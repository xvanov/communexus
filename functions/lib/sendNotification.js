"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
// sendNotification.ts - Push notification Cloud Function (FCM Option A)
const https_1 = require("firebase-functions/v2/https");
const v2_1 = require("firebase-functions/v2");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
(0, v2_1.setGlobalOptions)({ region: 'us-central1' });
if ((0, app_1.getApps)().length === 0) {
    (0, app_1.initializeApp)();
}
exports.sendNotification = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const { token, tokens, title, body, data } = (_a = request.data) !== null && _a !== void 0 ? _a : {};
    const messaging = (0, messaging_1.getMessaging)();
    const notification = title || body ? { title: title !== null && title !== void 0 ? title : '', body: body !== null && body !== void 0 ? body : '' } : undefined;
    try {
        if (tokens && tokens.length > 0) {
            const res = await messaging.sendMulticast({ tokens, notification, data });
            return { success: true, multicast: { successCount: res.successCount, failureCount: res.failureCount } };
        }
        if (token) {
            const id = await messaging.send({ token, notification, data });
            return { success: true, messageId: id };
        }
        return { success: false, error: 'No token(s) provided' };
    }
    catch (err) {
        return { success: false, error: (_b = err === null || err === void 0 ? void 0 : err.message) !== null && _b !== void 0 ? _b : String(err) };
    }
});
//# sourceMappingURL=sendNotification.js.map