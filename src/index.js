// 메인 Cloudflare Worker 엔트리포인트
import { loadTemplate } from './utils/template-loader.js';
import { 
    handleHome, 
    handleUpload, 
    handleApiDocs, 
    handlePackDetail,
    handleR2Images,
    testAIGateway,
    serveStaticFile 
} from './handlers/page-handlers.js';
import { 
    handleGetPacks, 
    handleGetPack, 
    handleDownload 
} from './handlers/pack-handlers.js';
import { handleUpload as handleUploadPost } from './handlers/upload-handler.js';
import { createCorsResponse } from './utils/helpers.js';

// 템플릿 내용 (직접 포함)
const BASE_TEMPLATE = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - Plakker</title>
    <link rel="stylesheet" href="/static/style.css">
</head>
<body>
    <header class="header">
        <div class="header-content">
            <img src="https://i.imgur.com/2MkyDCh.png" alt="Logo" style="width: 80px; height: auto; cursor: pointer;" onclick="location.href='https://bloupla.net/';">
            <h1 style="font-size: 1.8em;"><a href="/">Plakker</a></h1>
        </div>
        <nav>
            <a href="/">홈</a>
            <a href="/upload">업로드</a>
            <a href="/api-docs" class="hidden-nav">API 문서</a>
            <a href="/test-gateway" class="hidden-nav">AI 테스트</a>
        </nav>
    </header>
    <main class="main">
        {{content}}
    </main>
    <script src="/static/script.js"></script>
</body>
</html>`;

const HOME_TEMPLATE = `<div class="container">
    <h2 style="text-align: center;">이모티콘 목록</h2>
    <div id="pack-list" class="pack-grid">
        <div class="loading">로딩 중...</div>
    </div>
    <div class="pagination">
        <button id="prev-page" disabled>이전</button>
        <span id="page-info">1페이지</span>
        <button id="next-page">다음</button>
    </div>
</div>`;

const UPLOAD_TEMPLATE = `<div class="container">
    <h2 style="text-align: center;">이모티콘 업로드</h2>
    
    <div class="upload-warning">
        <span class="warning-icon"></span>
        <strong>주의:</strong> 업로드 후에는 수정이 불가능합니다. 신중하게 검토 후 업로드해주세요.
    </div>
    
    <div class="ai-validation-notice">
        <span class="info-icon"></span>
        <strong>검열 안내:</strong> 검열로 인해 업로드에 시간이 걸릴 수 있습니다.
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
            <input type="file" id="thumbnail-input" accept="image/*" style="display: none;">
            <div class="file-upload-area">
                <button type="button" class="add-file-btn" onclick="document.getElementById('thumbnail-input').click()">
                    <span class="plus-icon">+</span>
                    썸네일 선택
                </button>
                <div class="file-info">이모티콘을 대표할 썸네일 이미지를 선택하세요</div>
            </div>
            <div id="thumbnail-preview" class="file-preview"></div>
        </div>
        
        <div class="form-group">
            <label>이모티콘(최소 3개)</label>
            <input type="file" id="emoticons-input" accept="image/*" multiple style="display: none;">
            <div class="file-upload-area">
                <button type="button" class="add-file-btn" onclick="document.getElementById('emoticons-input').click()">
                    <span class="plus-icon">+</span>
                    이미지 추가
                </button>
                <div class="file-info">최소 3개의 이미지를 선택하세요. 자동으로 150x150으로 리사이즈되며, 모든 이미지는 검증을 통과해야 업로드됩니다.</div>
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
</div>`;

// 템플릿 초기화
function initTemplates() {
    loadTemplate('base', BASE_TEMPLATE);
    loadTemplate('home', HOME_TEMPLATE);
    loadTemplate('upload', UPLOAD_TEMPLATE);
}

// API 라우팅
async function handleAPI(request, env, path) {
    // OPTIONS preflight 요청 처리
    if (request.method === 'OPTIONS') {
        return createCorsResponse(null, 204, {
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400'
        });
    }
    
    let response;
    
    if (path === '/api/packs' && request.method === 'GET') {
        response = await handleGetPacks(request, env);
    } else if (path === '/api/upload' && request.method === 'POST') {
        response = await handleUploadPost(request, env);
    } else if (path.startsWith('/api/pack/') && path.endsWith('/download')) {
        const packId = path.split('/')[3];
        response = await handleDownload(packId, env);
    } else if (path.startsWith('/api/pack/')) {
        const packId = path.split('/')[3];
        response = await handleGetPack(packId, env, request);
    } else {
        response = new Response('API Not Found', { status: 404 });
    }
    
    return response;
}

// 메인 Worker 핸들러
export default {
    async fetch(request, env, ctx) {
        // 템플릿 초기화
        initTemplates();
        
        const url = new URL(request.url);
        const path = url.pathname;
        
        try {
            // 정적 파일 서빙 - 기존 방식 유지 (별도 번들링 필요)
            if (path === '/static/style.css') {
                // TODO: 빌드 과정에서 CSS 내용을 주입하거나 별도 번들러 사용
                return new Response('/* CSS 내용이 여기에 포함되어야 함 */', {
                    headers: { 'Content-Type': 'text/css; charset=utf-8' }
                });
            }
            
            if (path === '/static/script.js') {
                // TODO: 빌드 과정에서 JS 내용을 주입하거나 별도 번들러 사용  
                return new Response('/* JS 내용이 여기에 포함되어야 함 */', {
                    headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
                });
            }
            
            // R2 이미지 서빙
            if (path.startsWith('/r2/')) {
                return await handleR2Images(path, request, env);
            }
            
            // AI Gateway 테스트
            if (path === '/test-gateway') {
                return await testAIGateway(env);
            }
            
            // API 라우팅
            if (path.startsWith('/api/')) {
                return await handleAPI(request, env, path);
            }
            
            // 페이지 라우팅
            if (path === '/') {
                return handleHome();
            }
            
            if (path === '/upload') {
                return handleUpload();
            }
            
            if (path === '/api-docs') {
                return handleApiDocs();
            }
            
            if (path.startsWith('/pack/')) {
                const packId = path.split('/')[2];
                return await handlePackDetail(packId, env, request);
            }
            
            // 404
            return new Response('페이지를 찾을 수 없습니다', { status: 404 });
            
        } catch (error) {
            console.error('Request handling error:', error);
            return new Response('서버 오류가 발생했습니다', { status: 500 });
        }
    }
}; 