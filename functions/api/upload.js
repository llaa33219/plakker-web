import { handleUpload } from '../../src/api.js';
import { addCorsHeaders, handleOptions } from '../../src/utils.js';

export async function onRequest(context) {
    const { request, env } = context;
    
    // OPTIONS preflight 요청 처리
    if (request.method === 'OPTIONS') {
        return handleOptions();
    }
    
    let response;
    if (request.method === 'POST') {
        response = await handleUpload(request, env);
    } else {
        response = new Response('Method Not Allowed', { status: 405 });
    }
    
    // 모든 API 응답에 CORS 헤더 추가
    return addCorsHeaders(response);
} 