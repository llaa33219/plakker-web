import { HTML_TEMPLATES } from '../src/templates.js';
import { createSecureAdminHtmlResponse } from '../src/utils.js';
import { verifyAdminToken } from '../src/api.js';

export async function onRequest(context) {
    const { request, env, params } = context;
    
    // URL에서 경로 추출
    const url = new URL(request.url);
    const requestPath = url.pathname;
    const pathSegments = params.path || [];
    
    console.log('[DYNAMIC-ROUTE] 요청 경로:', requestPath);
    console.log('[DYNAMIC-ROUTE] 경로 세그먼트:', pathSegments);
    
    // 🔒 SECURITY ENHANCEMENT: 동적 관리자 URL 경로 확인
    const secretAdminPath = env.ADMIN_URL_PATH || '/admin';
    
    console.log('[DYNAMIC-ROUTE] ADMIN_URL_PATH 환경변수:', env.ADMIN_URL_PATH || '설정되지 않음');
    console.log('[DYNAMIC-ROUTE] 설정된 관리자 경로:', secretAdminPath);
    
    // 관리자 경로인지 확인
    if (requestPath === secretAdminPath) {
        console.log('[DYNAMIC-ROUTE] 관리자 경로 매치! 관리자 페이지 처리');
        return await handleAdminPage(request, env, secretAdminPath);
    }
    
    // 기본 /admin 경로 접근시 가짜 404 반환 (보안 강화)
    if (requestPath === '/admin' && secretAdminPath !== '/admin') {
        console.log('[DYNAMIC-ROUTE] 기본 /admin 경로 접근 - 가짜 404 반환');
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head><title>404 Not Found</title></head>
            <body>
                <h1>404 Not Found</h1>
                <p>The requested URL was not found on this server.</p>
            </body>
            </html>
        `, {
            status: 404,
            headers: { 'Content-Type': 'text/html' }
        });
    }
    
    // 다른 모든 경로는 일반 404
    console.log('[DYNAMIC-ROUTE] 알 수 없는 경로 - 404 반환');
    return new Response('Not Found', { status: 404 });
}

// 관리자 페이지 처리 함수
async function handleAdminPage(request, env, secretAdminPath) {
    // Authorization 헤더 확인
    const authHeader = request.headers.get('Authorization');
    let isAuthenticated = false;
    let authError = null;
    
    console.log('[ADMIN-DEBUG] Authorization 헤더:', authHeader ? '존재함' : '없음');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const authResult = await verifyAdminToken(request, env);
            isAuthenticated = authResult.valid;
            authError = authResult.error;
            console.log('[ADMIN-DEBUG] 토큰 검증 결과:', { valid: isAuthenticated, error: authError });
        } catch (error) {
            isAuthenticated = false;
            authError = error.message;
            console.error('[ADMIN-DEBUG] 토큰 검증 중 예외:', error);
        }
    } else {
        console.log('[ADMIN-DEBUG] Authorization 헤더가 없거나 형식이 잘못됨');
    }
    
    // 인증되지 않은 경우 로그인 페이지 반환
    if (!isAuthenticated) {
        console.log('[ADMIN-DEBUG] 인증 실패, 로그인 페이지 표시. 오류:', authError);
        return createSecureAdminHtmlResponse(HTML_TEMPLATES.base('관리자 인증', `
            <div class="container">
                <div style="text-align: center; padding: 80px 20px;">
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 40px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #495057; margin-bottom: 10px;">🔒 관리자 인증</h2>
                        <p style="color: #6c757d; margin-bottom: 30px;">관리자만 접근할 수 있습니다</p>
                        
                        <!-- 🔒 SECURITY: 비밀 경로 사용중임을 표시 -->
                        ${secretAdminPath !== '/admin' ? `<div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 10px; margin-bottom: 20px; font-size: 14px; color: #0c5460;">
                            🛡️ 보안 강화: 비밀 관리자 경로 사용중<br/>
                            현재 경로: ${secretAdminPath}
                        </div>` : ''}
                        
                        <!-- 🔒 DEBUG: 환경변수 상태 표시 -->
                        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 10px; margin-bottom: 20px; font-size: 12px; color: #856404;">
                            ✅ DEBUG: 환경변수 ADMIN_URL_PATH = "${env.ADMIN_URL_PATH || '설정되지 않음'}"<br/>
                            ✅ 현재 사용중인 경로: ${secretAdminPath}<br/>
                            ✅ 동적 라우팅: 활성화됨
                        </div>
                        
                        <!-- 🔒 DEBUG: 인증 오류 표시 -->
                        ${authError ? `<div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 10px; margin-bottom: 20px; font-size: 14px; color: #721c24;">
                            인증 오류: ${authError}
                        </div>` : ''}
                        
                        <div style="margin-bottom: 20px;">
                            <input type="password" id="admin-password" placeholder="관리자 비밀번호" 
                                style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px;" />
                        </div>
                        
                        <button id="login-btn" onclick="performLogin()" 
                            style="width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-bottom: 20px;">
                            로그인
                        </button>
                        
                        <div style="margin-top: 20px;">
                            <a href="/" style="color: #007bff; text-decoration: none;">← 메인페이지로 돌아가기</a>
                        </div>
                    </div>
                </div>
                
                <script>
                    // 🔒 SECURITY FIX: XSS 방지를 위한 안전한 DOM 조작
                    async function performLogin() {
                        const passwordInput = document.getElementById('admin-password');
                        const loginBtn = document.getElementById('login-btn');
                        const password = passwordInput.value;
                        
                        if (!password) {
                            alert('비밀번호를 입력해주세요.');
                            passwordInput.focus();
                            return;
                        }
                        
                        // 로딩 상태
                        const originalText = loginBtn.textContent;
                        loginBtn.disabled = true;
                        loginBtn.textContent = '로그인 중...';
                        
                        try {
                            console.log('[CLIENT-DEBUG] 로그인 API 호출 시작');
                            
                            const response = await fetch('/api/admin/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ password })
                            });
                            
                            console.log('[CLIENT-DEBUG] 응답 상태:', response.status);
                            
                            const result = await response.json();
                            console.log('[CLIENT-DEBUG] 응답 내용:', result);
                            
                            if (response.ok && result.success) {
                                // 토큰을 저장
                                const token = result.token;
                                console.log('[CLIENT-DEBUG] 토큰 저장:', token ? '성공' : '실패');
                                sessionStorage.setItem('admin_token', token);
                                
                                // 🔒 FIX: 토큰과 함께 Authorization 헤더를 포함한 페이지 요청
                                console.log('[CLIENT-DEBUG] Authorization 헤더를 포함한 페이지 요청');
                                
                                const adminResponse = await fetch(window.location.href, {
                                    headers: { 'Authorization': 'Bearer ' + token }
                                });
                                
                                if (adminResponse.ok) {
                                    console.log('[CLIENT-DEBUG] 인증된 페이지 로드 성공, 페이지 교체');
                                    const adminPageHtml = await adminResponse.text();
                                    document.documentElement.innerHTML = adminPageHtml;
                                } else {
                                    console.error('[CLIENT-DEBUG] 인증된 페이지 로드 실패:', adminResponse.status);
                                    alert('관리자 페이지 로드에 실패했습니다.');
                                }
                            } else {
                                console.error('[CLIENT-DEBUG] 로그인 실패:', result.error);
                                if (response.status === 429) {
                                    const blockTime = result.remainingTime ? Math.ceil(result.remainingTime / 60) : 5;
                                    alert('보안을 위해 로그인이 일시적으로 제한되었습니다. ' + blockTime + '분 후 다시 시도해주세요.');
                                } else {
                                    alert(result.error || '로그인에 실패했습니다.');
                                }
                            }
                        } catch (error) {
                            console.error('[CLIENT-DEBUG] 로그인 중 예외:', error);
                            alert('로그인 중 오류가 발생했습니다: ' + error.message);
                        } finally {
                            // 로딩 상태 해제
                            loginBtn.disabled = false;
                            loginBtn.textContent = originalText;
                        }
                    }
                    
                    // Enter 키로 로그인
                    document.getElementById('admin-password').addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            performLogin();
                        }
                    });
                    
                    // 🔒 FIX: 자동 새로고침 제거 - 무한 루프 방지
                    window.addEventListener('load', function() {
                        console.log('[CLIENT-DEBUG] 페이지 로드 완료');
                        
                        const token = sessionStorage.getItem('admin_token');
                        console.log('[CLIENT-DEBUG] 저장된 토큰:', token ? '있음' : '없음');
                        
                        if (token) {
                            console.log('[CLIENT-DEBUG] 토큰이 있습니다. 로그인 버튼을 눌러주세요.');
                        }
                        
                        // 포커스 설정
                        setTimeout(() => {
                            const passwordInput = document.getElementById('admin-password');
                            if (passwordInput) passwordInput.focus();
                        }, 100);
                    });
                </script>
            </div>
        `));
    }
    
    // 🔒 FIX: 인증된 경우 관리자 페이지 반환
    console.log('[ADMIN-DEBUG] 인증 성공, 관리자 페이지 표시');
    return createSecureAdminHtmlResponse(HTML_TEMPLATES.base('관리자 패널', HTML_TEMPLATES.admin()));
} 