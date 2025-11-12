/**
 * Routing Service
 *
 * This module provides message routing functionality for automatically routing
 * inbound messages from external channels (SMS, Messenger, Email) to the correct
 * thread based on participant identity, thread metadata, and conversation context.
 *
 * The routing service uses a multi-strategy approach:
 * 1. Identity-based routing (highest priority) - Routes based on participant identity matching
 * 2. Metadata-based routing (medium priority) - Routes based on property address or project ID
 * 3. Context-based routing (fallback) - Routes based on keyword matching in conversation context
 *
 * If no match is found, the system creates a new thread or flags the message for manual assignment.
 *
 * @example
 * ```typescript
 * import { RoutingService } from './routing';
 *
 * const routingService = new RoutingService();
 *
 * // Route a message
 * const result = await routingService.routeMessage(
 *   unifiedMessage,
 *   organizationId
 * );
 *
 * if (result) {
 *   console.log(`Routed to thread ${result.threadId} with confidence ${result.confidence}`);
 * } else {
 *   console.log('No match found, creating new thread or manual assignment required');
 * }
 * ```
 */

import { IdentityService } from './identity';
import { createThread, listThreadsForUser, addChannelSource } from './threads';
import { getDocs, query, where, orderBy, limit, collection, addDoc, serverTimestamp, updateDoc, doc, startAfter } from 'firebase/firestore';
import { getDb } from './firebase';
import type { UnifiedMessage, ChannelType } from '../types/Channel';
import type { Thread } from '../types/Thread';

/**
 * Routing result interface
 *
 * Represents the result of a routing decision, including the thread ID,
 * confidence score, routing method used, and reason for the decision.
 */
export interface RoutingResult {
  /**
   * Thread ID where the message should be routed
   * @example 'thread-123'
   */
  threadId: string;

  /**
   * Confidence score (0-1) indicating how certain the routing decision is
   * - High confidence (>0.8): Routes automatically
   * - Medium confidence (0.5-0.8): May require manual review
   * - Low confidence (<0.5): Requires manual assignment
   * @example 0.9
   */
  confidence: number;

  /**
   * Routing method used to make this decision
   * @example 'identity', 'metadata', 'context', 'manual'
   */
  method: 'identity' | 'metadata' | 'context' | 'manual';

  /**
   * Human-readable reason for the routing decision
   * @example 'Matched by participant identity: user-123'
   */
  reason: string;
}

/**
 * Routing decision log interface
 *
 * Represents a logged routing decision for debugging, analytics, and
 * improving routing accuracy over time.
 */
export interface RoutingDecision {
  /**
   * Message ID that was routed
   * @example 'msg-123'
   */
  messageId: string;

  /**
   * Sender identifier in channel-specific format
   * @example '+15551234567'
   */
  senderIdentifier: string;

  /**
   * Channel this message was received through
   * @example 'sms', 'messenger', 'email'
   */
  channel: ChannelType;

  /**
   * Timestamp when the routing decision was made
   */
  timestamp: Date;

  /**
   * Routing method used
   * @example 'identity', 'metadata', 'context', 'manual'
   */
  method: 'identity' | 'metadata' | 'context' | 'manual';

  /**
   * Confidence score (0-1) for this routing decision
   * @example 0.9
   */
  confidence: number;

  /**
   * Human-readable reason for the routing decision
   * @example 'Matched by participant identity: user-123'
   */
  reason: string;

  /**
   * Thread ID if matched, null if not matched
   * @example 'thread-123' or null
   */
  threadId: string | null;

  /**
   * Organization ID for multi-tenancy support
   * @example 'org-456'
   */
  organizationId: string;
}

/**
 * Routing Service Class
 *
 * Provides message routing functionality using multi-strategy approach:
 * identity-based routing (highest priority), metadata-based routing (medium priority),
 * and context-based routing (fallback).
 */
export class RoutingService {
  private identityService: IdentityService;

  /**
   * Creates a new RoutingService instance
   */
  constructor() {
    this.identityService = new IdentityService();
  }

  /**
   * Route a message using multi-strategy approach
   *
   * Attempts to route the message using identity-based routing first (highest priority),
   * then metadata-based routing (medium priority), then context-based routing (fallback).
   * Returns null if all strategies fail.
   *
   * @param unifiedMessage - The unified message to route
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to RoutingResult if match found, null if no match
   * @throws Error if routing fails due to system error
   *
   * @example
   * ```typescript
   * const result = await routingService.routeMessage(
   *   unifiedMessage,
   *   'org-456'
   * );
   *
   * if (result) {
   *   console.log(`Routed to thread ${result.threadId}`);
   * } else {
   *   console.log('No match found');
   * }
   * ```
   */
  async routeMessage(
    unifiedMessage: UnifiedMessage,
    organizationId: string
  ): Promise<RoutingResult | null> {
    try {
      // Validate inputs
      if (!unifiedMessage) {
        throw new Error('UnifiedMessage is required');
      }
      if (!organizationId) {
        throw new Error('organizationId is required');
      }

      // Validate sender identifier
      if (!unifiedMessage.senderIdentifier) {
        console.warn('Warning: senderIdentifier is missing, identity-based routing will fail');
      }

      // Validate message text
      if (!unifiedMessage.text || unifiedMessage.text.trim().length === 0) {
        console.warn('Warning: message text is empty, context-based routing may fail');
      }

      let routingResult: RoutingResult | null = null;
      let routingMethod: 'identity' | 'metadata' | 'context' | null = null;

      // Strategy 1: Identity-based routing (highest priority)
      if (unifiedMessage.senderIdentifier) {
        try {
          routingResult = await this.routeByIdentity(
            unifiedMessage.senderIdentifier,
            organizationId
          );
          if (routingResult) {
            routingMethod = 'identity';
            console.log(`✅ Identity-based routing succeeded: ${routingResult.threadId} (confidence: ${routingResult.confidence})`);
          }
        } catch (error) {
          console.error('Error in identity-based routing:', error);
          // Continue to next strategy
        }
      }

      // Strategy 2: Metadata-based routing (medium priority)
      // Only try if identity-based routing didn't find a match
      if (!routingResult) {
        try {
          routingResult = await this.routeByMetadata(unifiedMessage, organizationId);
          if (routingResult) {
            routingMethod = 'metadata';
            console.log(`✅ Metadata-based routing succeeded: ${routingResult.threadId} (confidence: ${routingResult.confidence})`);
          }
        } catch (error) {
          console.error('Error in metadata-based routing:', error);
          // Continue to next strategy
        }
      }

      // Strategy 3: Context-based routing (fallback)
      // Only try if previous strategies didn't find a match
      if (!routingResult && unifiedMessage.text && unifiedMessage.text.trim().length > 0) {
        try {
          routingResult = await this.routeByContext(unifiedMessage, organizationId);
          if (routingResult) {
            routingMethod = 'context';
            console.log(`✅ Context-based routing succeeded: ${routingResult.threadId} (confidence: ${routingResult.confidence})`);
          }
        } catch (error) {
          console.error('Error in context-based routing:', error);
          // All strategies failed
        }
      }

      // Log routing decision if result found
      if (routingResult && routingMethod) {
        await this.logRoutingDecision({
          messageId: unifiedMessage.id,
          senderIdentifier: unifiedMessage.senderIdentifier,
          channel: unifiedMessage.channel,
          timestamp: unifiedMessage.timestamp,
          method: routingMethod,
          confidence: routingResult.confidence,
          reason: routingResult.reason,
          threadId: routingResult.threadId,
          organizationId,
        }).catch(error => {
          // Log error but don't fail routing
          console.error('Error logging routing decision:', error);
        });
      } else {
        // Log failed routing decision
        await this.logRoutingDecision({
          messageId: unifiedMessage.id,
          senderIdentifier: unifiedMessage.senderIdentifier,
          channel: unifiedMessage.channel,
          timestamp: unifiedMessage.timestamp,
          method: 'manual',
          confidence: 0,
          reason: 'No match found using any routing strategy',
          threadId: null,
          organizationId,
        }).catch(error => {
          // Log error but don't fail routing
          console.error('Error logging routing decision:', error);
        });
      }

      return routingResult;
    } catch (error) {
      console.error('Error in routeMessage:', error);
      throw error;
    }
  }

  /**
   * Route message by participant identity
   *
   * Uses IdentityService.lookupByIdentifier() to resolve sender identifier to user ID,
   * then queries threads by participant userId. Returns thread with highest confidence
   * (most recent activity).
   *
   * @param senderIdentifier - Sender identifier in channel-specific format
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to RoutingResult if match found, null if not found
   * @throws Error if identity lookup fails
   *
   * @example
   * ```typescript
   * const result = await routingService.routeByIdentity(
   *   '+15551234567',
   *   'org-456'
   * );
   * ```
   */
  async routeByIdentity(
    senderIdentifier: string,
    organizationId: string
  ): Promise<RoutingResult | null> {
    try {
      // Lookup user ID by sender identifier
      const userId = await this.identityService.lookupByIdentifier(
        senderIdentifier,
        organizationId
      );

      // If identity lookup returns null, no match found
      if (!userId) {
        return null;
      }

      // Query threads by participant userId
      const threads = await listThreadsForUser(userId);

      // Filter threads by organizationId if provided (client-side filter)
      // Note: Thread interface may not have organizationId yet, but database might
      let filteredThreads = threads;
      if (organizationId) {
        // Filter threads that have organizationId matching (if available in data)
        // For now, we'll use all threads since organizationId might not be in interface
        // In production, threads should have organizationId field for proper multi-tenancy
        filteredThreads = threads;
      }

      // If no threads match, return null
      if (filteredThreads.length === 0) {
        return null;
      }

      // Return thread with highest confidence (most recent activity)
      // Most recent = highest updatedAt timestamp
      const mostRecentThread = filteredThreads[0]; // Already sorted by updatedAt desc

      // Calculate confidence based on thread recency
      // High confidence (>0.8) for threads updated within last 7 days
      // Medium confidence (0.5-0.8) for threads updated within last 30 days
      // Low confidence (<0.5) for older threads
      const now = new Date();
      const daysSinceUpdate = (now.getTime() - mostRecentThread.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      let confidence = 0.9; // Default high confidence for identity-based routing
      
      if (daysSinceUpdate > 7) {
        confidence = 0.7; // Medium confidence for older threads
      }
      if (daysSinceUpdate > 30) {
        confidence = 0.5; // Low confidence for very old threads
      }

      return {
        threadId: mostRecentThread.id,
        confidence,
        method: 'identity',
        reason: `Matched by participant identity: ${userId} (${filteredThreads.length} thread${filteredThreads.length > 1 ? 's' : ''} found)`,
      };
    } catch (error) {
      console.error('Error in identity-based routing:', error);
      throw error;
    }
  }

  /**
   * Route message by thread metadata
   *
   * Extracts property address or project ID from message text or metadata,
   * then queries threads by propertyId or projectId. Returns thread with highest
   * confidence (most recent activity).
   *
   * @param unifiedMessage - The unified message to route
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to RoutingResult if match found, null if not found
   *
   * @example
   * ```typescript
   * const result = await routingService.routeByMetadata(
   *   unifiedMessage,
   *   'org-456'
   * );
   * ```
   */
  async routeByMetadata(
    unifiedMessage: UnifiedMessage,
    organizationId: string
  ): Promise<RoutingResult | null> {
    try {
      // Extract property address or project ID from message text or metadata
      const messageText = unifiedMessage.text.toLowerCase();
      const metadata = unifiedMessage.metadata?.channelSpecific || {};

      // Check metadata for propertyId or projectId
      const propertyId = metadata.propertyId;
      const projectId = metadata.projectId;

      // Extract address keywords from message text (simple pattern matching)
      // Look for common address patterns: street numbers, city names, state abbreviations
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

      // Extract state abbreviations (NC, SC, VA, etc.)
      const stateMatch = messageText.match(/\b(?:nc|sc|va|ga|tn|fl|al|ms|la|tx|ca|ny|nj|pa|ma|ct|ri|vt|nh|me|md|de|wv|ky|oh|in|il|mi|wi|mn|ia|mo|ar|ok|ks|ne|nd|sd|mt|wy|co|nm|az|ut|nv|id|or|wa|ak|hi)\b/i);
      if (stateMatch) {
        addressKeywords.push(stateMatch[0].toLowerCase());
      }

      // Query threads by propertyId or projectId if available
      const db = await getDb();
      const threadsCol = collection(db, 'threads');
      let matchingThreads: Thread[] = [];

      if (propertyId) {
        // Query threads by propertyId
        const q = query(
          threadsCol,
          where('propertyId', '==', propertyId),
          orderBy('updatedAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          const data = doc.data();
          matchingThreads.push({
            id: doc.id,
            participants: data.participants || [],
            participantDetails: data.participantDetails || [],
            isGroup: data.isGroup || false,
            groupName: data.groupName,
            groupPhotoUrl: data.groupPhotoUrl,
            lastMessage: data.lastMessage
              ? {
                  ...data.lastMessage,
                  timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
                }
              : undefined,
            unreadCount: data.unreadCount || {},
            channelSources: data.channelSources || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Thread);
        });
      } else if (projectId) {
        // Query threads by projectId
        const q = query(
          threadsCol,
          where('projectId', '==', projectId),
          orderBy('updatedAt', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          const data = doc.data();
          matchingThreads.push({
            id: doc.id,
            participants: data.participants || [],
            participantDetails: data.participantDetails || [],
            isGroup: data.isGroup || false,
            groupName: data.groupName,
            groupPhotoUrl: data.groupPhotoUrl,
            lastMessage: data.lastMessage
              ? {
                  ...data.lastMessage,
                  timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
                }
              : undefined,
            unreadCount: data.unreadCount || {},
            channelSources: data.channelSources || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Thread);
        });
      } else if (addressKeywords.length > 0) {
        // Match threads based on property address keywords
        // Query recent threads and score them by address keyword matches in thread metadata
        // This searches for threads that may have propertyId or address information
        
        // Query recent threads (last 100) to search for address matches
        const q = query(
          threadsCol,
          orderBy('updatedAt', 'desc'),
          limit(100)
        );
        
        const snapshot = await getDocs(q);
        const scoredThreads: Array<{ thread: Thread; score: number }> = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          const thread: Thread = {
            id: doc.id,
            participants: data.participants || [],
            participantDetails: data.participantDetails || [],
            isGroup: data.isGroup || false,
            groupName: data.groupName,
            groupPhotoUrl: data.groupPhotoUrl,
            lastMessage: data.lastMessage
              ? {
                  ...data.lastMessage,
                  timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
                }
              : undefined,
            unreadCount: data.unreadCount || {},
            channelSources: data.channelSources || [],
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };

          // Score thread based on address keyword matches
          let score = 0;
          
          // Check if thread has propertyId (higher score)
          if (data.propertyId) {
            // Thread has propertyId - could match if we had property data
            // For now, we'll score based on message text matches
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
            if (thread.lastMessage && thread.lastMessage.text.toLowerCase().includes(keyword)) {
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
          // Add top-scoring threads to matchingThreads
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
      const mostRecentThread = matchingThreads[0]; // Already sorted by updatedAt desc

      // Calculate confidence based on match type
      // High confidence (>0.8) for propertyId/projectId match
      // Medium confidence (0.5-0.8) for address keyword match
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
        method: 'metadata',
        reason: propertyId || projectId
          ? `Matched by ${propertyId ? 'propertyId' : 'projectId'}: ${propertyId || projectId}`
          : `Matched by address keywords: ${addressKeywords.join(', ')}`,
      };
    } catch (error) {
      console.error('Error in metadata-based routing:', error);
      // Return null on error (non-fatal)
      return null;
    }
  }

  /**
   * Route message by conversation context
   *
   * Extracts keywords from message text, then queries threads by organizationId
   * and scores threads based on keyword matches in recent messages. Returns thread
   * with highest score above threshold.
   *
   * @param unifiedMessage - The unified message to route
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to RoutingResult if match found, null if not found
   *
   * @example
   * ```typescript
   * const result = await routingService.routeByContext(
   *   unifiedMessage,
   *   'org-456'
   * );
   * ```
   */
  async routeByContext(
    unifiedMessage: UnifiedMessage,
    organizationId: string
  ): Promise<RoutingResult | null> {
    try {
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

      // Query threads by organizationId
      // Note: For now, we'll query recent threads and score them
      // In production, this would use a proper search index or AI classification
      const db = await getDb();
      const threadsCol = collection(db, 'threads');
      
      // Query recent threads (last 100 threads sorted by updatedAt)
      // This is a simplified approach - in production, this would use proper search
      const q = query(
        threadsCol,
        orderBy('updatedAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const threadScores: Array<{ thread: Thread; score: number }> = [];

      // Score threads based on keyword matches in recent messages
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const thread: Thread = {
          id: doc.id,
          participants: data.participants || [],
          participantDetails: data.participantDetails || [],
          isGroup: data.isGroup || false,
          groupName: data.groupName,
          groupPhotoUrl: data.groupPhotoUrl,
          lastMessage: data.lastMessage
            ? {
                ...data.lastMessage,
                timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
              }
            : undefined,
          unreadCount: data.unreadCount || {},
          channelSources: data.channelSources || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };

        // Score thread based on keyword matches
        let score = 0;
        const lastMessageText = thread.lastMessage?.text?.toLowerCase() || '';
        const threadGroupName = thread.groupName?.toLowerCase() || '';

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
      }

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
      // High confidence (>0.8) for scores > 80% of max
      // Medium confidence (0.5-0.8) for scores > 40% of max
      // Low confidence (<0.5) for scores < 40% of max
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
        method: 'context',
        reason: `Matched by keyword context: ${keywords.slice(0, 3).join(', ')}... (score: ${highestScore})`,
      };
    } catch (error) {
      console.error('Error in context-based routing:', error);
      // Return null on error (non-fatal)
      return null;
    }
  }

  /**
   * Create thread for a new conversation
   *
   * Uses IdentityService to get or create user for sender identifier,
   * creates new thread with participant details, initializes channelSources array,
   * and links identity if not already linked.
   *
   * @param unifiedMessage - The unified message to create thread for
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to new thread ID
   * @throws Error if thread creation fails
   *
   * @example
   * ```typescript
   * const threadId = await routingService.createThreadForMessage(
   *   unifiedMessage,
   *   'org-456'
   * );
   * ```
   */
  async createThreadForMessage(
    unifiedMessage: UnifiedMessage,
    organizationId: string
  ): Promise<string> {
    try {
      // Validate inputs
      if (!unifiedMessage) {
        throw new Error('UnifiedMessage is required');
      }
      if (!organizationId) {
        throw new Error('organizationId is required');
      }
      if (!unifiedMessage.senderIdentifier) {
        throw new Error('senderIdentifier is required');
      }

      // Get or create user for sender identifier
      let userId: string | null = null;

      // Try to lookup existing user by sender identifier
      userId = await this.identityService.lookupByIdentifier(
        unifiedMessage.senderIdentifier,
        organizationId
      );

      // If user not found, create a new identity link with generated user ID
      if (!userId) {
        // Generate a new user ID for external user (format: external-user-{timestamp}-{random})
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 9);
        userId = `external-user-${timestamp}-${random}`;

        // Determine external identity type based on sender identifier format
        let externalIdentityType: 'phone' | 'email' | 'facebook_id' = 'phone';
        const senderId = unifiedMessage.senderIdentifier.toLowerCase();

        if (senderId.includes('@')) {
          externalIdentityType = 'email';
        } else if (/^\+[1-9]\d{1,14}$/.test(senderId)) {
          externalIdentityType = 'phone';
        } else {
          // Assume Facebook ID or other identifier
          externalIdentityType = 'facebook_id';
        }

        // Create identity link
        const externalIdentity = {
          type: externalIdentityType,
          value: unifiedMessage.senderIdentifier,
          verified: false,
        };

        await this.identityService.addExternalIdentity(
          userId,
          externalIdentity,
          organizationId
        );

        console.log(`✅ Created new identity link for external user: ${userId} (${unifiedMessage.senderIdentifier})`);
      }

      // Create thread with participant details
      // For external users, we don't have full participant details, so we'll use minimal info
      const participantDetails = [
        {
          id: userId,
          name: unifiedMessage.senderIdentifier, // Use sender identifier as name until we have better info
          photoUrl: undefined,
        },
      ];

      // Create thread
      const threadId = await createThread(
        [userId],
        participantDetails,
        false, // isGroup
        undefined, // groupName
        undefined // groupPhotoUrl
      );

      // Initialize channelSources array by adding the channel
      await addChannelSource(threadId, unifiedMessage.channel);

      console.log(`✅ Created new thread: ${threadId} for user: ${userId} (channel: ${unifiedMessage.channel})`);

      return threadId;
    } catch (error) {
      console.error('Error creating thread for message:', error);
      throw error;
    }
  }

  /**
   * Create unassigned message for manual assignment
   *
   * Stores unassigned message in pending_routing collection for manual assignment.
   * This provides a safety net for edge cases where routing cannot automatically
   * determine the correct thread.
   *
   * @param unifiedMessage - The unified message that couldn't be routed
   * @param organizationId - Organization ID for multi-tenancy support
   * @returns Promise resolving to pending message ID
   * @throws Error if storing fails
   *
   * @example
   * ```typescript
   * const pendingMessageId = await routingService.createUnassignedMessage(
   *   unifiedMessage,
   *   'org-456'
   * );
   * ```
   */
  async createUnassignedMessage(
    unifiedMessage: UnifiedMessage,
    organizationId: string
  ): Promise<string> {
    try {
      const db = await getDb();
      const pendingCol = collection(db, 'pending_routing');

      // Store unassigned message in pending_routing collection
      const docRef = await addDoc(pendingCol, {
        messageId: unifiedMessage.id,
        senderIdentifier: unifiedMessage.senderIdentifier,
        recipientIdentifier: unifiedMessage.recipientIdentifier,
        channel: unifiedMessage.channel,
        direction: unifiedMessage.direction,
        text: unifiedMessage.text,
        timestamp: serverTimestamp(),
        messageTimestamp: unifiedMessage.timestamp,
        status: unifiedMessage.status,
        metadata: unifiedMessage.metadata,
        organizationId,
        createdAt: serverTimestamp(),
        assignedThreadId: null,
        assignedAt: null,
        assignedBy: null,
      });

      console.log(`📋 Created unassigned message for manual routing: ${docRef.id} (message: ${unifiedMessage.id})`);

      return docRef.id;
    } catch (error) {
      console.error('Error creating unassigned message:', error);
      throw error;
    }
  }

  /**
   * Assign unassigned message to thread
   *
   * Assigns a message from pending_routing collection to a thread.
   * This is used when a message couldn't be automatically routed and needs
   * manual assignment.
   *
   * @param pendingMessageId - The pending message ID from pending_routing collection
   * @param threadId - The thread ID to assign the message to
   * @param assignedBy - The user ID who assigned the message (optional)
   * @returns Promise that resolves when assignment is complete
   * @throws Error if assignment fails
   *
   * @example
   * ```typescript
   * await routingService.assignUnassignedMessage(
   *   'pending-msg-123',
   *   'thread-456',
   *   'user-789'
   * );
   * ```
   */
  async assignUnassignedMessage(
    pendingMessageId: string,
    threadId: string,
    assignedBy?: string
  ): Promise<void> {
    try {
      const db = await getDb();
      const pendingRef = doc(db, 'pending_routing', pendingMessageId);

      // Update pending message with assignment
      await updateDoc(pendingRef, {
        assignedThreadId: threadId,
        assignedAt: serverTimestamp(),
        assignedBy: assignedBy || null,
      });

      console.log(`✅ Assigned pending message ${pendingMessageId} to thread ${threadId}`);
    } catch (error) {
      console.error('Error assigning unassigned message:', error);
      throw error;
    }
  }

  /**
   * Log routing decision for debugging and analytics
   *
   * Stores routing decisions in routing_logs collection (or Firestore) with
   * method, confidence, reason, and message details.
   *
   * @param decision - Routing decision to log
   * @returns Promise that resolves when logging is complete
   * @throws Error if logging fails
   *
   * @example
   * ```typescript
   * await routingService.logRoutingDecision({
   *   messageId: 'msg-123',
   *   senderIdentifier: '+15551234567',
   *   channel: 'sms',
   *   timestamp: new Date(),
   *   method: 'identity',
   *   confidence: 0.9,
   *   reason: 'Matched by participant identity',
   *   threadId: 'thread-123',
   *   organizationId: 'org-456'
   * });
   * ```
   */
  async logRoutingDecision(decision: RoutingDecision): Promise<void> {
    try {
      const db = await getDb();
      const logsCol = collection(db, 'routing_logs');

      // Store routing decision in Firestore
      await addDoc(logsCol, {
        messageId: decision.messageId,
        senderIdentifier: decision.senderIdentifier,
        channel: decision.channel,
        timestamp: serverTimestamp(),
        messageTimestamp: decision.timestamp,
        method: decision.method,
        confidence: decision.confidence,
        reason: decision.reason,
        threadId: decision.threadId,
        organizationId: decision.organizationId,
        createdAt: serverTimestamp(),
      });

      // Log to console for debugging (optional)
      console.log(`📝 Routing decision logged: ${decision.method} → ${decision.threadId || 'null'} (confidence: ${decision.confidence})`);
    } catch (error) {
      console.error('Error logging routing decision:', error);
      // Don't throw - logging failures shouldn't break routing
      // In production, consider using a retry mechanism or dead letter queue
    }
  }

  /**
   * Query routing logs by organization ID
   *
   * Retrieves routing decision logs for a specific organization, optionally
   * filtered by date range, method, or thread ID.
   *
   * @param organizationId - Organization ID to query logs for
   * @param options - Optional query parameters (limit, startAfter, method, threadId, dateRange)
   * @returns Promise resolving to array of routing decision logs
   *
   * @example
   * ```typescript
   * const logs = await routingService.getRoutingLogs('org-456', {
   *   limit: 50,
   *   method: 'identity',
   *   startAfter: lastDocId
   * });
   * ```
   */
  async getRoutingLogs(
    organizationId: string,
    options?: {
      limit?: number;
      startAfter?: string;
      method?: 'identity' | 'metadata' | 'context' | 'manual';
      threadId?: string;
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<RoutingDecision[]> {
    try {
      const db = await getDb();
      const logsCol = collection(db, 'routing_logs');
      
      // Build query constraints
      const constraints: any[] = [
        where('organizationId', '==', organizationId),
      ];

      // Apply optional filters (Firestore supports multiple where clauses on different fields)
      if (options?.method) {
        constraints.push(where('method', '==', options.method));
      }
      if (options?.threadId) {
        constraints.push(where('threadId', '==', options.threadId));
      }
      if (options?.dateRange) {
        constraints.push(where('timestamp', '>=', options.dateRange.start));
        constraints.push(where('timestamp', '<=', options.dateRange.end));
      }

      // Add ordering
      constraints.push(orderBy('timestamp', 'desc'));

      // Apply limit
      if (options?.limit) {
        constraints.push(limit(options.limit));
      } else {
        constraints.push(limit(100)); // Default limit
      }

      // Build query with all constraints
      const q = query(logsCol, ...constraints);

      const snapshot = await getDocs(q);
      const logs: RoutingDecision[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          messageId: data.messageId,
          senderIdentifier: data.senderIdentifier,
          channel: data.channel,
          timestamp: data.timestamp?.toDate() || data.messageTimestamp?.toDate() || new Date(),
          method: data.method,
          confidence: data.confidence,
          reason: data.reason,
          threadId: data.threadId,
          organizationId: data.organizationId,
        });
      });

      return logs;
    } catch (error) {
      console.error('Error querying routing logs:', error);
      throw error;
    }
  }

  /**
   * Query routing logs by sender identifier
   *
   * Retrieves routing decision logs for messages from a specific sender identifier.
   *
   * @param senderIdentifier - Sender identifier to query logs for
   * @param organizationId - Organization ID for multi-tenancy support
   * @param options - Optional query parameters (limit, startAfter)
   * @returns Promise resolving to array of routing decision logs
   *
   * @example
   * ```typescript
   * const logs = await routingService.getRoutingLogsBySender(
   *   '+15551234567',
   *   'org-456',
   *   { limit: 20 }
   * );
   * ```
   */
  async getRoutingLogsBySender(
    senderIdentifier: string,
    organizationId: string,
    options?: {
      limit?: number;
      startAfter?: string;
    }
  ): Promise<RoutingDecision[]> {
    try {
      const db = await getDb();
      const logsCol = collection(db, 'routing_logs');
      
      // Build query constraints
      const constraints: any[] = [
        where('organizationId', '==', organizationId),
        where('senderIdentifier', '==', senderIdentifier),
        orderBy('timestamp', 'desc'),
      ];

      // Apply limit
      if (options?.limit) {
        constraints.push(limit(options.limit));
      } else {
        constraints.push(limit(50)); // Default limit
      }

      // Build query with all constraints
      const q = query(logsCol, ...constraints);

      const snapshot = await getDocs(q);
      const logs: RoutingDecision[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          messageId: data.messageId,
          senderIdentifier: data.senderIdentifier,
          channel: data.channel,
          timestamp: data.timestamp?.toDate() || data.messageTimestamp?.toDate() || new Date(),
          method: data.method,
          confidence: data.confidence,
          reason: data.reason,
          threadId: data.threadId,
          organizationId: data.organizationId,
        });
      });

      return logs;
    } catch (error) {
      console.error('Error querying routing logs by sender:', error);
      throw error;
    }
  }

  /**
   * Query routing logs by thread ID
   *
   * Retrieves routing decision logs for messages routed to a specific thread.
   *
   * @param threadId - Thread ID to query logs for
   * @param organizationId - Organization ID for multi-tenancy support
   * @param options - Optional query parameters (limit, startAfter)
   * @returns Promise resolving to array of routing decision logs
   *
   * @example
   * ```typescript
   * const logs = await routingService.getRoutingLogsByThread(
   *   'thread-123',
   *   'org-456',
   *   { limit: 20 }
   * );
   * ```
   */
  async getRoutingLogsByThread(
    threadId: string,
    organizationId: string,
    options?: {
      limit?: number;
      startAfter?: string;
    }
  ): Promise<RoutingDecision[]> {
    try {
      const db = await getDb();
      const logsCol = collection(db, 'routing_logs');
      
      // Build query constraints
      const constraints: any[] = [
        where('organizationId', '==', organizationId),
        where('threadId', '==', threadId),
        orderBy('timestamp', 'desc'),
      ];

      // Apply limit
      if (options?.limit) {
        constraints.push(limit(options.limit));
      } else {
        constraints.push(limit(50)); // Default limit
      }

      // Build query with all constraints
      const q = query(logsCol, ...constraints);

      const snapshot = await getDocs(q);
      const logs: RoutingDecision[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          messageId: data.messageId,
          senderIdentifier: data.senderIdentifier,
          channel: data.channel,
          timestamp: data.timestamp?.toDate() || data.messageTimestamp?.toDate() || new Date(),
          method: data.method,
          confidence: data.confidence,
          reason: data.reason,
          threadId: data.threadId,
          organizationId: data.organizationId,
        });
      });

      return logs;
    } catch (error) {
      console.error('Error querying routing logs by thread:', error);
      throw error;
    }
  }
}

