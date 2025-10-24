// ai.ts - Helpers to call Cloud Functions (prod or emulator)
import { httpsCallable } from 'firebase/functions';
import { getFunctionsClient } from './firebase';

export async function callHelloWorld(): Promise<any> {
  const fn = httpsCallable(await getFunctionsClient(), 'helloWorld');
  const res = await fn({});
  return res.data;
}

// ai.ts - AI feature calls and service abstraction
// TODO: Implement AI service abstraction layer
export const summarizeThread = async (_threadId: string) => {
  // TODO: Implement thread summarization
};

export const extractActionItems = async (_threadId: string) => {
  // TODO: Implement action item extraction
};
