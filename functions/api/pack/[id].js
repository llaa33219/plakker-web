import { handleGetPack } from '../../../src/api.js';
import { addCorsHeaders, handleOptions } from '../../../src/utils.js';

export async function onRequest(context) {
    const { request, env, params } = context;
    
    // OPTIONS preflight 요청 처리
    if (request.method === 'OPTIONS') {
        return handleOptions();
    }
    
    let response;
    if (request.method === 'GET') {
        const packId = params.id;
        if (!packId) {
            response = new Response(JSON.stringify({ error: 'Pack ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            response = await handleGetPack(packId, env, request);
        }
    } else {
        response = new Response(JSON.stringify({ error: 'Method Not Allowed' }), { 
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // 모든 API 응답에 CORS 헤더 추가
    return addCorsHeaders(response);
} 