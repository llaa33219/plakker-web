// API 핸들러들
import { 
    addCorsHeaders, 
    handleOptions, 
    toAbsoluteUrl, 
    convertPackToAbsoluteUrls,
    generateId,
    resizeImage,
    validateEmoticonWithGemini
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
export async function handleGetPacks(request, env) {
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

// 파일 업로드 처리
export async function handleUpload(request, env) {
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
        const accountId = env.CF_ACCOUNT_ID;
        
        if (!geminiApiKey) {
            return new Response(JSON.stringify({ 
                error: '이미지 검증 시스템이 활성화되어 있지 않습니다 (Gemini API 키 누락). 관리자에게 문의해주세요.' 
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        if (!accountId) {
            return new Response(JSON.stringify({ 
                error: 'AI Gateway 설정이 완료되지 않았습니다 (Cloudflare Account ID 누락). 관리자에게 문의해주세요.' 
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const packId = generateId();
        
        // 썸네일 처리
        let thumbnailBuffer = await thumbnail.arrayBuffer();
        
        // 썸네일 Gemini 검증 (필수)
        const thumbnailValidation = await validateEmoticonWithGemini(thumbnailBuffer, geminiApiKey, env);
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
            const validation = await validateEmoticonWithGemini(emoticonBuffer, geminiApiKey, env);
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
export async function handleDownload(packId, env) {
    return new Response(JSON.stringify({ error: '다운로드 기능은 추후 구현 예정입니다' }), {
        status: 501,
        headers: { 'Content-Type': 'application/json' }
    });
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
        return convertedPack;
    } catch (error) {
        return null;
    }
} 