import { HTML_TEMPLATES } from '../src/templates.js';
import { createHtmlResponse } from '../src/utils.js';

export async function onRequest() {
    return createHtmlResponse(HTML_TEMPLATES.base('문의하기', HTML_TEMPLATES.contact()));
} 