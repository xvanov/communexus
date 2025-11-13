// index.ts - All Cloud Function exports
// Set global options once for all v2 functions
import { setGlobalOptions } from 'firebase-functions/v2';
setGlobalOptions({ region: 'us-central1' });

// TODO: Export all Cloud Functions
export { helloWorld } from './helloWorld';
export { aiThreadSummary } from './aiThreadSummary';
export { aiActionExtraction } from './aiActionExtraction';
export { aiPriorityDetection } from './aiPriorityDetection';
export { aiSmartSearch } from './aiSmartSearch';
export { aiProactiveAgent } from './aiProactiveAgent';
export { aiChecklistNLP } from './aiChecklistNLP';
export { aiChecklistVision } from './aiChecklistVision';
export { aiChecklistQuery } from './aiChecklistQuery';
export { sendNotification } from './sendNotification';

export { sendMessageNotification } from './sendMessageNotification';
export { smsWebhookHandler } from './channels/sms';
export { routeWebhookMessage } from './routing';
export { retryFailedMessages } from './retry';
