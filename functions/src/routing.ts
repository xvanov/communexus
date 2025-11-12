/**
 * Routing Cloud Function
 *
 * This module provides Cloud Function for routing webhook messages.
 * It handles routing UnifiedMessages to the correct thread using Admin SDK,
 * and creates new threads if no match is found.
 *
 * @example
 * ```typescript
 * import { routeWebhookMessage } from './routing';
 *
 * // Use in webhook handler
 * const result = await routeWebhookMessage(unifiedMessage, organizationId);
 * ```
 */

import { onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
} from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { UnifiedMessage } from '../../../src/types/Channel';

setGlobalOptions({ region: 'us-central1' });

if (getAdminApps().length === 0) {
  initializeAdminApp();
}

/**
 * Helper function to lookup identity by external identifier using Admin SDK
 */
async function lookupIdentityByIdentifier(
  externalIdentifier: string,
  organizationId: string
): Promise<string | null> {
  const db = getFirestore();
  const identityLinksRef = db.collection('identityLinks');

  // Query by organizationId (Firestore doesn't support efficient array queries)
  const snapshot = await identityLinksRef
    .where('organizationId', '==', organizationId)
    .get();

  // Filter client-side for matching external identifier
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const externalIdentities = data.externalIdentities || [];
    
    const match = externalIdentities.find(
      (identity: any) => identity.value === externalIdentifier
    );
    
    if (match) {
      return data.userId || null;
    }
  }

  return null;
}

/**
 * Helper function to get threads for a user using Admin SDK
 */
async function getThreadsForUser(userId: string): Promise<any[]> {
  const db = getFirestore();
  const threadsRef = db.collection('threads');

  const snapshot = await threadsRef
    .where('participants', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .limit(10)
    .get();

  const threads: any[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    threads.push({
      id: doc.id,
      ...data,
      updatedAt: data.updatedAt?.toDate() || new Date(),
    });
  });

  return threads;
}

/**
 * Helper function to create identity link using Admin SDK
 */
async function createIdentityLink(
  userId: string,
  externalIdentifier: string,
  organizationId: string
): Promise<void> {
  const db = getFirestore();
  const identityLinkId = `${organizationId}-${userId}`;
  const identityLinkRef = db.doc(`identityLinks/${identityLinkId}`);

  // Determine external identity type
  let externalIdentityType = 'phone';
  const identifier = externalIdentifier.toLowerCase();

  if (identifier.includes('@')) {
    externalIdentityType = 'email';
  } else if (/^\+[1-9]\d{1,14}$/.test(externalIdentifier)) {
    externalIdentityType = 'phone';
  } else {
    externalIdentityType = 'facebook_id';
  }

  const externalIdentity = {
    type: externalIdentityType,
    value: externalIdentifier,
    verified: false,
  };

  // Get existing identity link or create new one
  const existingDoc = await identityLinkRef.get();
  
  if (existingDoc.exists) {
    const existingData = existingDoc.data();
    const existingIdentities = existingData?.externalIdentities || [];
    
    // Check if identifier already exists
    const exists = existingIdentities.some(
      (identity: any) => identity.value === externalIdentifier
    );
    
    if (!exists) {
      // Add new external identity
      await identityLinkRef.update({
        externalIdentities: FieldValue.arrayUnion(externalIdentity),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } else {
    // Create new identity link
    await identityLinkRef.set({
      id: identityLinkId,
      userId,
      organizationId,
      externalIdentities: [externalIdentity],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Helper function to create thread using Admin SDK
 */
async function createThreadAdmin(
  participants: string[],
  participantDetails: any[],
  channel: string
): Promise<string> {
  const db = getFirestore();
  const threadsRef = db.collection('threads');

  const threadData = {
    participants,
    participantDetails,
    isGroup: false,
    groupName: null,
    groupPhotoUrl: null,
    lastMessage: null,
    unreadCount: participants.reduce((acc, id) => ({ ...acc, [id]: 0 }), {}),
    channelSources: [channel],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const docRef = await threadsRef.add(threadData);
  return docRef.id;
}

/**
 * Helper function to add channel source to thread using Admin SDK
 */
async function addChannelSourceAdmin(threadId: string, channel: string): Promise<void> {
  const db = getFirestore();
  const threadRef = db.doc(`threads/${threadId}`);
  
  await threadRef.update({
    channelSources: FieldValue.arrayUnion(channel),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Helper function to route message by identity using Admin SDK
 */
async function routeByIdentityAdmin(
  senderIdentifier: string,
  organizationId: string
): Promise<{ threadId: string; confidence: number } | null> {
  // Lookup user ID by sender identifier
  const userId = await lookupIdentityByIdentifier(senderIdentifier, organizationId);

  if (!userId) {
    return null;
  }

  // Query threads by participant userId
  const threads = await getThreadsForUser(userId);

  if (threads.length === 0) {
    return null;
  }

  // Return most recent thread
  const mostRecentThread = threads[0];
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - mostRecentThread.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  
  let confidence = 0.9;
  if (daysSinceUpdate > 7) {
    confidence = 0.7;
  }
  if (daysSinceUpdate > 30) {
    confidence = 0.5;
  }

  return {
    threadId: mostRecentThread.id,
    confidence,
  };
}

/**
 * Helper function to route message by metadata using Admin SDK
 */
async function routeByMetadataAdmin(
  unifiedMessage: UnifiedMessage,
  organizationId: string
): Promise<{ threadId: string; confidence: number } | null> {
  try {
    const db = getFirestore();
    const threadsRef = db.collection('threads');
    
    // Extract property address or project ID from message text or metadata
    const messageText = unifiedMessage.text.toLowerCase();
    const metadata = unifiedMessage.metadata?.channelSpecific || {};
    
    // Check metadata for propertyId or projectId
    const propertyId = metadata.propertyId;
    const projectId = metadata.projectId;
    
    // Extract address keywords from message text
    const addressKeywords: string[] = [];
    
    // Extract street numbers (e.g., "123 Main St", "456 Oak Ave")
    const streetNumberMatch = messageText.match(/\b\d+\s+[a-z]+(?:\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court|pl|place|way))?/i);
    if (streetNumberMatch) {
      addressKeywords.push(streetNumberMatch[0].toLowerCase());
    }
    
    // Extract city names (common city patterns)
    const cityMatch = messageText.match(/\b(?:durham|raleigh|chapel\s+hill|cary|greensboro|winston-salem|charlotte|asheville|wilmington)\b/i);
    if (cityMatch) {
      addressKeywords.push(cityMatch[0].toLowerCase());
    }
    
    // Extract state abbreviations
    const stateMatch = messageText.match(/\b(?:nc|sc|va|ga|tn|fl|al|ms|la|tx|ca|ny|nj|pa|ma|ct|ri|vt|nh|me|md|de|wv|ky|oh|in|il|mi|wi|mn|ia|mo|ar|ok|ks|ne|nd|sd|mt|wy|co|nm|az|ut|nv|id|or|wa|ak|hi)\b/i);
    if (stateMatch) {
      addressKeywords.push(stateMatch[0].toLowerCase());
    }
    
    let matchingThreads: any[] = [];
    
    // Query threads by propertyId or projectId if available
    if (propertyId) {
      const snapshot = await threadsRef
        .where('propertyId', '==', propertyId)
        .orderBy('updatedAt', 'desc')
        .limit(10)
        .get();
      
      snapshot.forEach(doc => {
        matchingThreads.push({
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        });
      });
    } else if (projectId) {
      const snapshot = await threadsRef
        .where('projectId', '==', projectId)
        .orderBy('updatedAt', 'desc')
        .limit(10)
        .get();
      
      snapshot.forEach(doc => {
        matchingThreads.push({
          id: doc.id,
          ...doc.data(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        });
      });
    } else if (addressKeywords.length > 0) {
      // Match threads based on property address keywords
      // Query recent threads and score them by address keyword matches
      const snapshot = await threadsRef
        .orderBy('updatedAt', 'desc')
        .limit(100)
        .get();
      
      const scoredThreads: Array<{ thread: any; score: number }> = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const thread = {
          id: doc.id,
          ...data,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        
        // Score thread based on address keyword matches
        let score = 0;
        
        // Check if thread has propertyId
        if (data.propertyId) {
          score += 1;
        }
        
        // Check if thread metadata contains address keywords
        const threadMetadata = data.customMetadata || {};
        const threadAddress = (threadMetadata.address || '').toLowerCase();
        const threadCity = (threadMetadata.city || '').toLowerCase();
        const threadState = (threadMetadata.state || '').toLowerCase();
        
        // Score based on keyword matches in thread metadata
        for (const keyword of addressKeywords) {
          if (threadAddress.includes(keyword)) {
            score += 3; // High score for address match
          }
          if (threadCity.includes(keyword)) {
            score += 2; // Medium score for city match
          }
          if (threadState.includes(keyword)) {
            score += 1; // Low score for state match
          }
          
          // Also check groupName for address mentions
          if (thread.groupName && thread.groupName.toLowerCase().includes(keyword)) {
            score += 1;
          }
          
          // Check last message for address mentions
          if (thread.lastMessage && thread.lastMessage.text && thread.lastMessage.text.toLowerCase().includes(keyword)) {
            score += 1;
          }
        }
        
        // Only include threads with score > 0
        if (score > 0) {
          scoredThreads.push({ thread, score });
        }
      });
      
      // Sort by score (highest first)
      scoredThreads.sort((a, b) => b.score - a.score);
      
      // Threshold for address keyword matching: minimum score of 2
      const threshold = 2;
      const aboveThreshold = scoredThreads.filter(st => st.score >= threshold);
      
      if (aboveThreshold.length > 0) {
        matchingThreads = aboveThreshold.map(st => st.thread);
      }
    }
    
    // If no property/project metadata found, return null
    if (!propertyId && !projectId && addressKeywords.length === 0) {
      return null;
    }
    
    // If no threads match, return null
    if (matchingThreads.length === 0) {
      return null;
    }
    
    // Return thread with highest confidence (most recent activity)
    const mostRecentThread = matchingThreads[0];
    
    // Calculate confidence based on match type
    let confidence = 0.8; // Default medium-high confidence for metadata-based routing
    
    if (propertyId || projectId) {
      confidence = 0.85; // High confidence for direct property/project ID match
    } else if (addressKeywords.length > 0) {
      confidence = 0.6; // Medium confidence for address keyword match
    }
    
    // Adjust confidence based on thread recency
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - mostRecentThread.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 7) {
      confidence *= 0.9; // Slightly reduce confidence for older threads
    }
    if (daysSinceUpdate > 30) {
      confidence *= 0.8; // Further reduce confidence for very old threads
    }
    
    return {
      threadId: mostRecentThread.id,
      confidence: Math.max(0.5, Math.min(0.95, confidence)), // Clamp between 0.5 and 0.95
    };
  } catch (error) {
    console.error('Error in metadata-based routing:', error);
    return null;
  }
}

/**
 * Helper function to route message by context using Admin SDK
 */
async function routeByContextAdmin(
  unifiedMessage: UnifiedMessage,
  organizationId: string
): Promise<{ threadId: string; confidence: number } | null> {
  try {
    const db = getFirestore();
    const threadsRef = db.collection('threads');
    
    // Extract keywords from message text
    const messageText = unifiedMessage.text.toLowerCase();
    
    // Simple keyword extraction: split by whitespace, filter out common stop words
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
      'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
      'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
      'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
      'very', 'just', 'now'
    ]);
    
    const keywords = messageText
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Limit to top 10 keywords
    
    // If no keywords extracted, return null
    if (keywords.length === 0) {
      return null;
    }
    
    // Query recent threads (last 100 threads sorted by updatedAt)
    const snapshot = await threadsRef
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .get();
    
    const threadScores: Array<{ thread: any; score: number }> = [];
    
    // Score threads based on keyword matches in recent messages
    snapshot.forEach(doc => {
      const data = doc.data();
      const thread = {
        id: doc.id,
        ...data,
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
      
      // Score thread based on keyword matches
      let score = 0;
      const lastMessageText = (thread.lastMessage?.text || '').toLowerCase();
      const threadGroupName = (thread.groupName || '').toLowerCase();
      
      // Score based on keyword matches in last message
      for (const keyword of keywords) {
        if (lastMessageText.includes(keyword)) {
          score += 2; // Higher weight for keyword matches in last message
        }
        if (threadGroupName.includes(keyword)) {
          score += 1; // Lower weight for keyword matches in group name
        }
      }
      
      // Boost score for recent threads (within last 7 days)
      const now = new Date();
      const daysSinceUpdate = (now.getTime() - thread.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) {
        score += 1; // Boost for recent threads
      }
      
      // Only include threads with score > 0
      if (score > 0) {
        threadScores.push({ thread, score });
      }
    });
    
    // Sort by score (highest first)
    threadScores.sort((a, b) => b.score - a.score);
    
    // Threshold for context-based routing: minimum score of 3
    const threshold = 3;
    const matchingThreads = threadScores.filter(ts => ts.score >= threshold);
    
    // If no threads match threshold, return null
    if (matchingThreads.length === 0) {
      return null;
    }
    
    // Return thread with highest score
    const bestMatch = matchingThreads[0];
    const highestScore = bestMatch.score;
    const maxPossibleScore = keywords.length * 2 + 1; // max score if all keywords match
    
    // Calculate confidence based on score ratio
    const scoreRatio = highestScore / maxPossibleScore;
    let confidence = 0.5; // Default low confidence for context-based routing
    
    if (scoreRatio > 0.8) {
      confidence = 0.75; // High confidence for strong keyword matches
    } else if (scoreRatio > 0.4) {
      confidence = 0.6; // Medium confidence for moderate keyword matches
    }
    
    // Adjust confidence based on thread recency
    const now = new Date();
    const daysSinceUpdate = (now.getTime() - bestMatch.thread.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) {
      confidence += 0.05; // Boost confidence for recent threads
    } else if (daysSinceUpdate > 30) {
      confidence -= 0.1; // Reduce confidence for very old threads
    }
    
    return {
      threadId: bestMatch.thread.id,
      confidence: Math.max(0.4, Math.min(0.85, confidence)), // Clamp between 0.4 and 0.85
    };
  } catch (error) {
    console.error('Error in context-based routing:', error);
    return null;
  }
}

/**
 * Route UnifiedMessage to Thread (Core Logic)
 *
 * Core routing function that routes a UnifiedMessage to the correct thread.
 * Uses Admin SDK routing logic to find matching thread, or creates new thread if no match found.
 * This function can be called directly from webhook handlers or other Cloud Functions.
 *
 * @param unifiedMessage - UnifiedMessage to route
 * @param organizationId - Organization ID for routing
 * @returns Promise resolving to routing result with threadId and confidence
 */
export async function routeMessageToThread(
  unifiedMessage: UnifiedMessage,
  organizationId: string
): Promise<{ success: boolean; threadId?: string; confidence?: number; method?: string; error?: string }> {
  try {
    if (!unifiedMessage) {
      throw new Error('UnifiedMessage is required');
    }

    if (!organizationId) {
      throw new Error('organizationId is required');
    }

    console.log('🔄 Routing webhook message:', {
      messageId: unifiedMessage.id,
      channel: unifiedMessage.channel,
      senderIdentifier: unifiedMessage.senderIdentifier,
      text: unifiedMessage.text?.substring(0, 50) + '...',
    });

    const db = getFirestore();

    // Strategy 1: Identity-based routing
    let routingResult: { threadId: string; confidence: number } | null = null;
    
    if (unifiedMessage.senderIdentifier) {
      try {
        routingResult = await routeByIdentityAdmin(
          unifiedMessage.senderIdentifier,
          organizationId
        );
        
        if (routingResult) {
          console.log(`✅ Identity-based routing succeeded: ${routingResult.threadId} (confidence: ${routingResult.confidence})`);
        }
      } catch (error) {
        console.error('Error in identity-based routing:', error);
        // Continue to next strategy
      }
    }

    // Strategy 2: Metadata-based routing (if identity failed)
    if (!routingResult) {
      try {
        const metadataResult = await routeByMetadataAdmin(unifiedMessage, organizationId);
        if (metadataResult) {
          routingResult = metadataResult;
          console.log(`✅ Metadata-based routing succeeded: ${routingResult.threadId} (confidence: ${routingResult.confidence})`);
        }
      } catch (error) {
        console.error('Error in metadata-based routing:', error);
        // Continue to next strategy
      }
    }

    // Strategy 3: Context-based routing (if previous strategies failed)
    if (!routingResult) {
      try {
        const contextResult = await routeByContextAdmin(unifiedMessage, organizationId);
        if (contextResult) {
          routingResult = contextResult;
          console.log(`✅ Context-based routing succeeded: ${routingResult.threadId} (confidence: ${routingResult.confidence})`);
        }
      } catch (error) {
        console.error('Error in context-based routing:', error);
        // Continue to thread creation
      }
    }

    // If no match found, create new thread
    if (!routingResult) {
      console.log('📝 No match found, creating new thread');

      // Get or create user for sender identifier
      let userId = await lookupIdentityByIdentifier(
        unifiedMessage.senderIdentifier,
        organizationId
      );

      if (!userId) {
        // Generate new user ID for external user
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        userId = `external-user-${timestamp}-${random}`;

        // Create identity link
        await createIdentityLink(userId, unifiedMessage.senderIdentifier, organizationId);
        console.log(`✅ Created new identity link for external user: ${userId}`);
      }

      // Create thread
      const participantDetails = [
        {
          id: userId,
          name: unifiedMessage.senderIdentifier,
          photoUrl: undefined,
        },
      ];

      const threadId = await createThreadAdmin(
        [userId],
        participantDetails,
        unifiedMessage.channel
      );

      console.log(`✅ Created new thread: ${threadId} for user: ${userId}`);

      routingResult = {
        threadId,
        confidence: 1.0, // High confidence for new thread creation
      };
    } else {
      // Add channel source to existing thread if not already present
      await addChannelSourceAdmin(routingResult.threadId, unifiedMessage.channel);
    }

    // Save message to routed thread
    const messagesRef = db.collection(`threads/${routingResult.threadId}/messages`);
    
    // Convert UnifiedMessage to Message format
    const messageData = {
      id: unifiedMessage.id,
      threadId: routingResult.threadId,
      senderId: 'external-user', // Will be resolved from identity
      senderName: unifiedMessage.senderIdentifier,
      text: unifiedMessage.text,
      status: unifiedMessage.status === 'failed' ? 'sent' : unifiedMessage.status,
      deliveredTo: [],
      readBy: [],
      readTimestamps: {},
      createdAt: FieldValue.serverTimestamp(),
      sentAt: FieldValue.serverTimestamp(),
      channel: unifiedMessage.channel,
      channelMessageId: unifiedMessage.id,
      senderIdentifier: unifiedMessage.senderIdentifier,
      recipientIdentifier: unifiedMessage.recipientIdentifier,
      direction: unifiedMessage.direction,
      channelMetadata: unifiedMessage.metadata?.channelSpecific || {},
    };

    await messagesRef.add(messageData);

    // Log routing decision
    const routingLogsRef = db.collection('routing_logs');
    await routingLogsRef.add({
      messageId: unifiedMessage.id,
      senderIdentifier: unifiedMessage.senderIdentifier,
      channel: unifiedMessage.channel,
      timestamp: FieldValue.serverTimestamp(),
      messageTimestamp: unifiedMessage.timestamp,
      method: routingResult.confidence === 1.0 ? 'created' : 'identity',
      confidence: routingResult.confidence,
      reason: routingResult.confidence === 1.0
        ? 'New thread created'
        : 'Matched by participant identity',
      threadId: routingResult.threadId,
      organizationId,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Message routed to thread: ${routingResult.threadId}`);

    return {
      success: true,
      threadId: routingResult.threadId,
      confidence: routingResult.confidence,
      method: routingResult.confidence === 1.0 ? 'created' : 'identity',
    };
  } catch (error) {
    console.error('❌ Error routing webhook message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Route Webhook Message
 *
 * Cloud Function that routes a UnifiedMessage to the correct thread.
 * Uses Admin SDK routing logic to find matching thread, or creates new thread if no match found.
 *
 * @param request - Cloud Function request with unifiedMessage and organizationId
 * @returns Promise resolving to routing result
 */
export const routeWebhookMessage = onCall(async request => {
  const { unifiedMessage, organizationId } = request.data;
  return await routeMessageToThread(unifiedMessage, organizationId);
});

