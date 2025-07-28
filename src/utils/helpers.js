// 일반적인 헬퍼 함수들

import { APP_CONFIG } from '../config/constants.js';

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getContentType(filename) {
    const ext = '.' + filename.split('.').pop().toLowerCase();
    return APP_CONFIG.CONTENT_TYPES[ext] || 'application/octet-stream';
}

export function validateImageFile(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
        return { valid: false, error: '지원하지 않는 이미지 형식입니다.' };
    }
    
    if (file.size > APP_CONFIG.MAX_FILE_SIZE) {
        return { valid: false, error: `파일 크기가 너무 큽니다. (최대 ${formatFileSize(APP_CONFIG.MAX_FILE_SIZE)})` };
    }
    
    return { valid: true };
}

export function sanitizeFilename(filename) {
    return filename.replace(/[^a-zA-Z0-9가-힣.\-_]/g, '_');
}

export function createCorsResponse(body, status = 200, headers = {}) {
    const corsHeaders = {
        ...APP_CONFIG.CORS_HEADERS,
        ...headers
    };
    
    return new Response(body, {
        status,
        headers: corsHeaders
    });
}

export function createJsonResponse(data, status = 200) {
    return createCorsResponse(JSON.stringify(data), status, {
        'Content-Type': 'application/json'
    });
}

export function createErrorResponse(message, status = 400) {
    return createJsonResponse({ error: message }, status);
}

export async function createZipFromFiles(files) {
    // ZIP 파일 생성을 위한 간단한 구현
    // 실제로는 JSZip 등의 라이브러리를 사용하는 것이 좋습니다
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    
    files.forEach((fileData, filename) => {
        zip.file(filename, fileData);
    });
    
    return await zip.generateAsync({ type: 'arraybuffer' });
} 