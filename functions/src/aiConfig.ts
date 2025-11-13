import { OpenAI } from 'openai';
import { ChatOpenAI } from '@langchain/openai';

// Lazy initialization of OpenAI client
let _openai: OpenAI | null = null;
let _chatModel: ChatOpenAI | null = null;
let _cachedApiKey: string | null = null;

export const getOpenAI = (): OpenAI => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  // Reinitialize if API key changed (for hot reloading in emulator)
  if (!_openai || _cachedApiKey !== apiKey) {
    _openai = new OpenAI({ apiKey });
    _cachedApiKey = apiKey;
    console.log('OpenAI client initialized with API key:', apiKey.substring(0, 10) + '...');
  }
  
  return _openai;
};

export const getChatModel = (): ChatOpenAI => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  // Reinitialize if API key changed (for hot reloading in emulator)
  if (!_chatModel || _cachedApiKey !== apiKey) {
    _chatModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
    });
    _cachedApiKey = apiKey;
  }
  
  return _chatModel;
};

export interface AIConfig {
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  langchain: {
    modelName: string;
    temperature: number;
    maxTokens: number;
  };
  features: {
    threadSummary: {
      enabled: boolean;
      maxMessages: number;
      responseTime: number; // milliseconds
    };
    actionExtraction: {
      enabled: boolean;
      minConfidence: number;
      responseTime: number;
    };
    priorityDetection: {
      enabled: boolean;
      responseTime: number;
    };
    smartSearch: {
      enabled: boolean;
      maxResults: number;
      responseTime: number;
    };
    decisionTracking: {
      enabled: boolean;
      responseTime: number;
    };
    proactiveAgent: {
      enabled: boolean;
      responseTime: number;
    };
  };
  performance: {
    enableCaching: boolean;
    cacheExpiry: number; // seconds
    rateLimitPerMinute: number;
  };
}

export const defaultAIConfig: AIConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
  },
  langchain: {
    modelName: 'gpt-4',
    temperature: 0.7,
    maxTokens: 1000,
  },
  features: {
    threadSummary: {
      enabled: true,
      maxMessages: 50,
      responseTime: 2000, // 2 seconds
    },
    actionExtraction: {
      enabled: true,
      minConfidence: 0.8,
      responseTime: 1500, // 1.5 seconds
    },
    priorityDetection: {
      enabled: true,
      responseTime: 1000, // 1 second
    },
    smartSearch: {
      enabled: true,
      maxResults: 10,
      responseTime: 2000, // 2 seconds
    },
    decisionTracking: {
      enabled: true,
      responseTime: 1000, // 1 second
    },
    proactiveAgent: {
      enabled: true,
      responseTime: 3000, // 3 seconds
    },
  },
  performance: {
    enableCaching: true,
    cacheExpiry: 3600, // 1 hour
    rateLimitPerMinute: 60,
  },
};

// Validate configuration
export const validateAIConfig = (config: AIConfig): string[] => {
  const errors: string[] = [];

  if (!config.openai.apiKey) {
    errors.push('OpenAI API key is required');
  }

  if (config.openai.temperature < 0 || config.openai.temperature > 2) {
    errors.push('OpenAI temperature must be between 0 and 2');
  }

  if (config.openai.maxTokens < 1 || config.openai.maxTokens > 4000) {
    errors.push('OpenAI maxTokens must be between 1 and 4000');
  }

  if (config.features.threadSummary.maxMessages < 1) {
    errors.push('Thread summary maxMessages must be at least 1');
  }

  if (
    config.features.actionExtraction.minConfidence < 0 ||
    config.features.actionExtraction.minConfidence > 1
  ) {
    errors.push('Action extraction minConfidence must be between 0 and 1');
  }

  if (config.features.smartSearch.maxResults < 1) {
    errors.push('Smart search maxResults must be at least 1');
  }

  if (config.performance.cacheExpiry < 0) {
    errors.push('Cache expiry must be non-negative');
  }

  if (config.performance.rateLimitPerMinute < 1) {
    errors.push('Rate limit per minute must be at least 1');
  }

  return errors;
};

// Get configuration with environment variable overrides
export const getAIConfig = (): AIConfig => {
  const config = { ...defaultAIConfig };

  // Override with environment variables if present
  if (process.env.OPENAI_MODEL) {
    config.openai.model = process.env.OPENAI_MODEL;
    config.langchain.modelName = process.env.OPENAI_MODEL;
  }

  if (process.env.OPENAI_TEMPERATURE) {
    const temperature = parseFloat(process.env.OPENAI_TEMPERATURE);
    if (!isNaN(temperature)) {
      config.openai.temperature = temperature;
      config.langchain.temperature = temperature;
    }
  }

  if (process.env.OPENAI_MAX_TOKENS) {
    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS);
    if (!isNaN(maxTokens)) {
      config.openai.maxTokens = maxTokens;
      config.langchain.maxTokens = maxTokens;
    }
  }

  if (process.env.AI_CACHE_ENABLED) {
    config.performance.enableCaching =
      process.env.AI_CACHE_ENABLED.toLowerCase() === 'true';
  }

  if (process.env.AI_CACHE_EXPIRY) {
    const cacheExpiry = parseInt(process.env.AI_CACHE_EXPIRY);
    if (!isNaN(cacheExpiry)) {
      config.performance.cacheExpiry = cacheExpiry;
    }
  }

  if (process.env.AI_RATE_LIMIT) {
    const rateLimit = parseInt(process.env.AI_RATE_LIMIT);
    if (!isNaN(rateLimit)) {
      config.performance.rateLimitPerMinute = rateLimit;
    }
  }

  return config;
};

// Rate limiting implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (userId: string, config: AIConfig): boolean => {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize rate limit
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + 60000, // 1 minute
    });
    return true;
  }

  if (userLimit.count >= config.performance.rateLimitPerMinute) {
    return false;
  }

  userLimit.count++;
  return true;
};

// Cache implementation
const cache = new Map<string, { data: any; expiry: number }>();

export const getCachedResult = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (!cached) return null;

  if (Date.now() > cached.expiry) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
};

export const setCachedResult = <T>(
  key: string,
  data: T,
  config: AIConfig
): void => {
  if (!config.performance.enableCaching) return;

  const expiry = Date.now() + config.performance.cacheExpiry * 1000;
  cache.set(key, { data, expiry });

  // Clean up expired entries periodically
  if (cache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now > value.expiry) {
        cache.delete(key);
      }
    }
  }
};
