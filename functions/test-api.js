import { testQwenAPI } from '../src/utils.js';

export async function onRequest(context) {
    return await testQwenAPI(context.env);
} 