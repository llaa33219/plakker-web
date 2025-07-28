// 업로드 관련 핸들러
import { createJsonResponse, createErrorResponse, generateId } from '../utils/helpers.js';
import { validateImageWithGemini } from '../utils/ai-gateway.js';
import { APP_CONFIG, ERROR_MESSAGES } from '../config/constants.js';

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
        if (!title || !creator || !thumbnail || emoticons.length < APP_CONFIG.MIN_EMOTICONS) {
            return createErrorResponse('필수 항목이 누락되었습니다');
        }
        
        // 환경 설정 확인
        const envCheck = validateEnvironment(env);
        if (!envCheck.valid) {
            return createErrorResponse(envCheck.error, 503);
        }
        
        const packId = generateId();
        
        // 썸네일 처리
        const thumbnailResult = await processThumbnail(thumbnail, packId, env);
        if (!thumbnailResult.success) {
            return createErrorResponse(thumbnailResult.error);
        }
        
        // 이모티콘들 처리
        const emoticonResult = await processEmoticons(emoticons, packId, env, baseUrl);
        
        // 검증 후 최소 개수 확인
        if (emoticonResult.validEmoticons.length < APP_CONFIG.MIN_EMOTICONS) {
            let errorMessage = `유효한 이미지가 ${emoticonResult.validEmoticons.length}개뿐입니다. 최소 ${APP_CONFIG.MIN_EMOTICONS}개가 필요합니다.`;
            if (emoticonResult.rejectedEmoticons.length > 0) {
                errorMessage += '\n\n거부된 이미지들:\n';
                emoticonResult.rejectedEmoticons.forEach(rejected => {
                    errorMessage += `- ${rejected.fileName}: ${rejected.reason}\n`;
                });
            }
            return createErrorResponse(errorMessage);
        }
        
        // 팩 정보 저장
        const pack = {
            id: packId,
            title,
            creator,
            creatorLink,
            thumbnail: `${baseUrl}/r2/${thumbnailResult.key}`,
            emoticons: emoticonResult.validEmoticons,
            validationInfo: {
                totalSubmitted: emoticons.length,
                approved: emoticonResult.validEmoticons.length,
                rejected: emoticonResult.rejectedEmoticons.length,
                rejectedItems: emoticonResult.rejectedEmoticons
            },
            createdAt: new Date().toISOString()
        };
        
        // KV에 저장
        await savePackToKV(pack, env);
        
        let successMessage = '이모티콘 팩이 성공적으로 업로드되었습니다!';
        if (emoticonResult.rejectedEmoticons.length > 0) {
            successMessage += ` (${emoticonResult.rejectedEmoticons.length}개 이미지가 검증을 통과하지 못했습니다)`;
        }
        
        return createJsonResponse({ 
            success: true, 
            id: packId,
            message: successMessage,
            validationInfo: pack.validationInfo
        });
        
    } catch (error) {
        console.error('업로드 오류:', error);
        return createErrorResponse('업로드 처리 중 오류가 발생했습니다: ' + error.message, 500);
    }
}

// 환경 설정 검증
function validateEnvironment(env) {
    if (!env.GEMINI_API_KEY) {
        return {
            valid: false,
            error: '이미지 검증 시스템이 활성화되어 있지 않습니다 (Gemini API 키 누락). 관리자에게 문의해주세요.'
        };
    }
    
    if (!env.CF_ACCOUNT_ID) {
        return {
            valid: false,
            error: 'AI Gateway 설정이 완료되지 않았습니다 (Cloudflare Account ID 누락). 관리자에게 문의해주세요.'
        };
    }
    
    return { valid: true };
}

// 썸네일 처리
async function processThumbnail(thumbnail, packId, env) {
    try {
        let thumbnailBuffer = await thumbnail.arrayBuffer();
        
        // AI 검증
        const validation = await validateImageWithGemini(thumbnailBuffer, thumbnail.name || 'thumbnail', env);
        if (!validation.success) {
            return { success: false, error: 'AI 검증 서비스 오류: ' + validation.error };
        }
        
        if (!validation.appropriate) {
            return { success: false, error: '썸네일 검증 실패: ' + validation.reason };
        }
        
        // 리사이즈 및 업로드
        thumbnailBuffer = await resizeImage(thumbnailBuffer, 200, 200);
        const thumbnailKey = `thumbnails/${packId}_thumbnail`;
        
        await env.PLAKKER_R2.put(thumbnailKey, thumbnailBuffer, {
            httpMetadata: { contentType: thumbnail.type }
        });
        
        return { success: true, key: thumbnailKey };
    } catch (error) {
        return { success: false, error: '썸네일 처리 중 오류: ' + error.message };
    }
}

// 이모티콘들 처리
async function processEmoticons(emoticons, packId, env, baseUrl) {
    const validEmoticons = [];
    const rejectedEmoticons = [];
    
    for (let i = 0; i < emoticons.length; i++) {
        const emoticon = emoticons[i];
        
        try {
            let emoticonBuffer = await emoticon.arrayBuffer();
            
            // AI 검증
            const validation = await validateImageWithGemini(emoticonBuffer, emoticon.name || `이미지 ${i + 1}`, env);
            
            if (!validation.success) {
                rejectedEmoticons.push({
                    fileName: emoticon.name || `이미지 ${i + 1}`,
                    reason: 'AI 검증 오류: ' + validation.error
                });
                continue;
            }
            
            if (!validation.appropriate) {
                rejectedEmoticons.push({
                    fileName: emoticon.name || `이미지 ${i + 1}`,
                    reason: validation.reason
                });
                continue;
            }
            
            // 리사이즈 및 업로드
            emoticonBuffer = await resizeImage(emoticonBuffer, 150, 150);
            const emoticonKey = `emoticons/${packId}_${validEmoticons.length}`;
            
            await env.PLAKKER_R2.put(emoticonKey, emoticonBuffer, {
                httpMetadata: { contentType: emoticon.type }
            });
            
            validEmoticons.push(`${baseUrl}/r2/${emoticonKey}`);
            
        } catch (error) {
            rejectedEmoticons.push({
                fileName: emoticon.name || `이미지 ${i + 1}`,
                reason: '처리 중 오류: ' + error.message
            });
        }
    }
    
    return { validEmoticons, rejectedEmoticons };
}

// KV에 팩 정보 저장
async function savePackToKV(pack, env) {
    // 개별 팩 정보 저장
    await env.PLAKKER_KV.put(`pack:${pack.id}`, JSON.stringify(pack));
    
    // 팩 리스트 업데이트
    const packList = await env.PLAKKER_KV.get('pack_list', 'json') || [];
    packList.unshift({
        id: pack.id,
        title: pack.title,
        creator: pack.creator,
        thumbnail: pack.thumbnail,
        createdAt: pack.createdAt
    });
    await env.PLAKKER_KV.put('pack_list', JSON.stringify(packList));
}

// 이미지 리사이즈 함수 (임시 - 실제로는 별도 유틸리티로 분리)
async function resizeImage(buffer, maxWidth, maxHeight) {
    // TODO: 실제 이미지 리사이즈 구현
    // 현재는 원본 반환
    return buffer;
} 