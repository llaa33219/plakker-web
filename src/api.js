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
    convertToSafeUnicode
} from './utils.js';

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
                console.error(`Failed to load pack ${key.name}:`, error);
                return null;
            }
        });
        
        const allPacks = (await Promise.all(packPromises))
            .filter(pack => pack !== null) // null 제거 (로드 실패한 팩들)
            .filter(pack => pack.status === 'approved') // 승인된 팩만 표시
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
        console.error('팩 리스트 조회 오류:', error);
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
        
        // 승인되지 않은 팩은 접근 불가
        if (pack.status !== 'approved') {
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
        const clientIP = await getClientIP(request);
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
        console.error('업로드 오류 (IP:', maskIP(clientIP), '):', error.message);
        return new Response(JSON.stringify({ error: '업로드 처리 중 오류가 발생했습니다: ' + error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 업로드 제한 상태 확인 API
export async function handleUploadLimitStatus(request, env) {
    try {
        const clientIP = await getClientIP(request);
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
        const clientIP = await getClientIP(request);
        console.error('업로드 제한 상태 확인 오류 (IP:', maskIP(clientIP), '):', error.message);
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

// 관리자 API: 대기 중인 팩 리스트 조회
export async function handleGetPendingPacks(request, env) {
    try {
        // 간단한 인증 체크 (실제 프로덕션에서는 더 강화된 인증 필요)
        const authHeader = request.headers.get('Authorization');
        const adminPassword = env.ADMIN_PASSWORD;
        
        if (!adminPassword || authHeader !== `Bearer ${adminPassword}`) {
            return new Response(JSON.stringify({ error: '관리자 권한이 필요합니다' }), {
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
                console.error(`Failed to load pack ${key.name}:`, error);
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
        console.error('대기 중인 팩 리스트 조회 오류:', error);
        return new Response(JSON.stringify({ error: '팩 리스트 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 관리자 API: 팩 승인
export async function handleApprovePack(request, env) {
    try {
        // 간단한 인증 체크
        const authHeader = request.headers.get('Authorization');
        const adminPassword = env.ADMIN_PASSWORD;
        
        if (!adminPassword || authHeader !== `Bearer ${adminPassword}`) {
            return new Response(JSON.stringify({ error: '관리자 권한이 필요합니다' }), {
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
        console.error('팩 승인 오류:', error);
        return new Response(JSON.stringify({ error: '팩 승인 처리 중 오류가 발생했습니다' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 관리자 API: 팩 거부
export async function handleRejectPack(request, env) {
    try {
        // 간단한 인증 체크
        const authHeader = request.headers.get('Authorization');
        const adminPassword = env.ADMIN_PASSWORD;
        
        if (!adminPassword || authHeader !== `Bearer ${adminPassword}`) {
            return new Response(JSON.stringify({ error: '관리자 권한이 필요합니다' }), {
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
        
        // 상태를 거부로 변경
        pack.status = 'rejected';
        pack.rejectedAt = new Date().toISOString();
        pack.rejectionReason = reason || '승인 기준에 맞지 않음';
        
        // KV에 업데이트된 팩 정보 저장
        await env.PLAKKER_KV.put(`pack_${packId}`, JSON.stringify(pack));
        
        // 선택적으로 R2에서 파일들을 삭제할 수도 있음 (여기서는 보관)
        
        return new Response(JSON.stringify({ 
            success: true, 
            message: '팩이 거부되었습니다',
            packId: packId
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('팩 거부 오류:', error);
        return new Response(JSON.stringify({ error: '팩 거부 처리 중 오류가 발생했습니다' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
} 