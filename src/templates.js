// HTML 템플릿들
import { escapeHtml, convertToSafeUnicode } from './utils.js';

// 캐시 버전 생성
function generateCacheVersion() {
    // 고정 버전 사용 (변경 시 수동으로 업데이트)
    return '20250130_urlfix_v3';
}

export const HTML_TEMPLATES = {
    base: (title, content) => {
        const cacheVersion = generateCacheVersion();
        return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(convertToSafeUnicode(title || ''))} - Plakker</title>
    <link rel="icon" type="image/png" href="https://i.imgur.com/2MkyDCh.png">
    <link rel="stylesheet" href="/static/style.css?v=${cacheVersion}">
</head>
<body>
    <header class="header">
        <div class="header-content">
            <img src="https://i.imgur.com/2MkyDCh.png" alt="Logo" style="width: 80px; height: auto; cursor: pointer;" onclick="location.href='https://bloupla.net/';">
            <h1 style="font-size: 1.8em;">Plakker</h1>
        </div>
        <nav>
            <a href="/">홈</a>
            <a href="/upload">업로드</a>
            <a href="/api-docs" class="hidden-nav">API 문서</a>
            <a href="/test-gateway" class="hidden-nav">AI 테스트</a>
        </nav>
    </header>
    <main class="main">
        ${content}
    </main>
    <script src="/static/script.js?v=${cacheVersion}"></script>
</body>
</html>`;
    },

    home: () => `
<div class="container">
    <h2 style="text-align: center;">이모티콘 목록</h2>
    <div id="pack-list" class="pack-grid">
        <div class="loading">로딩 중...</div>
    </div>
    <div class="pagination">
        <button id="prev-page" disabled>이전</button>
        <span id="page-info">1페이지</span>
        <button id="next-page">다음</button>
    </div>
</div>`,

    upload: () => `
<div class="container">
    <h2 style="text-align: center;">이모티콘 업로드</h2>
    
    <div class="upload-warning">
        <span class="warning-icon"></span>
        <strong>주의:</strong> 업로드 후에는 수정이 불가능합니다. 신중하게 검토 후 업로드해주세요.
    </div>
    
    <div class="ai-validation-notice">
        <span class="info-icon"></span>
        <strong>승인 안내:</strong> 업로드 후 관리자 승인을 거쳐 공개됩니다.
    </div>
    
    <div id="upload-limit-status" class="upload-limit-notice" style="display: none;">
        <span class="info-icon"></span>
        <strong>업로드 제한:</strong> <span id="limit-text"></span>
    </div>
    
    <form id="upload-form" class="upload-form">
        <div class="form-group">
            <label for="title">제목</label>
            <input type="text" id="title" name="title" required placeholder="이모티콘의 제목을 입력하세요">
        </div>
        
        <div class="form-group">
            <label for="creator">제작자</label>
            <input type="text" id="creator" name="creator" required placeholder="제작자 닉네임을 입력하세요">
        </div>
        
        <div class="form-group">
            <label for="creator-link">제작자 링크 (선택)</label>
            <input type="url" id="creator-link" name="creatorLink" placeholder="https://example.com">
        </div>
        
        <div class="form-group">
            <label>썸네일 이미지</label>
            <input type="file" id="thumbnail-input" accept=".png,.jpg,.jpeg,.webp,.gif" style="display: none;">
            <div class="file-upload-area">
                <button type="button" class="add-file-btn" onclick="document.getElementById('thumbnail-input').click()">
                    <span class="plus-icon">+</span>
                    썸네일 선택
                </button>
                <div class="file-info">이모티콘을 대표할 썸네일 이미지를 선택하세요 (PNG, JPG, JPEG, WebP, GIF). GIF는 1MB 이하만 업로드 가능합니다.</div>
            </div>
            <div id="thumbnail-preview" class="file-preview"></div>
        </div>
        
        <div class="form-group">
            <label>이모티콘(최소 3개)</label>
            <input type="file" id="emoticons-input" accept=".png,.jpg,.jpeg,.webp,.gif" multiple style="display: none;">
            <div class="file-upload-area">
                <button type="button" class="add-file-btn" onclick="document.getElementById('emoticons-input').click()">
                    <span class="plus-icon">+</span>
                    이미지 추가
                </button>
                <div class="file-info">최소 3개의 이미지를 선택하세요 (PNG, JPG, JPEG, WebP, GIF). GIF는 1MB 이하만 업로드 가능합니다.</div>
            </div>
            <div id="emoticon-preview" class="file-preview"></div>
        </div>
        
        <div class="form-actions">
            <button type="button" class="reset-btn" onclick="resetForm()">초기화</button>
            <button type="submit" class="submit-btn">
                <span class="submit-text">업로드</span>
                <span class="submit-loading" style="display: none;">업로드 중...</span>
            </button>
        </div>
    </form>
</div>`,

    detail: (pack) => `
<div class="container">
    <div class="pack-detail">
        <h2>${escapeHtml(convertToSafeUnicode(pack.title || ''))}</h2>
        <div class="pack-info">
            <p class="creator">제작자: ${pack.creatorLink ? 
                `<a href="${escapeHtml(pack.creatorLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(convertToSafeUnicode(pack.creator || ''))}</a>` : 
                escapeHtml(convertToSafeUnicode(pack.creator || ''))
            }</p>
            <p class="upload-date">업로드: ${new Date(pack.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>
        <div class="emoticons-grid">
            ${pack.emoticons.map((emoticon, index) => `
                <div class="emoticon-item">
                    <img src="${escapeHtml(emoticon)}" alt="${escapeHtml(convertToSafeUnicode(pack.title || ''))} 이모티콘 ${index + 1}" loading="lazy">
                </div>
            `).join('')}
        </div>

    </div>
</div>`,

    about: () => `
        <div class="container">
            <div class="about-content">
                <h1>Plakker 이모티콘 팩 저장소</h1>
                
                <div class="section">
                    <h2>소개</h2>
                    <p>Plakker는 다양한 이모티콘 팩을 업로드하고 공유할 수 있는 플랫폼입니다.</p>
                    <p>사용자가 직접 제작한 이모티콘이나 허용된 콘텐츠를 업로드하여 모두와 공유하세요.</p>
                </div>
                
                <div class="section">
                    <h2>사용 방법</h2>
                    <ol>
                        <li><a href="/upload">업로드 페이지</a>에서 팩 정보를 입력합니다</li>
                        <li>썸네일 이미지와 이모티콘 이미지들을 선택합니다</li>
                        <li>업로드 후 관리자 승인을 거쳐 공개됩니다</li>
                        <li>메인 페이지에서 승인된 팩들을 확인할 수 있습니다</li>
                    </ol>
                </div>
                
                <div class="section">
                    <h2>업로드 가이드라인</h2>
                    <ul>
                        <li>적절한 콘텐츠만 업로드해주세요</li>
                        <li>저작권이 있는 이미지는 권한을 확인 후 사용하세요</li>
                        <li>이미지 크기는 자동으로 최적화됩니다</li>
                        <li>팩당 최소 3개의 이모티콘이 필요합니다</li>
                    </ul>
                </div>
                
                <div class="back-link">
                    <a href="/">← 메인으로 돌아가기</a>
                </div>
            </div>
        </div>
    `,
    
    admin: () => `
        <div class="container">
            <div class="admin-header">
                <h1>관리자 패널</h1>
                <div class="admin-controls">
                    <button onclick="loadPendingPacks()">대기 목록 새로고침</button>
                    <button onclick="adminLogout()">로그아웃</button>
                </div>
            </div>
            
            <div class="admin-content">
                <div class="pending-stats" id="pending-stats">
                    <div class="stat-item">
                        <span class="stat-label">대기 중인 팩:</span>
                        <span class="stat-value" id="pending-count">0</span>
                    </div>
                </div>
                
                <div class="pending-packs" id="pending-packs">
                    <div class="loading">대기 중인 팩을 불러오는 중...</div>
                </div>
            </div>
            
            <div class="back-link">
                <a href="/">← 메인으로 돌아가기</a>
            </div>
        </div>
        
        <div class="pack-modal" id="pack-modal" style="display: none;">
            <div class="modal-backdrop" onclick="closePackModal()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>팩 상세 정보</h3>
                    <button class="modal-close" onclick="closePackModal()">×</button>
                </div>
                <div class="modal-body" id="pack-modal-body">
                    <!-- 팩 상세 정보가 여기에 로드됩니다 -->
                </div>
                <div class="modal-footer" id="pack-modal-footer">
                    <!-- 승인/거부 버튼이 여기에 표시됩니다 -->
                </div>
            </div>
        </div>
        
        <script>
            // 서버 인증된 관리자 페이지 초기화
            document.addEventListener('DOMContentLoaded', function() {
                if (window.location.pathname === '/admin') {
                    initializeAuthenticatedAdminPage();
                }
            });
            
            function initializeAuthenticatedAdminPage() {
                console.log('[ADMIN] 서버 인증된 관리자 페이지 초기화 중...');
                
                // 저장된 토큰을 전역 변수에 설정
                const storedToken = sessionStorage.getItem('admin_token');
                if (storedToken) {
                    window.adminToken = storedToken;
                    console.log('[ADMIN] 토큰 설정 완료');
                } else {
                    console.warn('[ADMIN] sessionStorage에 토큰이 없습니다.');
                }
                
                // 잠시 후 대기 중인 팩 자동 로드 (DOM이 완전히 로드된 후)
                setTimeout(() => {
                    if (typeof loadPendingPacks === 'function') {
                        console.log('[ADMIN] 대기 중인 팩 로드 시작');
                        loadPendingPacks();
                    } else {
                        console.error('[ADMIN] loadPendingPacks 함수를 찾을 수 없습니다.');
                    }
                }, 100);
            }
        </script>
    `,

    apiDocs: () => `
<div class="container">
    <div class="api-docs">
        <h2>Plakker API 문서</h2>
        <p class="api-intro">Plakker의 REST API를 사용하여 이모티콘 팩 데이터에 프로그래밍 방식으로 접근할 수 있습니다.</p>
        
        <div class="api-section">
            <h3>기본 정보</h3>
            <div class="api-info">
                <p><strong>Base URL:</strong> <code>${typeof window !== 'undefined' ? window.location.origin : 'https://plakker.bloupla.net'}</code></p>
                <p><strong>Content-Type:</strong> <code>application/json</code> (GET 요청), <code>multipart/form-data</code> (POST 요청)</p>
                <p><strong>Rate Limit:</strong> Cloudflare Workers 기본 제한 적용</p>
                <p><strong>CORS:</strong> 모든 도메인에서 접근 가능 (크롬 확장 프로그램 포함)</p>
            </div>
        </div>

        <div class="api-section">
            <h3>엔드포인트</h3>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/packs</span>
                </div>
                <div class="endpoint-content">
                    <p class="description">이모티콘 팩 목록을 페이지네이션으로 조회합니다.</p>
                    
                    <h4>Query Parameters</h4>
                    <table class="param-table">
                        <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                        </tr>
                        <tr>
                            <td><code>page</code></td>
                            <td>integer</td>
                            <td>No</td>
                            <td>페이지 번호 (기본값: 1, 페이지당 20개)</td>
                        </tr>
                    </table>
                    
                    <h4>Response Example</h4>
                    <pre class="code-block">{
  "packs": [
    {
      "id": "pack_1704067200000_abc123",
      "title": "예시 팩 1",
      "creator": "예시 제작자 1",
      "thumbnail": "https://plakker.bloupla.net/r2/thumbnails/pack_1704067200000_abc123_thumbnail",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "currentPage": 1,
  "hasNext": true,
  "total": 25
}</pre>
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/pack/{pack_id}</span>
                </div>
                <div class="endpoint-content">
                    <p class="description">특정 이모티콘 팩의 상세 정보와 모든 이모티콘 URL을 조회합니다.</p>
                    
                    <h4>Path Parameters</h4>
                    <table class="param-table">
                        <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                        </tr>
                        <tr>
                            <td><code>pack_id</code></td>
                            <td>string</td>
                            <td>Yes</td>
                            <td>이모티콘 팩의 고유 ID</td>
                        </tr>
                    </table>
                    
                    <h4>Response Example</h4>
                    <pre class="code-block">{
  "id": "pack_1704067200000_abc123",
  "title": "예시 팩 1",
  "creator": "예시 제작자 1",
  "creatorLink": "https://example.com/creator1",
  "thumbnail": "https://plakker.bloupla.net/r2/thumbnails/pack_1704067200000_abc123_thumbnail",
  "emoticons": [
    "https://plakker.bloupla.net/r2/emoticons/pack_1704067200000_abc123_0",
    "https://plakker.bloupla.net/r2/emoticons/pack_1704067200000_abc123_1",
    "https://plakker.bloupla.net/r2/emoticons/pack_1704067200000_abc123_2"
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}</pre>
                </div>
            </div>

        </div>

        <div class="api-section">
            <h3>제한사항</h3>
            <ul>
                <li>개별 파일 크기: 최대 25MB (Cloudflare Workers 제한)</li>
                <li>요청 CPU 시간: 최대 50ms (무료 플랜 기준)</li>
                <li>KV 읽기/쓰기: 일일 한도 적용</li>
                <li>이모티콘 최소 개수: 3개</li>
                <li>지원 이미지 형식: PNG, JPEG, GIF, WebP</li>
                <li>이미지 자동 리사이즈: 이모티콘 150x150, 썸네일 200x200</li>
            </ul>
        </div>
    </div>
</div>`,

    packDetail: (pack) => `
<div class="container">
    <div class="pack-detail">
        <div class="pack-header">
            <img src="${pack.thumbnail}" alt="${escapeHtml(convertToSafeUnicode(pack.title))}" class="pack-thumbnail-large" />
            <div class="pack-meta">
                <h2>${escapeHtml(convertToSafeUnicode(pack.title))}</h2>
                <p><strong>제작자:</strong> ${escapeHtml(convertToSafeUnicode(pack.creator))}</p>
                ${pack.creatorLink ? `<p><strong>제작자 링크:</strong> <a href="${escapeHtml(pack.creatorLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(pack.creatorLink)}</a></p>` : ''}
                <p><strong>업로드 시간:</strong> ${new Date(pack.createdAt).toLocaleString('ko-KR')}</p>
                <p><strong>이모티콘 개수:</strong> ${pack.totalEmoticons || pack.emoticons?.length || 0}개</p>
            </div>
        </div>
        
        <div class="pack-emoticons">
            <h3>이모티콘 목록</h3>
            <div class="emoticon-grid">
                ${pack.emoticons ? pack.emoticons.map((url, index) => `
                    <div class="emoticon-item">
                        <img src="${url}" alt="이모티콘 ${index + 1}" class="emoticon" />
                        <div class="emoticon-actions">
                            <button onclick="copyToClipboard('${url}')" class="copy-btn">복사</button>
                            <button onclick="downloadEmoticon('${url}', '${escapeHtml(convertToSafeUnicode(pack.title))}_${index + 1}')" class="download-btn">다운로드</button>
                        </div>
                    </div>
                `).join('') : '<p>이모티콘을 불러올 수 없습니다.</p>'}
            </div>
        </div>
        
        <div class="pack-actions">
            <button onclick="downloadAllEmoticons()" class="btn btn-primary">전체 다운로드</button>
            <a href="/" class="btn btn-secondary">← 목록으로 돌아가기</a>
        </div>
    </div>
    
    <script>
        function copyToClipboard(url) {
            navigator.clipboard.writeText(url).then(() => {
                alert('URL이 클립보드에 복사되었습니다!');
            }).catch(() => {
                alert('복사에 실패했습니다.');
            });
        }
        
        function downloadEmoticon(url, filename) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        function downloadAllEmoticons() {
            const emoticons = ${JSON.stringify(pack.emoticons || [])};
            const packTitle = '${escapeHtml(convertToSafeUnicode(pack.title))}';
            
            emoticons.forEach((url, index) => {
                setTimeout(() => {
                    downloadEmoticon(url, packTitle + '_' + (index + 1));
                }, index * 100);
            });
        }
    </script>
</div>`
};