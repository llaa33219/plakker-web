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
    
    emoticonInput.addEventListener('change', function() {
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
        
        if (!title || !creator || !thumbnail || emoticons.length < 3) {
            alert('모든 필수 항목을 입력해주세요. 이모티콘은 최소 3개 이상 선택해야 합니다.');
            return;
        }
        
        formData.append('title', title);
        formData.append('creator', creator);
        if (creatorLink) formData.append('creatorLink', creatorLink);
        formData.append('thumbnail', thumbnail);
        
        for (let i = 0; i < emoticons.length; i++) {
            formData.append('emoticons', emoticons[i]);
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
        
        if (path.startsWith('/pack/')) {
            const packId = path.split('/')[2];
            return handlePackDetail(packId, env);
        }
        
        // 404
        return new Response('Not Found', { status: 404 });
    }
};

// API 핸들러
async function handleAPI(request, env, path) {
    if (path === '/api/packs' && request.method === 'GET') {
        return handleGetPacks(request, env);
    }
    
    if (path === '/api/upload' && request.method === 'POST') {
        return handleUpload(request, env);
    }
    
    if (path.startsWith('/api/pack/') && path.endsWith('/download')) {
        const packId = path.split('/')[3];
        return handleDownload(packId, env);
    }
    
    if (path.startsWith('/api/pack/')) {
        const packId = path.split('/')[3];
        return handleGetPack(packId, env);
    }
    
    return new Response('API Not Found', { status: 404 });
}

// 팩 리스트 조회
async function handleGetPacks(request, env) {
    try {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;
        
        const packList = await env.PLAKKER_KV.get('pack_list', 'json') || [];
        
        const startIndex = offset;
        const endIndex = offset + limit;
        const paginatedPacks = packList.slice(startIndex, endIndex);
        
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
async function handleGetPack(packId, env) {
    try {
        const pack = await env.PLAKKER_KV.get(`pack_${packId}`, 'json');
        
        if (!pack) {
            return new Response(JSON.stringify({ error: '팩을 찾을 수 없습니다' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify(pack), {
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
async function handlePackDetail(packId, env) {
    try {
        const pack = await env.PLAKKER_KV.get(`pack_${packId}`, 'json');
        
        if (!pack) {
            return new Response('팩을 찾을 수 없습니다', { status: 404 });
        }
        
        return new Response(HTML_TEMPLATES.base(`${pack.title} - 이모티콘 팩`, HTML_TEMPLATES.detail(pack)), {
            headers: { 'Content-Type': 'text/html' }
        });
    } catch (error) {
        return new Response('서버 오류', { status: 500 });
    }
}

// 파일 업로드 처리
async function handleUpload(request, env) {
    try {
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
            
            emoticonUrls.push(`/r2/${emoticonKey}`);
        }
        
        // 팩 정보 저장
        const pack = {
            id: packId,
            title,
            creator,
            creatorLink,
            thumbnail: `/r2/${thumbnailKey}`,
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