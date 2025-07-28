// 팩 관련 API 핸들러들
import { createJsonResponse, createErrorResponse } from '../utils/helpers.js';
import { APP_CONFIG, ERROR_MESSAGES } from '../config/constants.js';

// 팩 리스트 조회
export async function handleGetPacks(request, env) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = APP_CONFIG.PACKS_PER_PAGE;
        const offset = (page - 1) * limit;
        
        const packList = await env.PLAKKER_KV.get('pack_list', 'json') || [];
        
        const startIndex = offset;
        const endIndex = offset + limit;
        const paginatedPacks = packList.slice(startIndex, endIndex).map(pack => {
            const convertedPack = { ...pack };
            
            // R2 URL을 절대 URL로 변환
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
            
            return convertedPack;
        });
        
        return createJsonResponse({
            packs: paginatedPacks,
            currentPage: page,
            totalPages: Math.ceil(packList.length / limit),
            hasNext: endIndex < packList.length,
            hasPrev: page > 1
        });
    } catch (error) {
        console.error('팩 리스트 조회 오류:', error);
        return createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, 500);
    }
}

// 개별 팩 조회
export async function handleGetPack(packId, env, request) {
    try {
        const url = new URL(request.url);
        const baseUrl = `${url.protocol}//${url.host}`;
        
        const pack = await env.PLAKKER_KV.get(`pack:${packId}`, 'json');
        
        if (!pack) {
            return createErrorResponse(ERROR_MESSAGES.PACK_NOT_FOUND, 404);
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
        
        return createJsonResponse(convertedPack);
    } catch (error) {
        console.error('팩 조회 오류:', error);
        return createErrorResponse(ERROR_MESSAGES.SERVER_ERROR, 500);
    }
}

// 팩 다운로드 (추후 구현)
export async function handleDownload(packId, env) {
    // TODO: ZIP 파일 생성 및 다운로드 기능 구현
    return createErrorResponse('다운로드 기능은 추후 구현 예정입니다', 501);
} 