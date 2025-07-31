// 🚨 임시 디버그용 - 개발 중에만 사용
export async function onRequest(context) {
    const { request, env } = context;
    
    // POST 요청만 허용
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    try {
        const body = await request.json();
        const { action, password } = body;
        
        if (action === 'check-env') {
            // 환경변수 상태 확인
            return new Response(JSON.stringify({
                success: true,
                env_status: {
                    JWT_SECRET: !!env.JWT_SECRET,
                    JWT_SECRET_length: env.JWT_SECRET ? env.JWT_SECRET.length : 0,
                    ADMIN_PASSWORD_HASH: !!env.ADMIN_PASSWORD_HASH,
                    ADMIN_PASSWORD_HASH_format: env.ADMIN_PASSWORD_HASH ? 
                        (env.ADMIN_PASSWORD_HASH.includes(':') ? 'valid' : 'invalid') : 'missing',
                    PLAKKER_KV: !!env.PLAKKER_KV,
                    available_env_vars: Object.keys(env).filter(k => !k.includes('SECRET') && !k.includes('HASH'))
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (action === 'generate-hash' && password) {
            // 비밀번호 해시 생성
            const { generateAdminPasswordHash } = await import('../src/utils.js');
            const hash = await generateAdminPasswordHash(password);
            
            return new Response(JSON.stringify({
                success: true,
                password_hash: hash,
                instruction: '이 값을 ADMIN_PASSWORD_HASH 환경변수에 설정하세요'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (action === 'simple-login' && password) {
            // 간단한 로그인 테스트 (해시 검증 없이)
            const simplePassword = 'admin123'; // 임시 테스트용
            
            if (password === simplePassword) {
                const { createJWT } = await import('../src/utils.js');
                const token = await createJWT({
                    role: 'admin',
                    sessionId: Date.now().toString(),
                    loginTime: Date.now()
                }, env.JWT_SECRET || 'temporary-secret-for-testing', 3600);
                
                return new Response(JSON.stringify({
                    success: true,
                    token: token,
                    message: '임시 로그인 성공 - admin123으로 로그인됨'
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                return new Response(JSON.stringify({
                    success: false,
                    error: '임시 비밀번호가 틀렸습니다. admin123을 시도해보세요.'
                }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        return new Response(JSON.stringify({
            error: 'Invalid action. Use: check-env, generate-hash, simple-login'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        
    } catch (error) {
        return new Response(JSON.stringify({
            error: '디버그 요청 처리 실패: ' + error.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
} 