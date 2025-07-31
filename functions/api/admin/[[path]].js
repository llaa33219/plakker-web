import { handleAPI, verifyAdminToken, validateAdminRequest } from '../../../src/api.js';

export async function onRequest(context) {
    const { request, env, params } = context;
    
    // URL에서 admin 경로 추출
    const url = new URL(request.url);
    const adminPath = params.path ? params.path.join('/') : '';
    const fullPath = `/api/admin/${adminPath}`;
    
    console.log('[ADMIN API] 요청 경로:', fullPath);
    console.log('[ADMIN API] 요청 메소드:', request.method);
    
    try {
        // 🔒 SECURITY FIX: 관리자 인증이 필요한 엔드포인트 확인
        const protectedEndpoints = [
            '/api/admin/pending-packs',
            '/api/admin/approve-pack',
            '/api/admin/reject-pack'
        ];
        
        // 인증이 필요한 엔드포인트인지 확인
        const requiresAuth = protectedEndpoints.some(endpoint => fullPath === endpoint);
        
        if (requiresAuth) {
            // 1. 추가 보안 검증
            const requestValidation = await validateAdminRequest(request, env);
            if (!requestValidation.valid) {
                return new Response(JSON.stringify({ 
                    error: requestValidation.error 
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            // 2. 관리자 토큰 검증
            const authResult = await verifyAdminToken(request, env);
            if (!authResult.valid) {
                return new Response(JSON.stringify({ 
                    error: authResult.error 
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            console.log('[ADMIN API] 관리자 인증 성공:', authResult.payload.sessionId);
        }
        
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