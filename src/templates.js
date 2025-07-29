// HTML 템플릿들
import { escapeHtml, convertToSafeUnicode } from './utils.js';

export const HTML_TEMPLATES = {
  base: (title, content) => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(convertToSafeUnicode(title || ''))} - Plakker</title>
    <link rel="icon" type="image/png" href="https://i.imgur.com/2MkyDCh.png">
    <link rel="stylesheet" href="/static/style.css?v=2025012901">
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
    <script src="/static/script.js?v=2025012901"></script>
</body>
</html>`,

  home: () => `
<div class="container">
    <h2 style="text-align: center;">이모티콘 목록</h2>
    
    <!-- 검색창 추가 -->
    <div class="search-container">
        <div class="search-box">
            <input type="text" id="search-input" placeholder="이모티콘 제목으로 검색..." maxlength="50">
            <button type="button" id="search-btn" class="search-button">
                <span class="search-icon">🔍</span>
            </button>
            <button type="button" id="clear-search-btn" class="clear-button" style="display: none;">
                <span class="clear-icon">✕</span>
            </button>
        </div>
        <div id="search-info" class="search-info" style="display: none;"></div>
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
        <strong>검열 안내:</strong> 검열로 인해 업로드에 시간이 걸릴 수 있습니다.
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
                <div class="file-info">이모티콘을 대표할 썸네일 이미지를 선택하세요 (PNG, JPG, JPEG, WebP, GIF)</div>
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
                <div class="file-info">최소 3개의 이미지를 선택하세요 (PNG, JPG, JPEG, WebP, GIF). 자동으로 150x150으로 리사이즈되며, 모든 이미지는 검증을 통과해야 업로드됩니다.</div>
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
                    <span class="path">/api/search</span>
                </div>
                <div class="endpoint-content">
                    <p class="description">이모티콘 팩을 제목으로 검색합니다.</p>
                    
                    <h4>Query Parameters</h4>
                    <table class="param-table">
                        <tr>
                            <th>Parameter</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                        </tr>
                        <tr>
                            <td><code>q</code></td>
                            <td>string</td>
                            <td>Yes</td>
                            <td>검색어 (최소 2자, 이모티콘 팩 제목에서 검색)</td>
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
      "title": "귀여운 고양이",
      "creator": "예시 제작자 1",
      "thumbnail": "https://plakker.bloupla.net/r2/thumbnails/pack_1704067200000_abc123_thumbnail",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "currentPage": 1,
  "hasNext": false,
  "total": 1,
  "query": "고양이"
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

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method post">POST</span>
                    <span class="path">/api/upload</span>
                </div>
                <div class="endpoint-content">
                    <p class="description">새로운 이모티콘 팩을 업로드합니다.</p>
                    
                    <h4>Request Body (multipart/form-data)</h4>
                    <table class="param-table">
                        <tr>
                            <th>Field</th>
                            <th>Type</th>
                            <th>Required</th>
                            <th>Description</th>
                        </tr>
                        <tr>
                            <td><code>title</code></td>
                            <td>string</td>
                            <td>Yes</td>
                            <td>이모티콘 팩 제목</td>
                        </tr>
                        <tr>
                            <td><code>creator</code></td>
                            <td>string</td>
                            <td>Yes</td>
                            <td>제작자 이름</td>
                        </tr>
                        <tr>
                            <td><code>creatorLink</code></td>
                            <td>string</td>
                            <td>No</td>
                            <td>제작자 웹사이트/SNS 링크</td>
                        </tr>
                        <tr>
                            <td><code>thumbnail</code></td>
                            <td>file</td>
                            <td>Yes</td>
                            <td>썸네일 이미지 파일</td>
                        </tr>
                        <tr>
                            <td><code>emoticons</code></td>
                            <td>file[]</td>
                            <td>Yes</td>
                            <td>이모티콘 이미지 파일들 (최소 3개)</td>
                        </tr>
                    </table>
                    
                    <h4>Response Example</h4>
                    <pre class="code-block">{
  "success": true,
  "id": "pack_1704067200000_abc123"
}</pre>
                </div>
            </div>


        </div>

        <div class="api-section">
            <h3>Error Codes</h3>
            <table class="param-table">
                <tr>
                    <th>Status Code</th>
                    <th>Description</th>
                </tr>
                <tr>
                    <td><code>200</code></td>
                    <td>성공</td>
                </tr>
                <tr>
                    <td><code>400</code></td>
                    <td>잘못된 요청 (필수 파라미터 누락 등)</td>
                </tr>
                <tr>
                    <td><code>404</code></td>
                    <td>리소스를 찾을 수 없음</td>
                </tr>
                <tr>
                    <td><code>500</code></td>
                    <td>서버 내부 오류</td>
                </tr>

            </table>
        </div>

        <div class="api-section">
            <h3>사용 예시</h3>
            
            <h4>JavaScript (Fetch API)</h4>
            <pre class="code-block">// 팩 목록 조회
const response = await fetch('/api/packs?page=1');
const data = await response.json();
console.log(data.packs);

// 검색 기능
const searchResponse = await fetch('/api/search?q=' + encodeURIComponent('고양이') + '&page=1');
const searchData = await searchResponse.json();
console.log('검색 결과:', searchData.packs);
console.log('검색어:', searchData.query);
console.log('총 결과 수:', searchData.total);

// 특정 팩 조회
const packResponse = await fetch('/api/pack/pack_1704067200000_abc123');
const pack = await packResponse.json();
console.log(pack.emoticons);

// 팩 업로드
const formData = new FormData();
formData.append('title', '예시 팩 2');
formData.append('creator', '예시 제작자 2');
formData.append('thumbnail', thumbnailFile);
formData.append('emoticons', emoticonFile1);
formData.append('emoticons', emoticonFile2);
formData.append('emoticons', emoticonFile3);

const uploadResponse = await fetch('/api/upload', {
    method: 'POST',
    body: formData
});
const result = await uploadResponse.json();</pre>

            <h4>Chrome Extension (Manifest V3)</h4>
            <pre class="code-block">// manifest.json에 권한 추가
{
  "permissions": ["activeTab"],
  "host_permissions": ["https://plakker.bloupla.net/*"]
}

// content script 또는 popup에서 사용
async function loadEmoticonPacks() {
  try {
    const response = await fetch('https://plakker.bloupla.net/api/packs?page=1');
    const data = await response.json();
    
    data.packs.forEach(pack => {
      console.log('팩:', pack.title, '제작자:', pack.creator);
    });
    
    return data.packs;
  } catch (error) {
    console.error('API 호출 실패:', error);
  }
}

// 특정 팩의 이모티콘들 가져오기
async function getEmoticons(packId) {
  const response = await fetch(\`https://plakker.bloupla.net/api/pack/\${packId}\`);
  const pack = await response.json();
  return pack.emoticons; // 이모티콘 URL 배열
}

// 이미지를 직접 DOM에 표시
function displayEmoticon(imageUrl, containerId) {
  const img = document.createElement('img');
  img.src = imageUrl; // CORS 설정으로 직접 사용 가능
  img.style.width = '150px';
  img.style.height = '150px';
  document.getElementById(containerId).appendChild(img);
}

// 이미지를 Blob으로 다운로드 (Canvas 처리 등에 사용)
async function downloadEmoticonAsBlob(imageUrl) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return blob; // 이 blob을 canvas에 그리거나 파일로 저장 가능
}</pre>

            <h4>cURL</h4>
            <pre class="code-block"># 팩 목록 조회
curl "https://plakker.bloupla.net/api/packs?page=1"

# 검색 기능
curl "https://plakker.bloupla.net/api/search?q=%EA%B3%A0%EC%96%91%EC%9D%B4&page=1"

# 특정 팩 조회
curl "https://plakker.bloupla.net/api/pack/pack_1704067200000_abc123"

# 팩 업로드
curl -X POST "https://plakker.bloupla.net/api/upload" \\
  -F "title=예시 팩 3" \\
  -F "creator=예시 제작자 3" \\
  -F "thumbnail=@thumbnail.png" \\
  -F "emoticons=@emoticon1.png" \\
  -F "emoticons=@emoticon2.png" \\
  -F "emoticons=@emoticon3.png"</pre>
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

        <div class="api-section">
            <h3>이미지 검증 기능 (필수)</h3>
            <p><strong>모든 업로드 이미지는 Hugging Face Llama 4 AI를 통한 검증을 반드시 통과해야 합니다.</strong> 검증에 실패하거나 오류가 발생하면 업로드가 차단됩니다.</p>
            
            <h4>검증 기준</h4>
            <ul>
                <li><strong>승인:</strong> 일반적인 모든 이미지 (캐릭터, 만화, 사진, 밈, 텍스트 등)</li>
                <li><strong>거부:</strong> 정치적인 내용 (정치인, 정치 관련 상징, 정치적 메시지)</li>
                <li><strong>거부:</strong> 선정적인 내용 (성적 표현, 노출, 성인 콘텐츠)</li>
                <li><strong>거부:</strong> 잔인한 내용 (폭력, 피, 상해, 죽음 관련)</li>
                <li><strong>거부:</strong> 혐오 내용 (혐오 표현, 차별적 내용)</li>
                <li><strong>거부:</strong> 불법적인 내용 (마약, 불법 활동)</li>
            </ul>
            
            <h4>환경 설정 (필수)</h4>
            <p><strong>서비스 운영을 위해 다음 설정들이 필수입니다:</strong></p>
            
            <h5>1. Hugging Face 토큰 설정</h5>
            <pre class="code-block"># Hugging Face에서 토큰 생성
1. https://huggingface.co/settings/tokens 접속
2. "New token" 클릭
3. "Read" 권한으로 토큰 생성
4. 토큰 복사

# Cloudflare 대시보드 설정
환경변수 이름: HF_TOKEN
값: your-hugging-face-token</pre>

            <h5>2. 보안 설정 (프로덕션 환경)</h5>
            <pre class="code-block"># 환경변수로 민감한 정보 관리 (권장)
wrangler secret put HF_TOKEN</pre>
            
            <div class="api-info">
                <p><strong>중요:</strong> Hugging Face Llama 4 API를 사용하여 업로드된 이미지의 부적절한 콘텐츠를 검증합니다. 토큰이 올바르지 않으면 업로드가 차단됩니다.</p>
            </div>
        </div>

        <div class="api-section">
            <h3>크롬 확장 프로그램 사용 시 주의사항</h3>
            <ul>
                <li><strong>Manifest V3:</strong> <code>host_permissions</code>에 도메인 권한 추가 필요</li>
                <li><strong>API CORS:</strong> 모든 출처에서 API 접근 가능하도록 설정되어 있음</li>
                <li><strong>이미지 CORS:</strong> 모든 이미지 리소스에 CORS 헤더가 설정되어 크로스 오리진 접근 가능</li>
                <li><strong>Content Security Policy:</strong> fetch() API 사용 권장</li>
                <li><strong>파일 업로드:</strong> 확장 프로그램에서 FormData 사용 가능</li>
                <li><strong>이미지 표시:</strong> 반환된 URL을 직접 img 태그 src나 canvas에 사용 가능</li>
                <li><strong>이미지 다운로드:</strong> fetch()로 이미지를 Blob으로 다운로드 가능</li>
            </ul>
        </div>
    </div>
</div>`
}; 