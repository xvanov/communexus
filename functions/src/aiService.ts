import { AIFeatures } from './types/AIFeatures';
import {
  getOpenAI,
  getChatModel,
  getAIConfig,
  validateAIConfig,
  checkRateLimit,
  getCachedResult,
  setCachedResult,
} from './aiConfig';

export class AIService {
  private config = getAIConfig();

  constructor() {
    const errors = validateAIConfig(this.config);
    if (errors.length > 0) {
      console.warn('AI Configuration warnings:', errors);
    }
  }

  async generateThreadSummary(
    threadId: string,
    messages: any[]
  ): Promise<AIFeatures.ThreadSummary | null> {
    if (!this.config.features.threadSummary.enabled) {
      throw new Error('Thread summary feature is disabled');
    }

    if (messages.length === 0) {
      return null;
    }

    // Check rate limit
    if (!checkRateLimit(threadId, this.config)) {
      throw new Error('Rate limit exceeded');
    }

    // Check cache
    const cacheKey = `summary_${threadId}_${messages.length}`;
    const cached = getCachedResult<AIFeatures.ThreadSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const startTime = Date.now();

      // Limit messages for processing
      const limitedMessages = messages.slice(
        -this.config.features.threadSummary.maxMessages
      );

      const prompt = this.buildSummaryPrompt(limitedMessages);

      const response = await getOpenAI().chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that creates concise, structured summaries of conversation threads. Focus on key decisions, action items, and important context.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.openai.temperature,
        max_tokens: this.config.openai.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const summary = this.parseSummaryResponse(content);

      // Cache the result
      setCachedResult(cacheKey, summary, this.config);

      const responseTime = Date.now() - startTime;
      console.log(`Thread summary generated in ${responseTime}ms`);

      return summary;
    } catch (error) {
      console.error('Error generating thread summary:', error);
      throw error;
    }
  }

  async extractActionItems(
    threadId: string,
    messages: any[]
  ): Promise<AIFeatures.ActionItem[]> {
    if (!this.config.features.actionExtraction.enabled) {
      throw new Error('Action extraction feature is disabled');
    }

    if (messages.length === 0) {
      return [];
    }

    // Check rate limit
    if (!checkRateLimit(threadId, this.config)) {
      throw new Error('Rate limit exceeded');
    }

    // Check cache
    const cacheKey = `actionItems_${threadId}_${messages.length}`;
    const cached = getCachedResult<AIFeatures.ActionItem[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const startTime = Date.now();

      const prompt = this.buildActionExtractionPrompt(messages);

      const response = await getOpenAI().chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that extracts action items from conversations. Return only actionable tasks with clear assignments and priorities.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.openai.temperature,
        max_tokens: this.config.openai.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const actionItems = this.parseActionItemsResponse(content);

      // Cache the result
      setCachedResult(cacheKey, actionItems, this.config);

      const responseTime = Date.now() - startTime;
      console.log(`Action items extracted in ${responseTime}ms`);

      return actionItems;
    } catch (error) {
      console.error('Error extracting action items:', error);
      throw error;
    }
  }

  async detectPriority(
    messageId: string,
    message: any
  ): Promise<AIFeatures.PriorityLevel | null> {
    if (!this.config.features.priorityDetection.enabled) {
      throw new Error('Priority detection feature is disabled');
    }

    // Check rate limit
    if (!checkRateLimit(messageId, this.config)) {
      throw new Error('Rate limit exceeded');
    }

    // Check cache
    const cacheKey = `priority_${messageId}`;
    const cached = getCachedResult<AIFeatures.PriorityLevel>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const startTime = Date.now();

      const prompt = this.buildPriorityDetectionPrompt(message);

      const response = await getOpenAI().chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that determines message priority levels. Classify messages as "high", "medium", or "low" priority based on urgency and importance.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: this.config.openai.temperature,
        max_tokens: 100, // Small response for priority classification
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const priority = this.parsePriorityResponse(content);

      // Cache the result
      setCachedResult(cacheKey, priority, this.config);

      const responseTime = Date.now() - startTime;
      console.log(`Priority detected in ${responseTime}ms`);

      return priority;
    } catch (error) {
      console.error('Error detecting priority:', error);
      throw error;
    }
  }

  async smartSearch(
    query: string,
    messages: any[]
  ): Promise<AIFeatures.SearchResult[]> {
    if (!this.config.features.smartSearch.enabled) {
      throw new Error('Smart search feature is disabled');
    }

    if (!query.trim() || messages.length === 0) {
      return [];
    }

    // Check rate limit
    if (!checkRateLimit(query, this.config)) {
      throw new Error('Rate limit exceeded');
    }

    // Check cache
    const cacheKey = `search_${query}_${messages.length}`;
    const cached = getCachedResult<AIFeatures.SearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const startTime = Date.now();

      // Build prompt with actual messages
      const messagesText = messages
        .map((m, idx) => `${idx + 1}. [${m.sender}]: ${m.text}`)
        .join('\n');

      const prompt = `Search Query: "${query}"

Messages to search:
${messagesText}

Analyze these messages and return the top 10 most relevant results for the query. For each result, provide:
1. The message number (from the numbered list above)
2. Relevance score (0-1, where 1 is perfect match)
3. A brief snippet explaining why it's relevant

Return ONLY a JSON array in this EXACT format:
[
  {
    "messageId": 1,
    "relevance": 0.95,
    "snippet": "Discusses power outlets installation"
  },
  {
    "messageId": 3,
    "relevance": 0.80,
    "snippet": "Mentions electrical work"
  }
]

Return ONLY valid JSON array, no markdown, no extra text. If no relevant messages, return [].`;

      const response = await getOpenAI().chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that performs semantic search. Analyze messages and return relevance scores based on meaning, not just keywords. Return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower for more focused results
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse AI response and map back to original messages
      const aiResults = this.parseSearchResponse(content);
      const results: AIFeatures.SearchResult[] = aiResults
        .map(result => {
          // Find the original message by index (messageId from AI is 1-indexed)
          const messageIdx = parseInt(result.messageId) - 1;
          if (messageIdx < 0 || messageIdx >= messages.length) {
            return null;
          }

          const originalMessage = messages[messageIdx];
          return {
            messageId: originalMessage.messageId,
            threadId: originalMessage.threadId,
            text: originalMessage.text,
            sender: originalMessage.sender,
            timestamp: new Date(originalMessage.timestamp),
            relevance: result.relevance,
            snippet: result.snippet,
          };
        })
        .filter(r => r !== null) as AIFeatures.SearchResult[];

      // Cache the result
      setCachedResult(cacheKey, results, this.config);

      const responseTime = Date.now() - startTime;
      console.log(
        `Smart search completed in ${responseTime}ms, found ${results.length} results`
      );

      return results;
    } catch (error) {
      console.error('Error performing smart search:', error);
      throw error;
    }
  }

  async trackDecision(
    messageId: string,
    decision: AIFeatures.Decision
  ): Promise<AIFeatures.Decision | null> {
    if (!this.config.features.decisionTracking.enabled) {
      throw new Error('Decision tracking feature is disabled');
    }

    // Check rate limit
    if (!checkRateLimit(messageId, this.config)) {
      throw new Error('Rate limit exceeded');
    }

    try {
      const startTime = Date.now();

      // Store decision in Firestore (this would be implemented with actual Firestore calls)
      // For now, we'll just return the decision with a timestamp
      const trackedDecision: AIFeatures.Decision = {
        ...decision,
        id: decision.id || `decision_${Date.now()}`,
        decidedAt: decision.decidedAt || new Date(),
      };

      const responseTime = Date.now() - startTime;
      console.log(`Decision tracked in ${responseTime}ms`);

      return trackedDecision;
    } catch (error) {
      console.error('Error tracking decision:', error);
      throw error;
    }
  }

  async getProactiveSuggestions(
    threadId: string,
    context: any
  ): Promise<AIFeatures.ProactiveSuggestion[]> {
    if (!this.config.features.proactiveAgent.enabled) {
      throw new Error('Proactive agent feature is disabled');
    }

    // Check rate limit
    if (!checkRateLimit(threadId, this.config)) {
      throw new Error('Rate limit exceeded');
    }

    // Check cache
    const cacheKey = `suggestions_${threadId}_${JSON.stringify(context).slice(0, 100)}`;
    const cached = getCachedResult<AIFeatures.ProactiveSuggestion[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const startTime = Date.now();

      const prompt = this.buildProactivePrompt(context);

      const response = await getChatModel().invoke([
        {
          role: 'system',
          content:
            'You are a proactive AI assistant that monitors conversations and suggests helpful actions. Provide contextual suggestions based on conversation patterns and user needs.',
        },
        { role: 'user', content: prompt },
      ]);

      const content = response.content as string;
      if (!content) {
        throw new Error('No response from LangChain');
      }

      const suggestions = this.parseProactiveResponse(content);

      // Cache the result
      setCachedResult(cacheKey, suggestions, this.config);

      const responseTime = Date.now() - startTime;
      console.log(`Proactive suggestions generated in ${responseTime}ms`);

      return suggestions;
    } catch (error) {
      console.error('Error generating proactive suggestions:', error);
      throw error;
    }
  }

  // Private helper methods for building prompts
  private buildSummaryPrompt(messages: any[]): string {
    const messageTexts = messages
      .map(
        (msg, index) =>
          `${index + 1}. [${msg.sender || 'Unknown'}]: ${msg.text}`
      )
      .join('\n');

    return `Analyze this construction/contractor conversation and provide a JSON response with this EXACT format:
{
  "summary": "2-3 sentence overview of the conversation",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "actionItems": ["action 1", "action 2", "action 3"]
}

Conversation:
${messageTexts}

Return ONLY valid JSON, no markdown, no extra text.`;
  }

  private buildActionExtractionPrompt(messages: any[]): string {
    const messageTexts = messages
      .map(
        (msg, index) =>
          `${index + 1}. [${msg.sender || 'Unknown'}]: ${msg.text}`
      )
      .join('\n');

    return `Extract all action items, tasks, and commitments from this construction/contractor conversation.

Return a JSON array of action items with this EXACT format:
[
  {
    "task": "Description of the task",
    "assignedTo": "Person responsible (or null)",
    "priority": "high" or "medium" or "low",
    "dueDate": "Date if mentioned (or null)"
  }
]

Conversation:
${messageTexts}

Look for:
- Tasks that need to be done
- Items needing approval
- Change orders
- Follow-ups required
- Deadlines mentioned

Return ONLY valid JSON array, no markdown, no extra text. If no action items found, return [].`;
  }

  private buildPriorityDetectionPrompt(message: any): string {
    return `Analyze this message and determine its priority level (high, medium, or low):

Message: "${message.text}"
Timestamp: ${message.timestamp}

Consider factors like:
- Urgency indicators (urgent, ASAP, emergency)
- Importance to business operations
- Time sensitivity
- Impact on project success

Return only the priority level: high, medium, or low`;
  }

  private buildProactivePrompt(context: any): string {
    return `Based on this conversation context, suggest proactive actions:

Context: ${JSON.stringify(context, null, 2)}

Consider:
1. Follow-up actions needed
2. Reminders for deadlines
3. Suggestions for improving communication
4. Potential issues to address

Provide 3-5 specific, actionable suggestions with confidence scores.`;
  }

  // Private helper methods for parsing responses
  private parseSummaryResponse(content: string): AIFeatures.ThreadSummary {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to parse as JSON
      const parsed = JSON.parse(cleanContent);

      return {
        summary: parsed.summary || 'No summary available',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        actionItems: Array.isArray(parsed.actionItems)
          ? parsed.actionItems
          : [],
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to parse summary response as JSON:', error);
      console.log('Raw content:', content);

      // Fallback: Extract what we can from plain text
      const lines = content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l);

      return {
        summary: lines[0] || 'Summary unavailable',
        keyPoints: lines.slice(1, 4),
        actionItems: [],
        generatedAt: new Date().toISOString(),
      };
    }
  }

  private parseActionItemsResponse(content: string): AIFeatures.ActionItem[] {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to parse as JSON array
      const parsed = JSON.parse(cleanContent);

      if (!Array.isArray(parsed)) {
        console.error('Expected array, got:', typeof parsed);
        return [];
      }

      // Map to our ActionItem format
      return parsed.map((item, index) => ({
        id: `action_${Date.now()}_${index}`,
        threadId: '',
        messageId: '',
        task: item.task || 'Unknown task',
        text: item.task || '',
        assignedTo: item.assignedTo || undefined,
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        priority: (item.priority || 'medium') as AIFeatures.PriorityLevel,
        status: 'pending' as const,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Failed to parse action items response as JSON:', error);
      console.log('Raw content:', content);

      // Fallback: Try to extract action items from plain text
      const lines = content
        .split('\n')
        .map(l => l.trim())
        .filter(
          l =>
            l &&
            (l.toLowerCase().includes('action') ||
              l.toLowerCase().includes('task') ||
              l.toLowerCase().includes('need') ||
              l.toLowerCase().includes('must') ||
              l.toLowerCase().includes('should') ||
              l.startsWith('-') ||
              l.startsWith('•') ||
              l.match(/^\d+\./))
        );

      return lines.slice(0, 10).map((line, index) => ({
        id: `action_${Date.now()}_${index}`,
        threadId: '',
        messageId: '',
        task: line.replace(/^[-•\d.]\s*/, ''),
        text: line.replace(/^[-•\d.]\s*/, ''),
        priority: 'medium' as AIFeatures.PriorityLevel,
        status: 'pending' as const,
        createdAt: new Date(),
      }));
    }
  }

  private parsePriorityResponse(content: string): AIFeatures.PriorityLevel {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('high')) return 'high';
    if (lowerContent.includes('medium')) return 'medium';
    if (lowerContent.includes('low')) return 'low';
    return 'medium'; // default
  }

  private parseSearchResponse(content: string): any[] {
    try {
      // Remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      // Try to parse as JSON array
      const parsed = JSON.parse(cleanContent);

      if (!Array.isArray(parsed)) {
        console.error('Expected array, got:', typeof parsed);
        return [];
      }

      // Return array of { messageId, relevance, snippet }
      return parsed.map(item => ({
        messageId: String(item.messageId || item.index || '0'),
        relevance: parseFloat(item.relevance || 0.5),
        snippet: item.snippet || '',
      }));
    } catch (error) {
      console.error('Failed to parse search response as JSON:', error);
      console.log('Raw content:', content);
      return [];
    }
  }

  private parseProactiveResponse(
    content: string
  ): AIFeatures.ProactiveSuggestion[] {
    const lines = content.split('\n');
    const suggestions: AIFeatures.ProactiveSuggestion[] = [];

    lines.forEach((line, index) => {
      if (line.trim()) {
        suggestions.push({
          type: 'followup',
          message: line.trim(),
          priority: 'medium',
          context: '',
        });
      }
    });

    return suggestions;
  }

  /**
   * Classify checklist intent from natural language text
   * Returns: 'create_item' | 'mark_complete' | 'query_status' | 'unknown'
   */
  async classifyChecklistIntent(text: string): Promise<string> {
    try {
      const startTime = Date.now();

      const prompt = `Analyze this natural language command about a checklist and classify the intent.

Command: "${text}"

Possible intents:
1. "create_item" - User wants to add a new item to the checklist (e.g., "add new task: install tiles", "create item: paint walls")
2. "mark_complete" - User wants to mark an item as complete (e.g., "mark item 3 complete", "complete install tiles", "done with painting", "Kitchen is ready", "Bathroom done", "[item] is finished")
3. "query_status" - User wants to query the checklist status (e.g., "what's next?", "show incomplete tasks", "how many done?")

Return ONLY one of these exact strings: "create_item", "mark_complete", "query_status", or "unknown" if unclear.

IMPORTANT: Phrases like "[item] is ready", "[item] is done", "[item] is complete", "[item] finished" should be classified as "mark_complete".

Examples:
- "mark item 3 complete" → "mark_complete"
- "Kitchen is ready" → "mark_complete"
- "Bathroom done" → "mark_complete"
- "Kitchen finished" → "mark_complete"
- "add new task: install tiles" → "create_item"
- "what's next?" → "query_status"
- "show incomplete tasks" → "query_status"
- "hello" → "unknown"

Return ONLY the intent string, nothing else.`;

      const response = await getOpenAI().chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that classifies checklist commands. Return only the intent string: "create_item", "mark_complete", "query_status", or "unknown".',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower for more consistent classification
        max_tokens: 50,
      });

      const content = response.choices[0]?.message?.content?.trim().toLowerCase();
      if (!content) {
        return 'unknown';
      }

      // Extract intent from response (handle cases where GPT adds extra text)
      if (content.includes('create_item')) return 'create_item';
      if (content.includes('mark_complete')) return 'mark_complete';
      if (content.includes('query_status')) return 'query_status';
      if (content.includes('unknown')) return 'unknown';

      // Fallback: try to infer from content
      if (content.includes('create') || content.includes('add') || content.includes('new')) {
        return 'create_item';
      }
      if (content.includes('complete') || content.includes('done') || content.includes('mark')) {
        return 'mark_complete';
      }
      if (content.includes('query') || content.includes('what') || content.includes('show') || content.includes('how')) {
        return 'query_status';
      }

      const responseTime = Date.now() - startTime;
      console.log(`Checklist intent classified in ${responseTime}ms: ${content}`);

      return 'unknown';
    } catch (error) {
      console.error('Error classifying checklist intent:', error);
      return 'unknown';
    }
  }

  /**
   * Match natural language text to a checklist item
   * Uses semantic similarity and exact matching
   */
  async matchChecklistItem(
    text: string,
    checklistId: string,
    items: Array<{ id: string; title: string; status: string; order: number }>
  ): Promise<{ id: string; title: string; confidence: number; additionalMatches?: Array<{ id: string; title: string; confidence: number }> } | null> {
    if (!items || items.length === 0) {
      return null;
    }

    try {
      const startTime = Date.now();

      // First, try exact matching for item numbers (e.g., "item 3", "item 1")
      const itemNumberMatch = text.match(/item\s+(\d+)/i);
      if (itemNumberMatch) {
        const itemIndex = parseInt(itemNumberMatch[1], 10) - 1; // Convert to 0-based index
        if (itemIndex >= 0 && itemIndex < items.length) {
          const sortedItems = [...items].sort((a, b) => a.order - b.order);
          const matched = sortedItems[itemIndex];
          return {
            id: matched.id,
            title: matched.title,
            confidence: 1.0,
            additionalMatches: undefined,
          };
        }
      }

      // Try exact title matching
      const exactMatch = items.find(item =>
        item.title.toLowerCase() === text.toLowerCase().trim()
      );
      if (exactMatch) {
        return {
          id: exactMatch.id,
          title: exactMatch.title,
          confidence: 1.0,
          additionalMatches: undefined,
        };
      }

      // Use GPT-4 for semantic similarity matching
      const itemsList = items
        .map((item, idx) => `${idx + 1}. "${item.title}" (id: ${item.id})`)
        .join('\n');

      const prompt = `Match this natural language reference to one or more of these checklist items.

User said: "${text}"

Available items:
${itemsList}

Find matching items. Be flexible and consider:
- Exact matches (same words: "Kitchen" = "Kitchen")
- Semantic similarity (similar meaning: "Kitchen is ready" matches "Kitchen")
- Partial matches (contains key words: "the kitchen" matches "Kitchen")
- Room/area names (if user says "bathroom is done", match "Bathroom" item)
- Status phrases (if user says "[item] is ready/done/complete", match that item)
- Natural variations ("kitchen done" = "Kitchen", "bathroom finished" = "Bathroom")

IMPORTANT: If the user mentions a room/area name or item name (even in a phrase like "Kitchen is ready"), match it to the corresponding checklist item with high confidence.

Examples:
- "Kitchen is ready" → match "Kitchen" item (high confidence)
- "Bathroom done" → match "Bathroom" item (high confidence)
- "mark kitchen complete" → match "Kitchen" item (high confidence)

Return ONLY a JSON array in this EXACT format (sorted by confidence, highest first):
[
  {
    "id": "item_id_here",
    "title": "item_title_here",
    "confidence": 0.95
  },
  {
    "id": "item_id_2",
    "title": "item_title_2",
    "confidence": 0.85
  }
]

Include all items with confidence >= 0.6. If no good matches, return empty array [].

Return ONLY valid JSON array, no markdown, no extra text.`;

      const response = await getOpenAI().chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that matches natural language to checklist items. Return only valid JSON with id, title, and confidence.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return null;
      }

      // Parse JSON response
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanContent);

      // Handle both single object (legacy) and array (new) formats
      const matches = Array.isArray(parsed) ? parsed : [parsed];
      
      // Filter matches with confidence >= 0.6
      const validMatches = matches.filter(m => m.id && m.confidence >= 0.6);

      if (validMatches.length === 0) {
        return null;
      }

      // Return best match (first in sorted array)
      const bestMatch = validMatches[0];
      
      const responseTime = Date.now() - startTime;
      console.log(`Item matched in ${responseTime}ms: ${bestMatch.title} (confidence: ${bestMatch.confidence})${validMatches.length > 1 ? `, ${validMatches.length - 1} additional matches` : ''}`);

      return {
        id: bestMatch.id,
        title: bestMatch.title,
        confidence: bestMatch.confidence,
        // Include additional matches if confidence is similar (within 0.15)
        additionalMatches: validMatches.length > 1 && validMatches[1].confidence >= bestMatch.confidence - 0.15
          ? validMatches.slice(1).map(m => ({ id: m.id, title: m.title, confidence: m.confidence }))
          : undefined,
      };
    } catch (error) {
      console.error('Error matching checklist item:', error);
      return null;
    }
  }

  /**
   * Process a checklist command and generate preview
   * Orchestrates: intent classification → item matching → preview generation
   */
  async processChecklistCommand(
    text: string,
    checklistId: string,
    items: Array<{ id: string; title: string; status: string; order: number }>
  ): Promise<{
    intent: string;
    matchedItem?: { id: string; title: string; confidence: number; additionalMatches?: Array<{ id: string; title: string; confidence: number }> };
    suggestedAction: string;
    confidence: number;
    newItemTitle?: string;
    queryResult?: string;
  }> {
    try {
      // Step 1: Classify intent
      const intent = await this.classifyChecklistIntent(text);

      if (intent === 'unknown') {
        // Provide helpful suggestions based on common patterns
        const lowerText = text.toLowerCase();
        let suggestion = 'Unable to understand command. ';
        
        if (lowerText.includes('complete') || lowerText.includes('done') || lowerText.includes('finish')) {
          suggestion += 'Did you mean to mark an item complete? Try: "mark item 3 complete"';
        } else if (lowerText.includes('add') || lowerText.includes('create') || lowerText.includes('new')) {
          suggestion += 'Did you mean to create a new item? Try: "add new task: [task name]"';
        } else if (lowerText.includes('what') || lowerText.includes('show') || lowerText.includes('how')) {
          suggestion += 'Did you mean to query status? Try: "what\'s next?" or "show incomplete tasks"';
        } else {
          suggestion += 'Please try: "mark item 3 complete", "add new task: [name]", or "what\'s next?"';
        }

        return {
          intent: 'unknown',
          suggestedAction: suggestion,
          confidence: 0,
        };
      }

      // Step 2: Match item (if needed for mark_complete)
      let matchedItem: { id: string; title: string; confidence: number; additionalMatches?: Array<{ id: string; title: string; confidence: number }> } | null = null;
      if (intent === 'mark_complete') {
        matchedItem = await this.matchChecklistItem(text, checklistId, items);
      }

      // Step 3: Generate preview based on intent
      if (intent === 'create_item') {
        // Extract item title from command
        const titleMatch = text.match(/(?:add|create|new).*?:(.+)|(?:add|create|new)\s+(?:task|item)\s+(.+)/i);
        const newTitle = titleMatch
          ? (titleMatch[1] || titleMatch[2]).trim()
          : text.replace(/(?:add|create|new)\s+(?:task|item)\s*/i, '').trim();

        return {
          intent: 'create_item',
          suggestedAction: `Add new item: "${newTitle}"`,
          confidence: 0.8,
          newItemTitle: newTitle,
        };
      }

      if (intent === 'mark_complete') {
        if (!matchedItem) {
          // Suggest similar items if available
          const suggestions = items
            .filter(item => item.status !== 'completed')
            .slice(0, 3)
            .map(item => `"${item.title}"`)
            .join(', ');

          const errorMessage = suggestions
            ? `Unable to find matching item. Did you mean: ${suggestions}?`
            : 'Unable to find matching item. Please specify which item to mark complete.';

          return {
            intent: 'mark_complete',
            suggestedAction: errorMessage,
            confidence: 0,
          };
        }

        return {
          intent: 'mark_complete',
          matchedItem: {
            id: matchedItem.id,
            title: matchedItem.title,
            confidence: matchedItem.confidence,
            additionalMatches: matchedItem.additionalMatches,
          },
          suggestedAction: `Mark "${matchedItem.title}" as complete`,
          confidence: matchedItem.confidence,
        };
      }

      if (intent === 'query_status') {
        // For MVP, return simple query result
        const incompleteItems = items.filter(item => item.status !== 'completed');
        const completedCount = items.filter(item => item.status === 'completed').length;
        const totalCount = items.length;

        let queryResult = '';
        if (text.toLowerCase().includes('next') || text.toLowerCase().includes("what's")) {
          if (incompleteItems.length > 0) {
            const sorted = incompleteItems.sort((a, b) => a.order - b.order);
            queryResult = `Next task: "${sorted[0].title}"`;
          } else {
            queryResult = 'All tasks are complete!';
          }
        } else if (text.toLowerCase().includes('incomplete')) {
          if (incompleteItems.length > 0) {
            queryResult = `Incomplete tasks: ${incompleteItems.map(item => `"${item.title}"`).join(', ')}`;
          } else {
            queryResult = 'All tasks are complete!';
          }
        } else if (text.toLowerCase().includes('how many') || text.toLowerCase().includes('done')) {
          queryResult = `${completedCount} of ${totalCount} tasks complete`;
        } else {
          queryResult = `${completedCount} of ${totalCount} tasks complete. ${incompleteItems.length} remaining.`;
        }

        return {
          intent: 'query_status',
          suggestedAction: queryResult,
          confidence: 0.9,
          queryResult,
        };
      }

      return {
        intent: 'unknown',
        suggestedAction: 'Unable to process command.',
        confidence: 0,
      };
    } catch (error) {
      console.error('Error processing checklist command:', error);
      throw error;
    }
  }

  /**
   * Analyze an image for checklist completion detection using GPT-4 Vision API
   * Returns detected tasks and completion status
   */
  async analyzeImageForChecklist(
    imageUrl: string,
    checklistId: string
  ): Promise<{
    detectedTasks: Array<{
      description: string;
      confidence: 'high' | 'medium' | 'low';
      confidenceScore: number;
    }>;
    completionStatus: 'complete' | 'incomplete' | 'partial' | 'unknown';
    summary: string;
  }> {
    try {
      const startTime = Date.now();

      // Get checklist context for better analysis
      // Note: We don't import checklistService here to avoid circular dependencies
      // The checklist context can be passed separately if needed, but for MVP we'll analyze the image independently

      const prompt = `Analyze this construction/contractor work image and identify:
1. What tasks or work items are visible in the image
2. Whether the work appears complete, incomplete, or partially complete
3. A brief summary of what you see

Focus on identifying specific construction tasks that might match checklist items (e.g., "install cabinets", "paint walls", "install countertops", "electrical work", "plumbing fixtures").

Return ONLY a JSON object in this EXACT format:
{
  "detectedTasks": [
    {
      "description": "Task description (e.g., 'Install kitchen cabinets')",
      "confidenceScore": 0.95
    }
  ],
  "completionStatus": "complete" | "incomplete" | "partial" | "unknown",
  "summary": "Brief 1-2 sentence summary of what's visible"
}

Confidence scores should be 0-1, where:
- 0.85-1.0 = high confidence
- 0.70-0.84 = medium confidence
- 0.0-0.69 = low confidence

Return ONLY valid JSON, no markdown, no extra text.`;

      // Use GPT-4 Vision (gpt-4-vision-preview or gpt-4o)
      // For vision, we need to use the chat completions API with image content
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o', // GPT-4o supports vision, fallback to gpt-4-vision-preview if needed
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that analyzes construction/contractor work images. Identify tasks and completion status. Return only valid JSON.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.3, // Lower for more consistent analysis
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI Vision API');
      }

      // Parse JSON response
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanContent);

      // Convert confidence scores to confidence levels
      const detectedTasks = (parsed.detectedTasks || []).map((task: any) => {
        const score = parseFloat(task.confidenceScore || 0);
        let confidence: 'high' | 'medium' | 'low' = 'low';
        if (score >= 0.85) confidence = 'high';
        else if (score >= 0.70) confidence = 'medium';

        return {
          description: task.description || '',
          confidence,
          confidenceScore: score,
        };
      });

      const responseTime = Date.now() - startTime;
      console.log(
        `Image analyzed in ${responseTime}ms: ${detectedTasks.length} tasks detected`
      );

      return {
        detectedTasks,
        completionStatus:
          parsed.completionStatus || 'unknown',
        summary: parsed.summary || 'No summary available',
      };
    } catch (error) {
      console.error('Error analyzing image for checklist:', error);
      throw error;
    }
  }

  /**
   * Match detected tasks from image analysis to checklist items
   * Uses semantic similarity and exact matching
   */
  async matchImageToChecklistItems(
    detectedTasks: Array<{ description: string; confidenceScore: number }>,
    checklistId: string,
    items: Array<{ id: string; title: string; status: string; order: number }>
  ): Promise<
    Array<{
      itemId: string;
      confidence: 'high' | 'medium' | 'low';
      confidenceScore: number;
      reasoning?: string;
    }>
  > {
    if (!detectedTasks || detectedTasks.length === 0) {
      return [];
    }

    if (!items || items.length === 0) {
      return [];
    }

    try {
      const startTime = Date.now();

      // Build items list for matching
      const itemsList = items
        .map((item, idx) => `${idx + 1}. "${item.title}" (id: ${item.id}, status: ${item.status})`)
        .join('\n');

      // Build detected tasks list
      const tasksList = detectedTasks
        .map((task, idx) => `${idx + 1}. "${task.description}" (confidence: ${task.confidenceScore})`)
        .join('\n');

      const prompt = `Match these detected tasks from an image analysis to checklist items.

Detected Tasks from Image:
${tasksList}

Available Checklist Items:
${itemsList}

For each detected task, find the best matching checklist item(s). Be flexible and consider:
- Exact matches (same words/phrases like "bathroom" = "Bathroom")
- Semantic similarity (similar meaning: "install vanity" matches "Bathroom")
- Partial matches (contains key words: "bathroom fixtures" matches "Bathroom")
- Construction/contractor terminology variations ("cabinet installation" = "Kitchen")
- Room/area matches (if image shows bathroom, match "Bathroom" item)
- General category matches (if image shows kitchen work, match "Kitchen" item)

IMPORTANT: If a detected task clearly relates to a checklist item (even if wording differs), include it with appropriate confidence.

Examples:
- Image shows bathroom → match "Bathroom" checklist item (high confidence)
- Image shows kitchen cabinets → match "Kitchen" checklist item (high confidence)
- Image shows "install vanity" → match "Bathroom" item (high confidence)

Return ONLY a JSON array in this EXACT format (one entry per match, sorted by confidence):
[
  {
    "itemId": "item_id_here",
    "confidenceScore": 0.95,
    "reasoning": "Brief explanation of why this matches"
  }
]

Include matches with confidenceScore >= 0.6. If no good matches, return empty array [].

Return ONLY valid JSON array, no markdown, no extra text.`;

      const response = await getOpenAI().chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that matches detected tasks to checklist items. Return only valid JSON with itemId, confidenceScore, and reasoning.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        return [];
      }

      // Parse JSON response
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanContent);
      const matches = Array.isArray(parsed) ? parsed : [parsed];

      // Filter and convert to confidence levels
      const validMatches = matches
        .filter((m: any) => m.itemId && m.confidenceScore >= 0.6)
        .map((m: any) => {
          const score = parseFloat(m.confidenceScore || 0);
          let confidence: 'high' | 'medium' | 'low' = 'low';
          if (score >= 0.85) confidence = 'high';
          else if (score >= 0.70) confidence = 'medium';

          return {
            itemId: m.itemId,
            confidence,
            confidenceScore: score,
            reasoning: m.reasoning,
          };
        });

      const responseTime = Date.now() - startTime;
      console.log(
        `Items matched in ${responseTime}ms: ${validMatches.length} matches found`
      );

      return validMatches;
    } catch (error) {
      console.error('Error matching image to checklist items:', error);
      return [];
    }
  }

  /**
   * Process a natural language query about checklist status
   * Handles queries like: "what's next?", "show incomplete", "how many done?"
   */
  async processChecklistQuery(
    query: string,
    checklistId: string,
    items: Array<{ id: string; title: string; status: string; order: number }>
  ): Promise<{
    query: string;
    answer: string;
    nextTask?: { id: string; title: string; status: string; order: number };
    incompleteItems?: Array<{ id: string; title: string; status: string; order: number }>;
    progress?: {
      total: number;
      completed: number;
      percentage: number;
    };
    relatedItems?: Array<{ id: string; title: string; status: string; order: number }>;
  }> {
    try {
      const startTime = Date.now();
      const lowerQuery = query.toLowerCase().trim();

      // Handle simple queries with direct logic
      if (lowerQuery.includes("what's next") || lowerQuery.includes("what is next") || lowerQuery === "next") {
        const incompleteItems = items.filter(item => item.status !== 'completed');
        const sorted = incompleteItems.sort((a, b) => a.order - b.order);
        const nextTask = sorted[0];

        return {
          query,
          answer: nextTask
            ? `Next task: ${nextTask.title}`
            : 'All tasks are complete!',
          nextTask: nextTask || undefined,
        };
      }

      if (lowerQuery.includes("show incomplete") || lowerQuery.includes("show pending") || lowerQuery.includes("incomplete")) {
        const incompleteItems = items.filter(item => item.status !== 'completed');
        const sorted = incompleteItems.sort((a, b) => a.order - b.order);

        return {
          query,
          answer: incompleteItems.length === 0
            ? 'All tasks are complete!'
            : `Found ${incompleteItems.length} incomplete task${incompleteItems.length > 1 ? 's' : ''}: ${sorted.map(i => i.title).join(', ')}`,
          incompleteItems: sorted,
        };
      }

      if (lowerQuery.includes("how many") && (lowerQuery.includes("done") || lowerQuery.includes("complete"))) {
        const completedCount = items.filter(item => item.status === 'completed').length;
        const totalCount = items.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        return {
          query,
          answer: `${completedCount} of ${totalCount} tasks complete${percentage > 0 ? ` (${percentage}%)` : ''}`,
          progress: {
            total: totalCount,
            completed: completedCount,
            percentage,
          },
        };
      }

      // For complex queries, use GPT-4
      const itemsList = items
        .map((item, idx) => `${idx + 1}. "${item.title}" (status: ${item.status}, order: ${item.order})`)
        .join('\n');

      const prompt = `Answer this question about a checklist:

Question: "${query}"

Checklist Items:
${itemsList}

Provide a helpful answer. Consider:
- What tasks are next (incomplete items sorted by order)
- Which items are incomplete
- Progress statistics (completed vs total)
- Specific item details if asked

Return ONLY a JSON object in this EXACT format:
{
  "answer": "Your answer here",
  "nextTask": { "id": "item_id", "title": "item_title", "status": "pending", "order": 1 } or null,
  "incompleteItems": [array of incomplete items] or [],
  "progress": { "total": 10, "completed": 5, "percentage": 50 } or null,
  "relatedItems": [array of relevant items] or []
}

Return ONLY valid JSON, no markdown, no extra text.`;

      const response = await getOpenAI().chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that answers questions about checklist status. Return only valid JSON with answer, nextTask, incompleteItems, progress, and relatedItems.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleanContent);

      const responseTime = Date.now() - startTime;
      console.log(`Query processed in ${responseTime}ms`);

      return {
        query,
        answer: parsed.answer || 'Unable to process query',
        nextTask: parsed.nextTask || undefined,
        incompleteItems: parsed.incompleteItems || undefined,
        progress: parsed.progress || undefined,
        relatedItems: parsed.relatedItems || undefined,
      };
    } catch (error) {
      console.error('Error processing checklist query:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
