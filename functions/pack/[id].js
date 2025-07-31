import { handleGetPack } from '../../src/api.js';
import { HTML_TEMPLATES } from '../../src/templates.js';
import { createHtmlResponse } from '../../src/utils.js';

export async function onRequest(context) {
    const { request, env, params } = context;
    let packId = params.id;
    
    // pending_pack_ 접두사가 있으면 제거 (실제 packId 추출)
    if (packId.startsWith('pending_pack_')) {
        packId = packId.replace('pending_pack_', '');
    }
    
    try {
        // handleGetPack을 사용하여 승인된 팩과 대기 중인 팩 모두 조회
        const response = await handleGetPack(packId, env, request);
        
        if (response.status === 404) {
            return createHtmlResponse('팩을 찾을 수 없습니다', 404);
        }
        
        if (response.status !== 200) {
            return createHtmlResponse('팩을 불러오는데 실패했습니다', 500);
        }
        
        const pack = await response.json();
        
        return createHtmlResponse(HTML_TEMPLATES.base(`${pack.title} - 이모티콘 팩`, HTML_TEMPLATES.detail(pack)));
        
    } catch (error) {
        console.error('팩 페이지 로드 실패:', error);
        return createHtmlResponse('팩을 불러오는데 실패했습니다', 500);
    }
} 