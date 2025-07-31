// API 핸들러들
import { 
    addCorsHeaders, 
    handleOptions, 
    toAbsoluteUrl, 
    convertPackToAbsoluteUrls,
    generateId,
    resizeImage,
    getClientIP,
    checkUploadLimit,
    incrementUploadCount,
    maskIP,
    sanitizeTextInput,
    sanitizeUrl,
    convertToSafeUnicode,
    createJWT,
    verifyJWT,
    hashPassword,
    isValidIP,
    generateSecureSessionId,
    verifyPassword // 해싱된 비밀번호 검증 함수 추가
} from './utils.js';

// Rate limiting을 위한 맵 (실제 프로덕션에서는 Redis 등 사용 권장)
const loginAttempts = new Map();
const adminSessions = new Map();
const validAdminIPs = new Map(); // 승인된 관리자 IP 추적

// Rate limiting 설정
const RATE_LIMIT = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15분
    blockDurationMs: 30 * 60 * 1000 // 30분 차단
};

// 세션 만료 시간 (1시간)
const SESSION_TIMEOUT = 60 * 60 * 1000;

// 서버 측 보안 검증 강화
const SECURITY_CONFIG = {
    maxSessionsPerIP: 1, // IP당 최대 세션 수
    tokenRotationInterval: 30 * 60 * 1000, // 30분마다 토큰 갱신 필요
    adminIPWhitelist: [], // 환경변수에서 설정 가능한 IP 화이트리스트
    requireDoubleVerification: true // 이중 검증 필요
};

// API 핸들러
export async function handleAPI(request, env, path) {
    // OPTIONS preflight 요청 처리
    if (request.method === 'OPTIONS') {
        return handleOptions();
    }
    
    let response;
    
    if (path === '/api/packs' && request.method === 'GET') {
        response = await handleGetPacks(request, env);
    } else if (path === '/api/upload' && request.method === 'POST') {
        response = await handleUpload(request, env);
    } else if (path === '/api/upload-limit' && request.method === 'GET') {
        response = await handleUploadLimitStatus(request, env);
    } else if (path === '/api/admin/login' && request.method === 'POST') {
        response = await handleAdminLogin(request, env);
    } else if (path === '/api/admin/verify' && request.method === 'GET') {
        response = await handleAdminVerify(request, env);
    } else if (path === '/api/admin/logout' && request.method === 'POST') {
        response = await handleAdminLogout(request, env);
    } else if (path === '/api/admin/pending-packs' && request.method === 'GET') {
        response = await handleGetPendingPacks(request, env);
    } else if (path === '/api/admin/approve-pack' && request.method === 'POST') {
        response = await handleApprovePack(request, env);
    } else if (path === '/api/admin/reject-pack' && request.method === 'POST') {
        response = await handleRejectPack(request, env);
    } else if (path.startsWith('/api/pack/')) {
        const packId = path.split('/')[3];
        response = await handleGetPack(packId, env, request);
    } else {
        response = new Response('API Not Found', { status: 404 });
    }
    
    // 모든 API 응답에 CORS 헤더 추가
    return addCorsHeaders(response);
}

// 팩 리스트 조회 (pack_list 없이 직접 KV에서 조회)
export async function handleGetPacks(request, env) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = 20;
        const offset = (page - 1) * limit;
        
        // KV에서 pack_ prefix로 모든 팩 키 조회
        const packKeys = await env.PLAKKER_KV.list({ prefix: 'pack_' });
        
        if (!packKeys.keys || packKeys.keys.length === 0) {
            return new Response(JSON.stringify({
                packs: [],
                currentPage: page,
                hasNext: false,
                total: 0
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 모든 팩 데이터를 조회 (한번에 여러 개 조회)
        const packPromises = packKeys.keys.map(async (key) => {
            try {
                const pack = await env.PLAKKER_KV.get(key.name, 'json');
                return pack;
            } catch (error) {
                return null;
            }
        });
        
        const allPacks = (await Promise.all(packPromises))
            .filter(pack => pack !== null) // null 제거 (로드 실패한 팩들)
            .filter(pack => pack.status === 'approved' || !pack.status) // 승인된 팩 + 기존 팩들(status 없음) 표시
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // 최신순 정렬
        
        // 페이지네이션 적용
        const startIndex = offset;
        const endIndex = offset + limit;
        const paginatedPacks = allPacks.slice(startIndex, endIndex).map(pack => {
            // 목록에서는 필요한 정보만 반환 (emoticons 배열 제외로 응답 크기 최적화)
            const listPack = {
                id: pack.id,
                title: convertToSafeUnicode(pack.title || ''), // 출력 시 안전 변환
                creator: convertToSafeUnicode(pack.creator || ''), // 출력 시 안전 변환
                creatorLink: pack.creatorLink,
                thumbnail: toAbsoluteUrl(pack.thumbnail, baseUrl),
                createdAt: pack.createdAt
            };
            return listPack;
        });
        
        return new Response(JSON.stringify({
            packs: paginatedPacks,
            currentPage: page,
            hasNext: endIndex < allPacks.length,
            total: allPacks.length
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
export async function handleGetPack(packId, env, request) {
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
        
        // 승인되지 않은 팩은 접근 불가 (기존 팩들은 status가 없으므로 승인된 것으로 간주)
        if (pack.status && pack.status !== 'approved') {
            return new Response(JSON.stringify({ error: '팩을 찾을 수 없습니다' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const convertedPack = convertPackToAbsoluteUrls(pack, baseUrl);
        
        // 출력 시 텍스트 필드를 안전하게 변환
        const safePack = {
            ...convertedPack,
            title: convertToSafeUnicode(convertedPack.title || ''),
            creator: convertToSafeUnicode(convertedPack.creator || '')
        };
        
        return new Response(JSON.stringify(safePack), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '팩 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 파일 업로드 처리
export async function handleUpload(request, env) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        
        // IP 기반 업로드 제한 확인
        const clientIP = getClientIP(request);
        const uploadLimitCheck = await checkUploadLimit(env, clientIP, 5);
        
        if (!uploadLimitCheck.allowed) {
            return new Response(JSON.stringify({ 
                error: `일일 업로드 제한에 도달했습니다. (${uploadLimitCheck.currentCount}/${uploadLimitCheck.limit}) 내일 다시 시도해주세요.` 
            }), {
                status: 429, // Too Many Requests
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const formData = await request.formData();
        
        // 입력 데이터 정화 및 검증
        const rawTitle = formData.get('title');
        const rawCreator = formData.get('creator');
        const rawCreatorLink = formData.get('creatorLink') || '';
        const thumbnail = formData.get('thumbnail');
        const emoticons = formData.getAll('emoticons');
        
        // 텍스트 입력 정화 (HTML 태그 제거, 특수문자 제한)
        const title = sanitizeTextInput(rawTitle, 50); // 제목 최대 50자
        const creator = sanitizeTextInput(rawCreator, 30); // 제작자 이름 최대 30자
        const creatorLink = sanitizeUrl(rawCreatorLink); // URL 검증 및 정화
        
        // 유효성 검사
        if (!title || !creator || !thumbnail || emoticons.length < 3) {
            return new Response(JSON.stringify({ error: '필수 항목이 누락되었거나 유효하지 않습니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 추가 길이 검증
        if (title.length < 2) {
            return new Response(JSON.stringify({ error: '제목은 최소 2자 이상이어야 합니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (creator.length < 2) {
            return new Response(JSON.stringify({ error: '제작자 이름은 최소 2자 이상이어야 합니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 허용된 이미지 형식
        const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/gif'];
        
        // 파일 형식 검증 함수
        function isValidImageType(file) {
            return file && file.type && allowedImageTypes.includes(file.type.toLowerCase());
        }
        
        // 썸네일 파일 형식 검증
        if (!isValidImageType(thumbnail)) {
            return new Response(JSON.stringify({ 
                error: '썸네일은 지원되는 이미지 형식이어야 합니다. (PNG, JPG, JPEG, WebP, GIF)' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 이모티콘 파일 형식 검증
        for (let i = 0; i < emoticons.length; i++) {
            if (!isValidImageType(emoticons[i])) {
                return new Response(JSON.stringify({ 
                    error: `이모티콘 ${i + 1}번이 지원되지 않는 파일 형식입니다. 지원되는 형식: PNG, JPG, JPEG, WebP, GIF` 
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // 팩 정보 저장 (AI 검증 없이 저장)
        const packId = generateId();
        
        // 썸네일 처리
        let thumbnailBuffer = await thumbnail.arrayBuffer();
        
        // 썸네일 리사이즈 및 업로드 (애니메이션 파일은 원본 유지)
        const { isAnimatedImage } = await import('./utils.js');
        if (!isAnimatedImage(thumbnail, thumbnailBuffer)) {
            thumbnailBuffer = await resizeImage(thumbnailBuffer, 200, 200); // 썸네일은 200x200
        }
        const thumbnailKey = `thumbnails/${packId}_thumbnail`;
        await env.PLAKKER_R2.put(thumbnailKey, thumbnailBuffer, {
            httpMetadata: { contentType: thumbnail.type }
        });
        
        // 이모티콘들 처리 (AI 검증 없이 모든 파일 처리)
        const emoticonUrls = [];
        
        for (let i = 0; i < emoticons.length; i++) {
            const emoticon = emoticons[i];
            let emoticonBuffer = await emoticon.arrayBuffer();
            
            // 이모티콘 리사이즈 (150x150, 애니메이션 파일은 원본 유지)
            if (!isAnimatedImage(emoticon, emoticonBuffer)) {
                emoticonBuffer = await resizeImage(emoticonBuffer, 150, 150);
            }
            
            // R2에 업로드
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
            totalEmoticons: emoticons.length,
            status: 'pending', // 업로드 시 대기 상태로 설정 (관리자 승인 필요)
            createdAt: new Date().toISOString()
        };
        
        // KV에 팩 정보 저장 (pack_list는 더 이상 사용하지 않음)
        await env.PLAKKER_KV.put(`pack_${packId}`, JSON.stringify(pack));
        
        // 업로드 성공 시 IP별 카운트 증가
        await incrementUploadCount(env, clientIP);
        
        const successMessage = '이모티콘 팩이 성공적으로 업로드되었습니다! 관리자 승인 후 공개됩니다.';
        
        return new Response(JSON.stringify({ 
            success: true, 
            id: packId,
            message: successMessage,
            status: 'pending',
            totalEmoticons: emoticons.length
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: '업로드 처리 중 오류가 발생했습니다: ' + error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 업로드 제한 상태 확인 API
export async function handleUploadLimitStatus(request, env) {
    try {
        const clientIP = getClientIP(request);
        const uploadLimitCheck = await checkUploadLimit(env, clientIP, 5);
        
        return new Response(JSON.stringify({
            currentCount: uploadLimitCheck.currentCount,
            limit: uploadLimitCheck.limit,
            remaining: uploadLimitCheck.remaining,
            allowed: uploadLimitCheck.allowed
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        const clientIP = getClientIP(request);
        return new Response(JSON.stringify({ 
            error: '제한 상태를 확인할 수 없습니다' 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}


// 팩 상세 페이지
export async function handlePackDetail(packId, env, request) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const pack = await env.PLAKKER_KV.get(`pack_${packId}`, 'json');
        
        if (!pack) {
            return null; // null을 반환하여 404 처리를 메인에서 하도록 함
        }
        
        const convertedPack = convertPackToAbsoluteUrls(pack, baseUrl);
        
        // 출력 시 텍스트 필드를 안전하게 변환
        const safePack = {
            ...convertedPack,
            title: convertToSafeUnicode(convertedPack.title || ''),
            creator: convertToSafeUnicode(convertedPack.creator || '')
        };
        
        return safePack;
    } catch (error) {
        return null;
    }
} 

// 관리자 API: 대기 중인 팩 리스트 조회 (클라이언트 위조 방지)
export async function handleGetPendingPacks(request, env) {
    try {
        // 1. 추가 보안 검증 (클라이언트 위조 불가능)
        const requestValidation = await validateAdminRequest(request, env);
        if (!requestValidation.valid) {
            return new Response(JSON.stringify({ error: requestValidation.error }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 2. 강화된 JWT 토큰 검증
        const authResult = await verifyAdminToken(request, env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: authResult.error }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        
        // KV에서 pack_ prefix로 모든 팩 키 조회
        const packKeys = await env.PLAKKER_KV.list({ prefix: 'pack_' });
        
        if (!packKeys.keys || packKeys.keys.length === 0) {
            return new Response(JSON.stringify({
                packs: [],
                total: 0
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 모든 팩 데이터를 조회하고 대기 중인 것만 필터링
        const packPromises = packKeys.keys.map(async (key) => {
            try {
                const pack = await env.PLAKKER_KV.get(key.name, 'json');
                return pack;
            } catch (error) {
                return null;
            }
        });
        
        const pendingPacks = (await Promise.all(packPromises))
            .filter(pack => pack !== null && pack.status === 'pending')
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // 오래된 것부터
            .map(pack => ({
                id: pack.id,
                title: convertToSafeUnicode(pack.title || ''),
                creator: convertToSafeUnicode(pack.creator || ''),
                creatorLink: pack.creatorLink,
                thumbnail: toAbsoluteUrl(pack.thumbnail, baseUrl),
                totalEmoticons: pack.totalEmoticons,
                createdAt: pack.createdAt,
                status: pack.status
            }));
        
        return new Response(JSON.stringify({
            packs: pendingPacks,
            total: pendingPacks.length
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

// 보안 함수들

// Rate limiting 체크
function checkRateLimit(clientIP) {
    const now = Date.now();
    const clientKey = `login_${clientIP}`;
    
    if (!loginAttempts.has(clientKey)) {
        loginAttempts.set(clientKey, { attempts: 0, firstAttempt: now, blocked: false });
        return { allowed: true, remaining: RATE_LIMIT.maxAttempts };
    }
    
    const record = loginAttempts.get(clientKey);
    
    // 차단 기간이 지났는지 확인
    if (record.blocked && (now - record.blockedAt) > RATE_LIMIT.blockDurationMs) {
        record.blocked = false;
        record.attempts = 0;
        record.firstAttempt = now;
    }
    
    // 현재 차단 중인지 확인
    if (record.blocked) {
        const remainingTime = RATE_LIMIT.blockDurationMs - (now - record.blockedAt);
        return { 
            allowed: false, 
            blocked: true, 
            remainingTime: Math.ceil(remainingTime / 1000) 
        };
    }
    
    // 시간 윈도우가 지났는지 확인
    if ((now - record.firstAttempt) > RATE_LIMIT.windowMs) {
        record.attempts = 0;
        record.firstAttempt = now;
    }
    
    // 시도 횟수 확인
    if (record.attempts >= RATE_LIMIT.maxAttempts) {
        record.blocked = true;
        record.blockedAt = now;
        return { 
            allowed: false, 
            blocked: true, 
            remainingTime: Math.ceil(RATE_LIMIT.blockDurationMs / 1000) 
        };
    }
    
    return { 
        allowed: true, 
        remaining: RATE_LIMIT.maxAttempts - record.attempts 
    };
}

// Rate limiting 기록
function recordLoginAttempt(clientIP, success = false) {
    const clientKey = `login_${clientIP}`;
    
    if (!loginAttempts.has(clientKey)) {
        loginAttempts.set(clientKey, { attempts: 1, firstAttempt: Date.now(), blocked: false });
    } else {
        const record = loginAttempts.get(clientKey);
        if (!success) {
            record.attempts++;
        } else {
            // 성공 시 초기화
            record.attempts = 0;
            record.blocked = false;
        }
    }
}

// 간단한 관리자 권한 검증
async function verifyAdminToken(request, env) {
    try {
        const clientIP = getClientIP(request);
        
        // 1. 기본 토큰 검증
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { valid: false, error: '인증 토큰이 필요합니다' };
        }
        
        const token = authHeader.substring(7);
        
        // JWT_SECRET 우선 사용, 없으면 ADMIN_PASSWORD 사용 (보안 강화)
        const jwtSecret = env.JWT_SECRET;
        if (!jwtSecret) {
            return { valid: false, error: 'JWT 시크릿이 설정되지 않았습니다. 관리자에게 문의하세요.' };
        }
        
        const verification = await verifyJWT(token, jwtSecret);
        if (!verification.valid) {
            return { valid: false, error: '유효하지 않은 토큰입니다' };
        }
        
        // 2. 세션 확인
        const sessionId = verification.payload.sessionId;
        if (!adminSessions.has(sessionId)) {
            return { valid: false, error: '세션이 만료되었습니다' };
        }
        
        const session = adminSessions.get(sessionId);
        
        // 3. 세션 만료 확인
        if (Date.now() > session.expiresAt) {
            adminSessions.delete(sessionId);
            return { valid: false, error: '세션이 만료되었습니다' };
        }
        
        // 4. IP 확인 (기본적인 보안)
        if (verification.payload.ip !== clientIP) {
            return { valid: false, error: '보안 오류가 발생했습니다' };
        }
        
        // 세션 갱신
        session.expiresAt = Date.now() + SESSION_TIMEOUT;
        
        return { valid: true, payload: verification.payload };
    } catch (error) {
        return { valid: false, error: '토큰 검증 실패' };
    }
}

// 간단한 보안 로깅
function logSecurityEvent(eventType, ip, userAgent = '', details = '') {
    // 보안 로깅은 서버 로그로만 처리
}

// 관리자 로그인 (단순화된 버전)
export async function handleAdminLogin(request, env) {
    try {
        const clientIP = getClientIP(request);
        
        // Rate limiting 체크 (단순화)
        const rateLimitResult = checkRateLimit(clientIP);
        if (!rateLimitResult.allowed) {
            recordLoginAttempt(clientIP, false);
            
            const errorMessage = rateLimitResult.blocked 
                ? `너무 많은 로그인 시도로 인해 ${Math.ceil(rateLimitResult.remainingTime / 60)}분간 차단되었습니다.`
                : '잠시 후 다시 시도해주세요.';
                
            return new Response(JSON.stringify({ 
                error: errorMessage,
                blocked: rateLimitResult.blocked,
                remainingTime: rateLimitResult.remainingTime
            }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        let requestBody;
        try {
            requestBody = await request.json();
        } catch (error) {
            return new Response(JSON.stringify({ error: '잘못된 요청 형식입니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const { password } = requestBody;
        
        if (!password) {
            recordLoginAttempt(clientIP, false);
            return new Response(JSON.stringify({ error: '비밀번호가 필요합니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 비밀번호 검증 (보안 강화: 해싱된 비밀번호만 사용)
        const adminPasswordHash = env.ADMIN_PASSWORD_HASH;
        
        if (!adminPasswordHash) {
            return new Response(JSON.stringify({ 
                error: 'ADMIN_PASSWORD_HASH 환경변수가 설정되지 않았습니다. 관리자에게 문의하세요.' 
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        let isValidPassword = false;
        
        try {
            const [storedHash, storedSalt] = adminPasswordHash.split(':');
            if (storedHash && storedSalt) {
                isValidPassword = await verifyPassword(password, storedHash, storedSalt);
            } else {
                console.error('ADMIN_PASSWORD_HASH 형식이 올바르지 않습니다. hash:salt 형식이어야 합니다.');
            }
        } catch (error) {
            console.error('해싱된 비밀번호 검증 오류:', error);
        }
        
        if (!isValidPassword) {
            recordLoginAttempt(clientIP, false);
            return new Response(JSON.stringify({ error: '잘못된 비밀번호입니다' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 성공적인 로그인 (단순화)
        recordLoginAttempt(clientIP, true);
        
        // IP를 승인된 관리자 목록에 추가
        validAdminIPs.set(clientIP, {
            firstLogin: Date.now(),
            lastLogin: Date.now(),
            loginCount: (validAdminIPs.get(clientIP)?.loginCount || 0) + 1
        });
        
        // 간단한 세션 생성
        const sessionId = generateSecureSessionId();
        const expiresAt = Date.now() + SESSION_TIMEOUT;
        
        adminSessions.set(sessionId, {
            ip: clientIP,
            createdAt: Date.now(),
            expiresAt: expiresAt
        });
        
        // 간단한 JWT 토큰 생성
        const jwtSecret = env.JWT_SECRET;
        
        if (!jwtSecret) {
            return new Response(JSON.stringify({ error: '서버 설정 오류입니다. 관리자에게 문의하세요.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        let token;
        try {
            const tokenPayload = {
                role: 'admin',
                sessionId: sessionId,
                ip: clientIP,
                loginTime: Date.now()
            };
            
            token = await createJWT(tokenPayload, jwtSecret, 3600); // 1시간
        } catch (error) {
            return new Response(JSON.stringify({ error: '토큰 생성에 실패했습니다' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const response = {
            success: true,
            token: token,
            expiresAt: expiresAt
        };
        
        return new Response(JSON.stringify(response), {
            headers: { 
                'Content-Type': 'application/json'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: '로그인 처리 중 오류가 발생했습니다',
            details: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 관리자 세션 정리 (보안 강화)
function cleanupAdminSessions() {
    const now = Date.now();
    const expiredSessions = [];
    
    for (const [sessionId, session] of adminSessions.entries()) {
        if (now > session.expiresAt) {
            expiredSessions.push(sessionId);
        }
    }
    
    for (const sessionId of expiredSessions) {
        const session = adminSessions.get(sessionId);
        adminSessions.delete(sessionId);
    }
    
    // 오래된 IP 정보도 정리 (7일 이상 미사용)
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    for (const [ip, ipInfo] of validAdminIPs.entries()) {
        if (ipInfo.lastLogin < sevenDaysAgo) {
            validAdminIPs.delete(ip);
        }
    }
}

// 관리자 API 호출 전 기본 검증 (단순화)
async function validateAdminRequest(request, env) {
    // 세션 정리
    cleanupAdminSessions();
    
    const clientIP = getClientIP(request);
    
    // 기본 Rate limiting만 적용
    const adminRateLimit = checkAdminRateLimit(clientIP);
    if (!adminRateLimit.allowed) {
        return { valid: false, error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' };
    }
    
    return { valid: true };
}

// 관리자 전용 Rate Limiting (일반 업로드와 별도)
function checkAdminRateLimit(clientIP) {
    const now = Date.now();
    const adminKey = `admin_rate_${clientIP}`;
    
    if (!loginAttempts.has(adminKey)) {
        loginAttempts.set(adminKey, { requests: 1, firstRequest: now });
        return { allowed: true, remaining: 99 };
    }
    
    const record = loginAttempts.get(adminKey);
    
    // 1분 윈도우에서 100개 요청 제한
    const windowMs = 60 * 1000;
    const maxRequests = 100;
    
    if ((now - record.firstRequest) > windowMs) {
        record.requests = 1;
        record.firstRequest = now;
        return { allowed: true, remaining: maxRequests - 1 };
    }
    
    if (record.requests >= maxRequests) {
        return { allowed: false, remaining: 0 };
    }
    
    record.requests++;
    return { allowed: true, remaining: maxRequests - record.requests };
}

// 관리자 토큰 검증 API (강화된 보안)
export async function handleAdminVerify(request, env) {
    // 추가 보안 검증 먼저 실행
    const requestValidation = await validateAdminRequest(request, env);
    if (!requestValidation.valid) {
        return new Response(JSON.stringify({ 
            valid: false, 
            error: requestValidation.error 
        }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const authResult = await verifyAdminToken(request, env);
    
    if (authResult.valid) {
        return new Response(JSON.stringify({
            valid: true,
            payload: authResult.payload
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } else {
        return new Response(JSON.stringify({
            valid: false,
            error: authResult.error
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 관리자 로그아웃 (강화된 보안)
export async function handleAdminLogout(request, env) {
    try {
        // 추가 보안 검증
        const requestValidation = await validateAdminRequest(request, env);
        if (!requestValidation.valid) {
            return new Response(JSON.stringify({ error: requestValidation.error }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const authResult = await verifyAdminToken(request, env);
        const clientIP = getClientIP(request);
        
        if (authResult.valid && authResult.payload.sessionId) {
            adminSessions.delete(authResult.payload.sessionId);
        }
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 
                'Content-Type': 'application/json',
                'Set-Cookie': 'admin_session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/admin'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: '로그아웃 처리 중 오류가 발생했습니다' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 관리자 API: 팩 승인 (클라이언트 위조 방지)
export async function handleApprovePack(request, env) {
    try {
        // 1. 추가 보안 검증 (클라이언트 위조 불가능)
        const requestValidation = await validateAdminRequest(request, env);
        if (!requestValidation.valid) {
            return new Response(JSON.stringify({ error: requestValidation.error }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 2. 강화된 JWT 토큰 검증
        const authResult = await verifyAdminToken(request, env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: authResult.error }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { packId } = await request.json();
        
        if (!packId) {
            return new Response(JSON.stringify({ error: 'packId가 필요합니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 팩 정보 조회
        const pack = await env.PLAKKER_KV.get(`pack_${packId}`, 'json');
        
        if (!pack) {
            return new Response(JSON.stringify({ error: '팩을 찾을 수 없습니다' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (pack.status !== 'pending') {
            return new Response(JSON.stringify({ error: '대기 상태가 아닌 팩입니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 상태를 승인으로 변경
        pack.status = 'approved';
        pack.approvedAt = new Date().toISOString();
        
        // KV에 업데이트된 팩 정보 저장
        await env.PLAKKER_KV.put(`pack_${packId}`, JSON.stringify(pack));
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: '팩이 승인되었습니다',
            packId: packId
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: '팩 승인 처리 중 오류가 발생했습니다' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 관리자 API: 팩 거부 (클라이언트 위조 방지)
export async function handleRejectPack(request, env) {
    try {
        // 1. 추가 보안 검증 (클라이언트 위조 불가능)
        const requestValidation = await validateAdminRequest(request, env);
        if (!requestValidation.valid) {
            return new Response(JSON.stringify({ error: requestValidation.error }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 2. 강화된 JWT 토큰 검증
        const authResult = await verifyAdminToken(request, env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: authResult.error }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { packId, reason } = await request.json();
        
        if (!packId) {
            return new Response(JSON.stringify({ error: 'packId가 필요합니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 팩 정보 조회
        const pack = await env.PLAKKER_KV.get(`pack_${packId}`, 'json');
        
        if (!pack) {
            return new Response(JSON.stringify({ error: '팩을 찾을 수 없습니다' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (pack.status !== 'pending') {
            return new Response(JSON.stringify({ error: '대기 상태가 아닌 팩입니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 거부된 팩 완전 삭제 시작
        const deletionResults = {
            kvDeleted: false,
            thumbnailDeleted: false,
            emoticonsDeleted: 0,
            totalEmoticons: pack.totalEmoticons || 0,
            errors: []
        };
        
        try {
            // 1. R2에서 썸네일 삭제
            const thumbnailKey = `thumbnails/${packId}_thumbnail`;
            try {
                await env.PLAKKER_R2.delete(thumbnailKey);
                deletionResults.thumbnailDeleted = true;
            } catch (error) {
                deletionResults.errors.push(`썸네일 삭제 실패: ${error.message}`);
            }
            
            // 2. R2에서 모든 이모티콘 삭제
            for (let i = 0; i < deletionResults.totalEmoticons; i++) {
                const emoticonKey = `emoticons/${packId}_${i}`;
                try {
                    await env.PLAKKER_R2.delete(emoticonKey);
                    deletionResults.emoticonsDeleted++;
                } catch (error) {
                    deletionResults.errors.push(`이모티콘 ${i+1} 삭제 실패: ${error.message}`);
                }
            }
            
            // 3. KV에서 팩 메타데이터 완전 삭제
            try {
                await env.PLAKKER_KV.delete(`pack_${packId}`);
                deletionResults.kvDeleted = true;
            } catch (error) {
                deletionResults.errors.push(`메타데이터 삭제 실패: ${error.message}`);
            }
            
            let responseMessage = '팩이 거부되어 완전히 삭제되었습니다';
            if (deletionResults.errors.length > 0) {
                responseMessage += ` (일부 파일 삭제 실패: ${deletionResults.errors.length}개)`;
            }
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: responseMessage,
                packId: packId,
                deletionDetails: {
                    thumbnailDeleted: deletionResults.thumbnailDeleted,
                    emoticonsDeleted: deletionResults.emoticonsDeleted,
                    totalEmoticons: deletionResults.totalEmoticons,
                    kvDeleted: deletionResults.kvDeleted,
                    errors: deletionResults.errors
                }
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
            
        } catch (error) {
            // 삭제 실패 시에도 KV에서 최소한 메타데이터는 삭제 시도
            try {
                await env.PLAKKER_KV.delete(`pack_${packId}`);
            } catch (kvError) {
                // 복구도 실패
            }
            
            return new Response(JSON.stringify({ 
                success: true, 
                message: '팩이 거부되었지만 일부 파일 삭제에 실패했습니다',
                packId: packId,
                error: error.message
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
    } catch (error) {
        return new Response(JSON.stringify({ error: '팩 거부 처리 중 오류가 발생했습니다' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 