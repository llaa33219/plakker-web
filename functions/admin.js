import { HTML_TEMPLATES } from '../src/templates.js';
import { createSecureAdminHtmlResponse } from '../src/utils.js';
import { verifyAdminToken } from '../src/api.js';

export async function onRequest(context) {
    const { request, env } = context;
    
    // 🔒 SECURITY ENHANCEMENT: 동적 관리자 URL 경로 확인
    const url = new URL(request.url);
    const requestPath = url.pathname;
    const secretAdminPath = env.ADMIN_URL_PATH || '/admin';
    
    // 프로덕션에서는 디버그 로그 제거
    const isDevelopment = env.ENVIRONMENT === 'development';
    if (isDevelopment) {
        console.log('[ADMIN-DEBUG] 요청 경로:', requestPath);
        console.log('[ADMIN-DEBUG] 설정된 관리자 경로:', secretAdminPath !== '/admin' ? '비밀 경로 사용중' : '기본 경로 사용중');
    }
    
    // 🔒 SECURITY: 잘못된 경로로 접근 시 404 또는 가짜 페이지 반환
    if (requestPath !== secretAdminPath) {
        if (isDevelopment) {
            console.log('[ADMIN-DEBUG] 잘못된 관리자 경로 접근 시도:', requestPath);
        }
        
        // 기본 /admin 경로 접근시 가짜 404 페이지 반환
        if (requestPath === '/admin' && secretAdminPath !== '/admin') {
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
        
        return new Response('Not Found', { status: 404 });
    }
    
    // Authorization 헤더 확인
    const authHeader = request.headers.get('Authorization');
    let isAuthenticated = false;
    let authError = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const authResult = await verifyAdminToken(request, env);
            isAuthenticated = authResult.valid;
            authError = authResult.error;
            
            if (isDevelopment) {
                console.log('[ADMIN-DEBUG] 토큰 검증 결과:', { valid: isAuthenticated, error: authError });
            }
        } catch (error) {
            isAuthenticated = false;
            authError = '인증 처리 중 오류가 발생했습니다';
            if (isDevelopment) {
                console.error('[ADMIN-DEBUG] 토큰 검증 중 예외:', error);
            }
        }
    }
    
    // 인증되지 않은 경우 로그인 페이지 반환
    if (!isAuthenticated) {
        if (isDevelopment) {
            console.log('[ADMIN-DEBUG] 인증 실패, 로그인 페이지 표시. 오류:', authError);
        }
        
        return createSecureAdminHtmlResponse(HTML_TEMPLATES.base('관리자 인증', `
            <div class="container">
                <div style="text-align: center; padding: 80px 20px;">
                    <div style="background: #f8f9fa; border-radius: 10px; padding: 40px; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <h2 style="color: #495057; margin-bottom: 10px;">🔒 관리자 인증</h2>
                        <p style="color: #6c757d; margin-bottom: 30px;">관리자만 접근할 수 있습니다</p>
                        
                        ${secretAdminPath !== '/admin' && isDevelopment ? `<div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 10px; margin-bottom: 20px; font-size: 14px; color: #0c5460;">
                            🛡️ 보안 강화: 비밀 관리자 경로 사용중
                        </div>` : ''}
                        
                        ${authError ? `<div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 10px; margin-bottom: 20px; font-size: 14px; color: #721c24;">
                            인증 오류: 다시 시도해주세요
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
                    // 🔒 SECURITY ENHANCEMENT: 안전한 DOM 조작 및 CSRF 토큰 적용
                    let csrfToken = null;
                    
                    async function performLogin() {
                        const passwordInput = document.getElementById('admin-password');
                        const loginBtn = document.getElementById('login-btn');
                        const password = passwordInput.value;
                        
                        if (!password) {
                            showError('비밀번호를 입력해주세요.');
                            passwordInput.focus();
                            return;
                        }
                        
                        // 로딩 상태
                        const originalText = loginBtn.textContent;
                        loginBtn.disabled = true;
                        loginBtn.textContent = '로그인 중...';
                        
                        try {
                            const response = await fetch('/api/admin/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ password })
                            });
                            
                            const result = await response.json();
                            
                            if (response.ok && result.success) {
                                const token = result.token;
                                sessionStorage.setItem('admin_token', token);
                                
                                // 🔒 SECURITY ENHANCEMENT: 안전한 페이지 리로드
                                window.location.reload();
                                
                            } else {
                                if (response.status === 429) {
                                    const blockTime = result.remainingTime ? Math.ceil(result.remainingTime / 60) : 5;
                                    showError('보안을 위해 로그인이 일시적으로 제한되었습니다. ' + blockTime + '분 후 다시 시도해주세요.');
                                } else {
                                    showError(result.error || '로그인에 실패했습니다.');
                                }
                            }
                        } catch (error) {
                            showError('로그인 중 오류가 발생했습니다.');
                        } finally {
                            loginBtn.disabled = false;
                            loginBtn.textContent = originalText;
                        }
                    }
                    
                    // 🔒 SECURITY ENHANCEMENT: 안전한 오류 표시
                    function showError(message) {
                        // 기존 오류 메시지 제거
                        const existingError = document.querySelector('.error-message');
                        if (existingError) {
                            existingError.remove();
                        }
                        
                        // 새 오류 메시지 생성
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message';
                        errorDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 10px; margin-bottom: 20px; font-size: 14px; color: #721c24;';
                        errorDiv.textContent = message;
                        
                        // 비밀번호 입력창 앞에 삽입
                        const passwordDiv = document.getElementById('admin-password').parentElement;
                        passwordDiv.parentElement.insertBefore(errorDiv, passwordDiv);
                    }
                    
                    // Enter 키로 로그인
                    document.getElementById('admin-password').addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            performLogin();
                        }
                    });
                    
                    // 페이지 로드 시 포커스 설정
                    window.addEventListener('load', function() {
                        const passwordInput = document.getElementById('admin-password');
                        if (passwordInput) {
                            setTimeout(() => passwordInput.focus(), 100);
                        }
                    });
                </script>
            </div>
        `));
    }
    
    // 🔒 SECURITY ENHANCEMENT: 인증된 경우 관리자 페이지 반환 (CSRF 토큰 포함)
    if (isDevelopment) {
        console.log('[ADMIN-DEBUG] 인증 성공, 관리자 페이지 표시');
    }
    
    // 세션에서 CSRF 토큰 가져오기
    let csrfToken = '';
    try {
        const authResult = await verifyAdminToken(request, env);
        if (authResult.valid && authResult.payload.sessionId) {
            const sessionKey = `admin_session:${authResult.payload.sessionId}`;
            const session = await env.PLAKKER_KV.get(sessionKey, 'json');
            if (session && session.csrfToken) {
                csrfToken = session.csrfToken;
            }
        }
    } catch (error) {
        if (isDevelopment) {
            console.error('[ADMIN-DEBUG] CSRF 토큰 가져오기 실패:', error);
        }
    }
    
    return createSecureAdminHtmlResponse(HTML_TEMPLATES.base('관리자 패널', 
        HTML_TEMPLATES.admin() + `
        <script>
            // 🔒 SECURITY ENHANCEMENT: CSRF 토큰 설정
            window.CSRF_TOKEN = '${csrfToken}';
            
            // 모든 관리자 API 요청에 CSRF 토큰 자동 추가
            const originalFetch = window.fetch;
            window.fetch = function(url, options = {}) {
                if (url.startsWith('/api/admin/') && options.method && options.method !== 'GET') {
                    options.headers = options.headers || {};
                    options.headers['X-CSRF-Token'] = window.CSRF_TOKEN;
                    
                    const token = sessionStorage.getItem('admin_token');
                    if (token) {
                        options.headers['Authorization'] = 'Bearer ' + token;
                    }
                }
                return originalFetch.call(this, url, options);
            };
        </script>
        `
    ));
} 