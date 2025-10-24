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
    threadId?: string
  ): Promise<AIFeatures.SearchResult[]> {
    if (!this.config.features.smartSearch.enabled) {
      throw new Error('Smart search feature is disabled');
    }

    if (!query.trim()) {
      return [];
    }

    // Check rate limit
    if (!checkRateLimit(query, this.config)) {
      throw new Error('Rate limit exceeded');
    }

    // Check cache
    const cacheKey = `search_${query}_${threadId || 'global'}`;
    const cached = getCachedResult<AIFeatures.SearchResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const startTime = Date.now();

      const prompt = this.buildSearchPrompt(query, threadId);

      const response = await getOpenAI().chat.completions.create({
        model: this.config.openai.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an AI assistant that performs semantic search on conversations. Return relevant messages with relevance scores.',
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

      const results = this.parseSearchResponse(content);

      // Cache the result
      setCachedResult(cacheKey, results, this.config);

      const responseTime = Date.now() - startTime;
      console.log(`Smart search completed in ${responseTime}ms`);

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
      .map((msg, index) => `${index + 1}. ${msg.text} (${msg.timestamp})`)
      .join('\n');

    return `Please summarize the following conversation thread. Focus on:
1. Key decisions made
2. Action items and tasks
3. Important context and background
4. Unresolved issues

Conversation:
${messageTexts}

Provide a structured summary with clear sections for decisions, action items, and context.`;
  }

  private buildActionExtractionPrompt(messages: any[]): string {
    const messageTexts = messages
      .map((msg, index) => `${index + 1}. ${msg.text}`)
      .join('\n');

    return `Extract all action items from this conversation. For each action item, identify:
1. The specific task or action
2. Who is responsible (if mentioned)
3. Priority level (high/medium/low)
4. Due date (if mentioned)

Conversation:
${messageTexts}

Return the action items in a structured format.`;
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

  private buildSearchPrompt(query: string, threadId?: string): string {
    return `Perform a semantic search for: "${query}"

${threadId ? `Focus on thread: ${threadId}` : 'Search across all conversations'}

Return relevant messages with:
1. Message ID
2. Relevance score (0-1)
3. Snippet of relevant text
4. Context about why it's relevant

Format the results as a structured list.`;
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
    // Simple parsing - in production, you'd want more robust parsing
    const lines = content.split('\n');
    const summary =
      lines.find(line => line.toLowerCase().includes('summary')) || content;

    return {
      summary: summary,
      keyPoints: lines.filter(
        line => line.startsWith('•') || line.startsWith('-')
      ),
      actionItems: [],
      generatedAt: new Date().toISOString(),
    };
  }

  private parseActionItemsResponse(content: string): AIFeatures.ActionItem[] {
    const lines = content.split('\n');
    const actionItems: AIFeatures.ActionItem[] = [];

    lines.forEach((line, index) => {
      if (
        line.trim() &&
        (line.includes('action') ||
          line.includes('task') ||
          line.includes('todo'))
      ) {
        actionItems.push({
          id: `action_${Date.now()}_${index}`,
          threadId: '',
          messageId: '',
          task: line.trim(),
          text: line.trim(),
          priority: this.extractPriority(line),
          assignedTo: this.extractAssignee(line),
          dueDate: this.extractDueDate(line),
          status: 'pending',
          createdAt: new Date(),
        });
      }
    });

    return actionItems;
  }

  private parsePriorityResponse(content: string): AIFeatures.PriorityLevel {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('high')) return 'high';
    if (lowerContent.includes('medium')) return 'medium';
    if (lowerContent.includes('low')) return 'low';
    return 'medium'; // default
  }

  private parseSearchResponse(content: string): AIFeatures.SearchResult[] {
    const lines = content.split('\n');
    const results: AIFeatures.SearchResult[] = [];

    lines.forEach((line, index) => {
      if (line.trim()) {
        results.push({
          messageId: `search_result_${index}`,
          threadId: '',
          text: line.trim(),
          snippet: line.trim(),
          sender: '',
          timestamp: new Date(),
          relevance: 0.8, // Default score
        });
      }
    });

    return results;
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

  private extractPriority(text: string): AIFeatures.PriorityLevel {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('urgent') || lowerText.includes('high'))
      return 'high';
    if (lowerText.includes('low')) return 'low';
    return 'medium';
  }

  private extractAssignee(text: string): string | undefined {
    // Simple regex to extract assignee - in production, use more sophisticated NLP
    const match = text.match(/(?:assign|give|send)\s+(?:to\s+)?([A-Za-z\s]+)/i);
    return match ? match[1].trim() : undefined;
  }

  private extractDueDate(text: string): Date | undefined {
    // Simple regex to extract dates - in production, use date parsing library
    const match = text.match(/(?:by|due|before)\s+([A-Za-z0-9\s,]+)/i);
    if (match) {
      try {
        return new Date(match[1]);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

// Export singleton instance
export const aiService = new AIService();
