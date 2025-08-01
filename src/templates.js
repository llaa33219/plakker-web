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
    
    <div class="search-container">
        <div class="search-box">
            <input type="text" id="search-input" placeholder="제목이나 제작자 이름으로 검색..." class="search-input">
            <button id="search-btn" class="search-btn">검색</button>
            <button id="clear-search" class="clear-btn" style="display: none;">초기화</button>
        </div>
    </div>
    
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
    <h2 style="text-align: center;">관리 시스템 변경 안내</h2>
    
    <div class="admin-notice">
        <div class="notice-header">
            <span class="info-icon">ℹ️</span>
            <h3>새로운 관리 방식</h3>
        </div>
        <div class="notice-content">
            <p>이모티콘 팩 관리 시스템이 변경되었습니다.</p>
            <p>이제 <strong>Cloudflare KV 대시보드</strong>에서 직접 관리할 수 있습니다.</p>
        </div>
    </div>
    
    <div class="management-guide">
        <h3>🔧 관리 방법</h3>
        <ol>
            <li>
                <strong>Cloudflare 대시보드</strong>에 로그인
            </li>
            <li>
                <strong>Workers & Pages</strong> → 해당 사이트 → <strong>KV</strong>
            </li>
            <li>
                <strong>PLAKKER_PENDING_KV</strong> 네임스페이스에서 대기 중인 팩 확인
            </li>
            <li>
                <code>pending_</code>로 시작하는 키들이 대기 중인 팩들입니다
            </li>
            <li>
                해당 키를 클릭하여 팩 정보 확인 후:
                <ul>
                    <li><code>"adminStatus": "approved"</code>로 변경 → 자동 승인</li>
                    <li><code>"adminStatus": "rejected"</code>로 변경 → 자동 거부 및 삭제</li>
                </ul>
            </li>
        </ol>
    </div>
    
    <div class="features-section">
        <h3>✨ 새로운 기능</h3>
        <ul>
            <li><strong>자동 처리:</strong> 팩 목록 조회 시 자동으로 승인/거부 처리</li>
            <li><strong>대기 팩 조회:</strong> 대기 중인 팩도 직접 URL로 접근 가능</li>
            <li><strong>파일 자동 삭제:</strong> 거부된 팩의 파일들 자동 삭제</li>
            <li><strong>관리 편의성:</strong> 복잡한 관리자 인터페이스 없이 KV에서 직접 관리</li>
        </ul>
    </div>
    
    <div class="status-guide">
        <h3>📋 상태 설명</h3>
        <div class="status-table">
            <div class="status-row">
                <span class="status-badge pending">pending</span>
                <span>승인 대기 중 (기본값)</span>
            </div>
            <div class="status-row">
                <span class="status-badge approved">approved</span>
                <span>승인됨 → 자동으로 공개</span>
            </div>
            <div class="status-row">
                <span class="status-badge rejected">rejected</span>
                <span>거부됨 → 자동으로 삭제</span>
            </div>
        </div>
    </div>
    
    <div class="action-buttons">
        <button onclick="location.href='/'" class="btn btn-primary">홈으로 이동</button>
        <button onclick="location.href='/upload'" class="btn btn-secondary">업로드 페이지</button>
    </div>
</div>

<style>
.admin-notice {
    background: #e8f4f8;
    border: 1px solid #4a90e2;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}

.notice-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}

.notice-header .info-icon {
    font-size: 24px;
}

.management-guide, .features-section, .status-guide {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}

.management-guide h3, .features-section h3, .status-guide h3 {
    margin-top: 0;
    color: #333;
}

.management-guide ol {
    padding-left: 20px;
}

.management-guide li {
    margin: 10px 0;
    line-height: 1.6;
}

.management-guide code {
    background: #e8e8e8;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
}

.features-section ul {
    padding-left: 20px;
}

.features-section li {
    margin: 10px 0;
    line-height: 1.6;
}

.status-table {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.status-row {
    display: flex;
    align-items: center;
    gap: 15px;
}

.status-badge {
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 14px;
    font-weight: bold;
    min-width: 80px;
    text-align: center;
}

.status-badge.pending {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
}

.status-badge.approved {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.status-badge.rejected {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.action-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 30px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
}

.btn.btn-primary {
    background: #007bff;
    color: white;
}

.btn.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn:hover {
    opacity: 0.9;
}
</style>`,

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
                    <p class="description">이모티콘 팩 목록을 페이지네이션으로 조회합니다. 제목이나 제작자 이름으로 검색할 수 있습니다.</p>
                    
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
                        <tr>
                            <td><code>search</code></td>
                            <td>string</td>
                            <td>No</td>
                            <td>검색어 (제목이나 제작자 이름으로 검색, 대소문자 구분 안함)</td>
                        </tr>
                    </table>
                    
                    <h4>사용 예시</h4>
                    <ul>
                        <li><code>GET /api/packs</code> - 전체 팩 목록 조회 (1페이지)</li>
                        <li><code>GET /api/packs?page=2</code> - 2페이지 조회</li>
                        <li><code>GET /api/packs?search=고양이</code> - "고양이" 검색</li>
                        <li><code>GET /api/packs?search=고양이&page=2</code> - "고양이" 검색 결과의 2페이지</li>
                    </ul>

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
  "totalPages": 3,
  "totalPacks": 25,
  "hasNext": true
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
            <h3>제한사항 및 특징</h3>
            <ul>
                <li>개별 파일 크기: 최대 25MB (Cloudflare Workers 제한)</li>
                <li>요청 CPU 시간: 최대 50ms (무료 플랜 기준)</li>
                <li>KV 읽기/쓰기: 일일 한도 적용</li>
                <li>이모티콘 최소 개수: 3개</li>
                <li>지원 이미지 형식: PNG, JPEG, GIF, WebP</li>
                <li>이미지 자동 리사이즈: 이모티콘 150x150, 썸네일 200x200</li>
                <li><strong>검색 기능:</strong> 부분 문자열 매칭, 대소문자 구분 안함, 제목과 제작자 이름에서 동시 검색</li>
                <li><strong>검색 성능:</strong> 모든 팩을 메모리에 로드 후 필터링 (소규모 데이터셋에 최적화)</li>
            </ul>
        </div>
    </div>
</div>`
};