"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCachedResult = exports.getCachedResult = exports.checkRateLimit = exports.getAIConfig = exports.validateAIConfig = exports.defaultAIConfig = exports.getChatModel = exports.getOpenAI = void 0;
var openai_1 = require("openai");
var openai_2 = require("@langchain/openai");
// Lazy initialization of OpenAI client
var _openai = null;
var _chatModel = null;
var getOpenAI = function () {
    if (!_openai) {
        var apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        _openai = new openai_1.OpenAI({ apiKey: apiKey });
    }
    return _openai;
};
exports.getOpenAI = getOpenAI;
var getChatModel = function () {
    if (!_chatModel) {
        var apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set');
        }
        _chatModel = new openai_2.ChatOpenAI({
            openAIApiKey: apiKey,
            modelName: 'gpt-4',
            temperature: 0.7,
            maxTokens: 1000,
        });
    }
    return _chatModel;
};
exports.getChatModel = getChatModel;
exports.defaultAIConfig = {
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
var validateAIConfig = function (config) {
    var errors = [];
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
    if (config.features.actionExtraction.minConfidence < 0 ||
        config.features.actionExtraction.minConfidence > 1) {
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
exports.validateAIConfig = validateAIConfig;
// Get configuration with environment variable overrides
var getAIConfig = function () {
    var config = __assign({}, exports.defaultAIConfig);
    // Override with environment variables if present
    if (process.env.OPENAI_MODEL) {
        config.openai.model = process.env.OPENAI_MODEL;
        config.langchain.modelName = process.env.OPENAI_MODEL;
    }
    if (process.env.OPENAI_TEMPERATURE) {
        var temperature = parseFloat(process.env.OPENAI_TEMPERATURE);
        if (!isNaN(temperature)) {
            config.openai.temperature = temperature;
            config.langchain.temperature = temperature;
        }
    }
    if (process.env.OPENAI_MAX_TOKENS) {
        var maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS);
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
        var cacheExpiry = parseInt(process.env.AI_CACHE_EXPIRY);
        if (!isNaN(cacheExpiry)) {
            config.performance.cacheExpiry = cacheExpiry;
        }
    }
    if (process.env.AI_RATE_LIMIT) {
        var rateLimit = parseInt(process.env.AI_RATE_LIMIT);
        if (!isNaN(rateLimit)) {
            config.performance.rateLimitPerMinute = rateLimit;
        }
    }
    return config;
};
exports.getAIConfig = getAIConfig;
// Rate limiting implementation
var rateLimitMap = new Map();
var checkRateLimit = function (userId, config) {
    var now = Date.now();
    var userLimit = rateLimitMap.get(userId);
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
exports.checkRateLimit = checkRateLimit;
// Cache implementation
var cache = new Map();
var getCachedResult = function (key) {
    var cached = cache.get(key);
    if (!cached)
        return null;
    if (Date.now() > cached.expiry) {
        cache.delete(key);
        return null;
    }
    return cached.data;
};
exports.getCachedResult = getCachedResult;
var setCachedResult = function (key, data, config) {
    if (!config.performance.enableCaching)
        return;
    var expiry = Date.now() + config.performance.cacheExpiry * 1000;
    cache.set(key, { data: data, expiry: expiry });
    // Clean up expired entries periodically
    if (cache.size > 1000) {
        var now = Date.now();
        for (var _i = 0, _a = cache.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key_1 = _b[0], value = _b[1];
            if (now > value.expiry) {
                cache.delete(key_1);
            }
        }
    }
};
exports.setCachedResult = setCachedResult;
