"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiChecklistVision = void 0;
// aiChecklistVision.ts - AI checklist vision Cloud Function
var https_1 = require("firebase-functions/v2/https");
var v2_1 = require("firebase-functions/v2");
var aiService_1 = require("./aiService");
// Set global options for v2 functions (required for emulator)
(0, v2_1.setGlobalOptions)({ region: 'us-central1' });
exports.aiChecklistVision = (0, https_1.onCall)(function (request) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, operation, imageUrl, checklistId, detectedTasks, items, _b, analysis, matches, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 7, , 8]);
                _a = request.data, operation = _a.operation, imageUrl = _a.imageUrl, checklistId = _a.checklistId, detectedTasks = _a.detectedTasks, items = _a.items;
                if (!operation) {
                    throw new Error('Operation is required');
                }
                _b = operation;
                switch (_b) {
                    case 'analyzeImage': return [3 /*break*/, 1];
                    case 'matchItems': return [3 /*break*/, 3];
                }
                return [3 /*break*/, 5];
            case 1:
                if (!imageUrl || !checklistId) {
                    throw new Error('ImageUrl and checklistId are required for image analysis');
                }
                return [4 /*yield*/, aiService_1.aiService.analyzeImageForChecklist(imageUrl, checklistId)];
            case 2:
                analysis = _c.sent();
                return [2 /*return*/, {
                        success: true,
                        analysis: analysis,
                    }];
            case 3:
                if (!detectedTasks || !checklistId || !items) {
                    throw new Error('DetectedTasks, checklistId, and items are required for item matching');
                }
                return [4 /*yield*/, aiService_1.aiService.matchImageToChecklistItems(detectedTasks, checklistId, items)];
            case 4:
                matches = _c.sent();
                return [2 /*return*/, {
                        success: true,
                        matches: matches,
                    }];
            case 5: throw new Error("Unknown operation: ".concat(operation));
            case 6: return [3 /*break*/, 8];
            case 7:
                error_1 = _c.sent();
                console.error('Error in aiChecklistVision:', error_1);
                return [2 /*return*/, {
                        success: false,
                        error: error_1 instanceof Error ? error_1.message : 'Unknown error occurred',
                    }];
            case 8: return [2 /*return*/];
        }
    });
}); });
