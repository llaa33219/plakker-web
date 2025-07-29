import { HTML_TEMPLATES } from '../src/templates.js';
import { createHtmlResponse } from '../src/utils.js';

export async function onRequest() {
    return createHtmlResponse(HTML_TEMPLATES.base('API 문서', HTML_TEMPLATES.apiDocs()));
} 