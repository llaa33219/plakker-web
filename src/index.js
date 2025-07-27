// HTML 템플릿들
const HTML_TEMPLATES = {
  base: (title, content) => `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Plakker</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <header class="header">
        <h1><a href="/">Plakker</a></h1>
        <nav>
            <a href="/">홈</a>
            <a href="/upload">업로드</a>
            <a href="/api-docs">API 문서</a>
        </nav>
    </header>
    <main class="main">
        ${content}
    </main>
    <script src="/static/script.js"></script>
</body>
</html>`,

  home: () => `
<div class="container">
    <h2>이모티콘 팩 목록</h2>
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
    <h2>이모티콘 팩 업로드</h2>
    
    <div class="upload-warning">
        <span class="warning-icon">⚠️</span>
        <strong>주의:</strong> 업로드 후에는 수정이 불가능합니다. 신중하게 검토 후 업로드해주세요.
    </div>
    
    <form id="upload-form" class="upload-form">
        <div class="form-group">
            <label for="title">제목 *</label>
            <input type="text" id="title" name="title" required placeholder="이모티콘 팩의 제목을 입력하세요">
        </div>
        
        <div class="form-group">
            <label for="creator">제작자 *</label>
            <input type="text" id="creator" name="creator" required placeholder="제작자 이름을 입력하세요">
        </div>
        
        <div class="form-group">
            <label for="creator-link">제작자 링크 (선택)</label>
            <input type="url" id="creator-link" name="creatorLink" placeholder="https://example.com">
        </div>
        
        <div class="form-group">
            <label>썸네일 이미지 *</label>
            <input type="file" id="thumbnail-input" accept="image/*" style="display: none;">
            <div class="file-upload-area">
                <button type="button" class="add-file-btn" onclick="document.getElementById('thumbnail-input').click()">
                    <span class="plus-icon">+</span>
                    썸네일 선택
                </button>
                <div class="file-info">팩을 대표할 썸네일 이미지를 선택하세요</div>
            </div>
            <div id="thumbnail-preview" class="file-preview"></div>
        </div>
        
        <div class="form-group">
            <label>이모티콘/스티커 이미지 * (최소 3개)</label>
            <input type="file" id="emoticons-input" accept="image/*" multiple style="display: none;">
            <div class="file-upload-area">
                <button type="button" class="add-file-btn" onclick="document.getElementById('emoticons-input').click()">
                    <span class="plus-icon">+</span>
                    이미지 추가
                </button>
                <div class="file-info">최소 3개의 이미지를 선택하세요. 자동으로 150x150으로 리사이즈되며, 모든 이미지는 AI 검증을 통과해야 업로드됩니다.</div>
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
        <h2>${pack.title}</h2>
        <div class="pack-info">
            <p class="creator">제작자: ${pack.creatorLink ? 
                `<a href="${pack.creatorLink}" target="_blank">${pack.creator}</a>` : 
                pack.creator
            }</p>
            <p class="upload-date">업로드: ${new Date(pack.createdAt).toLocaleDateString('ko-KR')}</p>
        </div>
        <div class="emoticons-grid">
            ${pack.emoticons.map((emoticon, index) => `
                <div class="emoticon-item">
                    <img src="${emoticon}" alt="${pack.title} 이모티콘 ${index + 1}" loading="lazy">
                </div>
            `).join('')}
        </div>
        <div class="pack-actions">
            <button onclick="downloadPack('${pack.id}')" class="download-btn">팩 다운로드</button>
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

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method get">GET</span>
                    <span class="path">/api/pack/{pack_id}/download</span>
                </div>
                <div class="endpoint-content">
                    <p class="description">이모티콘 팩을 ZIP 파일로 다운로드합니다. (추후 구현 예정)</p>
                    
                    <h4>Response</h4>
                    <p>현재는 501 상태 코드와 함께 구현 예정 메시지를 반환합니다.</p>
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
                <tr>
                    <td><code>501</code></td>
                    <td>구현되지 않은 기능</td>
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
            <p><strong>모든 업로드 이미지는 Google Gemini AI를 통한 검증을 반드시 통과해야 합니다.</strong> 검증에 실패하거나 오류가 발생하면 업로드가 차단됩니다.</p>
            
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
            <p><strong>서비스 운영을 위해 Gemini API 키 설정이 필수입니다:</strong></p>
            <pre class="code-block"># Cloudflare Workers 환경변수 설정 (권장)
wrangler secret put GEMINI_API_KEY

# 또는 wrangler.toml에서 설정 (보안상 권장하지 않음)
[vars]
GEMINI_API_KEY = "your-api-key-here"</pre>
            
            <div class="api-info">
                <p><strong>중요:</strong> API 키가 설정되지 않으면 모든 업로드가 차단됩니다. 검증 시스템 오류 시에도 업로드가 거부됩니다.</p>
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

// CSS 스타일
const CSS_STYLES = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    background-color: #f8f9fa;
    color: #333;
}

.header {
    background: white;
    padding: 1rem;
    border-bottom: 1px solid #e9ecef;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header h1 a {
    text-decoration: none;
    color: #007bff;
    font-size: 1.5rem;
}

.header nav a {
    text-decoration: none;
    color: #6c757d;
    margin-left: 1rem;
    transition: color 0.2s;
}

.header nav a:hover {
    color: #007bff;
}

.main {
    min-height: calc(100vh - 70px);
    padding: 2rem 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.pack-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin: 2rem 0;
}

.pack-item {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.pack-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.pack-thumbnail {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 0.5rem;
}

.pack-title {
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
}

.pack-creator {
    color: #6c757d;
    font-size: 0.9rem;
}

.upload-warning {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.warning-icon {
    font-size: 1.2rem;
}

.upload-form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    max-width: 700px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 2rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.75rem;
    font-weight: 600;
    color: #2d3748;
    font-size: 1.1rem;
}

.form-group input[type="text"],
.form-group input[type="url"] {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.file-upload-area {
    border: 2px dashed #cbd5e0;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    background: #f7fafc;
    transition: border-color 0.2s, background-color 0.2s;
}

.file-upload-area:hover {
    border-color: #007bff;
    background: #f0f8ff;
}

.add-file-btn {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 auto;
    transition: background-color 0.2s, transform 0.1s;
}

.add-file-btn:hover {
    background: #0056b3;
    transform: translateY(-1px);
}

.plus-icon {
    font-size: 1.2rem;
    font-weight: bold;
}

.form-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #e2e8f0;
}

.reset-btn {
    background: #6c757d;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s;
}

.reset-btn:hover {
    background: #5a6268;
}

.file-info {
    font-size: 0.875rem;
    color: #6c757d;
    margin-top: 0.25rem;
}

.file-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
    padding: 1.5rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background-color: #f8fafc;
    min-height: 120px;
}

.file-preview.has-files {
    border-color: #007bff;
    background-color: #f0f8ff;
}

.file-preview:empty::after {
    content: "선택된 파일이 없습니다";
    grid-column: 1 / -1;
    text-align: center;
    color: #a0aec0;
    font-style: italic;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80px;
}

.preview-item {
    position: relative;
    text-align: center;
    background: white;
    border-radius: 8px;
    padding: 0.5rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.preview-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.preview-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 6px;
    border: 2px solid #e2e8f0;
}

.preview-filename {
    font-size: 0.75rem;
    color: #4a5568;
    margin-top: 0.5rem;
    word-break: break-all;
    line-height: 1.2;
    font-weight: 500;
}

.preview-remove {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #e53e3e;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: background-color 0.2s, transform 0.1s;
}

.preview-remove:hover {
    background: #c53030;
    transform: scale(1.1);
}

.preview-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    color: #6c757d;
    font-size: 0.875rem;
}

.submit-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 6px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    position: relative;
    min-width: 120px;
}

.submit-btn:hover:not(:disabled) {
    background: #218838;
    transform: translateY(-1px);
}

.submit-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
}

.submit-loading {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

.pack-detail {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pack-info {
    margin: 1rem 0 2rem 0;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;
}

.emoticons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin: 2rem 0;
}

.emoticon-item img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #e9ecef;
}

.pack-actions {
    margin-top: 2rem;
    text-align: center;
}

.download-btn {
    background: #28a745;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
}

.download-btn:hover {
    background: #218838;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin: 2rem 0;
}

.pagination button {
    background: #007bff;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s;
}

.pagination button:hover:not(:disabled) {
    background: #0056b3;
}

.pagination button:disabled {
    background: #6c757d;
    cursor: not-allowed;
}

.loading {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
}

.error {
    background: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

.success {
    background: #d4edda;
    color: #155724;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
}

@media (max-width: 768px) {
    .container {
        padding: 0 0.5rem;
    }
    
    .pack-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
    }
    
    .emoticons-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    }
    
    .header {
        flex-direction: column;
        gap: 1rem;
    }
}

/* API 문서 스타일 */
.api-docs {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    max-width: none;
}

.api-intro {
    font-size: 1.1rem;
    color: #6c757d;
    margin-bottom: 2rem;
    line-height: 1.6;
}

.api-section {
    margin-bottom: 3rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e9ecef;
}

.api-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
}

.api-section h3 {
    color: #007bff;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.api-section h4 {
    color: #495057;
    font-size: 1.1rem;
    margin: 1.5rem 0 0.5rem 0;
}

.api-info {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    border-left: 4px solid #007bff;
}

.endpoint {
    margin-bottom: 2rem;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    overflow: hidden;
}

.endpoint-header {
    background: #f8f9fa;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    border-bottom: 1px solid #e9ecef;
}

.method {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: bold;
    font-size: 0.875rem;
    text-transform: uppercase;
}

.method.get {
    background: #28a745;
    color: white;
}

.method.post {
    background: #007bff;
    color: white;
}

.path {
    font-family: 'Courier New', monospace;
    font-size: 1.1rem;
    font-weight: bold;
    color: #495057;
}

.endpoint-content {
    padding: 1.5rem;
}

.description {
    color: #6c757d;
    margin-bottom: 1rem;
    line-height: 1.6;
}

.param-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    background: white;
}

.param-table th,
.param-table td {
    padding: 0.75rem;
    text-align: left;
    border: 1px solid #e9ecef;
}

.param-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #495057;
}

.param-table code {
    background: #f8f9fa;
    padding: 0.2rem 0.4rem;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    color: #e83e8c;
    border: 1px solid #e9ecef;
}

.code-block {
    background: #2d3748;
    color: #e2e8f0;
    padding: 1.5rem;
    border-radius: 4px;
    overflow-x: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.875rem;
    line-height: 1.6;
    margin: 1rem 0;
    border: 1px solid #4a5568;
}

.api-section ul {
    margin-left: 1.5rem;
}

.api-section li {
    margin-bottom: 0.5rem;
    line-height: 1.6;
}

@media (max-width: 768px) {
    .api-docs {
        padding: 1rem;
    }
    
    .endpoint-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .param-table {
        font-size: 0.875rem;
    }
    
    .param-table th,
    .param-table td {
        padding: 0.5rem;
    }
    
    .code-block {
        font-size: 0.75rem;
        padding: 1rem;
    }
}`;

// JavaScript 클라이언트 코드 (템플릿 리터럴을 일반 문자열로 변경)
const JS_CLIENT = `
let currentPage = 1;

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    
    if (path === '/') {
        loadPackList(1);
        setupPagination();
    } else if (path === '/upload') {
        setupUploadForm();
    }
});

async function loadPackList(page = 1) {
    try {
        const response = await fetch('/api/packs?page=' + page);
        const data = await response.json();
        
        const container = document.getElementById('pack-list');
        if (data.packs && data.packs.length > 0) {
            container.innerHTML = data.packs.map(pack => 
                '<div class="pack-item" onclick="location.href=\\'/pack/' + pack.id + '\\'">\\n' +
                '    <img src="' + pack.thumbnail + '" alt="' + pack.title + '" class="pack-thumbnail">\\n' +
                '    <div class="pack-title">' + pack.title + '</div>\\n' +
                '    <div class="pack-creator">' + pack.creator + '</div>\\n' +
                '</div>'
            ).join('');
        } else {
            container.innerHTML = '<div class="loading">등록된 이모티콘 팩이 없습니다.</div>';
        }
        
        updatePagination(data.currentPage, data.hasNext);
        
    } catch (error) {
        console.error('팩 리스트 로드 실패:', error);
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
    
    let selectedThumbnail = null;
    let selectedEmoticons = [];
    
    // 이미지 리사이즈 함수
    function resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve) => {
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
                
                // Blob으로 변환
                canvas.toBlob(resolve, file.type, 0.8);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
    
    // 썸네일 파일 선택 이벤트
    thumbnailInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('이미지 파일만 선택해주세요.');
                return;
            }
            
            try {
                // 썸네일 리사이즈 (200x200)
                const resizedFile = await resizeImage(file, 200, 200);
                selectedThumbnail = new File([resizedFile], file.name, { 
                    type: file.type, 
                    lastModified: Date.now() 
                });
                updateThumbnailPreview();
            } catch (error) {
                console.error('이미지 리사이즈 오류:', error);
                alert('이미지 처리 중 오류가 발생했습니다.');
            }
        }
    });
    
    // 이모티콘 파일 선택 이벤트
    emoticonsInput.addEventListener('change', async function(e) {
        const files = Array.from(e.target.files);
        
        // 이미지 파일만 필터링
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length !== files.length) {
            alert('이미지 파일만 선택해주세요.');
        }
        
        if (imageFiles.length === 0) {
            e.target.value = '';
            return;
        }
        
        try {
            // 로딩 메시지 표시
            const previewContainer = document.getElementById('emoticon-preview');
            previewContainer.innerHTML = '<div class="loading">이미지 처리 중...</div>';
            
            // 진행률 표시를 위한 임시 메시지
            const totalFiles = imageFiles.length;
            let processedFiles = 0;
            
            // 각 이미지를 150x150으로 리사이즈
            const resizedFiles = await Promise.all(
                imageFiles.map(async function(file, index) {
                    const resizedFile = await resizeImage(file, 150, 150);
                    processedFiles++;
                    
                    // 진행률 표시 (선택적)
                    if (totalFiles > 3) {
                        console.log('이미지 처리 중... ' + processedFiles + '/' + totalFiles);
                    }
                    
                    return new File([resizedFile], file.name, { 
                        type: file.type, 
                        lastModified: Date.now() 
                    });
                })
            );
            
            // 기존 선택된 파일들에 추가
            selectedEmoticons = selectedEmoticons.concat(resizedFiles);
            updateEmoticonPreview();
            
        } catch (error) {
            console.error('이미지 리사이즈 오류:', error);
            alert('이미지 처리 중 오류가 발생했습니다.');
        }
        
        // input 값 리셋 (같은 파일을 다시 선택할 수 있도록)
        e.target.value = '';
    });
    
    // 폼 제출 이벤트
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const title = document.getElementById('title').value.trim();
        const creator = document.getElementById('creator').value.trim();
        const creatorLink = document.getElementById('creator-link').value.trim();
        
        // 유효성 검사
        if (!title || !creator) {
            alert('제목과 제작자는 필수 항목입니다.');
            return;
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
        const confirmed = confirm(\`업로드하시겠습니까?\\n\\n제목: \${title}\\n제작자: \${creator}\\n이미지 개수: \${selectedEmoticons.length}개\\n\\n⚠️ 업로드 후에는 수정할 수 없습니다.\`);
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
                
                // 검증 정보가 있으면 상세 정보 표시
                if (result.validationInfo && result.validationInfo.rejected > 0) {
                    let detailMessage = message + '\\n\\n검증 결과:\\n';
                    detailMessage += '- 제출된 이미지: ' + result.validationInfo.totalSubmitted + '개\\n';
                    detailMessage += '- 승인된 이미지: ' + result.validationInfo.approved + '개\\n';
                    detailMessage += '- 거부된 이미지: ' + result.validationInfo.rejected + '개';
                    
                    if (result.validationInfo.rejectedItems && result.validationInfo.rejectedItems.length > 0) {
                        detailMessage += '\\n\\n거부된 이미지 상세:\\n';
                        result.validationInfo.rejectedItems.forEach(function(item) {
                            detailMessage += '- ' + item.fileName + ': ' + item.reason + '\\n';
                        });
                    }
                    
                    alert(detailMessage);
                } else {
                    alert(message);
                }
                
                location.href = '/pack/' + result.id;
            } else {
                alert('업로드 실패: ' + (result.error || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('업로드 오류:', error);
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
            previewContainer.innerHTML = \`
                <div class="preview-item">
                    <img src="\${e.target.result}" class="preview-image" alt="썸네일 미리보기">
                    <div class="preview-filename">\${selectedThumbnail.name}</div>
                    <button type="button" class="preview-remove" data-action="remove-thumbnail">×</button>
                </div>
            \`;
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
                previewItem.innerHTML = \`
                    <img src="\${e.target.result}" class="preview-image" alt="이모티콘 \${index + 1}">
                    <div class="preview-filename">\${file.name}</div>
                    <button type="button" class="preview-remove" data-action="remove-emoticon" data-index="\${index}">×</button>
                \`;
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
    
    // 초기 미리보기 표시
    updateThumbnailPreview();
    updateEmoticonPreview();
}

async function downloadPack(packId) {
    try {
        const response = await fetch('/api/pack/' + packId + '/download');
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'emoticon-pack-' + packId + '.zip';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('다운로드에 실패했습니다.');
        }
    } catch (error) {
        console.error('다운로드 오류:', error);
        alert('다운로드 중 오류가 발생했습니다.');
    }
}`;

// 유틸리티 함수들
function generateId() {
    return 'pack_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 서버 측에서는 리사이즈를 하지 않음 (클라이언트에서 처리됨)
async function resizeImage(imageBuffer, width = 150, height = 150) {
    // 클라이언트에서 이미 리사이즈된 이미지가 전송되므로 원본 반환
    return imageBuffer;
}

// Gemini API를 통한 이모티콘 검증
async function validateEmoticonWithGemini(imageBuffer, apiKey) {
    try {
        // 이미지 크기 제한 (20MB)
        if (imageBuffer.byteLength > 20 * 1024 * 1024) {
            return {
                isValid: false,
                reason: '이미지 파일이 너무 큽니다 (20MB 이하만 허용)',
                error: 'File too large: ' + imageBuffer.byteLength + ' bytes'
            };
        }
        
        // 이미지를 base64로 인코딩 (큰 파일에 안전한 방식)
        const uint8Array = new Uint8Array(imageBuffer);
        let binary = '';
        const chunkSize = 8192; // 8KB씩 처리
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
        }
        
        const base64Image = btoa(binary);
        
        // 이미지 타입 감지 (간단한 매직 바이트 체크)
        let mimeType = 'image/jpeg'; // 기본값
        if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50) {
            mimeType = 'image/png';
        } else if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49) {
            mimeType = 'image/gif';
        } else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49) {
            mimeType = 'image/webp';
        }
        
        const promptText = '이 이미지가 이모티콘/스티커로 사용하기에 부적절한 콘텐츠가 포함되어 있는지 분석해주세요.\n\n' +
            '부적절한 콘텐츠 기준:\n' +
            '1. 정치적인 내용 (정치인, 정치 관련 상징, 정치적 메시지 등)\n' +
            '2. 선정적인 내용 (성적인 표현, 노출, 성인 콘텐츠 등)\n' +
            '3. 잔인한 내용 (폭력, 피, 상해, 죽음 관련 등)\n' +
            '4. 역겨운 내용 (혐오스러운 표현, 혐오 발언, 차별적 내용 등)\n' +
            '5. 불법적인 내용 (마약, 불법 활동 등)\n\n' +
            '위 기준에 해당하지 않는 모든 이미지는 적절한 것으로 분류해주세요.\n' +
            '(일반 사진, 음식, 동물, 풍경, 캐릭터, 만화, 밈, 텍스트 등은 모두 적절함)\n\n' +
            '응답은 반드시 다음 JSON 형식으로만 해주세요:\n' +
            '{"classification": "APPROPRIATE|INAPPROPRIATE", "reason": "분류 이유를 한 줄로"}';
        
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: promptText
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);
            return { 
                isValid: false, 
                reason: 'AI 검증 시스템 오류 (HTTP ' + response.status + ')',
                error: errorText
            };
        }
        
        const result = await response.json();
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
            return { 
                isValid: false, 
                reason: 'AI 응답을 해석할 수 없습니다',
                error: 'Empty response content'
            };
        }
        
        // JSON 응답 파싱
        try {
            const parsed = JSON.parse(content.trim());
            const isValid = parsed.classification === 'APPROPRIATE';
            return {
                isValid,
                reason: parsed.reason || '분류 완료',
                classification: parsed.classification
            };
        } catch (parseError) {
            // JSON 파싱 실패 시 텍스트에서 분류 추출
            const upperContent = content.toUpperCase();
            if (upperContent.includes('INAPPROPRIATE')) {
                return { isValid: false, reason: '부적절한 콘텐츠로 분류됨' };
            } else if (upperContent.includes('APPROPRIATE')) {
                return { isValid: true, reason: '텍스트 분석으로 적절한 콘텐츠로 승인' };
            } else {
                // 파싱 실패하고 명확하지 않은 경우 검증 실패로 처리
                return { 
                    isValid: false, 
                    reason: 'AI 응답 형식 오류로 검증 실패',
                    error: 'JSON parse failed: ' + parseError.message
                };
            }
        }
        
    } catch (error) {
        console.error('Gemini validation error:', error);
        // API 오류 시 검증 실패로 처리 (보안 우선)
        return { 
            isValid: false, 
            reason: 'AI 검증 시스템 연결 오류',
            error: error.message || 'Unknown error'
        };
    }
}

// URL을 절대 URL로 변환하는 함수
function toAbsoluteUrl(url, baseUrl) {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url; // 이미 절대 URL
    }
    return baseUrl + url; // 상대 URL을 절대 URL로 변환
}

// 팩 객체의 URL들을 절대 URL로 변환
function convertPackToAbsoluteUrls(pack, baseUrl) {
    if (!pack) return pack;
    
    const convertedPack = { ...pack };
    
    if (convertedPack.thumbnail) {
        convertedPack.thumbnail = toAbsoluteUrl(convertedPack.thumbnail, baseUrl);
    }
    
    if (convertedPack.emoticons && Array.isArray(convertedPack.emoticons)) {
        convertedPack.emoticons = convertedPack.emoticons.map(url => toAbsoluteUrl(url, baseUrl));
    }
    
    return convertedPack;
}

// HTML 응답에 보안 헤더 추가
function createHtmlResponse(content, status = 200) {
    const response = new Response(content, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
    
    // 보안 헤더 추가
    const securityHeaders = {
        'Permissions-Policy': getPermissionsPolicyHeader(),
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    
    return response;
}

// Worker 메인 함수
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // 정적 파일 서빙
        if (path === '/static/style.css') {
            const response = new Response(CSS_STYLES, {
                headers: { 'Content-Type': 'text/css; charset=utf-8' }
            });
            response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());
            return response;
        }
        
        if (path === '/static/script.js') {
            const response = new Response(JS_CLIENT, {
                headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
            });
            response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());
            return response;
        }
        
        // R2 이미지 서빙
        if (path.startsWith('/r2/')) {
            // OPTIONS preflight 요청 처리
            if (request.method === 'OPTIONS') {
                const headers = new Headers();
                headers.set('Access-Control-Allow-Origin', '*');
                headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
                headers.set('Access-Control-Max-Age', '86400');
                headers.set('Permissions-Policy', getPermissionsPolicyHeader());
                return new Response(null, { status: 204, headers });
            }
            
            const key = path.substring(4); // '/r2/' 제거
            try {
                const object = await env.PLAKKER_R2.get(key);
                if (object === null) {
                    return new Response('Image not found', { status: 404 });
                }
                
                const headers = new Headers();
                object.writeHttpMetadata(headers);
                headers.set('etag', object.httpEtag);
                
                // 이미지에 CORS 헤더 추가
                headers.set('Access-Control-Allow-Origin', '*');
                headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
                headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
                headers.set('Access-Control-Max-Age', '86400');
                headers.set('Permissions-Policy', getPermissionsPolicyHeader());
                
                // 이미지 캐싱 헤더 추가
                headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1년 캐시
                
                return new Response(object.body, { headers });
            } catch (error) {
                return new Response('Error serving image', { status: 500 });
            }
        }
        
        // API 라우팅
        if (path.startsWith('/api/')) {
            return handleAPI(request, env, path);
        }
        
        // 페이지 라우팅
        if (path === '/') {
            return createHtmlResponse(HTML_TEMPLATES.base('홈', HTML_TEMPLATES.home()));
        }
        
        if (path === '/upload') {
            return createHtmlResponse(HTML_TEMPLATES.base('업로드', HTML_TEMPLATES.upload()));
        }
        
        if (path === '/api-docs') {
            return createHtmlResponse(HTML_TEMPLATES.base('API 문서', HTML_TEMPLATES.apiDocs()));
        }
        
        if (path.startsWith('/pack/')) {
            const packId = path.split('/')[2];
            return handlePackDetail(packId, env, request);
        }
        
        // 404
        return new Response('Not Found', { status: 404 });
    }
};

// Permissions-Policy 헤더 문자열 생성
function getPermissionsPolicyHeader() {
    return [
        'attribution-reporting=()',
        'private-aggregation=()',
        'private-state-token-issuance=()',
        'private-state-token-redemption=()',
        'join-ad-interest-group=()',
        'run-ad-auction=()',
        'browsing-topics=()'
    ].join(', ');
}

// CORS 및 보안 헤더 추가 함수
function addCorsHeaders(response) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400', // 24시간
        'Permissions-Policy': getPermissionsPolicyHeader()
    };
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    
    return response;
}

// OPTIONS preflight 요청 처리
function handleOptions() {
    return addCorsHeaders(new Response(null, { status: 204 }));
}

// API 핸들러
async function handleAPI(request, env, path) {
    // OPTIONS preflight 요청 처리
    if (request.method === 'OPTIONS') {
        return handleOptions();
    }
    
    let response;
    
    if (path === '/api/packs' && request.method === 'GET') {
        response = await handleGetPacks(request, env);
    } else if (path === '/api/upload' && request.method === 'POST') {
        response = await handleUpload(request, env);
    } else if (path.startsWith('/api/pack/') && path.endsWith('/download')) {
        const packId = path.split('/')[3];
        response = await handleDownload(packId, env);
    } else if (path.startsWith('/api/pack/')) {
        const packId = path.split('/')[3];
        response = await handleGetPack(packId, env, request);
    } else {
        response = new Response('API Not Found', { status: 404 });
    }
    
    // 모든 API 응답에 CORS 헤더 추가
    return addCorsHeaders(response);
}

// 팩 리스트 조회
async function handleGetPacks(request, env) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;
        
        const packList = await env.PLAKKER_KV.get('pack_list', 'json') || [];
        
        const startIndex = offset;
        const endIndex = offset + limit;
        const paginatedPacks = packList.slice(startIndex, endIndex).map(pack => {
            const convertedPack = { ...pack };
            if (convertedPack.thumbnail) {
                convertedPack.thumbnail = toAbsoluteUrl(convertedPack.thumbnail, baseUrl);
            }
            return convertedPack;
        });
        
        return new Response(JSON.stringify({
            packs: paginatedPacks,
            currentPage: page,
            hasNext: endIndex < packList.length,
            total: packList.length
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '팩 리스트 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 특정 팩 조회
async function handleGetPack(packId, env, request) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const pack = await env.PLAKKER_KV.get(`pack_${packId}`, 'json');
        
        if (!pack) {
            return new Response(JSON.stringify({ error: '팩을 찾을 수 없습니다' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const convertedPack = convertPackToAbsoluteUrls(pack, baseUrl);
        
        return new Response(JSON.stringify(convertedPack), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '팩 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 팩 상세 페이지
async function handlePackDetail(packId, env, request) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const pack = await env.PLAKKER_KV.get(`pack_${packId}`, 'json');
        
        if (!pack) {
            return createHtmlResponse('팩을 찾을 수 없습니다', 404);
        }
        
        const convertedPack = convertPackToAbsoluteUrls(pack, baseUrl);
        
        return createHtmlResponse(HTML_TEMPLATES.base(`${pack.title} - 이모티콘 팩`, HTML_TEMPLATES.detail(convertedPack)));
    } catch (error) {
        return createHtmlResponse('서버 오류', 500);
    }
}

// 파일 업로드 처리
async function handleUpload(request, env) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const formData = await request.formData();
        
        const title = formData.get('title');
        const creator = formData.get('creator');
        const creatorLink = formData.get('creatorLink') || '';
        const thumbnail = formData.get('thumbnail');
        const emoticons = formData.getAll('emoticons');
        
        // 유효성 검사
        if (!title || !creator || !thumbnail || emoticons.length < 3) {
            return new Response(JSON.stringify({ error: '필수 항목이 누락되었습니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Gemini API 키 확인 (필수)
        const geminiApiKey = env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return new Response(JSON.stringify({ 
                error: '이미지 검증 시스템이 활성화되어 있지 않습니다. 관리자에게 문의해주세요.' 
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const packId = generateId();
        
        // 썸네일 처리
        let thumbnailBuffer = await thumbnail.arrayBuffer();
        
        // 썸네일 Gemini 검증 (필수)
        const thumbnailValidation = await validateEmoticonWithGemini(thumbnailBuffer, geminiApiKey);
        if (!thumbnailValidation.isValid) {
            const errorDetail = thumbnailValidation.error ? 
                ' (상세: ' + thumbnailValidation.error + ')' : '';
            return new Response(JSON.stringify({ 
                error: '썸네일 검증 실패: ' + thumbnailValidation.reason + errorDetail
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 썸네일 리사이즈 및 업로드
        thumbnailBuffer = await resizeImage(thumbnailBuffer, 200, 200); // 썸네일은 200x200
        const thumbnailKey = `thumbnails/${packId}_thumbnail`;
        await env.PLAKKER_R2.put(thumbnailKey, thumbnailBuffer, {
            httpMetadata: { contentType: thumbnail.type }
        });
        
        // 이모티콘들 처리
        const emoticonUrls = [];
        const rejectedEmoticons = [];
        
        for (let i = 0; i < emoticons.length; i++) {
            const emoticon = emoticons[i];
            let emoticonBuffer = await emoticon.arrayBuffer();
            
                        // Gemini 검증 (필수)
            const validation = await validateEmoticonWithGemini(emoticonBuffer, geminiApiKey);
            if (!validation.isValid) {
                const errorDetail = validation.error ? 
                    ' (' + validation.error + ')' : '';
                rejectedEmoticons.push({
                    fileName: emoticon.name || `이미지 ${i + 1}`,
                    reason: validation.reason + errorDetail
                });
                continue; // 다음 이모티콘으로 건너뛰기
            }
            
            // 이모티콘 리사이즈 (150x150)
            emoticonBuffer = await resizeImage(emoticonBuffer, 150, 150);
            
            // R2에 업로드
            const emoticonKey = `emoticons/${packId}_${emoticonUrls.length}`;
            await env.PLAKKER_R2.put(emoticonKey, emoticonBuffer, {
                httpMetadata: { contentType: emoticon.type }
            });
            
            emoticonUrls.push(`${baseUrl}/r2/${emoticonKey}`);
        }
        
        // 검증 후 최소 개수 확인
        if (emoticonUrls.length < 3) {
            let errorMessage = `유효한 이미지가 ${emoticonUrls.length}개뿐입니다. 최소 3개가 필요합니다.`;
            if (rejectedEmoticons.length > 0) {
                errorMessage += '\\n\\n거부된 이미지들:\\n';
                rejectedEmoticons.forEach(rejected => {
                    errorMessage += `- ${rejected.fileName}: ${rejected.reason}\\n`;
                });
            }
            
            return new Response(JSON.stringify({ error: errorMessage }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 팩 정보 저장
        const pack = {
            id: packId,
            title,
            creator,
            creatorLink,
            thumbnail: `${baseUrl}/r2/${thumbnailKey}`,
            emoticons: emoticonUrls,
            validationInfo: {
                totalSubmitted: emoticons.length,
                approved: emoticonUrls.length,
                rejected: rejectedEmoticons.length,
                rejectedItems: rejectedEmoticons
            },
            createdAt: new Date().toISOString()
        };
        
        // KV에 팩 정보 저장
        await env.PLAKKER_KV.put(`pack_${packId}`, JSON.stringify(pack));
        
        // 팩 리스트 업데이트
        const packList = await env.PLAKKER_KV.get('pack_list', 'json') || [];
        packList.unshift({
            id: packId,
            title,
            creator,
            thumbnail: pack.thumbnail,
            createdAt: pack.createdAt
        });
        await env.PLAKKER_KV.put('pack_list', JSON.stringify(packList));
        
        let successMessage = '이모티콘 팩이 성공적으로 업로드되었습니다!';
        if (rejectedEmoticons.length > 0) {
            successMessage += ` (${rejectedEmoticons.length}개 이미지가 검증을 통과하지 못했습니다)`;
        }
        
        return new Response(JSON.stringify({ 
            success: true, 
            id: packId,
            message: successMessage,
            validationInfo: pack.validationInfo
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('업로드 오류:', error);
        return new Response(JSON.stringify({ error: '업로드 처리 중 오류가 발생했습니다: ' + error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 다운로드 처리 (추후 구현)
async function handleDownload(packId, env) {
    return new Response(JSON.stringify({ error: '다운로드 기능은 추후 구현 예정입니다' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' }
    });
} 