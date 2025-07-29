import { handlePackDetail } from '../../src/api.js';
import { HTML_TEMPLATES } from '../../src/templates.js';
import { createHtmlResponse } from '../../src/utils.js';

export async function onRequest(context) {
    const { request, env, params } = context;
    const packId = params.id;
    
    const pack = await handlePackDetail(packId, env, request);
    if (!pack) {
        return createHtmlResponse('팩을 찾을 수 없습니다', 404);
    }
    return createHtmlResponse(HTML_TEMPLATES.base(`${pack.title} - 이모티콘 팩`, HTML_TEMPLATES.detail(pack)));
} 