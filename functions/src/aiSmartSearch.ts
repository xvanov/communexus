// aiSmartSearch.ts - AI smart search Cloud Function
import { onCall } from 'firebase-functions/v2/https';
import { aiService } from './aiService';

export const aiSmartSearch = onCall(async request => {
  try {
    const { query, messages } = request.data;

    if (!query || typeof query !== 'string') {
      throw new Error('Search query is required');
    }

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    console.log(
      `🔍 Smart search: query="${query}", messages=${messages.length}`
    );

    const results = await aiService.smartSearch(query, messages);

    return {
      success: true,
      results: results,
      count: results.length,
      query: query,
    };
  } catch (error) {
    console.error('Error in aiSmartSearch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      results: [],
    };
  }
});
