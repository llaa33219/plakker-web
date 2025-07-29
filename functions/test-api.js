import { testGeminiAPI } from '../src/utils.js';

export async function onRequest(context) {
    return await testGeminiAPI(context.env);
} 