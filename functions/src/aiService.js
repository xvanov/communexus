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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AIService = void 0;
var aiConfig_1 = require("./aiConfig");
var AIService = /** @class */ (function () {
    function AIService() {
        this.config = (0, aiConfig_1.getAIConfig)();
        var errors = (0, aiConfig_1.validateAIConfig)(this.config);
        if (errors.length > 0) {
            console.warn('AI Configuration warnings:', errors);
        }
    }
    AIService.prototype.generateThreadSummary = function (threadId, messages) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, startTime, limitedMessages, prompt_1, response, content, summary, responseTime, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.config.features.threadSummary.enabled) {
                            throw new Error('Thread summary feature is disabled');
                        }
                        if (messages.length === 0) {
                            return [2 /*return*/, null];
                        }
                        // Check rate limit
                        if (!(0, aiConfig_1.checkRateLimit)(threadId, this.config)) {
                            throw new Error('Rate limit exceeded');
                        }
                        cacheKey = "summary_".concat(threadId, "_").concat(messages.length);
                        cached = (0, aiConfig_1.getCachedResult)(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        startTime = Date.now();
                        limitedMessages = messages.slice(-this.config.features.threadSummary.maxMessages);
                        prompt_1 = this.buildSummaryPrompt(limitedMessages);
                        return [4 /*yield*/, (0, aiConfig_1.getOpenAI)().chat.completions.create({
                                model: this.config.openai.model,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an AI assistant that creates concise, structured summaries of conversation threads. Focus on key decisions, action items, and important context.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_1,
                                    },
                                ],
                                temperature: this.config.openai.temperature,
                                max_tokens: this.config.openai.maxTokens,
                            })];
                    case 2:
                        response = _c.sent();
                        content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!content) {
                            throw new Error('No response from OpenAI');
                        }
                        summary = this.parseSummaryResponse(content);
                        // Cache the result
                        (0, aiConfig_1.setCachedResult)(cacheKey, summary, this.config);
                        responseTime = Date.now() - startTime;
                        console.log("Thread summary generated in ".concat(responseTime, "ms"));
                        return [2 /*return*/, summary];
                    case 3:
                        error_1 = _c.sent();
                        console.error('Error generating thread summary:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AIService.prototype.extractActionItems = function (threadId, messages) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, startTime, prompt_2, response, content, actionItems, responseTime, error_2;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.config.features.actionExtraction.enabled) {
                            throw new Error('Action extraction feature is disabled');
                        }
                        if (messages.length === 0) {
                            return [2 /*return*/, []];
                        }
                        // Check rate limit
                        if (!(0, aiConfig_1.checkRateLimit)(threadId, this.config)) {
                            throw new Error('Rate limit exceeded');
                        }
                        cacheKey = "actionItems_".concat(threadId, "_").concat(messages.length);
                        cached = (0, aiConfig_1.getCachedResult)(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        startTime = Date.now();
                        prompt_2 = this.buildActionExtractionPrompt(messages);
                        return [4 /*yield*/, (0, aiConfig_1.getOpenAI)().chat.completions.create({
                                model: this.config.openai.model,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an AI assistant that extracts action items from conversations. Return only actionable tasks with clear assignments and priorities.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_2,
                                    },
                                ],
                                temperature: this.config.openai.temperature,
                                max_tokens: this.config.openai.maxTokens,
                            })];
                    case 2:
                        response = _c.sent();
                        content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!content) {
                            throw new Error('No response from OpenAI');
                        }
                        actionItems = this.parseActionItemsResponse(content);
                        // Cache the result
                        (0, aiConfig_1.setCachedResult)(cacheKey, actionItems, this.config);
                        responseTime = Date.now() - startTime;
                        console.log("Action items extracted in ".concat(responseTime, "ms"));
                        return [2 /*return*/, actionItems];
                    case 3:
                        error_2 = _c.sent();
                        console.error('Error extracting action items:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AIService.prototype.detectPriority = function (messageId, message) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, startTime, prompt_3, response, content, priority, responseTime, error_3;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.config.features.priorityDetection.enabled) {
                            throw new Error('Priority detection feature is disabled');
                        }
                        // Check rate limit
                        if (!(0, aiConfig_1.checkRateLimit)(messageId, this.config)) {
                            throw new Error('Rate limit exceeded');
                        }
                        cacheKey = "priority_".concat(messageId);
                        cached = (0, aiConfig_1.getCachedResult)(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        startTime = Date.now();
                        prompt_3 = this.buildPriorityDetectionPrompt(message);
                        return [4 /*yield*/, (0, aiConfig_1.getOpenAI)().chat.completions.create({
                                model: this.config.openai.model,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an AI assistant that determines message priority levels. Classify messages as "high", "medium", or "low" priority based on urgency and importance.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_3,
                                    },
                                ],
                                temperature: this.config.openai.temperature,
                                max_tokens: 100, // Small response for priority classification
                            })];
                    case 2:
                        response = _c.sent();
                        content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!content) {
                            throw new Error('No response from OpenAI');
                        }
                        priority = this.parsePriorityResponse(content);
                        // Cache the result
                        (0, aiConfig_1.setCachedResult)(cacheKey, priority, this.config);
                        responseTime = Date.now() - startTime;
                        console.log("Priority detected in ".concat(responseTime, "ms"));
                        return [2 /*return*/, priority];
                    case 3:
                        error_3 = _c.sent();
                        console.error('Error detecting priority:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AIService.prototype.smartSearch = function (query, messages) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, startTime, messagesText, prompt_4, response, content, aiResults, results, responseTime, error_4;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.config.features.smartSearch.enabled) {
                            throw new Error('Smart search feature is disabled');
                        }
                        if (!query.trim() || messages.length === 0) {
                            return [2 /*return*/, []];
                        }
                        // Check rate limit
                        if (!(0, aiConfig_1.checkRateLimit)(query, this.config)) {
                            throw new Error('Rate limit exceeded');
                        }
                        cacheKey = "search_".concat(query, "_").concat(messages.length);
                        cached = (0, aiConfig_1.getCachedResult)(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        startTime = Date.now();
                        messagesText = messages
                            .map(function (m, idx) { return "".concat(idx + 1, ". [").concat(m.sender, "]: ").concat(m.text); })
                            .join('\n');
                        prompt_4 = "Search Query: \"".concat(query, "\"\n\nMessages to search:\n").concat(messagesText, "\n\nAnalyze these messages and return the top 10 most relevant results for the query. For each result, provide:\n1. The message number (from the numbered list above)\n2. Relevance score (0-1, where 1 is perfect match)\n3. A brief snippet explaining why it's relevant\n\nReturn ONLY a JSON array in this EXACT format:\n[\n  {\n    \"messageId\": 1,\n    \"relevance\": 0.95,\n    \"snippet\": \"Discusses power outlets installation\"\n  },\n  {\n    \"messageId\": 3,\n    \"relevance\": 0.80,\n    \"snippet\": \"Mentions electrical work\"\n  }\n]\n\nReturn ONLY valid JSON array, no markdown, no extra text. If no relevant messages, return [].");
                        return [4 /*yield*/, (0, aiConfig_1.getOpenAI)().chat.completions.create({
                                model: this.config.openai.model,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an AI assistant that performs semantic search. Analyze messages and return relevance scores based on meaning, not just keywords. Return valid JSON only.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_4,
                                    },
                                ],
                                temperature: 0.3, // Lower for more focused results
                                max_tokens: 1000,
                            })];
                    case 2:
                        response = _c.sent();
                        content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!content) {
                            throw new Error('No response from OpenAI');
                        }
                        aiResults = this.parseSearchResponse(content);
                        results = aiResults
                            .map(function (result) {
                            // Find the original message by index (messageId from AI is 1-indexed)
                            var messageIdx = parseInt(result.messageId) - 1;
                            if (messageIdx < 0 || messageIdx >= messages.length) {
                                return null;
                            }
                            var originalMessage = messages[messageIdx];
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
                            .filter(function (r) { return r !== null; });
                        // Cache the result
                        (0, aiConfig_1.setCachedResult)(cacheKey, results, this.config);
                        responseTime = Date.now() - startTime;
                        console.log("Smart search completed in ".concat(responseTime, "ms, found ").concat(results.length, " results"));
                        return [2 /*return*/, results];
                    case 3:
                        error_4 = _c.sent();
                        console.error('Error performing smart search:', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    AIService.prototype.trackDecision = function (messageId, decision) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, trackedDecision, responseTime;
            return __generator(this, function (_a) {
                if (!this.config.features.decisionTracking.enabled) {
                    throw new Error('Decision tracking feature is disabled');
                }
                // Check rate limit
                if (!(0, aiConfig_1.checkRateLimit)(messageId, this.config)) {
                    throw new Error('Rate limit exceeded');
                }
                try {
                    startTime = Date.now();
                    trackedDecision = __assign(__assign({}, decision), { id: decision.id || "decision_".concat(Date.now()), decidedAt: decision.decidedAt || new Date() });
                    responseTime = Date.now() - startTime;
                    console.log("Decision tracked in ".concat(responseTime, "ms"));
                    return [2 /*return*/, trackedDecision];
                }
                catch (error) {
                    console.error('Error tracking decision:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    AIService.prototype.getProactiveSuggestions = function (threadId, context) {
        return __awaiter(this, void 0, void 0, function () {
            var cacheKey, cached, startTime, prompt_5, response, content, suggestions, responseTime, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.features.proactiveAgent.enabled) {
                            throw new Error('Proactive agent feature is disabled');
                        }
                        // Check rate limit
                        if (!(0, aiConfig_1.checkRateLimit)(threadId, this.config)) {
                            throw new Error('Rate limit exceeded');
                        }
                        cacheKey = "suggestions_".concat(threadId, "_").concat(JSON.stringify(context).slice(0, 100));
                        cached = (0, aiConfig_1.getCachedResult)(cacheKey);
                        if (cached) {
                            return [2 /*return*/, cached];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        startTime = Date.now();
                        prompt_5 = this.buildProactivePrompt(context);
                        return [4 /*yield*/, (0, aiConfig_1.getChatModel)().invoke([
                                {
                                    role: 'system',
                                    content: 'You are a proactive AI assistant that monitors conversations and suggests helpful actions. Provide contextual suggestions based on conversation patterns and user needs.',
                                },
                                { role: 'user', content: prompt_5 },
                            ])];
                    case 2:
                        response = _a.sent();
                        content = response.content;
                        if (!content) {
                            throw new Error('No response from LangChain');
                        }
                        suggestions = this.parseProactiveResponse(content);
                        // Cache the result
                        (0, aiConfig_1.setCachedResult)(cacheKey, suggestions, this.config);
                        responseTime = Date.now() - startTime;
                        console.log("Proactive suggestions generated in ".concat(responseTime, "ms"));
                        return [2 /*return*/, suggestions];
                    case 3:
                        error_5 = _a.sent();
                        console.error('Error generating proactive suggestions:', error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Private helper methods for building prompts
    AIService.prototype.buildSummaryPrompt = function (messages) {
        var messageTexts = messages
            .map(function (msg, index) {
            return "".concat(index + 1, ". [").concat(msg.sender || 'Unknown', "]: ").concat(msg.text);
        })
            .join('\n');
        return "Analyze this construction/contractor conversation and provide a JSON response with this EXACT format:\n{\n  \"summary\": \"2-3 sentence overview of the conversation\",\n  \"keyPoints\": [\"point 1\", \"point 2\", \"point 3\"],\n  \"actionItems\": [\"action 1\", \"action 2\", \"action 3\"]\n}\n\nConversation:\n".concat(messageTexts, "\n\nReturn ONLY valid JSON, no markdown, no extra text.");
    };
    AIService.prototype.buildActionExtractionPrompt = function (messages) {
        var messageTexts = messages
            .map(function (msg, index) {
            return "".concat(index + 1, ". [").concat(msg.sender || 'Unknown', "]: ").concat(msg.text);
        })
            .join('\n');
        return "Extract all action items, tasks, and commitments from this construction/contractor conversation.\n\nReturn a JSON array of action items with this EXACT format:\n[\n  {\n    \"task\": \"Description of the task\",\n    \"assignedTo\": \"Person responsible (or null)\",\n    \"priority\": \"high\" or \"medium\" or \"low\",\n    \"dueDate\": \"Date if mentioned (or null)\"\n  }\n]\n\nConversation:\n".concat(messageTexts, "\n\nLook for:\n- Tasks that need to be done\n- Items needing approval\n- Change orders\n- Follow-ups required\n- Deadlines mentioned\n\nReturn ONLY valid JSON array, no markdown, no extra text. If no action items found, return [].");
    };
    AIService.prototype.buildPriorityDetectionPrompt = function (message) {
        return "Analyze this message and determine its priority level (high, medium, or low):\n\nMessage: \"".concat(message.text, "\"\nTimestamp: ").concat(message.timestamp, "\n\nConsider factors like:\n- Urgency indicators (urgent, ASAP, emergency)\n- Importance to business operations\n- Time sensitivity\n- Impact on project success\n\nReturn only the priority level: high, medium, or low");
    };
    AIService.prototype.buildProactivePrompt = function (context) {
        return "Based on this conversation context, suggest proactive actions:\n\nContext: ".concat(JSON.stringify(context, null, 2), "\n\nConsider:\n1. Follow-up actions needed\n2. Reminders for deadlines\n3. Suggestions for improving communication\n4. Potential issues to address\n\nProvide 3-5 specific, actionable suggestions with confidence scores.");
    };
    // Private helper methods for parsing responses
    AIService.prototype.parseSummaryResponse = function (content) {
        try {
            // Remove markdown code blocks if present
            var cleanContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            // Try to parse as JSON
            var parsed = JSON.parse(cleanContent);
            return {
                summary: parsed.summary || 'No summary available',
                keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
                actionItems: Array.isArray(parsed.actionItems)
                    ? parsed.actionItems
                    : [],
                generatedAt: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error('Failed to parse summary response as JSON:', error);
            console.log('Raw content:', content);
            // Fallback: Extract what we can from plain text
            var lines = content
                .split('\n')
                .map(function (l) { return l.trim(); })
                .filter(function (l) { return l; });
            return {
                summary: lines[0] || 'Summary unavailable',
                keyPoints: lines.slice(1, 4),
                actionItems: [],
                generatedAt: new Date().toISOString(),
            };
        }
    };
    AIService.prototype.parseActionItemsResponse = function (content) {
        try {
            // Remove markdown code blocks if present
            var cleanContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            // Try to parse as JSON array
            var parsed = JSON.parse(cleanContent);
            if (!Array.isArray(parsed)) {
                console.error('Expected array, got:', typeof parsed);
                return [];
            }
            // Map to our ActionItem format
            return parsed.map(function (item, index) { return ({
                id: "action_".concat(Date.now(), "_").concat(index),
                threadId: '',
                messageId: '',
                task: item.task || 'Unknown task',
                text: item.task || '',
                assignedTo: item.assignedTo || undefined,
                dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
                priority: (item.priority || 'medium'),
                status: 'pending',
                createdAt: new Date(),
            }); });
        }
        catch (error) {
            console.error('Failed to parse action items response as JSON:', error);
            console.log('Raw content:', content);
            // Fallback: Try to extract action items from plain text
            var lines = content
                .split('\n')
                .map(function (l) { return l.trim(); })
                .filter(function (l) {
                return l &&
                    (l.toLowerCase().includes('action') ||
                        l.toLowerCase().includes('task') ||
                        l.toLowerCase().includes('need') ||
                        l.toLowerCase().includes('must') ||
                        l.toLowerCase().includes('should') ||
                        l.startsWith('-') ||
                        l.startsWith('•') ||
                        l.match(/^\d+\./));
            });
            return lines.slice(0, 10).map(function (line, index) { return ({
                id: "action_".concat(Date.now(), "_").concat(index),
                threadId: '',
                messageId: '',
                task: line.replace(/^[-•\d.]\s*/, ''),
                text: line.replace(/^[-•\d.]\s*/, ''),
                priority: 'medium',
                status: 'pending',
                createdAt: new Date(),
            }); });
        }
    };
    AIService.prototype.parsePriorityResponse = function (content) {
        var lowerContent = content.toLowerCase();
        if (lowerContent.includes('high'))
            return 'high';
        if (lowerContent.includes('medium'))
            return 'medium';
        if (lowerContent.includes('low'))
            return 'low';
        return 'medium'; // default
    };
    AIService.prototype.parseSearchResponse = function (content) {
        try {
            // Remove markdown code blocks if present
            var cleanContent = content
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            // Try to parse as JSON array
            var parsed = JSON.parse(cleanContent);
            if (!Array.isArray(parsed)) {
                console.error('Expected array, got:', typeof parsed);
                return [];
            }
            // Return array of { messageId, relevance, snippet }
            return parsed.map(function (item) { return ({
                messageId: String(item.messageId || item.index || '0'),
                relevance: parseFloat(item.relevance || 0.5),
                snippet: item.snippet || '',
            }); });
        }
        catch (error) {
            console.error('Failed to parse search response as JSON:', error);
            console.log('Raw content:', content);
            return [];
        }
    };
    AIService.prototype.parseProactiveResponse = function (content) {
        var lines = content.split('\n');
        var suggestions = [];
        lines.forEach(function (line, index) {
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
    };
    /**
     * Classify checklist intent from natural language text
     * Returns: 'create_item' | 'mark_complete' | 'query_status' | 'unknown'
     */
    AIService.prototype.classifyChecklistIntent = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, prompt_6, response, content, responseTime, error_6;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        startTime = Date.now();
                        prompt_6 = "Analyze this natural language command about a checklist and classify the intent.\n\nCommand: \"".concat(text, "\"\n\nPossible intents:\n1. \"create_item\" - User wants to add a new item to the checklist (e.g., \"add new task: install tiles\", \"create item: paint walls\")\n2. \"mark_complete\" - User wants to mark an item as complete (e.g., \"mark item 3 complete\", \"complete install tiles\", \"done with painting\")\n3. \"query_status\" - User wants to query the checklist status (e.g., \"what's next?\", \"show incomplete tasks\", \"how many done?\")\n\nReturn ONLY one of these exact strings: \"create_item\", \"mark_complete\", \"query_status\", or \"unknown\" if unclear.\n\nExamples:\n- \"mark item 3 complete\" \u2192 \"mark_complete\"\n- \"add new task: install tiles\" \u2192 \"create_item\"\n- \"what's next?\" \u2192 \"query_status\"\n- \"show incomplete tasks\" \u2192 \"query_status\"\n- \"hello\" \u2192 \"unknown\"\n\nReturn ONLY the intent string, nothing else.");
                        return [4 /*yield*/, (0, aiConfig_1.getOpenAI)().chat.completions.create({
                                model: this.config.openai.model,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an AI assistant that classifies checklist commands. Return only the intent string: "create_item", "mark_complete", "query_status", or "unknown".',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_6,
                                    },
                                ],
                                temperature: 0.3, // Lower for more consistent classification
                                max_tokens: 50,
                            })];
                    case 1:
                        response = _d.sent();
                        content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase();
                        if (!content) {
                            return [2 /*return*/, 'unknown'];
                        }
                        // Extract intent from response (handle cases where GPT adds extra text)
                        if (content.includes('create_item'))
                            return [2 /*return*/, 'create_item'];
                        if (content.includes('mark_complete'))
                            return [2 /*return*/, 'mark_complete'];
                        if (content.includes('query_status'))
                            return [2 /*return*/, 'query_status'];
                        if (content.includes('unknown'))
                            return [2 /*return*/, 'unknown'];
                        // Fallback: try to infer from content
                        if (content.includes('create') || content.includes('add') || content.includes('new')) {
                            return [2 /*return*/, 'create_item'];
                        }
                        if (content.includes('complete') || content.includes('done') || content.includes('mark')) {
                            return [2 /*return*/, 'mark_complete'];
                        }
                        if (content.includes('query') || content.includes('what') || content.includes('show') || content.includes('how')) {
                            return [2 /*return*/, 'query_status'];
                        }
                        responseTime = Date.now() - startTime;
                        console.log("Checklist intent classified in ".concat(responseTime, "ms: ").concat(content));
                        return [2 /*return*/, 'unknown'];
                    case 2:
                        error_6 = _d.sent();
                        console.error('Error classifying checklist intent:', error_6);
                        return [2 /*return*/, 'unknown'];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Match natural language text to a checklist item
     * Uses semantic similarity and exact matching
     */
    AIService.prototype.matchChecklistItem = function (text, checklistId, items) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, itemNumberMatch, itemIndex, sortedItems, matched, exactMatch, itemsList, prompt_7, response, content, cleanContent, parsed, matches, validMatches, bestMatch, responseTime, error_7;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!items || items.length === 0) {
                            return [2 /*return*/, null];
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        startTime = Date.now();
                        itemNumberMatch = text.match(/item\s+(\d+)/i);
                        if (itemNumberMatch) {
                            itemIndex = parseInt(itemNumberMatch[1], 10) - 1;
                            if (itemIndex >= 0 && itemIndex < items.length) {
                                sortedItems = __spreadArray([], items, true).sort(function (a, b) { return a.order - b.order; });
                                matched = sortedItems[itemIndex];
                                return [2 /*return*/, {
                                        id: matched.id,
                                        title: matched.title,
                                        confidence: 1.0,
                                        additionalMatches: undefined,
                                    }];
                            }
                        }
                        exactMatch = items.find(function (item) {
                            return item.title.toLowerCase() === text.toLowerCase().trim();
                        });
                        if (exactMatch) {
                            return [2 /*return*/, {
                                    id: exactMatch.id,
                                    title: exactMatch.title,
                                    confidence: 1.0,
                                    additionalMatches: undefined,
                                }];
                        }
                        itemsList = items
                            .map(function (item, idx) { return "".concat(idx + 1, ". \"").concat(item.title, "\" (id: ").concat(item.id, ")"); })
                            .join('\n');
                        prompt_7 = "Match this natural language reference to one or more of these checklist items:\n\nUser said: \"".concat(text, "\"\n\nAvailable items:\n").concat(itemsList, "\n\nFind matching items. Consider:\n- Exact matches (same words)\n- Semantic similarity (similar meaning)\n- Partial matches (contains key words)\n\nReturn ONLY a JSON array in this EXACT format (sorted by confidence, highest first):\n[\n  {\n    \"id\": \"item_id_here\",\n    \"title\": \"item_title_here\",\n    \"confidence\": 0.95\n  },\n  {\n    \"id\": \"item_id_2\",\n    \"title\": \"item_title_2\",\n    \"confidence\": 0.85\n  }\n]\n\nInclude all items with confidence >= 0.6. If no good matches, return empty array [].\n\nReturn ONLY valid JSON array, no markdown, no extra text.");
                        return [4 /*yield*/, (0, aiConfig_1.getOpenAI)().chat.completions.create({
                                model: this.config.openai.model,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an AI assistant that matches natural language to checklist items. Return only valid JSON with id, title, and confidence.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_7,
                                    },
                                ],
                                temperature: 0.3,
                                max_tokens: 200,
                            })];
                    case 2:
                        response = _d.sent();
                        content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                        if (!content) {
                            return [2 /*return*/, null];
                        }
                        cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                        parsed = JSON.parse(cleanContent);
                        matches = Array.isArray(parsed) ? parsed : [parsed];
                        validMatches = matches.filter(function (m) { return m.id && m.confidence >= 0.6; });
                        if (validMatches.length === 0) {
                            return [2 /*return*/, null];
                        }
                        bestMatch = validMatches[0];
                        responseTime = Date.now() - startTime;
                        console.log("Item matched in ".concat(responseTime, "ms: ").concat(bestMatch.title, " (confidence: ").concat(bestMatch.confidence, ")").concat(validMatches.length > 1 ? ", ".concat(validMatches.length - 1, " additional matches") : ''));
                        return [2 /*return*/, {
                                id: bestMatch.id,
                                title: bestMatch.title,
                                confidence: bestMatch.confidence,
                                // Include additional matches if confidence is similar (within 0.15)
                                additionalMatches: validMatches.length > 1 && validMatches[1].confidence >= bestMatch.confidence - 0.15
                                    ? validMatches.slice(1).map(function (m) { return ({ id: m.id, title: m.title, confidence: m.confidence }); })
                                    : undefined,
                            }];
                    case 3:
                        error_7 = _d.sent();
                        console.error('Error matching checklist item:', error_7);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process a checklist command and generate preview
     * Orchestrates: intent classification → item matching → preview generation
     */
    AIService.prototype.processChecklistCommand = function (text, checklistId, items) {
        return __awaiter(this, void 0, void 0, function () {
            var intent, lowerText, suggestion, matchedItem, titleMatch, newTitle, suggestions, errorMessage, incompleteItems, completedCount, totalCount, queryResult, sorted, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.classifyChecklistIntent(text)];
                    case 1:
                        intent = _a.sent();
                        if (intent === 'unknown') {
                            lowerText = text.toLowerCase();
                            suggestion = 'Unable to understand command. ';
                            if (lowerText.includes('complete') || lowerText.includes('done') || lowerText.includes('finish')) {
                                suggestion += 'Did you mean to mark an item complete? Try: "mark item 3 complete"';
                            }
                            else if (lowerText.includes('add') || lowerText.includes('create') || lowerText.includes('new')) {
                                suggestion += 'Did you mean to create a new item? Try: "add new task: [task name]"';
                            }
                            else if (lowerText.includes('what') || lowerText.includes('show') || lowerText.includes('how')) {
                                suggestion += 'Did you mean to query status? Try: "what\'s next?" or "show incomplete tasks"';
                            }
                            else {
                                suggestion += 'Please try: "mark item 3 complete", "add new task: [name]", or "what\'s next?"';
                            }
                            return [2 /*return*/, {
                                    intent: 'unknown',
                                    suggestedAction: suggestion,
                                    confidence: 0,
                                }];
                        }
                        matchedItem = null;
                        if (!(intent === 'mark_complete')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.matchChecklistItem(text, checklistId, items)];
                    case 2:
                        matchedItem = _a.sent();
                        _a.label = 3;
                    case 3:
                        // Step 3: Generate preview based on intent
                        if (intent === 'create_item') {
                            titleMatch = text.match(/(?:add|create|new).*?:(.+)|(?:add|create|new)\s+(?:task|item)\s+(.+)/i);
                            newTitle = titleMatch
                                ? (titleMatch[1] || titleMatch[2]).trim()
                                : text.replace(/(?:add|create|new)\s+(?:task|item)\s*/i, '').trim();
                            return [2 /*return*/, {
                                    intent: 'create_item',
                                    suggestedAction: "Add new item: \"".concat(newTitle, "\""),
                                    confidence: 0.8,
                                    newItemTitle: newTitle,
                                }];
                        }
                        if (intent === 'mark_complete') {
                            if (!matchedItem) {
                                suggestions = items
                                    .filter(function (item) { return item.status !== 'completed'; })
                                    .slice(0, 3)
                                    .map(function (item) { return "\"".concat(item.title, "\""); })
                                    .join(', ');
                                errorMessage = suggestions
                                    ? "Unable to find matching item. Did you mean: ".concat(suggestions, "?")
                                    : 'Unable to find matching item. Please specify which item to mark complete.';
                                return [2 /*return*/, {
                                        intent: 'mark_complete',
                                        suggestedAction: errorMessage,
                                        confidence: 0,
                                    }];
                            }
                            return [2 /*return*/, {
                                    intent: 'mark_complete',
                                    matchedItem: {
                                        id: matchedItem.id,
                                        title: matchedItem.title,
                                        confidence: matchedItem.confidence,
                                        additionalMatches: matchedItem.additionalMatches,
                                    },
                                    suggestedAction: "Mark \"".concat(matchedItem.title, "\" as complete"),
                                    confidence: matchedItem.confidence,
                                }];
                        }
                        if (intent === 'query_status') {
                            incompleteItems = items.filter(function (item) { return item.status !== 'completed'; });
                            completedCount = items.filter(function (item) { return item.status === 'completed'; }).length;
                            totalCount = items.length;
                            queryResult = '';
                            if (text.toLowerCase().includes('next') || text.toLowerCase().includes("what's")) {
                                if (incompleteItems.length > 0) {
                                    sorted = incompleteItems.sort(function (a, b) { return a.order - b.order; });
                                    queryResult = "Next task: \"".concat(sorted[0].title, "\"");
                                }
                                else {
                                    queryResult = 'All tasks are complete!';
                                }
                            }
                            else if (text.toLowerCase().includes('incomplete')) {
                                if (incompleteItems.length > 0) {
                                    queryResult = "Incomplete tasks: ".concat(incompleteItems.map(function (item) { return "\"".concat(item.title, "\""); }).join(', '));
                                }
                                else {
                                    queryResult = 'All tasks are complete!';
                                }
                            }
                            else if (text.toLowerCase().includes('how many') || text.toLowerCase().includes('done')) {
                                queryResult = "".concat(completedCount, " of ").concat(totalCount, " tasks complete");
                            }
                            else {
                                queryResult = "".concat(completedCount, " of ").concat(totalCount, " tasks complete. ").concat(incompleteItems.length, " remaining.");
                            }
                            return [2 /*return*/, {
                                    intent: 'query_status',
                                    suggestedAction: queryResult,
                                    confidence: 0.9,
                                    queryResult: queryResult,
                                }];
                        }
                        return [2 /*return*/, {
                                intent: 'unknown',
                                suggestedAction: 'Unable to process command.',
                                confidence: 0,
                            }];
                    case 4:
                        error_8 = _a.sent();
                        console.error('Error processing checklist command:', error_8);
                        throw error_8;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze an image for checklist completion detection using GPT-4 Vision API
     * Returns detected tasks and completion status
     */
    AIService.prototype.analyzeImageForChecklist = function (imageUrl, checklistId) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, prompt_8, response, content, cleanContent, parsed, detectedTasks, responseTime, error_9;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        startTime = Date.now();
                        prompt_8 = "Analyze this construction/contractor work image and identify:\n1. What tasks or work items are visible in the image\n2. Whether the work appears complete, incomplete, or partially complete\n3. A brief summary of what you see\n\nFocus on identifying specific construction tasks that might match checklist items (e.g., \"install cabinets\", \"paint walls\", \"install countertops\", \"electrical work\", \"plumbing fixtures\").\n\nReturn ONLY a JSON object in this EXACT format:\n{\n  \"detectedTasks\": [\n    {\n      \"description\": \"Task description (e.g., 'Install kitchen cabinets')\",\n      \"confidenceScore\": 0.95\n    }\n  ],\n  \"completionStatus\": \"complete\" | \"incomplete\" | \"partial\" | \"unknown\",\n  \"summary\": \"Brief 1-2 sentence summary of what's visible\"\n}\n\nConfidence scores should be 0-1, where:\n- 0.85-1.0 = high confidence\n- 0.70-0.84 = medium confidence\n- 0.0-0.69 = low confidence\n\nReturn ONLY valid JSON, no markdown, no extra text.";
                        return [4 /*yield*/, (0, aiConfig_1.getOpenAI)().chat.completions.create({
                                model: 'gpt-4o', // GPT-4o supports vision, fallback to gpt-4-vision-preview if needed
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an AI assistant that analyzes construction/contractor work images. Identify tasks and completion status. Return only valid JSON.',
                                    },
                                    {
                                        role: 'user',
                                        content: [
                                            {
                                                type: 'text',
                                                text: prompt_8,
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
                            })];
                    case 1:
                        response = _c.sent();
                        content = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!content) {
                            throw new Error('No response from OpenAI Vision API');
                        }
                        cleanContent = content
                            .replace(/```json\n?/g, '')
                            .replace(/```\n?/g, '')
                            .trim();
                        parsed = JSON.parse(cleanContent);
                        detectedTasks = (parsed.detectedTasks || []).map(function (task) {
                            var score = parseFloat(task.confidenceScore || 0);
                            var confidence = 'low';
                            if (score >= 0.85)
                                confidence = 'high';
                            else if (score >= 0.70)
                                confidence = 'medium';
                            return {
                                description: task.description || '',
                                confidence: confidence,
                                confidenceScore: score,
                            };
                        });
                        responseTime = Date.now() - startTime;
                        console.log("Image analyzed in ".concat(responseTime, "ms: ").concat(detectedTasks.length, " tasks detected"));
                        return [2 /*return*/, {
                                detectedTasks: detectedTasks,
                                completionStatus: parsed.completionStatus || 'unknown',
                                summary: parsed.summary || 'No summary available',
                            }];
                    case 2:
                        error_9 = _c.sent();
                        console.error('Error analyzing image for checklist:', error_9);
                        throw error_9;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Match detected tasks from image analysis to checklist items
     * Uses semantic similarity and exact matching
     */
    AIService.prototype.matchImageToChecklistItems = function (detectedTasks, checklistId, items) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, itemsList, tasksList, prompt_9, response, content, cleanContent, parsed, matches, validMatches, responseTime, error_10;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!detectedTasks || detectedTasks.length === 0) {
                            return [2 /*return*/, []];
                        }
                        if (!items || items.length === 0) {
                            return [2 /*return*/, []];
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        startTime = Date.now();
                        itemsList = items
                            .map(function (item, idx) { return "".concat(idx + 1, ". \"").concat(item.title, "\" (id: ").concat(item.id, ", status: ").concat(item.status, ")"); })
                            .join('\n');
                        tasksList = detectedTasks
                            .map(function (task, idx) { return "".concat(idx + 1, ". \"").concat(task.description, "\" (confidence: ").concat(task.confidenceScore, ")"); })
                            .join('\n');
                        prompt_9 = "Match these detected tasks from an image analysis to checklist items:\n\nDetected Tasks from Image:\n".concat(tasksList, "\n\nAvailable Checklist Items:\n").concat(itemsList, "\n\nFor each detected task, find the best matching checklist item(s). Consider:\n- Exact matches (same words/phrases)\n- Semantic similarity (similar meaning)\n- Partial matches (contains key words)\n- Construction/contractor terminology variations\n\nReturn ONLY a JSON array in this EXACT format (one entry per match, sorted by confidence):\n[\n  {\n    \"itemId\": \"item_id_here\",\n    \"confidenceScore\": 0.95,\n    \"reasoning\": \"Brief explanation of why this matches\"\n  }\n]\n\nInclude matches with confidenceScore >= 0.6. If no good matches, return empty array [].\n\nReturn ONLY valid JSON array, no markdown, no extra text.");
                        return [4 /*yield*/, (0, aiConfig_1.getOpenAI)().chat.completions.create({
                                model: this.config.openai.model,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an AI assistant that matches detected tasks to checklist items. Return only valid JSON with itemId, confidenceScore, and reasoning.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_9,
                                    },
                                ],
                                temperature: 0.3,
                                max_tokens: 500,
                            })];
                    case 2:
                        response = _d.sent();
                        content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                        if (!content) {
                            return [2 /*return*/, []];
                        }
                        cleanContent = content
                            .replace(/```json\n?/g, '')
                            .replace(/```\n?/g, '')
                            .trim();
                        parsed = JSON.parse(cleanContent);
                        matches = Array.isArray(parsed) ? parsed : [parsed];
                        validMatches = matches
                            .filter(function (m) { return m.itemId && m.confidenceScore >= 0.6; })
                            .map(function (m) {
                            var score = parseFloat(m.confidenceScore || 0);
                            var confidence = 'low';
                            if (score >= 0.85)
                                confidence = 'high';
                            else if (score >= 0.70)
                                confidence = 'medium';
                            return {
                                itemId: m.itemId,
                                confidence: confidence,
                                confidenceScore: score,
                                reasoning: m.reasoning,
                            };
                        });
                        responseTime = Date.now() - startTime;
                        console.log("Items matched in ".concat(responseTime, "ms: ").concat(validMatches.length, " matches found"));
                        return [2 /*return*/, validMatches];
                    case 3:
                        error_10 = _d.sent();
                        console.error('Error matching image to checklist items:', error_10);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process a natural language query about checklist status
     * Handles queries like: "what's next?", "show incomplete", "how many done?"
     */
    AIService.prototype.processChecklistQuery = function (query, checklistId, items) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, lowerQuery, incompleteItems, sorted, nextTask, incompleteItems, sorted, completedCount, totalCount, percentage, itemsList, prompt_10, response, content, cleanContent, parsed, responseTime, error_11;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        startTime = Date.now();
                        lowerQuery = query.toLowerCase().trim();
                        // Handle simple queries with direct logic
                        if (lowerQuery.includes("what's next") || lowerQuery.includes("what is next") || lowerQuery === "next") {
                            incompleteItems = items.filter(function (item) { return item.status !== 'completed'; });
                            sorted = incompleteItems.sort(function (a, b) { return a.order - b.order; });
                            nextTask = sorted[0];
                            return [2 /*return*/, {
                                    query: query,
                                    answer: nextTask
                                        ? "Next task: ".concat(nextTask.title)
                                        : 'All tasks are complete!',
                                    nextTask: nextTask || undefined,
                                }];
                        }
                        if (lowerQuery.includes("show incomplete") || lowerQuery.includes("show pending") || lowerQuery.includes("incomplete")) {
                            incompleteItems = items.filter(function (item) { return item.status !== 'completed'; });
                            sorted = incompleteItems.sort(function (a, b) { return a.order - b.order; });
                            return [2 /*return*/, {
                                    query: query,
                                    answer: incompleteItems.length === 0
                                        ? 'All tasks are complete!'
                                        : "Found ".concat(incompleteItems.length, " incomplete task").concat(incompleteItems.length > 1 ? 's' : '', ": ").concat(sorted.map(function (i) { return i.title; }).join(', ')),
                                    incompleteItems: sorted,
                                }];
                        }
                        if (lowerQuery.includes("how many") && (lowerQuery.includes("done") || lowerQuery.includes("complete"))) {
                            completedCount = items.filter(function (item) { return item.status === 'completed'; }).length;
                            totalCount = items.length;
                            percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                            return [2 /*return*/, {
                                    query: query,
                                    answer: "".concat(completedCount, " of ").concat(totalCount, " tasks complete").concat(percentage > 0 ? " (".concat(percentage, "%)") : ''),
                                    progress: {
                                        total: totalCount,
                                        completed: completedCount,
                                        percentage: percentage,
                                    },
                                }];
                        }
                        itemsList = items
                            .map(function (item, idx) { return "".concat(idx + 1, ". \"").concat(item.title, "\" (status: ").concat(item.status, ", order: ").concat(item.order, ")"); })
                            .join('\n');
                        prompt_10 = "Answer this question about a checklist:\n\nQuestion: \"".concat(query, "\"\n\nChecklist Items:\n").concat(itemsList, "\n\nProvide a helpful answer. Consider:\n- What tasks are next (incomplete items sorted by order)\n- Which items are incomplete\n- Progress statistics (completed vs total)\n- Specific item details if asked\n\nReturn ONLY a JSON object in this EXACT format:\n{\n  \"answer\": \"Your answer here\",\n  \"nextTask\": { \"id\": \"item_id\", \"title\": \"item_title\", \"status\": \"pending\", \"order\": 1 } or null,\n  \"incompleteItems\": [array of incomplete items] or [],\n  \"progress\": { \"total\": 10, \"completed\": 5, \"percentage\": 50 } or null,\n  \"relatedItems\": [array of relevant items] or []\n}\n\nReturn ONLY valid JSON, no markdown, no extra text.");
                        return [4 /*yield*/, (0, aiConfig_1.getOpenAI)().chat.completions.create({
                                model: this.config.openai.model,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an AI assistant that answers questions about checklist status. Return only valid JSON with answer, nextTask, incompleteItems, progress, and relatedItems.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_10,
                                    },
                                ],
                                temperature: 0.3,
                                max_tokens: 500,
                            })];
                    case 1:
                        response = _d.sent();
                        content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                        if (!content) {
                            throw new Error('No response from OpenAI');
                        }
                        cleanContent = content
                            .replace(/```json\n?/g, '')
                            .replace(/```\n?/g, '')
                            .trim();
                        parsed = JSON.parse(cleanContent);
                        responseTime = Date.now() - startTime;
                        console.log("Query processed in ".concat(responseTime, "ms"));
                        return [2 /*return*/, {
                                query: query,
                                answer: parsed.answer || 'Unable to process query',
                                nextTask: parsed.nextTask || undefined,
                                incompleteItems: parsed.incompleteItems || undefined,
                                progress: parsed.progress || undefined,
                                relatedItems: parsed.relatedItems || undefined,
                            }];
                    case 2:
                        error_11 = _d.sent();
                        console.error('Error processing checklist query:', error_11);
                        throw error_11;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return AIService;
}());
exports.AIService = AIService;
// Export singleton instance
exports.aiService = new AIService();
