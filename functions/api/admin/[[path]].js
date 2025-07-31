import { handleAPI } from '../../../src/api.js';

export async function onRequest(context) {
    const { request, env, params } = context;
    
    // URL에서 admin 경로 추출
    const url = new URL(request.url);
    const adminPath = params.path ? params.path.join('/') : '';
    const fullPath = `/api/admin/${adminPath}`;
    
    console.log('[ADMIN API] 요청 경로:', fullPath);
    console.log('[ADMIN API] 요청 메소드:', request.method);
    
    try {
        // 메인 API 핸들러로 위임
        const response = await handleAPI(request, env, fullPath);
        console.log('[ADMIN API] 응답 준비 완료');
        return response;
    } catch (error) {
        console.error('[ADMIN API] 처리 중 오류:', error);
        return new Response(JSON.stringify({ 
            error: '관리자 API 처리 중 오류가 발생했습니다',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 