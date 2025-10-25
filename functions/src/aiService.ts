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
}

// Export singleton instance
export const aiService = new AIService();
