// 관리자 API 라우팅 테스트용 엔드포인트

export async function onRequest(context) {
    const { request, env } = context;
    
    console.log('[ADMIN TEST] 테스트 API 호출됨');
    
    return new Response(JSON.stringify({
        success: true,
        message: '관리자 API 라우팅이 정상적으로 작동합니다',
        timestamp: new Date().toISOString(),
        method: request.method
        // hasAdminPassword 정보 제거 - 보안 취약점 수정
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
} 