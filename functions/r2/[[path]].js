import { getPermissionsPolicyHeader } from '../../src/utils.js';

export async function onRequest(context) {
    const { request, env, params } = context;
    
    // OPTIONS preflight 요청 처리
    if (request.method === 'OPTIONS') {
        const headers = new Headers();
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
        headers.set('Access-Control-Max-Age', '86400');
        headers.set('Permissions-Policy', getPermissionsPolicyHeader());
        return new Response(null, { status: 204, headers });
    }
    
    const key = Array.isArray(params.path) ? params.path.join('/') : (params.path || ''); // [[path]]에서 경로 조합
    try {
        const object = await env.PLAKKER_R2.get(key);
        if (object === null) {
            return new Response('Image not found', { status: 404 });
        }
        
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        
        // 이미지에 CORS 헤더 추가
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
        headers.set('Access-Control-Max-Age', '86400');
        headers.set('Permissions-Policy', getPermissionsPolicyHeader());
        
        // 이미지 캐싱 헤더 추가
        headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1년 캐시
        
        return new Response(object.body, { headers });
    } catch (error) {
        return new Response('Error serving image', { status: 500 });
    }
} 