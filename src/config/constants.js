// 애플리케이션 설정 및 상수들

export const APP_CONFIG = {
    // 페이지네이션
    PACKS_PER_PAGE: 12,
    
    // 파일 크기 제한 (바이트)
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB
    
    // 이미지 제한
    MIN_EMOTICONS: 3,
    MAX_EMOTICONS: 30,
    
    // CORS 설정
    CORS_HEADERS: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    },
    
    // 컨텐츠 타입
    CONTENT_TYPES: {
        '.html': 'text/html;charset=UTF-8',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.zip': 'application/zip'
    }
};

export const ERROR_MESSAGES = {
    FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
    INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
    TOO_FEW_EMOTICONS: '최소 3개의 이모티콘이 필요합니다.',
    TOO_MANY_EMOTICONS: '최대 30개의 이모티콘만 업로드할 수 있습니다.',
    UPLOAD_FAILED: '업로드에 실패했습니다.',
    PACK_NOT_FOUND: '이모티콘 팩을 찾을 수 없습니다.',
    INVALID_REQUEST: '잘못된 요청입니다.',
    SERVER_ERROR: '서버 오류가 발생했습니다.'
};

export function getPermissionsPolicyHeader() {
    return [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'fullscreen=(self)'
    ].join(', ');
} 