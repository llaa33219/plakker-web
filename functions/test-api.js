import { testLlamaAPI } from '../src/utils.js';

export async function onRequest(context) {
    return await testLlamaAPI(context.env);
} 