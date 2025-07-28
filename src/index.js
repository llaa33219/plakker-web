// 모듈 imports
import { HTML_TEMPLATES } from './templates.js';
import { CSS_STYLES } from './styles.js';
import { JS_CLIENT } from './client.js';
import { testAIGateway, createHtmlResponse, getPermissionsPolicyHeader } from './utils.js';
import { handleAPI, handlePackDetail } from './api.js';

// Worker 메인 함수
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // 정적 파일 서빙
        if (path === '/static/style.css') {
            const response = new Response(CSS_STYLES, {
                headers: { 'Content-Type': 'text/css; charset=utf-8' }
            });
            response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());
            return response;
        }
        
        if (path === '/static/script.js') {
            const response = new Response(JS_CLIENT, {
                headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
            });
            response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());
            return response;
        }
        
        // R2 이미지 서빙
        if (path.startsWith('/r2/')) {
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
            
            const key = path.substring(4); // '/r2/' 제거
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
        
        // AI Gateway 테스트 엔드포인트
        if (path === '/test-gateway') {
            return await testAIGateway(env);
        }
        
        // API 라우팅
        if (path.startsWith('/api/')) {
            return handleAPI(request, env, path);
        }
        
        // 페이지 라우팅
        if (path === '/') {
            return createHtmlResponse(HTML_TEMPLATES.base('홈', HTML_TEMPLATES.home()));
        }
        
        if (path === '/upload') {
            return createHtmlResponse(HTML_TEMPLATES.base('업로드', HTML_TEMPLATES.upload()));
        }
        
        if (path === '/api-docs') {
            return createHtmlResponse(HTML_TEMPLATES.base('API 문서', HTML_TEMPLATES.apiDocs()));
        }
        
        if (path.startsWith('/pack/')) {
            const packId = path.split('/')[2];
            const pack = await handlePackDetail(packId, env, request);
            if (!pack) {
                return createHtmlResponse('팩을 찾을 수 없습니다', 404);
            }
            return createHtmlResponse(HTML_TEMPLATES.base(`${pack.title} - 이모티콘 팩`, HTML_TEMPLATES.detail(pack)));
        }
        
        // 404
        return new Response('Not Found', { status: 404 });
    }
};