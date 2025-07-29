import { CSS_STYLES } from '../../src/styles.js';
import { getPermissionsPolicyHeader } from '../../src/utils.js';

export async function onRequest() {
    const response = new Response(CSS_STYLES, {
        headers: { 'Content-Type': 'text/css; charset=utf-8' }
    });
    response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());
    return response;
} 