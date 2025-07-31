import { HTML_TEMPLATES } from '../src/templates.js';
import { createHtmlResponse } from '../src/utils.js';
import { verifyAdminToken } from '../src/api.js';

export async function onRequest(context) {
    const { request, env } = context;
    
    // 기본 인증 체크 (쿠키 또는 Authorization 헤더)
    const authCookie = request.headers.get('Cookie');
    const authHeader = request.headers.get('Authorization');
    
    // 인증 토큰이 있는지 확인
    let hasValidAuth = false;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        // JWT 토큰 검증
        try {
            const authResult = await verifyAdminToken(request, env);
            hasValidAuth = authResult.valid;
        } catch (error) {
            hasValidAuth = false;
        }
    } else if (authCookie && authCookie.includes('admin_session=')) {
        // 쿠키 기반 세션 체크 (선택적)
        // 현재는 JWT 기반이므로 생략
        hasValidAuth = false;
    }
    
    // 인증되지 않은 경우 로그인 페이지 반환
    if (!hasValidAuth) {
        return createHtmlResponse(HTML_TEMPLATES.base('관리자 로그인', `
            <div class="container">
                <div style="text-align: center; padding: 50px;">
                    <h2>🔒 관리자 인증 필요</h2>
                    <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
                    <div style="margin: 30px 0;">
                        <input type="password" id="admin-password" placeholder="관리자 비밀번호" style="padding: 10px; margin-right: 10px;" />
                        <button onclick="adminLoginRedirect()" style="padding: 10px 20px;">로그인</button>
                    </div>
                    <div style="margin-top: 20px;">
                        <a href="/" style="color: #007bff; text-decoration: none;">← 메인페이지로 돌아가기</a>
                    </div>
                </div>
                
                <script>
                    async function adminLoginRedirect() {
                        const password = document.getElementById('admin-password').value;
                        if (!password) {
                            alert('비밀번호를 입력해주세요.');
                            return;
                        }
                        
                        try {
                            const response = await fetch('/api/admin/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ password })
                            });
                            
                            const result = await response.json();
                            
                            if (response.ok && result.success) {
                                // 토큰을 헤더에 설정하고 페이지 새로고침
                                sessionStorage.setItem('admin_token', result.token);
                                
                                // Authorization 헤더로 다시 요청
                                window.location.reload();
                            } else {
                                alert(result.error || '로그인에 실패했습니다.');
                            }
                        } catch (error) {
                            alert('로그인 중 오류가 발생했습니다.');
                        }
                    }
                    
                    // Enter 키 지원
                    document.getElementById('admin-password').addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            adminLoginRedirect();
                        }
                    });
                    
                    // 페이지 로드 시 토큰 체크
                    window.addEventListener('load', function() {
                        const token = sessionStorage.getItem('admin_token');
                        if (token) {
                            // 토큰이 있으면 헤더에 포함해서 페이지 다시 요청
                            fetch(window.location.href, {
                                headers: { 'Authorization': 'Bearer ' + token }
                            }).then(response => {
                                if (response.ok) {
                                    // 인증 성공 시 페이지 내용 교체
                                    response.text().then(html => {
                                        document.documentElement.innerHTML = html;
                                    });
                                }
                            });
                        }
                    });
                </script>
            </div>
        `));
    }
    
    // 인증된 경우 관리자 페이지 반환
    return createHtmlResponse(HTML_TEMPLATES.base('관리자 패널', HTML_TEMPLATES.admin()));
} 