"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
// sendNotification.ts - Push notification Cloud Function
// TODO: Implement Firebase Cloud Messaging for push notifications
const https_1 = require("firebase-functions/v2/https");
exports.sendNotification = (0, https_1.onCall)(async (_request) => {
    // TODO: Implement push notification sending
    return { success: true };
});
//# sourceMappingURL=sendNotification.js.map