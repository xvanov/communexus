"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = void 0;
// helloWorld.ts - Simple Hello World Cloud Function for testing
const https_1 = require("firebase-functions/v2/https");
exports.helloWorld = (0, https_1.onCall)(async (request) => {
    return {
        message: 'Hello from Communexus Firebase Cloud Functions!',
        timestamp: new Date().toISOString(),
        success: true
    };
});
//# sourceMappingURL=helloWorld.js.map