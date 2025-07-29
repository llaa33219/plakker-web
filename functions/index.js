// 모듈 imports
import { HTML_TEMPLATES } from '../src/templates.js';
import { createHtmlResponse } from '../src/utils.js';

// 홈페이지 핸들러
export async function onRequest(context) {
    const { request } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 홈페이지
    if (path === '/') {
        return createHtmlResponse(HTML_TEMPLATES.base('홈', HTML_TEMPLATES.home()));
    }
    
    // 업로드 페이지
    if (path === '/upload') {
        return createHtmlResponse(HTML_TEMPLATES.base('업로드', HTML_TEMPLATES.upload()));
    }
    
    // API 문서 페이지
    if (path === '/api-docs') {
        return createHtmlResponse(HTML_TEMPLATES.base('API 문서', HTML_TEMPLATES.apiDocs()));
    }
    
    // Gemini API 테스트 페이지
    if (path === '/test-api') {
        const { testGeminiAPI } = await import('../src/utils.js');
        return await testGeminiAPI(context.env);
    }
    
    // 404
    return new Response('Not Found', { status: 404 });
} 