import { HTML_TEMPLATES } from '../src/templates.js';
import { createHtmlResponse, createSecureAdminHtmlResponse } from '../src/utils.js';
import { verifyAdminToken, handlePackDetail } from '../src/api.js';

export async function onRequest(context) {
    const { request, env, params } = context;
    
    // URL에서 경로 추출
    const url = new URL(request.url);
    const requestPath = url.pathname;
    const pathSegments = params.path || [];
    
    // 🔒 SECURITY ENHANCEMENT: 동적 관리자 URL 경로 확인
    const secretAdminPath = env.ADMIN_URL_PATH || '/admin';
    const isDevelopment = env.ENVIRONMENT === 'development';
    
    if (isDevelopment) {
        console.log('[DYNAMIC-ROUTE] 요청 경로:', requestPath);
        console.log('[DYNAMIC-ROUTE] 경로 세그먼트:', pathSegments);
    }
    
    // 홈 페이지 처리
    if (requestPath === '/') {
        if (isDevelopment) {
            console.log('[DYNAMIC-ROUTE] 홈 페이지 요청');
        }
        return createHtmlResponse(HTML_TEMPLATES.base('홈', HTML_TEMPLATES.home()));
    }
    
    // 업로드 페이지 처리
    if (requestPath === '/upload') {
        if (isDevelopment) {
            console.log('[DYNAMIC-ROUTE] 업로드 페이지 요청');
        }
        return createHtmlResponse(HTML_TEMPLATES.base('업로드', HTML_TEMPLATES.upload()));
    }
    
    // API 문서 페이지 처리
    if (requestPath === '/api-docs') {
        if (isDevelopment) {
            console.log('[DYNAMIC-ROUTE] API 문서 페이지 요청');
        }
        return createHtmlResponse(HTML_TEMPLATES.base('API 문서', HTML_TEMPLATES.apiDocs()));
    }
    
    // 팩 상세 페이지 처리
    if (requestPath.startsWith('/pack/')) {
        const packId = requestPath.split('/')[2];
        if (packId) {
            if (isDevelopment) {
                console.log('[DYNAMIC-ROUTE] 팩 상세 페이지 요청:', packId);
            }
            
            const pack = await handlePackDetail(packId, env, request);
            if (pack) {
                return createHtmlResponse(HTML_TEMPLATES.base(
                    `${pack.title} - 이모티콘 팩`, 
                    HTML_TEMPLATES.packDetail(pack)
                ));
            } else {
                return new Response('팩을 찾을 수 없습니다', { status: 404 });
            }
        }
    }
    
    // 관리자 경로인지 확인
    if (requestPath === secretAdminPath) {
        if (isDevelopment) {
            console.log('[DYNAMIC-ROUTE] 관리자 경로 매치! 관리자 페이지 처리');
        }
        return await handleAdminPage(request, env, secretAdminPath);
    }
    
    // 기본 /admin 경로 접근시 가짜 404 반환 (보안 강화)
    if (requestPath === '/admin' && secretAdminPath !== '/admin') {
        if (isDevelopment) {
            console.log('[DYNAMIC-ROUTE] 기본 /admin 경로 접근 - 가짜 404 반환');
        }
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
    if (isDevelopment) {
        console.log('[DYNAMIC-ROUTE] 알 수 없는 경로 - 404 반환');
    }
    return new Response('Not Found', { status: 404 });
}

// 관리자 페이지 처리 함수
async function handleAdminPage(request, env, secretAdminPath) {
    const isDevelopment = env.ENVIRONMENT === 'development';
    
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
                    async function performLogin() {
                        const passwordInput = document.getElementById('admin-password');
                        const loginBtn = document.getElementById('login-btn');
                        const password = passwordInput.value;
                        
                        if (!password) {
                            showError('비밀번호를 입력해주세요.');
                            passwordInput.focus();
                            return;
                        }
                        
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
                                window.location.reload();
                            } else {
                                if (response.status === 429) {
                                    const blockTime = result.remainingTime ? Math.ceil(result.remainingTime / 60) : 5;
                                    showError('보안상 ' + blockTime + '분간 로그인이 제한되었습니다.');
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
                    
                    function showError(message) {
                        const existingError = document.querySelector('.error-message');
                        if (existingError) {
                            existingError.remove();
                        }
                        
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-message';
                        errorDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 10px; margin-bottom: 20px; font-size: 14px; color: #721c24;';
                        errorDiv.textContent = message;
                        
                        const passwordDiv = document.getElementById('admin-password').parentElement;
                        passwordDiv.parentElement.insertBefore(errorDiv, passwordDiv);
                    }
                    
                    document.getElementById('admin-password').addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            performLogin();
                        }
                    });
                    
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
    
    // 인증된 경우 관리자 페이지 반환 (CSRF 토큰 포함)
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
            window.CSRF_TOKEN = '${csrfToken}';
            
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