import { JS_CLIENT } from '../../src/client.js';
import { getPermissionsPolicyHeader } from '../../src/utils.js';

export async function onRequest() {
    const response = new Response(JS_CLIENT, {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
    });
    response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());
    return response;
} 