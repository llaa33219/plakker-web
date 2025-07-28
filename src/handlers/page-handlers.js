// 페이지 관련 핸들러들
import { loadTemplate, renderPage } from '../utils/template-loader.js';
import { createCorsResponse, createErrorResponse } from '../utils/helpers.js';
import { getPermissionsPolicyHeader } from '../config/constants.js';

// HTML 응답 생성
export function createHtmlResponse(html) {
    const response = new Response(html, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
    });
    response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());
    return response;
}

// 정적 파일 서빙
export function serveStaticFile(content, contentType) {
    const response = new Response(content, {
        headers: { 'Content-Type': contentType }
    });
    response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());
    return response;
}

// 홈페이지
export function handleHome() {
    const homeContent = loadTemplate('home');
    return createHtmlResponse(renderPage('홈', homeContent));
}

// 업로드 페이지
export function handleUpload() {
    const uploadContent = loadTemplate('upload');
    return createHtmlResponse(renderPage('업로드', uploadContent));
}

// API 문서 페이지
export function handleApiDocs() {
    const apiDocsContent = generateApiDocsHtml();
    return createHtmlResponse(renderPage('API 문서', apiDocsContent));
}

// 팩 상세 페이지
export async function handlePackDetail(packId, env, request) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        
        const pack = await env.PLAKKER_KV.get(`pack:${packId}`, 'json');
        
        if (!pack) {
            return createHtmlResponse(`
                <div class="container">
                    <div class="error">이모티콘 팩을 찾을 수 없습니다.</div>
                    <a href="/">홈으로 돌아가기</a>
                </div>
            `);
        }
        
        // R2 URL을 절대 URL로 변환
        const convertedPack = { ...pack };
        
        if (convertedPack.thumbnail && !convertedPack.thumbnail.startsWith('http')) {
            convertedPack.thumbnail = `${baseUrl}/r2/${convertedPack.thumbnail}`;
        }
        
        if (convertedPack.emoticons) {
            convertedPack.emoticons = convertedPack.emoticons.map(emoticon => {
                if (!emoticon.startsWith('http')) {
                    return `${baseUrl}/r2/${emoticon}`;
                }
                return emoticon;
            });
        }
        
        const detailContent = generatePackDetailHtml(convertedPack);
        return createHtmlResponse(renderPage(convertedPack.title, detailContent));
        
    } catch (error) {
        console.error('팩 상세 페이지 오류:', error);
        return createHtmlResponse(`
            <div class="container">
                <div class="error">페이지를 불러오는 중 오류가 발생했습니다.</div>
                <a href="/">홈으로 돌아가기</a>
            </div>
        `);
    }
}

// R2 이미지 서빙
export async function handleR2Images(path, request, env) {
    // OPTIONS preflight 요청 처리
    if (request.method === 'OPTIONS') {
        return createCorsResponse(null, 204, {
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Range',
            'Access-Control-Max-Age': '86400',
            'Permissions-Policy': getPermissionsPolicyHeader()
        });
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

// AI Gateway 테스트
export async function testAIGateway(env) {
    try {
        if (!env.AI_GATEWAY_BASE_URL || !env.GEMINI_API_KEY) {
            return createJsonResponse({
                success: false,
                error: 'AI Gateway 또는 Gemini API 키가 설정되지 않았습니다.',
                config: {
                    gatewayUrl: !!env.AI_GATEWAY_BASE_URL,
                    apiKey: !!env.GEMINI_API_KEY
                }
            });
        }
        
        const testPayload = {
            contents: [{
                parts: [{
                    text: "Hello! This is a test message to verify AI Gateway connectivity."
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 50
            }
        };
        
        const response = await fetch(`${env.AI_GATEWAY_BASE_URL}/v1beta/models/gemini-1.5-flash:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testPayload)
        });
        
        const result = await response.json();
        
        return createJsonResponse({
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        return createJsonResponse({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

// 팩 상세 HTML 생성
function generatePackDetailHtml(pack) {
    const emoticonsHtml = pack.emoticons.map((emoticon, index) => `
        <div class="emoticon-item">
            <img src="${emoticon}" alt="${pack.title} 이모티콘 ${index + 1}" loading="lazy">
        </div>
    `).join('');
    
    return `
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
                    ${emoticonsHtml}
                </div>
                <div class="pack-actions">
                    <button onclick="downloadPack('${pack.id}')" class="download-btn">팩 다운로드</button>
                </div>
            </div>
        </div>
    `;
}

// API 문서 HTML 생성
function generateApiDocsHtml() {
    return `
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
                                <thead>
                                    <tr><th>Parameter</th><th>Type</th><th>Description</th><th>Default</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><code>page</code></td>
                                        <td>integer</td>
                                        <td>페이지 번호 (1부터 시작)</td>
                                        <td>1</td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <h4>Response Example</h4>
                            <div class="code-block">
{
  "packs": [
    {
      "id": "pack_id_123",
      "title": "귀여운 동물들",
      "creator": "작성자명",
      "thumbnail": "https://plakker.bloupla.net/r2/thumbnails/pack_id_123_thumbnail",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "currentPage": 1,
  "totalPages": 5,
  "hasNext": true,
  "hasPrev": false
}
                            </div>
                        </div>
                    </div>

                    <div class="endpoint">
                        <div class="endpoint-header">
                            <span class="method get">GET</span>
                            <span class="path">/api/pack/{packId}</span>
                        </div>
                        <div class="endpoint-content">
                            <p class="description">특정 이모티콘 팩의 상세 정보를 조회합니다.</p>
                            
                            <h4>Path Parameters</h4>
                            <table class="param-table">
                                <thead>
                                    <tr><th>Parameter</th><th>Type</th><th>Description</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><code>packId</code></td>
                                        <td>string</td>
                                        <td>조회할 팩의 고유 ID</td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <h4>Response Example</h4>
                            <div class="code-block">
{
  "id": "pack_id_123",
  "title": "귀여운 동물들",
  "creator": "작성자명",
  "creatorLink": "https://example.com",
  "thumbnail": "https://plakker.bloupla.net/r2/thumbnails/pack_id_123_thumbnail",
  "emoticons": [
    "https://plakker.bloupla.net/r2/emoticons/pack_id_123_0",
    "https://plakker.bloupla.net/r2/emoticons/pack_id_123_1"
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="api-section">
                    <h3>Error Responses</h3>
                    <p>모든 에러는 다음 형식으로 반환됩니다:</p>
                    <div class="code-block">
{
  "error": "오류 메시지"
}
                    </div>
                    
                    <h4>HTTP Status Codes</h4>
                    <ul>
                        <li><strong>200:</strong> 성공</li>
                        <li><strong>400:</strong> 잘못된 요청</li>
                        <li><strong>404:</strong> 리소스를 찾을 수 없음</li>
                        <li><strong>500:</strong> 서버 내부 오류</li>
                    </ul>
                </div>

                <div class="api-section">
                    <h3>사용 예시</h3>
                    <h4>JavaScript (Fetch API)</h4>
                    <div class="code-block">
// 팩 목록 조회
const response = await fetch('https://plakker.bloupla.net/api/packs?page=1');
const data = await response.json();
console.log(data.packs);

// 특정 팩 조회
const packResponse = await fetch('https://plakker.bloupla.net/api/pack/pack_id_123');
const packData = await packResponse.json();
console.log(packData.emoticons);
                    </div>
                    
                    <h4>curl</h4>
                    <div class="code-block">
# 팩 목록 조회
curl "https://plakker.bloupla.net/api/packs?page=1"

# 특정 팩 조회
curl "https://plakker.bloupla.net/api/pack/pack_id_123"
                    </div>
                </div>
            </div>
        </div>
    `;
} 