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
        // PLAKKER_PENDING_KV에서 대기 중인 팩들 자동 처리
        await processPendingPacks(env);
        
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = 20; // 한 페이지당 20개
        const offset = (page - 1) * limit;
        
        // KV에서 모든 팩 키 가져오기
        const list = await env.PLAKKER_KV.list({
            prefix: 'pack_',
            limit: 1000
        });
        
        // 키들을 배열로 변환
        const packKeys = list.keys.map(key => key.name);
        
        // 모든 팩 데이터를 병렬로 가져오기
        const packPromises = packKeys.map(async (key) => {
            try {
                const packData = await env.PLAKKER_KV.get(key, 'json');
                return packData;
            } catch (error) {
                console.error(`팩 로드 실패 (${key}):`, error);
                return null;
            }
        });
        
        const allPacks = (await Promise.all(packPromises))
            .filter(pack => pack !== null && pack.status === 'approved') // 승인된 팩만 표시
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // 최신순 정렬
        
        // 페이지네이션 적용
        const totalPacks = allPacks.length;
        const paginatedPacks = allPacks.slice(offset, offset + limit);
        
        // 절대 URL로 변환
        const packsWithAbsoluteUrls = paginatedPacks.map(pack => 
            convertPackToAbsoluteUrls(pack, baseUrl)
        );
        
        return new Response(JSON.stringify({
            packs: packsWithAbsoluteUrls,
            currentPage: page,
            totalPages: Math.ceil(totalPacks / limit),
            totalPacks: totalPacks,
            hasNext: page < Math.ceil(totalPacks / limit)
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('팩 리스트 조회 오류:', error);
        return new Response(JSON.stringify({ 
            error: '팩 리스트를 불러오는데 실패했습니다',
            packs: [],
            currentPage: 1,
            totalPages: 0,
            totalPacks: 0,
            hasNext: false
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PLAKKER_PENDING_KV의 대기 중인 팩들을 자동으로 처리하는 함수
async function processPendingPacks(env) {
    try {
        // 대기 중인 모든 팩 키 가져오기
        const pendingList = await env.PLAKKER_PENDING_KV.list({
            prefix: 'pending_',
            limit: 1000
        });
        
        // 각 대기 중인 팩 처리
        for (const keyInfo of pendingList.keys) {
            try {
                const pendingPack = await env.PLAKKER_PENDING_KV.get(keyInfo.name, 'json');
                
                if (!pendingPack) continue;
                
                const { adminStatus } = pendingPack;
                
                if (adminStatus === 'approved') {
                    // 승인된 경우: PLAKKER_KV로 이동
                    const approvedPack = {
                        ...pendingPack,
                        status: 'approved',
                        approvedAt: new Date().toISOString()
                    };
                    delete approvedPack.adminStatus; // adminStatus 필드 제거
                    
                    await env.PLAKKER_KV.put(`pack_${pendingPack.id}`, JSON.stringify(approvedPack));
                    await env.PLAKKER_PENDING_KV.delete(keyInfo.name);
                    
                    console.log(`팩 자동 승인됨: ${pendingPack.id}`);
                    
                } else if (adminStatus === 'rejected') {
                    // 거부된 경우: 파일들 삭제하고 PLAKKER_PENDING_KV에서 제거
                    await deletePackFiles(env, pendingPack);
                    await env.PLAKKER_PENDING_KV.delete(keyInfo.name);
                    
                    console.log(`팩 자동 거부됨: ${pendingPack.id}`);
                }
                // 'pending' 상태인 경우는 그대로 유지
                
            } catch (error) {
                console.error(`대기 중인 팩 처리 실패 (${keyInfo.name}):`, error);
            }
        }
        
    } catch (error) {
        console.error('대기 중인 팩들 처리 중 오류:', error);
    }
}

// 팩의 파일들을 R2에서 삭제하는 함수
async function deletePackFiles(env, pack) {
    try {
        // 썸네일 삭제
        if (pack.thumbnail) {
            const thumbnailKey = pack.thumbnail.replace('/r2/', '');
            await env.PLAKKER_R2.delete(thumbnailKey);
        }
        
        // 이모티콘들 삭제
        if (pack.emoticons && Array.isArray(pack.emoticons)) {
            for (const emoticonUrl of pack.emoticons) {
                const emoticonKey = emoticonUrl.replace('/r2/', '');
                await env.PLAKKER_R2.delete(emoticonKey);
            }
        }
        
        console.log(`팩 파일들 삭제 완료: ${pack.id}`);
        
    } catch (error) {
        console.error(`팩 파일들 삭제 실패 (${pack.id}):`, error);
    }
}

// 특정 팩 조회
export async function handleGetPack(packId, env, request) {
    try {
        // PLAKKER_PENDING_KV에서 대기 중인 팩들 자동 처리
        await processPendingPacks(env);
        
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        
        // 먼저 승인된 팩에서 조회
        let pack = await env.PLAKKER_KV.get(`pack_${packId}`, 'json');
        
        // 승인된 팩이 없으면 대기 중인 팩에서 조회
        if (!pack) {
            const pendingPack = await env.PLAKKER_PENDING_KV.get(`pending_${packId}`, 'json');
            if (pendingPack && pendingPack.adminStatus === 'pending') {
                pack = {
                    ...pendingPack,
                    status: 'pending', // 대기 상태 명시
                    pendingNotice: '이 팩은 현재 승인 대기 중입니다. 목록에는 표시되지 않으며 승인 후 공개됩니다.'
                };
                delete pack.adminStatus; // 클라이언트에는 adminStatus 숨김
            }
        }
        
        if (!pack) {
            return new Response(JSON.stringify({ error: '팩을 찾을 수 없습니다' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 절대 URL로 변환
        const packWithAbsoluteUrls = convertPackToAbsoluteUrls(pack, baseUrl);
        
        return new Response(JSON.stringify(packWithAbsoluteUrls), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error(`팩 조회 오류 (${packId}):`, error);
        return new Response(JSON.stringify({ error: '팩 조회에 실패했습니다' }), {
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
        if (title.length > 50 || creator.length > 30) {
            return new Response(JSON.stringify({ error: '입력 항목이 허용된 길이를 초과했습니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 이모티콘 개수 제한 (최대 50개)
        if (emoticons.length > 50) {
            return new Response(JSON.stringify({ error: '이모티콘은 최대 50개까지 업로드할 수 있습니다' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // 파일 크기 검증 (25MB 제한)
        const maxFileSize = 25 * 1024 * 1024; // 25MB
        
        if (thumbnail.size > maxFileSize) {
            return new Response(JSON.stringify({ error: '썸네일 파일 크기가 너무 큽니다 (최대 25MB)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        for (const emoticon of emoticons) {
            if (emoticon.size > maxFileSize) {
                return new Response(JSON.stringify({ error: '이모티콘 파일 크기가 너무 큽니다 (최대 25MB)' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

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
            status: 'pending', // 업로드 시 대기 상태로 설정
            createdAt: new Date().toISOString()
        };
        
        // 새로운 PLAKKER_PENDING_KV에 대기 상태로 저장
        await env.PLAKKER_PENDING_KV.put(`pending_${packId}`, JSON.stringify({
            ...pack,
            adminStatus: 'pending' // Cloudflare에서 직접 수정할 값
        }));
        
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

// 관리자 API들은 제거됨 - 이제 Cloudflare KV에서 직접 관리
// 기존: handleGetPendingPacks, handleApprovePack, handleRejectPack 