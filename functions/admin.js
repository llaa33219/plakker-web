import { HTML_TEMPLATES } from '../src/templates.js';
import { createSecureAdminHtmlResponse } from '../src/utils.js';
import { verifyAdminToken } from '../src/api.js'; // 🔒 FIX: 누락된 import 추가

export async function onRequest(context) {
    const { request, env } = context;
    
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
    
    // 인증되지 않은 경우 로그인 페이지 반환 (🔒 SECURITY FIX: 강화된 보안 헤더 적용)
    if (!isAuthenticated) {
        console.log('[ADMIN-DEBUG] 인증 실패, 로그인 페이지 표시. 오류:', authError);
        return createSecureAdminHtmlResponse(HTML_TEMPLATES.base('관리자 인증', `
            <div class="container">
                <div style="text-align: center; padding: 80px 20px;">
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 40px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #495057; margin-bottom: 10px;">🔒 관리자 인증</h2>
                        <p style="color: #6c757d; margin-bottom: 30px;">관리자만 접근할 수 있습니다</p>
                        
                        <!-- 🔒 DEBUG: 인증 오류 표시 -->
                        ${authError ? `<div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 10px; margin-bottom: 20px; font-size: 14px; color: #856404;">
                            디버그: ${authError}
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
                    // 🔒 FIX: 무한 새로고침 방지를 위한 플래그
                    let isReloading = false;
                    
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
                                // 토큰을 저장하고 새로고침
                                const token = result.token;
                                console.log('[CLIENT-DEBUG] 토큰 저장:', token ? '성공' : '실패');
                                sessionStorage.setItem('admin_token', token);
                                
                                // 🔒 FIX: 무한 새로고침 방지 - 플래그 설정 후 새로고침
                                isReloading = true;
                                sessionStorage.setItem('login_success', 'true');
                                console.log('[CLIENT-DEBUG] 페이지 새로고침 시작');
                                window.location.reload();
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
                    
                    // 🔒 FIX: 개선된 자동 로그인 로직 (무한 새로고침 방지)
                    window.addEventListener('load', function() {
                        console.log('[CLIENT-DEBUG] 페이지 로드 완료');
                        
                        // 이미 새로고침 중이면 더 이상 진행하지 않음
                        if (isReloading) {
                            console.log('[CLIENT-DEBUG] 새로고침 중이므로 자동 로그인 시도 안함');
                            return;
                        }
                        
                        const token = sessionStorage.getItem('admin_token');
                        const loginSuccess = sessionStorage.getItem('login_success');
                        
                        console.log('[CLIENT-DEBUG] 저장된 토큰:', token ? '있음' : '없음');
                        console.log('[CLIENT-DEBUG] 로그인 성공 플래그:', loginSuccess);
                        
                        // 로그인 성공 플래그가 있으면 제거하고 자동 로그인 시도 안함 (이미 성공한 상태)
                        if (loginSuccess) {
                            sessionStorage.removeItem('login_success');
                            console.log('[CLIENT-DEBUG] 로그인 성공 플래그 제거됨');
                            return;
                        }
                        
                        if (token) {
                            console.log('[CLIENT-DEBUG] 토큰 검증 시작');
                            // 토큰 검증을 위한 요청 (새로고침 없이)
                            fetch('/api/admin/verify', {
                                headers: { 'Authorization': 'Bearer ' + token }
                            }).then(response => {
                                console.log('[CLIENT-DEBUG] 토큰 검증 응답:', response.status);
                                if (response.ok) {
                                    // 토큰이 유효하면 한 번만 새로고침
                                    if (!sessionStorage.getItem('auto_login_attempted')) {
                                        sessionStorage.setItem('auto_login_attempted', 'true');
                                        console.log('[CLIENT-DEBUG] 자동 로그인 새로고침 시작');
                                        window.location.reload();
                                    } else {
                                        console.log('[CLIENT-DEBUG] 자동 로그인 이미 시도됨');
                                    }
                                } else {
                                    // 토큰이 무효하면 제거
                                    sessionStorage.removeItem('admin_token');
                                    sessionStorage.removeItem('auto_login_attempted');
                                    console.log('[CLIENT-DEBUG] 무효한 토큰 제거됨');
                                }
                            }).catch(error => {
                                console.error('[CLIENT-DEBUG] 토큰 검증 실패:', error);
                                sessionStorage.removeItem('admin_token');
                                sessionStorage.removeItem('auto_login_attempted');
                            });
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
    
    // 🔒 FIX: 인증된 경우 자동 로그인 플래그 정리
    console.log('[ADMIN-DEBUG] 인증 성공, 관리자 페이지 표시');
    const authenticatedPage = createSecureAdminHtmlResponse(HTML_TEMPLATES.base('관리자 패널', HTML_TEMPLATES.admin()));
    
    // 응답에 자동 로그인 플래그 정리 스크립트 추가
    const originalBody = await authenticatedPage.text();
    const modifiedBody = originalBody.replace('</body>', `
        <script>
            console.log('[ADMIN-DEBUG] 관리자 페이지 로드됨');
            // 자동 로그인 관련 플래그 정리
            sessionStorage.removeItem('auto_login_attempted');
            sessionStorage.removeItem('login_success');
        </script>
    </body>`);
    
    return new Response(modifiedBody, {
        status: authenticatedPage.status,
        headers: authenticatedPage.headers
    });
} 