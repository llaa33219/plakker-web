// JavaScript 클라이언트 코드 (템플릿 리터럴을 일반 문자열로 변경)
export const JS_CLIENT = `
// HTML 문자열 생성 유틸리티 함수들 (따옴표 충돌 방지)
function createHTMLElement(tag, attributes = {}, content = '') {
    const attrs = Object.entries(attributes)
        .map(([key, value]) => key + '="' + String(value).replace(/"/g, '&quot;') + '"')
        .join(' ');
    
    if (content) {
        return '<' + tag + (attrs ? ' ' + attrs : '') + '>' + content + '</' + tag + '>';
    } else {
        return '<' + tag + (attrs ? ' ' + attrs : '') + '/>';
    }
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function createButton(text, clickHandler, className = '') {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.className = className;
    if (clickHandler) btn.onclick = clickHandler;
    return btn;
}

let currentPage = 1;

// 캐시 무효화 및 버전 관리
const CACHE_VERSION_KEY = 'plakker_cache_version';
const CURRENT_VERSION = '20250130_urlfix_v3'; // 고정 버전

function checkCacheVersion() {
    try {
        // 무한 새로고침 방지 - 새로고침 카운터 체크
        const reloadCount = parseInt(sessionStorage.getItem('plakker_reload_count') || '0');
        if (reloadCount >= 3) {
            sessionStorage.removeItem('plakker_reload_count');
            return;
        }
        
        const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
        
        // 버전이 다르거나 처음 방문인 경우
        if (!storedVersion || storedVersion !== CURRENT_VERSION) {
            
            // 새로고침 카운터 증가
            sessionStorage.setItem('plakker_reload_count', (reloadCount + 1).toString());
            
            // 서비스 워커 캐시 정리 (있는 경우)
            if ('serviceWorker' in navigator && 'caches' in window) {
                caches.keys().then(function(cacheNames) {
                    return Promise.all(
                        cacheNames.map(function(cacheName) {
                            return caches.delete(cacheName);
                        })
                    );
                });
            }
            
            // localStorage 버전 업데이트 (새로고침 전에 미리 업데이트)
            localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
            
            // 이전 버전이 있었다면 한 번만 새로고침
            if (storedVersion && reloadCount === 0) {
                setTimeout(() => {
                    window.location.reload(true);
                }, 100);
                return;
            }
        } else {
            // 버전이 같으면 새로고침 카운터 초기화
            sessionStorage.removeItem('plakker_reload_count');
        }
        
    } catch (error) {
        // 에러가 나도 무한 새로고침 방지
        const errorReloadCount = parseInt(sessionStorage.getItem('plakker_error_reload') || '0');
        if (errorReloadCount < 1) {
            sessionStorage.setItem('plakker_error_reload', '1');
            window.location.reload(true);
        }
    }
}

// 개발자 도구용 수동 캐시 클리어 함수
window.clearPlakkerCache = function() {
    localStorage.removeItem(CACHE_VERSION_KEY);
    localStorage.removeItem('plakker_last_cache_check');
    
    if ('serviceWorker' in navigator && 'caches' in window) {
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        }).then(function() {
            window.location.reload(true);
        });
    } else {
        window.location.reload(true);
    }
};

// 관리자 기능들
let adminToken = null;
let sessionTimeout = null;
let securityFingerprint = null; // 클라이언트 보안 핑거프린트

// 보안 핑거프린트 생성 (안전한 버전)
function generateSecurityFingerprint() {
    try {
        // 기본 브라우저 정보만 사용 (캔버스 제외)
        const fingerprint = {
            screen: screen.width + 'x' + screen.height,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            language: navigator.language || 'en',
            platform: navigator.platform || 'unknown',
            timestamp: Date.now()
        };
        
        // 안전한 인코딩 (유니코드 문제 방지)
        const jsonString = JSON.stringify(fingerprint);
        let encoded = '';
        for (let i = 0; i < jsonString.length; i++) {
            encoded += jsonString.charCodeAt(i).toString(16);
        }
        
        return encoded.slice(0, 32);
    } catch (error) {
        // 폴백: 간단한 타임스탬프 기반 핑거프린트
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
}

// 개발자 도구 감지 (관리자 페이지 전용)
function detectDevTools() {
    // 관리자 페이지에서만 활성화
    if (window.location.pathname !== '/admin') {
        return;
    }
    
    let devtools = false;
    const threshold = 160;
    
    const checkInterval = setInterval(() => {
        // 관리자 페이지를 벗어나면 감지 중단
        if (window.location.pathname !== '/admin') {
            clearInterval(checkInterval);
            return;
        }
        
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools) {
                devtools = true;
                // 개발자 도구 감지 시 특별한 조치 없음
            }
        } else {
            devtools = false;
        }
    }, 2000); // 2초마다 체크 (성능 개선)
}

// 🔒 SECURITY ENHANCEMENT: 안전한 관리자 API 요청 함수 (CSRF 토큰 포함)
async function secureAdminRequest(url, options = {}) {
    const token = adminToken || sessionStorage.getItem('admin_token');
    
    if (!token) {
        throw new Error('관리자 인증이 필요합니다');
    }
    
    // 🔒 SECURITY: CSRF 토큰 자동 추가
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
    };
    
    // POST, PUT, DELETE 요청에는 CSRF 토큰 필수
    if (options.method && options.method !== 'GET' && window.CSRF_TOKEN) {
        headers['X-CSRF-Token'] = window.CSRF_TOKEN;
    }
    
    const secureOptions = {
        ...options,
        headers
    };
    
    return fetch(url, secureOptions);
}

// 🔒 SECURITY ENHANCEMENT: 관리자 로그인 (보안 강화)
window.adminLogin = async function() {
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.querySelector('.login-btn');
    const password = passwordInput.value;
    
    if (!password) {
        showSecureError('비밀번호를 입력해주세요.');
        return;
    }
    
    // 로딩 상태 설정
    const originalText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const responseText = await response.text();
        
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
                throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } else if (responseText.trim() === '') {
                throw new Error('서버 연결에 실패했습니다.');
            } else {
                throw new Error('로그인 처리 중 오류가 발생했습니다.');
            }
        }
        
        if (response.ok && result.success) {
            adminToken = result.token;
            sessionStorage.setItem('admin_token', result.token);
            
            // UI 업데이트
            const authElement = document.getElementById('admin-auth');
            const controlsElement = document.getElementById('admin-controls');
            const contentElement = document.getElementById('admin-content');
            
            if (authElement) authElement.style.display = 'none';
            if (controlsElement) controlsElement.style.display = 'block';
            if (contentElement) contentElement.style.display = 'block';
            
            // 🔒 SECURITY: 세션 타임아웃 30분으로 설정
            if (result.expiresAt) {
                const expiresIn = (result.expiresAt - Date.now()) - (5 * 60 * 1000); // 5분 전 경고
                if (expiresIn > 0) {
                    sessionTimeout = setTimeout(() => {
                        showSecureError('세션이 곧 만료됩니다. 다시 로그인해주세요.');
                        setTimeout(() => adminLogout(), 3000);
                    }, expiresIn);
                }
            }
            
            await loadPendingPacks();
            passwordInput.value = ''; // 비밀번호 즉시 지우기
            
        } else {
            if (response.status === 429) {
                const blockTime = result.remainingTime ? Math.ceil(result.remainingTime / 60) : 5;
                showSecureError('보안상 ' + blockTime + '분간 로그인이 제한되었습니다.');
            } else if (response.status === 500) {
                showSecureError('서버 오류가 발생했습니다. 관리자에게 문의하세요.');
            } else {
                showSecureError('인증에 실패했습니다.');
            }
        }
    } catch (error) {
        showSecureError('로그인 중 오류가 발생했습니다.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = originalText;
    }
};

// 🔒 SECURITY ENHANCEMENT: 안전한 오류 메시지 표시
function showSecureError(message) {
    // 기존 오류 메시지 제거
    const existingError = document.querySelector('.admin-error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // 새 오류 메시지 생성
    const errorDiv = document.createElement('div');
    errorDiv.className = 'admin-error-message';
    errorDiv.style.cssText = 'background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 10px; margin-bottom: 15px; color: #721c24; font-size: 14px; text-align: center;';
    errorDiv.textContent = message;
    
    // 적절한 위치에 삽입
    const authDiv = document.getElementById('admin-auth') || document.querySelector('.container');
    if (authDiv) {
        authDiv.insertBefore(errorDiv, authDiv.firstChild);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// 🔒 SECURITY ENHANCEMENT: 관리자 로그아웃 (보안 강화)
window.adminLogout = async function() {
    try {
        const token = adminToken || sessionStorage.getItem('admin_token');
        if (token) {
            // 🔒 SECURITY: CSRF 토큰 포함하여 로그아웃 요청
            await secureAdminRequest('/api/admin/logout', {
                method: 'POST'
            });
        }
    } catch (error) {
        // 로그아웃 오류는 무시하고 클라이언트 측 정리 진행
    } finally {
        // 🔒 SECURITY: 모든 인증 정보 완전 삭제
        adminToken = null;
        sessionStorage.removeItem('admin_token');
        
        if (sessionTimeout) {
            clearTimeout(sessionTimeout);
            sessionTimeout = null;
        }
        
        // CSRF 토큰도 제거
        if (window.CSRF_TOKEN) {
            window.CSRF_TOKEN = null;
        }
        
        const authElement = document.getElementById('admin-auth');
        const controlsElement = document.getElementById('admin-controls');
        const contentElement = document.getElementById('admin-content');
        const passwordElement = document.getElementById('admin-password');
        
        if (authElement && controlsElement && contentElement) {
            authElement.style.display = 'block';
            controlsElement.style.display = 'none';
            contentElement.style.display = 'none';
            if (passwordElement) passwordElement.value = '';
            
            const packsElement = document.getElementById('pending-packs');
            if (packsElement) packsElement.innerHTML = '';
        } else {
            // 서버 인증 페이지의 경우 홈으로 리다이렉트
            window.location.href = '/';
        }
    }
};

// 🔒 SECURITY ENHANCEMENT: 대기 중인 팩 로드 (보안 강화)
window.loadPendingPacks = async function() {
    const token = adminToken || sessionStorage.getItem('admin_token');
    
    if (!token) {
        showSecureError('로그인이 필요합니다.');
        return;
    }
    
    if (!adminToken && token) {
        adminToken = token;
    }
    
    try {
        const response = await secureAdminRequest('/api/admin/pending-packs', {
            method: 'GET'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showSecureError('세션이 만료되었습니다. 다시 로그인해주세요.');
                setTimeout(() => adminLogout(), 2000);
                return;
            }
            throw new Error('권한이 없습니다.');
        }
        
        const data = await response.json();
        const pendingPacks = data.packs || [];
        
        // UI 업데이트
        const pendingCountElement = document.getElementById('pending-count');
        if (pendingCountElement) {
            pendingCountElement.textContent = pendingPacks.length;
        }
        
        const packsContainer = document.getElementById('pending-packs');
        if (!packsContainer) return;
        
        if (pendingPacks.length === 0) {
            packsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #6c757d;"><p>대기 중인 팩이 없습니다.</p></div>';
            return;
        }
        
        // 팩 목록 렌더링 (안전한 방식)
        const packElements = pendingPacks.map(pack => {
            const packDiv = document.createElement('div');
            packDiv.className = 'pack-item';
            packDiv.onclick = () => openPackModal(pack.id);
            
            // 텍스트 내용 안전하게 설정
            const titleSpan = document.createElement('span');
            titleSpan.className = 'pack-title';
            titleSpan.textContent = pack.title || '제목 없음';
            
            const creatorSpan = document.createElement('span');
            creatorSpan.className = 'pack-creator';
            creatorSpan.textContent = pack.creator || '제작자 미상';
            
            const dateSpan = document.createElement('span');
            dateSpan.className = 'pack-date';
            dateSpan.textContent = formatKoreanDate(pack.createdAt);
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'pack-info';
            infoDiv.appendChild(titleSpan);
            infoDiv.appendChild(creatorSpan);
            infoDiv.appendChild(dateSpan);
            
            if (pack.thumbnail) {
                const thumbnailImg = document.createElement('img');
                thumbnailImg.src = pack.thumbnail;
                thumbnailImg.alt = '썸네일';
                thumbnailImg.className = 'pack-thumbnail';
                packDiv.appendChild(thumbnailImg);
            }
            
            packDiv.appendChild(infoDiv);
            return packDiv;
        });
        
        // 기존 내용 제거하고 새 요소들 추가
        packsContainer.innerHTML = '';
        packElements.forEach(element => packsContainer.appendChild(element));
        
    } catch (error) {
        showSecureError('팩 목록을 불러오는데 실패했습니다.');
    }
};

// 대기 중인 팩들 표시
function displayPendingPacks(packs) {
    const container = document.getElementById('pending-packs');
    
    if (!packs || packs.length === 0) {
        container.innerHTML = '<div class="no-packs">대기 중인 팩이 없습니다.</div>';
        return;
    }
    
    container.innerHTML = '';
    
    packs.forEach(pack => {
        const packDiv = document.createElement('div');
        packDiv.className = 'pending-pack-item';
        packDiv.innerHTML = \`
            <div class="pack-thumbnail">
                <img src="\${pack.thumbnail}" alt="\${pack.title}" />
            </div>
            <div class="pack-info">
                <h3>\${pack.title}</h3>
                <p>제작자: \${pack.creator}</p>
                <p>이모티콘 개수: \${pack.totalEmoticons}개</p>
                <p>업로드: \${new Date(pack.createdAt).toLocaleDateString('ko-KR')}</p>
            </div>
            <div class="pack-actions">
                <button class="btn btn-primary" onclick="viewPackDetails('\${pack.id}')">상세보기</button>
                <button class="btn btn-success" onclick="approvePack('\${pack.id}')">승인</button>
                <button class="btn btn-danger" onclick="rejectPack('\${pack.id}')">거부</button>
            </div>
        \`;
        container.appendChild(packDiv);
    });
}

// 팩 상세보기
window.viewPackDetails = async function(packId) {
    const token = adminToken || sessionStorage.getItem('admin_token');
    if (!token) {
        alert('로그인이 필요합니다.');
        return;
    }
    
    try {
        // 대기 중인 팩의 상세 정보를 가져오기 위해 보안 요청 사용
        const response = await fetch('/api/admin/pending-packs', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('API 호출 실패');
        
        const data = await response.json();
        const pack = data.packs.find(p => p.id === packId);
        
        if (!pack) {
            alert('팩을 찾을 수 없습니다.');
            return;
        }
        
        showPackModal(pack);
        
    } catch (error) {
        alert('팩 상세 정보를 불러오는데 실패했습니다.');
    }
};

// 🔒 SECURITY ENHANCEMENT: 팩 상세 모달 표시 (안전한 DOM 조작)
function showPackModal(pack) {
    const modal = document.getElementById('pack-modal');
    const modalBody = document.getElementById('pack-modal-body');
    const modalFooter = document.getElementById('pack-modal-footer');
    
    // 안전한 DOM 생성
    const modalDiv = document.createElement('div');
    modalDiv.className = 'pack-detail-modal';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'pack-header';
    
    const img = document.createElement('img');
    img.src = pack.thumbnail;
    img.alt = pack.title;
    img.className = 'pack-thumbnail-large';
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'pack-meta';
    
    const titleH3 = document.createElement('h3');
    titleH3.textContent = pack.title;
    
    const creatorP = document.createElement('p');
    creatorP.innerHTML = '<strong>제작자:</strong> ';
    creatorP.appendChild(document.createTextNode(pack.creator));
    
    const timeP = document.createElement('p');
    timeP.innerHTML = '<strong>업로드 시간:</strong> ';
    timeP.appendChild(document.createTextNode(new Date(pack.createdAt).toLocaleString('ko-KR')));
    
    const countP = document.createElement('p');
    countP.innerHTML = '<strong>이모티콘 개수:</strong> ';
    countP.appendChild(document.createTextNode(pack.totalEmoticons + '개'));
    
    metaDiv.appendChild(titleH3);
    metaDiv.appendChild(creatorP);
    
    if (pack.creatorLink) {
        const linkP = document.createElement('p');
        linkP.innerHTML = '<strong>제작자 링크:</strong> ';
        const linkA = document.createElement('a');
        linkA.href = pack.creatorLink;
        linkA.target = '_blank';
        linkA.textContent = pack.creatorLink;
        linkP.appendChild(linkA);
        metaDiv.appendChild(linkP);
    }
    
    metaDiv.appendChild(timeP);
    metaDiv.appendChild(countP);
    
    headerDiv.appendChild(img);
    headerDiv.appendChild(metaDiv);
    
    const emoticonsDiv = document.createElement('div');
    emoticonsDiv.className = 'pack-emoticons';
    const emoticonP = document.createElement('p');
    emoticonP.textContent = '이모티콘들이 실제로는 여기에 표시되어야 하지만, 승인 전이므로 미리보기는 제한됩니다.';
    emoticonsDiv.appendChild(emoticonP);
    
    modalDiv.appendChild(headerDiv);
    modalDiv.appendChild(emoticonsDiv);
    
    modalBody.innerHTML = '';
    modalBody.appendChild(modalDiv);
    
    // 안전한 버튼 생성
    const approveBtn = document.createElement('button');
    approveBtn.className = 'btn btn-success';
    approveBtn.textContent = '승인';
    approveBtn.onclick = () => { approvePack(pack.id); closePackModal(); };
    
    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn btn-danger';
    rejectBtn.textContent = '거부';
    rejectBtn.onclick = () => showRejectModal(pack.id);
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-secondary';
    closeBtn.textContent = '닫기';
    closeBtn.onclick = closePackModal;
    
    modalFooter.innerHTML = '';
    modalFooter.appendChild(approveBtn);
    modalFooter.appendChild(rejectBtn);
    modalFooter.appendChild(closeBtn);
    
    modal.style.display = 'block';
}

// 팩 모달 닫기
window.closePackModal = function() {
    document.getElementById('pack-modal').style.display = 'none';
};

// 🔒 SECURITY ENHANCEMENT: 팩 승인 (보안 강화)
window.approvePack = async function(packId) {
    if (!packId) {
        showSecureError('팩 ID가 없습니다.');
        return;
    }
    
    if (!confirm('이 팩을 승인하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await secureAdminRequest('/api/admin/approve-pack', {
            method: 'POST',
            body: JSON.stringify({ packId })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showSecureError('권한이 없습니다. 다시 로그인해주세요.');
                setTimeout(() => adminLogout(), 2000);
                return;
            }
            throw new Error('승인 처리에 실패했습니다.');
        }
        
        const result = await response.json();
        if (result.success) {
            alert('팩이 승인되었습니다.');
            closePackModal();
            await loadPendingPacks(); // 목록 새로고침
        } else {
            throw new Error(result.error || '승인에 실패했습니다.');
        }
        
    } catch (error) {
        showSecureError('승인 처리 중 오류가 발생했습니다.');
    }
};

// 팩 거부 모달 표시
window.showRejectModal = function(packId) {
    const reason = prompt('거부 사유를 입력해주세요:');
    if (reason !== null) {
        rejectPack(packId, reason);
    }
};

// 🔒 SECURITY ENHANCEMENT: 팩 거부 (보안 강화)
window.rejectPack = async function(packId) {
    if (!packId) {
        showSecureError('팩 ID가 없습니다.');
        return;
    }
    
    const reason = prompt('거부 사유를 입력하세요 (선택사항):');
    if (reason === null) return; // 취소한 경우
    
    if (!confirm('이 팩을 거부하시겠습니까? 모든 데이터가 삭제됩니다.')) {
        return;
    }
    
    try {
        const response = await secureAdminRequest('/api/admin/reject-pack', {
            method: 'POST',
            body: JSON.stringify({ packId, reason })
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showSecureError('권한이 없습니다. 다시 로그인해주세요.');
                setTimeout(() => adminLogout(), 2000);
                return;
            }
            throw new Error('거부 처리에 실패했습니다.');
        }
        
        const result = await response.json();
        if (result.success) {
            alert('팩이 거부되어 삭제되었습니다.');
            closePackModal();
            await loadPendingPacks(); // 목록 새로고침
        } else {
            throw new Error(result.error || '거부에 실패했습니다.');
        }
        
    } catch (error) {
        showSecureError('거부 처리 중 오류가 발생했습니다.');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // 캐시 버전 체크 먼저 실행
    checkCacheVersion();
    
    const path = window.location.pathname;
    
    if (path === '/') {
        loadPackList(1);
        setupPagination();
    } else if (path === '/upload') {
        setupUploadForm();
        loadUploadLimitStatus();
    } else if (path === '/admin') {
        // 관리자 페이지 초기화
        setupAdminPage();
    }
});

async function loadPackList(page = 1) {
    try {
        const response = await fetch('/api/packs?page=' + page);
        const data = await response.json();
        
        const container = document.getElementById('pack-list');
        if (data.packs && data.packs.length > 0) {
            container.innerHTML = '';
            data.packs.forEach(pack => {
                const packDiv = document.createElement('div');
                packDiv.className = 'pack-item';
                packDiv.style.cursor = 'pointer';
                packDiv.addEventListener('click', () => {
                    location.href = '/pack/' + pack.id;
                });
                
                const img = document.createElement('img');
                img.src = pack.thumbnail;
                img.alt = pack.title;
                img.className = 'pack-thumbnail';
                
                const info = document.createElement('div');
                info.className = 'pack-info';
                
                const title = document.createElement('div');
                title.className = 'pack-title';
                title.textContent = pack.title; // textContent는 HTML 태그를 자동으로 이스케이프함
                
                const creator = document.createElement('div');
                creator.className = 'pack-creator';
                creator.textContent = pack.creator; // textContent는 HTML 태그를 자동으로 이스케이프함
                
                info.appendChild(title);
                info.appendChild(creator);
                packDiv.appendChild(img);
                packDiv.appendChild(info);
                container.appendChild(packDiv);
            });
        } else {
            container.innerHTML = '<div class="loading">등록된 이모티콘 팩이 없습니다.</div>';
        }
        
        updatePagination(data.currentPage, data.hasNext);
        
            } catch (error) {
            document.getElementById('pack-list').innerHTML = '<div class="error">팩 리스트를 불러오는데 실패했습니다.</div>';
        }
}

function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPackList(currentPage);
        }
    });
    
    document.getElementById('next-page').addEventListener('click', () => {
        currentPage++;
        loadPackList(currentPage);
    });
}

function updatePagination(page, hasNext) {
    currentPage = page;
    document.getElementById('page-info').textContent = page + '페이지';
    document.getElementById('prev-page').disabled = page <= 1;
    document.getElementById('next-page').disabled = !hasNext;
}

function setupUploadForm() {
    const form = document.getElementById('upload-form');
    const thumbnailInput = document.getElementById('thumbnail-input');
    const emoticonsInput = document.getElementById('emoticons-input');
    
    // URL 유효성 검증 함수 - 간단하고 안전한 버전
    function isValidCreatorUrl(url) {
        if (!url || url.trim().length === 0) return true; // 빈 값은 허용 (선택사항)
        
        url = url.trim();
        
        // http:// 또는 https://로 시작하지 않으면 https:// 추가
        if (!url.toLowerCase().startsWith('http://') && !url.toLowerCase().startsWith('https://')) {
            url = 'https://' + url;
        }
        
        try {
            const urlObj = new URL(url);
            
            // 허용된 프로토콜만 허용
            if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
                return false;
            }
            
            // 기본적인 도메인 검증
            const hostname = urlObj.hostname;
            if (!hostname || hostname.length === 0) {
                return false;
            }
            
            // 도메인이 최소한의 형식을 갖추고 있는지 확인
            if (!hostname.includes('.') || hostname.startsWith('.') || hostname.endsWith('.')) {
                return false;
            }
            
            // 악의적인 프로토콜 차단
            const fullUrl = urlObj.href.toLowerCase();
            const dangerousPatterns = [
                'javascript:', 'data:', 'file:', 'ftp:', 'ftps:',
                'vbscript:', 'about:', 'chrome:', 'chrome-extension:'
            ];
            
            for (let i = 0; i < dangerousPatterns.length; i++) {
                if (fullUrl.startsWith(dangerousPatterns[i])) {
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            // URL 파싱에 실패한 경우, 간단한 도메인 패턴 체크
            return url.includes('.') && !url.includes(' ') && url.length > 3;
        }
    }

    // 실시간 입력 검증 설정
    const titleInput = document.getElementById('title');
    const creatorInput = document.getElementById('creator');
    const creatorLinkInput = document.getElementById('creator-link');
    
    // 실시간 검증 함수 - 시각적 피드백만 (에러는 표시하지 않음)
    function setupRealTimeValidation(input, fieldName, maxLength) {
        let timeoutId;
        input.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                const value = input.value.trim();
                if (value.length > maxLength) {
                    // 길이 초과 시에만 약간의 시각적 피드백 (에러 메시지 없음)
                    input.style.borderColor = '#ffaa00';
                    input.title = fieldName + ' 글자 수: ' + value.length + '/' + maxLength;
                } else {
                    input.style.borderColor = '';
                    input.title = '';
                }
            }, 300);
        });
    }
    
    // 각 입력 필드에 실시간 검증 적용 (완전히 자유로운 입력 허용)
    // if (titleInput) setupRealTimeValidation(titleInput, '제목', 50);
    // if (creatorInput) setupRealTimeValidation(creatorInput, '제작자 이름', 30);
    if (creatorLinkInput) {
        creatorLinkInput.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value && value.length > 0) {
                // 개선된 URL 검증 로직
                if (isValidCreatorUrl(value)) {
                    this.style.borderColor = '';
                    this.title = '';
                } else {
                    this.style.borderColor = '#ff4444';
                    this.title = '유효한 웹사이트 URL을 입력해주세요. (예: example.com, https://example.com)';
                }
            } else {
                this.style.borderColor = '';
                this.title = '';
            }
        });
    }
    
    let selectedThumbnail = null;
    let selectedEmoticons = [];
    
    // 허용된 이미지 형식
    const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/gif'];
    
    // 파일 형식 검증 함수
    function isValidImageType(file) {
        return allowedImageTypes.includes(file.type.toLowerCase());
    }
    
    // WebP 파일이 애니메이션인지 확인하는 함수
    function isAnimatedWebP(arrayBuffer) {
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // WebP 파일인지 확인 (RIFF....WEBP)
        if (uint8Array.length < 12) return false;
        
        const riffHeader = String.fromCharCode(...uint8Array.slice(0, 4));
        const webpHeader = String.fromCharCode(...uint8Array.slice(8, 12));
        
        if (riffHeader !== 'RIFF' || webpHeader !== 'WEBP') {
            return false;
        }
        
        // ANIM 청크를 찾아 애니메이션 여부 확인
        for (let i = 12; i < uint8Array.length - 4; i++) {
            const chunkType = String.fromCharCode(...uint8Array.slice(i, i + 4));
            if (chunkType === 'ANIM') {
                return true;
            }
        }
        
        return false;
    }
    
    // 애니메이션 파일인지 확인 (GIF 또는 애니메이션 WebP)
    function isAnimatedImage(file, arrayBuffer) {
        if (!file || !file.type) return false;
        
        const fileType = file.type.toLowerCase();
        
        // GIF는 항상 애니메이션으로 처리
        if (fileType === 'image/gif') {
            return true;
        }
        
        // WebP의 경우 애니메이션 여부 확인
        if (fileType === 'image/webp' && arrayBuffer) {
            return isAnimatedWebP(arrayBuffer);
        }
        
        return false;
    }
    
    // 애니메이션 파일 검증 함수 (GIF 및 애니메이션 WebP)
    function validateAnimatedFile(file, maxWidth = 200, maxHeight = 200, maxSize = 1 * 1024 * 1024) {
        return new Promise((resolve, reject) => {
            // 파일 크기 체크 (1MB)
            if (file.size > maxSize) {
                const fileTypeName = file.type === 'image/gif' ? 'GIF' : '애니메이션 WebP';
                reject(fileTypeName + ' 파일 크기가 ' + Math.round(maxSize / (1024 * 1024)) + 'MB를 초과합니다. (현재: ' + Math.round(file.size / (1024 * 1024) * 100) / 100 + 'MB)');
                return;
            }
            
            // 이미지 해상도 체크
            const img = new Image();
            img.onload = function() {
                if (img.width > maxWidth || img.height > maxHeight) {
                    const fileTypeName = file.type === 'image/gif' ? 'GIF' : '애니메이션 WebP';
                    reject(fileTypeName + ' 해상도가 ' + maxWidth + 'x' + maxHeight + '를 초과합니다. (현재: ' + img.width + 'x' + img.height + ')');
                } else {
                    resolve(true);
                }
                URL.revokeObjectURL(img.src);
            };
            img.onerror = function() {
                const fileTypeName = file.type === 'image/gif' ? 'GIF' : '애니메이션 WebP';
                reject(fileTypeName + ' 파일을 읽을 수 없습니다.');
                URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(file);
        });
    }

    // 이미지 리사이즈 함수
    function resizeImage(file, maxWidth, maxHeight) {
        return new Promise(async (resolve, reject) => {
            // 애니메이션 파일인지 확인하기 위해 arrayBuffer 읽기
            let fileArrayBuffer;
            try {
                fileArrayBuffer = await file.arrayBuffer();
            } catch (error) {
                reject('파일을 읽을 수 없습니다.');
                return;
            }
            
            // 애니메이션 파일의 경우 검증 후 원본 반환 (애니메이션 보존)
            if (isAnimatedImage(file, fileArrayBuffer)) {
                validateAnimatedFile(file, maxWidth, maxHeight)
                    .then(() => resolve(file))
                    .catch((error) => reject(error));
                return;
            }
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = function() {
                // 비율을 유지하면서 리사이즈
                let { width, height } = img;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 이미지 그리기
                ctx.drawImage(img, 0, 0, width, height);
                
                // GIF는 지원되지 않으므로 다른 형식으로 변환
                let outputType = file.type;
                if (file.type.toLowerCase() === 'image/gif') {
                    outputType = 'image/png'; // GIF를 PNG로 변환
                }
                
                // Blob으로 변환
                canvas.toBlob(resolve, outputType, 0.8);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    // 썸네일 파일 선택 이벤트
    thumbnailInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!isValidImageType(file)) {
                alert('지원되는 이미지 형식만 선택해주세요. (PNG, JPG, JPEG, WebP, GIF)');
                e.target.value = '';
                return;
            }
            
            try {
                // 썸네일 리사이즈 (200x200)
                const resizedFile = await resizeImage(file, 200, 200);
                
                // 애니메이션 파일의 경우 원본을 그대로 사용 (애니메이션 보존)
                const fileArrayBuffer = await file.arrayBuffer();
                if (isAnimatedImage(file, fileArrayBuffer)) {
                    selectedThumbnail = resizedFile; // 원본 애니메이션 파일 그대로 사용
                } else {
                    selectedThumbnail = new File([resizedFile], file.name, { 
                        type: file.type, 
                        lastModified: Date.now() 
                    });
                }
                updateThumbnailPreview();
            } catch (error) {
                alert(error || '이미지 처리 중 오류가 발생했습니다.');
                e.target.value = '';
            }
        }
    });
    
    // 이모티콘 파일 선택 이벤트
    emoticonsInput.addEventListener('change', async function(e) {
        const files = Array.from(e.target.files);
        
        // 허용된 이미지 파일만 필터링
        const validImageFiles = files.filter(file => isValidImageType(file));
        
        if (validImageFiles.length !== files.length) {
            const invalidFiles = files.filter(file => !isValidImageType(file));
            if (invalidFiles.length > 0) {
                alert('지원되지 않는 파일 형식이 포함되어 있습니다.\\n지원되는 형식: PNG, JPG, JPEG, WebP, GIF');
                e.target.value = '';
                return;
            }
        }
        
        if (validImageFiles.length === 0) {
            e.target.value = '';
            return;
        }
        
        try {
            // 로딩 메시지 표시
            const previewContainer = document.getElementById('emoticon-preview');
            previewContainer.innerHTML = '<div class="loading">이미지 처리 중...</div>';
            
            // 진행률 표시를 위한 임시 메시지
            const totalFiles = validImageFiles.length;
            let processedFiles = 0;
            
            // 각 이미지를 150x150으로 리사이즈
            const resizeResults = await Promise.allSettled(
                validImageFiles.map(async function(file, index) {
                    const resizedFile = await resizeImage(file, 150, 150);
                    processedFiles++;
                    
                    // 진행률 표시 (선택적)
                    
                    // 애니메이션 파일의 경우 원본을 그대로 사용 (애니메이션 보존)
                    const fileArrayBuffer = await file.arrayBuffer();
                    if (isAnimatedImage(file, fileArrayBuffer)) {
                        return resizedFile; // 원본 애니메이션 파일 그대로 사용
                    } else {
                        return new File([resizedFile], file.name, { 
                            type: file.type, 
                            lastModified: Date.now() 
                        });
                    }
                })
            );
            
            // 성공한 파일들만 필터링
            const resizedFiles = [];
            const failedFiles = [];
            
            resizeResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    resizedFiles.push(result.value);
                } else {
                    failedFiles.push({
                        name: validImageFiles[index].name,
                        error: result.reason
                    });
                }
            });
            
            // 실패한 파일들이 있으면 알림
            if (failedFiles.length > 0) {
                let errorMessage = '다음 파일들이 처리되지 않았습니다:\\n';
                failedFiles.forEach(failed => {
                    errorMessage += '- ' + failed.name + ': ' + failed.error + '\\n';
                });
                alert(errorMessage);
            }
            
            // 성공한 파일들만 추가
            if (resizedFiles.length > 0) {
                selectedEmoticons = selectedEmoticons.concat(resizedFiles);
                updateEmoticonPreview();
            } else {
                // 미리보기 컨테이너 초기화
                const previewContainer = document.getElementById('emoticon-preview');
                previewContainer.innerHTML = '';
            }
            
        } catch (error) {
            alert(error || '이미지 처리 중 오류가 발생했습니다.');
            // 미리보기 컨테이너 초기화
            const previewContainer = document.getElementById('emoticon-preview');
            previewContainer.innerHTML = '';
        }
        
        // input 값 리셋 (같은 파일을 다시 선택할 수 있도록)
        e.target.value = '';
    });
    
    // 텍스트 입력 검증 함수 (클라이언트 사이드) - 서버에서 안전하게 처리하므로 기본 검증만
    function validateTextInput(text, fieldName, maxLength = 100) {
        if (!text || text.trim().length === 0) {
            return { valid: false, message: fieldName + '은(는) 필수 항목입니다.' };
        }
        
        // 길이 검사만 수행 (서버에서 보안 처리함)
        if (text.trim().length > maxLength) {
            return { valid: false, message: fieldName + '은(는) ' + maxLength + '자를 초과할 수 없습니다.' };
        }
        
        if (text.trim().length < 2) {
            return { valid: false, message: fieldName + '은(는) 최소 2자 이상이어야 합니다.' };
        }
        
        return { valid: true, message: '' };
    }
    
    // 폼 제출 이벤트
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const creator = document.getElementById('creator').value.trim();
        const creatorLink = document.getElementById('creator-link').value.trim();
        
        // 기본 입력 검사만 (서버에서 모든 검증 처리)
        if (!title || title.trim().length === 0) {
            alert('제목은 필수 항목입니다.');
            return;
        }
        
        if (!creator || creator.trim().length === 0) {
            alert('제작자 이름은 필수 항목입니다.');
            return;
        }
        
        // URL 유효성 검사 (선택사항) - 개선된 검증
        if (creatorLink && creatorLink.length > 0) {
            if (!isValidCreatorUrl(creatorLink)) {
                alert('제작자 링크가 유효한 웹사이트 URL 형식이 아닙니다.\\n예시: example.com, https://example.com, https://github.com/username');
                return;
            }
        }
        
        if (!selectedThumbnail) {
            alert('썸네일 이미지를 선택해주세요.');
            return;
        }
        
        if (selectedEmoticons.length < 3) {
            alert('최소 3개의 이미지를 선택해주세요.');
            return;
        }
        
        // 최종 확인
        const confirmed = confirm('업로드하시겠습니까?\\n\\n제목: ' + title + '\\n제작자: ' + creator + '\\n이미지 개수: ' + selectedEmoticons.length + '개\\n\\n업로드 후 관리자 승인을 거쳐 공개됩니다.\\n업로드 후에는 수정할 수 없습니다.');
        if (!confirmed) {
            return;
        }
        
        // 로딩 상태 설정
        const submitBtn = form.querySelector('.submit-btn');
        const submitText = submitBtn.querySelector('.submit-text');
        const submitLoading = submitBtn.querySelector('.submit-loading');
        
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitLoading.style.display = 'block';
        submitLoading.textContent = '업로드 중...';
        
        try {
            // FormData 생성
            const formData = new FormData();
            formData.append('title', title);
            formData.append('creator', creator);
            if (creatorLink) formData.append('creatorLink', creatorLink);
            formData.append('thumbnail', selectedThumbnail);
            
            selectedEmoticons.forEach(file => {
                formData.append('emoticons', file);
            });
            
            // API 호출
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                const message = result.message || '이모티콘 팩이 성공적으로 업로드되었습니다!';
                
                // 업로드 성공 후 제한 상태 업데이트
                loadUploadLimitStatus();
                
                // 성공 메시지 표시
                showUploadResult(true, message, null, result.id);
            } else {
                alert('업로드 실패: ' + (result.error || '알 수 없는 오류'));
            }
        } catch (error) {
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            // 로딩 상태 해제
            submitBtn.disabled = false;
            submitText.style.display = 'block';
            submitLoading.style.display = 'none';
        }
    });
    
    // 썸네일 미리보기 업데이트
    function updateThumbnailPreview() {
        const previewContainer = document.getElementById('thumbnail-preview');
        
        if (!selectedThumbnail) {
            previewContainer.innerHTML = '';
            previewContainer.classList.remove('has-files');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = createHTMLElement('div', { class: 'preview-item' }, 
                createHTMLElement('img', { 
                    src: e.target.result, 
                    class: 'preview-image', 
                    alt: '썸네일 미리보기' 
                }) +
                createHTMLElement('div', { class: 'preview-filename' }, escapeHTML(selectedThumbnail.name)) +
                createHTMLElement('button', { 
                    type: 'button', 
                    class: 'preview-remove', 
                    'data-action': 'remove-thumbnail' 
                }, '×')
            );
            previewContainer.innerHTML = previewItem;
            previewContainer.classList.add('has-files');
        };
        reader.readAsDataURL(selectedThumbnail);
    }
    
    // 이모티콘 미리보기 업데이트
    function updateEmoticonPreview() {
        const previewContainer = document.getElementById('emoticon-preview');
        
        if (selectedEmoticons.length === 0) {
            previewContainer.innerHTML = '';
            previewContainer.classList.remove('has-files');
            return;
        }
        
        previewContainer.innerHTML = '';
        previewContainer.classList.add('has-files');
        
        selectedEmoticons.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = createHTMLElement('img', { 
                        src: e.target.result, 
                        class: 'preview-image', 
                        alt: '이모티콘 ' + (index + 1) 
                    }) +
                    createHTMLElement('div', { class: 'preview-filename' }, escapeHTML(file.name)) +
                    createHTMLElement('button', { 
                        type: 'button', 
                        class: 'preview-remove', 
                        'data-action': 'remove-emoticon', 
                        'data-index': index 
                    }, '×');
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 이벤트 위임을 사용하여 제거 버튼 처리
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action="remove-thumbnail"]')) {
            selectedThumbnail = null;
            thumbnailInput.value = '';
            updateThumbnailPreview();
        } else if (e.target.matches('[data-action="remove-emoticon"]')) {
            const index = parseInt(e.target.dataset.index);
            selectedEmoticons.splice(index, 1);
            updateEmoticonPreview();
        }
    });
    
    // 전역 함수들
    window.resetForm = function() {
        if (confirm('모든 입력 내용이 초기화됩니다. 계속하시겠습니까?')) {
            form.reset();
            selectedThumbnail = null;
            selectedEmoticons = [];
            updateThumbnailPreview();
            updateEmoticonPreview();
        }
    };
    
    // 업로드 결과 표시 함수
    window.showUploadResult = function(isSuccess, message, validationInfo, packId) {
        // 모달 생성
        const modal = document.createElement('div');
        modal.className = 'upload-result-modal';
        
        let modalHTML = '<div class="modal-backdrop" onclick="closeUploadModal()"></div>' +
            '<div class="modal-content">' +
                '<div class="modal-header ' + (isSuccess ? 'success' : 'error') + '">' +
                    '<span class="modal-icon"></span>' +
                    '<h3>업로드 ' + (isSuccess ? '완료' : '실패') + '</h3>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<p class="main-message">' + message + '</p>';
        
        if (isSuccess) {
            modalHTML += '<div class="approval-notice">' +
                '<p><strong>알림:</strong> 업로드된 팩은 관리자 승인 후 공개됩니다. 승인까지 시간이 걸릴 수 있습니다.</p>' +
                '</div>';
        }
        
        modalHTML += '</div>' +
            '<div class="modal-footer">';
        
        modalHTML += createHTMLElement('button', { 
            class: 'btn btn-primary', 
            onclick: 'closeUploadModal()' 
        }, '확인') +
        createHTMLElement('button', { 
            class: 'btn btn-secondary', 
            onclick: 'location.href=\\'/\\'' 
        }, '홈으로 이동');
        
        modalHTML += '</div></div>';
        
        modal.innerHTML = modalHTML;
        
        document.body.appendChild(modal);
        
        // 모달 닫기 함수를 전역으로 등록
        window.closeUploadModal = function() {
            document.body.removeChild(modal);
        };
        
        // ESC 키로 닫기 (성공시에는 막음)
        function handleEscape(e) {
            if (e.key === 'Escape' && !(isSuccess && packId)) {
                closeUploadModal();
                document.removeEventListener('keydown', handleEscape);
            }
        }
        document.addEventListener('keydown', handleEscape);
    };
    
    // 초기 미리보기 표시
    updateThumbnailPreview();
    updateEmoticonPreview();
}

// 업로드 제한 상태 로드 및 표시
async function loadUploadLimitStatus() {
    try {
        const response = await fetch('/api/upload-limit');
        const data = await response.json();
        
        if (response.ok) {
            const statusElement = document.getElementById('upload-limit-status');
            const limitTextElement = document.getElementById('limit-text');
            
                         if (statusElement && limitTextElement) {
                 if (data.allowed) {
                     limitTextElement.textContent = '오늘 ' + data.currentCount + '/' + data.limit + '개 업로드함 (남은 횟수: ' + data.remaining + '개)';
                     statusElement.className = 'upload-limit-notice info';
                 } else {
                     limitTextElement.textContent = '일일 업로드 제한에 도달했습니다. (' + data.currentCount + '/' + data.limit + '개) 내일 다시 시도해주세요.';
                     statusElement.className = 'upload-limit-notice warning';
                     
                     // 제한 도달 시 업로드 버튼 비활성화
                     const submitBtn = document.querySelector('.submit-btn');
                     if (submitBtn) {
                         submitBtn.disabled = true;
                         submitBtn.style.opacity = '0.6';
                         submitBtn.style.cursor = 'not-allowed';
                     }
                 }
                 statusElement.style.display = 'block';
             }
        }
    } catch (error) {
        // 업로드 제한 상태 로드 실패 시 무시
    }
}

// 관리자 페이지 초기화 (보안 강화)
function setupAdminPage() {
    // 관리자 페이지인지 확인
    if (window.location.pathname !== '/admin') {
        console.warn('[ADMIN] 관리자 페이지가 아닙니다. setupAdminPage 실행을 중단합니다.');
        return;
    }
    
    // 서버에서 이미 인증된 페이지인지 확인 (DOM 구조로 판단)
    const authCheckLoading = document.getElementById('auth-check-loading');
    const adminControls = document.querySelector('.admin-controls');
    
    if (!authCheckLoading && adminControls) {
        // 서버에서 이미 인증된 관리자 페이지 - 추가 초기화 불필요
        console.log('[ADMIN] 서버에서 인증된 관리자 페이지입니다.');
        return;
    }
    
    // 클라이언트 인증이 필요한 경우만 처리
    if (authCheckLoading) {
        // 보안 핑거프린트 초기화
        securityFingerprint = generateSecurityFingerprint();
        
        // 페이지 로드 즉시 인증 체크
        checkAdminAuthentication();
    }
}

// 관리자 인증 체크 함수
async function checkAdminAuthentication() {
    const loadingElement = document.getElementById('auth-check-loading');
    const unauthorizedElement = document.getElementById('unauthorized-access');
    const adminPanelElement = document.getElementById('admin-panel');
    
    // DOM 요소 존재 확인
    if (!loadingElement || !unauthorizedElement || !adminPanelElement) {
        console.warn('[ADMIN] 관리자 페이지 DOM 요소를 찾을 수 없습니다. 관리자 페이지가 아닌 것 같습니다.');
        return;
    }
    
    try {
        // 저장된 토큰이 있는지 확인 (sessionStorage 사용)
        const storedToken = sessionStorage.getItem('admin_token');
        
        if (!storedToken) {
            // 토큰이 없으면 인증 필요
            showUnauthorizedAccess();
            return;
        }
        
        // 토큰이 있으면 서버에서 검증
        const response = await fetch('/api/admin/verify', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + storedToken,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.valid) {
                // 인증 성공 - 관리자 패널 표시
                adminToken = storedToken;
                showAdminPanel();
                return;
            }
        }
        
        // 토큰이 유효하지 않음 - 저장된 토큰 제거
        sessionStorage.removeItem('admin_token');
        showUnauthorizedAccess();
        
    } catch (error) {
        // 인증 체크 실패 - 접근 거부
        sessionStorage.removeItem('admin_token');
        showUnauthorizedAccess();
    }
    
    function showUnauthorizedAccess() {
        if (loadingElement) loadingElement.style.display = 'none';
        if (unauthorizedElement) unauthorizedElement.style.display = 'block';
        if (adminPanelElement) adminPanelElement.style.display = 'none';
    }
    
    function showAdminPanel() {
        if (loadingElement) loadingElement.style.display = 'none';
        if (unauthorizedElement) unauthorizedElement.style.display = 'none';
        if (adminPanelElement) adminPanelElement.style.display = 'block';
        
        // 관리자 패널 초기화
        initializeAdminPanel();
    }
}

// 관리자 패널 초기화
function initializeAdminPanel() {
    const passwordInput = document.getElementById('admin-password');
    
    if (passwordInput) {
        // Enter 키로 로그인
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                adminLogin();
            }
        });
        
        // 포커스 설정
        passwordInput.focus();
    }
    
    // 토큰이 이미 있으면 로그인된 상태로 UI 업데이트
    if (adminToken) {
        document.getElementById('admin-auth').style.display = 'none';
        document.getElementById('admin-controls').style.display = 'block';
        document.getElementById('admin-content').style.display = 'block';
        loadPendingPacks();
    }
}



// 보안 모니터링 시작 (관리자 페이지 전용)
function startSecurityMonitoring() {
    // 관리자 페이지에서만 활성화
    if (window.location.pathname !== '/admin') {
        return;
    }
    
    // 10초마다 보안 상태 확인
    const monitorInterval = setInterval(() => {
        // 관리자 페이지를 벗어나면 모니터링 중단
        if (window.location.pathname !== '/admin') {
            clearInterval(monitorInterval);
            return;
        }
        
        if (adminToken) {
            // 토큰이 있지만 UI 상태가 일치하지 않는 경우 감지
            const authDiv = document.getElementById('admin-auth');
            const controlsDiv = document.getElementById('admin-controls');
            
            if (authDiv && controlsDiv) {
                const authVisible = authDiv.style.display !== 'none';
                const controlsVisible = controlsDiv.style.display !== 'none';
                
                if (authVisible && controlsVisible) {
                    adminLogout();
                }
            }
        }
    }, 10000);
}

// 기존 세션 확인 (쿠키나 로컬 스토리지 기반)
async function checkExistingSession() {
    // 향후 확장 가능한 기능 - 현재는 보안상 구현하지 않음
    // 세션 토큰이 있어도 매번 새로 로그인하도록 함
}

// 🔧 임시 도구: 비밀번호 해시 생성 (관리자용)
async function generatePasswordHash() {
    const passwordInput = document.getElementById('password-input');
    const hashResult = document.getElementById('hash-result');
    const hashValue = document.getElementById('hash-value');
    
    const password = passwordInput.value.trim();
    if (!password) {
        alert('비밀번호를 입력하세요.');
        return;
    }
    
    try {
        // Web Crypto API로 해시 생성
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const encoder = new TextEncoder();
        const data = encoder.encode(password + Array.from(salt).join(''));
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        
        const hash = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
        const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
        
        const adminPasswordHash = hash + ':' + saltHex;
        
        hashValue.textContent = 'ADMIN_PASSWORD_HASH=' + adminPasswordHash;
        hashResult.style.display = 'block';
        
        // 입력 필드 초기화
        passwordInput.value = '';
        
    } catch (error) {
        alert('해시 생성 중 오류가 발생했습니다: ' + error.message);
    }
}

// 해시 값을 클립보드에 복사
async function copyHashToClipboard() {
    const hashValue = document.getElementById('hash-value');
    const text = hashValue.textContent;
    
    try {
        await navigator.clipboard.writeText(text);
        const originalText = hashValue.textContent;
        hashValue.textContent = '✅ 복사되었습니다!';
        setTimeout(() => {
            hashValue.textContent = originalText;
        }, 2000);
    } catch (error) {
        // fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('클립보드에 복사되었습니다.');
    }
}

`; 