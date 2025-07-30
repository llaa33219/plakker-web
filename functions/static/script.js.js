import { JS_CLIENT } from '../../src/client.js';
import { getStaticResourceHeaders, generateContentHash } from '../../src/utils.js';

export async function onRequest(context) {
    // 개발 환경 감지 (환경변수나 호스트명으로 판단)
    const isDevelopment = context?.env?.ENVIRONMENT === 'development' || 
                         context?.request?.url?.includes('localhost') ||
                         context?.request?.url?.includes('127.0.0.1');
    
    // 콘텐츠 기반 ETag 생성
    const contentHash = generateContentHash(JS_CLIENT);
    const headers = getStaticResourceHeaders('application/javascript; charset=utf-8', isDevelopment);
    
    // 콘텐츠 기반 ETag 추가
    headers.set('ETag', `"js-${contentHash}"`);
    
    // 클라이언트 측 캐시 무효화를 위한 추가 헤더
    if (isDevelopment) {
        headers.set('X-Cache-Control', 'no-cache');
        headers.set('X-Development-Mode', 'true');
    }
    
    const response = new Response(JS_CLIENT, { headers });
    return response;
} 