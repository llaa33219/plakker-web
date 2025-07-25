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
    <form id="upload-form" class="upload-form">
        <div class="form-group">
            <label for="title">제목</label>
            <input type="text" id="title" name="title" required>
        </div>
        
        <div class="form-group">
            <label for="creator">제작자</label>
            <input type="text" id="creator" name="creator" required>
        </div>
        
        <div class="form-group">
            <label for="creator-link">제작자 링크 (선택)</label>
            <input type="url" id="creator-link" name="creatorLink">
        </div>
        
        <div class="form-group">
            <label for="thumbnail">썸네일 이미지</label>
            <input type="file" id="thumbnail" name="thumbnail" accept="image/*" required>
        </div>
        
        <div class="form-group">
            <label for="emoticons">이모티콘들 (최소 3개)</label>
            <input type="file" id="emoticons" name="emoticons" accept="image/*" multiple required>
            <div class="file-info">최소 3개의 이미지를 선택해주세요. 자동으로 150x150으로 리사이즈됩니다.</div>
            <div id="emoticon-preview" class="file-preview"></div>
        </div>
        
        <div class="form-group">
            <label for="thumbnail">썸네일 미리보기</label>
            <div id="thumbnail-preview" class="file-preview"></div>
        </div>
        
        <button type="submit" class="submit-btn">업로드</button>
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
            </ul>
        </div>

        <div class="api-section">
            <h3>크롬 확장 프로그램 사용 시 주의사항</h3>
            <ul>
                <li><strong>Manifest V3:</strong> <code>host_permissions</code>에 도메인 권한 추가 필요</li>
                <li><strong>CORS:</strong> 모든 출처에서 접근 가능하도록 설정되어 있음</li>
                <li><strong>Content Security Policy:</strong> fetch() API 사용 권장</li>
                <li><strong>파일 업로드:</strong> 확장 프로그램에서 FormData 사용 가능</li>
                <li><strong>이미지 표시:</strong> 반환된 URL을 직접 img 태그 src에 사용 가능</li>
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

.upload-form {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    max-width: 600px;
    margin: 0 auto;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-size: 1rem;
}

.form-group input:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.file-info {
    font-size: 0.875rem;
    color: #6c757d;
    margin-top: 0.25rem;
}

.file-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 1rem;
    border: 2px dashed #e9ecef;
    border-radius: 4px;
    background-color: #f8f9fa;
}

.file-preview.has-files {
    border-color: #007bff;
    background-color: #f0f8ff;
}

.preview-item {
    position: relative;
    text-align: center;
}

.preview-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #dee2e6;
}

.preview-filename {
    font-size: 0.75rem;
    color: #6c757d;
    margin-top: 0.25rem;
    word-break: break-all;
    line-height: 1.2;
}

.preview-remove {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.preview-remove:hover {
    background: #c82333;
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
    background: #007bff;
    color: white;
    border: none;
    padding: 0.75rem 2rem;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.2s;
}

.submit-btn:hover {
    background: #0056b3;
}

.submit-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
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
    const emoticonInput = document.getElementById('emoticons');
    const thumbnailInput = document.getElementById('thumbnail');
    
    let selectedEmoticons = [];
    let selectedThumbnail = null;
    
    // 썸네일 미리보기
    thumbnailInput.addEventListener('change', function() {
        selectedThumbnail = this.files[0];
        updateThumbnailPreview();
    });
    
    // 이모티콘 미리보기
    emoticonInput.addEventListener('change', function() {
        selectedEmoticons = Array.from(this.files);
        updateEmoticonPreview();
        
        if (this.files.length < 3) {
            alert('최소 3개의 이모티콘 이미지를 선택해주세요.');
        }
    });
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const title = document.getElementById('title').value;
        const creator = document.getElementById('creator').value;
        const creatorLink = document.getElementById('creator-link').value;
        const thumbnail = document.getElementById('thumbnail').files[0];
        const emoticons = document.getElementById('emoticons').files;
        
        if (!title || !creator || !selectedThumbnail || selectedEmoticons.length < 3) {
            alert('모든 필수 항목을 입력해주세요. 이모티콘은 최소 3개 이상 선택해야 합니다.');
            return;
        }
        
        formData.append('title', title);
        formData.append('creator', creator);
        if (creatorLink) formData.append('creatorLink', creatorLink);
        formData.append('thumbnail', selectedThumbnail);
        
        for (let i = 0; i < selectedEmoticons.length; i++) {
            formData.append('emoticons', selectedEmoticons[i]);
        }
        
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = '업로드 중...';
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('이모티콘 팩이 성공적으로 업로드되었습니다!');
                location.href = '/pack/' + result.id;
            } else {
                alert('업로드 실패: ' + (result.error || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('업로드 오류:', error);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '업로드';
        }
    });
    
    // 썸네일 미리보기 업데이트
    function updateThumbnailPreview() {
        const previewContainer = document.getElementById('thumbnail-preview');
        
        if (!selectedThumbnail) {
            previewContainer.innerHTML = '<div class="preview-placeholder">썸네일을 선택해주세요</div>';
            previewContainer.classList.remove('has-files');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = 
                '<div class="preview-item">' +
                '    <img src="' + e.target.result + '" class="preview-image" alt="썸네일 미리보기">' +
                '    <div class="preview-filename">' + selectedThumbnail.name + '</div>' +
                '    <button type="button" class="preview-remove" onclick="removeThumbnail()">×</button>' +
                '</div>';
            previewContainer.classList.add('has-files');
        };
        reader.readAsDataURL(selectedThumbnail);
    }
    
    // 이모티콘 미리보기 업데이트
    function updateEmoticonPreview() {
        const previewContainer = document.getElementById('emoticon-preview');
        
        if (selectedEmoticons.length === 0) {
            previewContainer.innerHTML = '<div class="preview-placeholder">이모티콘을 선택해주세요 (최소 3개)</div>';
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
                previewItem.innerHTML = 
                    '<img src="' + e.target.result + '" class="preview-image" alt="이모티콘 ' + (index + 1) + '">' +
                    '<div class="preview-filename">' + file.name + '</div>' +
                    '<button type="button" class="preview-remove" onclick="removeEmoticon(' + index + ')">×</button>';
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 전역 함수로 만들어서 onclick에서 사용 가능하도록
    window.removeThumbnail = function() {
        selectedThumbnail = null;
        document.getElementById('thumbnail').value = '';
        updateThumbnailPreview();
    };
    
    window.removeEmoticon = function(index) {
        selectedEmoticons.splice(index, 1);
        
        // FileList는 직접 수정할 수 없으므로 새로운 DataTransfer 객체 생성
        const dt = new DataTransfer();
        selectedEmoticons.forEach(file => dt.items.add(file));
        document.getElementById('emoticons').files = dt.files;
        
        updateEmoticonPreview();
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

// Worker 메인 함수
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // 정적 파일 서빙
        if (path === '/static/style.css') {
            return new Response(CSS_STYLES, {
                headers: { 'Content-Type': 'text/css' }
            });
        }
        
        if (path === '/static/script.js') {
            return new Response(JS_CLIENT, {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }
        
        // R2 이미지 서빙
        if (path.startsWith('/r2/')) {
            const key = path.substring(4); // '/r2/' 제거
            try {
                const object = await env.PLAKKER_R2.get(key);
                if (object === null) {
                    return new Response('Image not found', { status: 404 });
                }
                
                const headers = new Headers();
                object.writeHttpMetadata(headers);
                headers.set('etag', object.httpEtag);
                
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
            return new Response(HTML_TEMPLATES.base('홈', HTML_TEMPLATES.home()), {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        if (path === '/upload') {
            return new Response(HTML_TEMPLATES.base('업로드', HTML_TEMPLATES.upload()), {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        if (path === '/api-docs') {
            return new Response(HTML_TEMPLATES.base('API 문서', HTML_TEMPLATES.apiDocs()), {
                headers: { 'Content-Type': 'text/html' }
            });
        }
        
        if (path.startsWith('/pack/')) {
            const packId = path.split('/')[2];
            return handlePackDetail(packId, env, request);
        }
        
        // 404
        return new Response('Not Found', { status: 404 });
    }
};

// CORS 헤더 추가 함수
function addCorsHeaders(response) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400' // 24시간
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
            return new Response('팩을 찾을 수 없습니다', { status: 404 });
        }
        
        const convertedPack = convertPackToAbsoluteUrls(pack, baseUrl);
        
        return new Response(HTML_TEMPLATES.base(`${pack.title} - 이모티콘 팩`, HTML_TEMPLATES.detail(convertedPack)), {
            headers: { 'Content-Type': 'text/html' }
        });
    } catch (error) {
        return new Response('서버 오류', { status: 500 });
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
        
        if (!title || !creator || !thumbnail || emoticons.length < 3) {
            return new Response(JSON.stringify({ error: '필수 항목이 누락되었습니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const packId = generateId();
        
        // 썸네일 업로드
        const thumbnailBuffer = await thumbnail.arrayBuffer();
        const thumbnailKey = `thumbnails/${packId}_thumbnail`;
        await env.PLAKKER_R2.put(thumbnailKey, thumbnailBuffer, {
            httpMetadata: { contentType: thumbnail.type }
        });
        
        // 이모티콘들 업로드
        const emoticonUrls = [];
        for (let i = 0; i < emoticons.length; i++) {
            const emoticon = emoticons[i];
            const emoticonBuffer = await emoticon.arrayBuffer();
            const emoticonKey = `emoticons/${packId}_${i}`;
            
            await env.PLAKKER_R2.put(emoticonKey, emoticonBuffer, {
                httpMetadata: { contentType: emoticon.type }
            });
            
            emoticonUrls.push(`${baseUrl}/r2/${emoticonKey}`);
        }
        
        // 팩 정보 저장
        const pack = {
            id: packId,
            title,
            creator,
            creatorLink,
            thumbnail: `${baseUrl}/r2/${thumbnailKey}`,
            emoticons: emoticonUrls,
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
        
        return new Response(JSON.stringify({ success: true, id: packId }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('업로드 오류:', error);
        return new Response(JSON.stringify({ error: '업로드 처리 중 오류가 발생했습니다' }), {
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