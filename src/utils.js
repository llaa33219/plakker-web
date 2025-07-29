// 유틸리티 함수들

// ID 생성 함수
export function generateId() {
    return 'pack_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 서버 측에서는 리사이즈를 하지 않음 (클라이언트에서 처리됨)
export async function resizeImage(imageBuffer, width = 150, height = 150) {
    // 클라이언트에서 이미 리사이즈된 이미지가 전송되므로 원본 반환
    return imageBuffer;
}

// Gemini API 테스트 함수
export async function testGeminiAPI(env) {
    const result = {
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'unknown',
        settings: {
            hasGeminiApiKey: !!env.GEMINI_API_KEY,
            geminiApiKeyLength: env.GEMINI_API_KEY ? env.GEMINI_API_KEY.length : 0
        }
    };

    // 필수 설정 확인
    if (!env.GEMINI_API_KEY) {
        result.test = {
            success: false,
            message: 'GEMINI_API_KEY가 설정되지 않았습니다. wrangler.toml에 API 키를 추가하거나 wrangler secret put을 사용하세요.',
            error: 'Missing GEMINI_API_KEY'
        };
    } else {
        // 실제 API 테스트
        try {
            const geminiApiKey = env.GEMINI_API_KEY;
            
            // Google AI Studio API 직접 호출
            const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
            
            result.test = {
                apiUrl,
                timestamp: new Date().toISOString()
            };
            
            console.log('Gemini API 테스트 시작:', {
                apiUrl,
                apiKeyLength: geminiApiKey.length
            });
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': geminiApiKey
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: 'Hello, this is a test message. Please respond with "TEST_SUCCESS".'
                        }]
                    }]
                })
            });
            
            const responseText = await response.text();
            
            result.test.response = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: responseText
            };
            
            console.log('Gemini API 응답:', {
                status: response.status,
                statusText: response.statusText,
                bodyPreview: responseText.substring(0, 200)
            });
            
            if (response.ok) {
                result.test.success = true;
                result.test.message = '✅ Gemini API 연결 성공!';
            } else {
                result.test.success = false;
                
                if (responseText.includes('User location is not supported')) {
                    result.test.message = `❌ 현재 지역에서는 Gemini API를 사용할 수 없습니다.

**해결 방법:**
1. VPN을 사용하여 지원되는 지역으로 접속
2. 지원되는 지역에서 서비스 이용`;
                } else if (response.status === 401 || response.status === 403) {
                    result.test.message = `❌ API 키 인증 실패 (HTTP ${response.status})
                    
**해결 방법:**
1. Google AI Studio에서 새 API 키 생성
2. API 키가 Gemini API 사용 권한을 가지고 있는지 확인
3. wrangler.toml 또는 wrangler secret의 GEMINI_API_KEY 업데이트`;
                } else {
                    result.test.message = `❌ API 호출 실패 (HTTP ${response.status}): ${responseText}`;
                }
            }
            
        } catch (error) {
            console.error('Gemini API 테스트 오류:', error);
            result.test = {
                success: false,
                message: `❌ API 호출 중 네트워크 오류 발생: ${error.message}
                
**해결 방법:**
1. 인터넷 연결 확인
2. Google AI Studio 서비스 상태 확인
3. 방화벽이나 프록시 설정 확인`,
                error: error.toString()
            };
        }
    }
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>AI Gateway 테스트</title>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
            .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
            .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
            .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
            pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
            .section { margin: 20px 0; }
            h2 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            h3 { color: #555; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Gemini API 연결 테스트</h1>
            
            <div class="section">
                <h2>설정 현황</h2>
                <div class="status ${result.settings.hasGeminiApiKey ? 'success' : 'error'}">
                    <strong>전체 설정 상태:</strong> ${result.settings.hasGeminiApiKey ? '설정 완료' : '설정 미완료'}
                </div>
                
                <h3>환경 변수</h3>
                <ul>
                    <li><strong>GEMINI_API_KEY:</strong> ${result.settings.hasGeminiApiKey ? `설정됨 (${result.settings.geminiApiKeyLength}자)` : '미설정'}</li>
                    <li><strong>ENVIRONMENT:</strong> ${result.environment}</li>
                </ul>
            </div>
            
            ${result.error ? `
                <div class="section">
                    <h2>설정 오류</h2>
                    <div class="status error">
                        ${result.error}
                    </div>
                    <div class="info">
                        <h3>해결 방법:</h3>
                        <ol>
                            <li><a href="https://ai.google.dev/" target="_blank">Google AI Studio</a>에서 API 키 생성</li>
                            <li>wrangler.toml에 GEMINI_API_KEY 설정</li>
                        </ol>
                    </div>
                </div>
            ` : ''}
            
            ${result.test ? `
                <div class="section">
                    <h2>API 연결 테스트</h2>
                    <div class="status ${result.test.success ? 'success' : 'error'}">
                        <strong>테스트 결과:</strong> ${result.test.message}
                    </div>
                    
                    <h3>요청 정보</h3>
                    <p><strong>API URL:</strong> ${result.test.apiUrl || 'N/A'}</p>
                    
                    ${result.test.response ? `
                        <h3>응답 정보</h3>
                        <p><strong>HTTP Status:</strong> ${result.test.response.status} ${result.test.response.statusText}</p>
                        <pre>${JSON.stringify(result.test.response, null, 2)}</pre>
                    ` : ''}
                    
                    ${result.test.error ? `
                        <h3>오류 정보</h3>
                        <pre>${result.test.error}</pre>
                    ` : ''}
                </div>
            ` : ''}
            
            <div class="section">
                <h2>전체 결과 (JSON)</h2>
                <pre>${JSON.stringify(result, null, 2)}</pre>
            </div>
            
            <div class="section">
                <p><a href="/">← 홈으로 돌아가기</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// Gemini 2.5 Flash API를 통한 이모티콘 검증
export async function validateEmoticonWithGemini(imageBuffer, apiKey, env) {
    try {
        // 이미지 크기 제한 (20MB)
        if (imageBuffer.byteLength > 20 * 1024 * 1024) {
            return {
                isValid: false,
                reason: '이미지 파일이 너무 큽니다 (20MB 이하만 허용)',
                error: 'File too large: ' + imageBuffer.byteLength + ' bytes'
            };
        }
        
        // 이미지를 base64로 인코딩 (큰 파일에 안전한 방식)
        const uint8Array = new Uint8Array(imageBuffer);
        let binary = '';
        const chunkSize = 8192; // 8KB씩 처리
        
        for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize);
            binary += String.fromCharCode.apply(null, chunk);
        }
        
        const base64Image = btoa(binary);
        
        // 이미지 타입 감지 (간단한 매직 바이트 체크)
        let mimeType = 'image/jpeg'; // 기본값
        if (uint8Array[0] === 0x89 && uint8Array[1] === 0x50) {
            mimeType = 'image/png';
        } else if (uint8Array[0] === 0x47 && uint8Array[1] === 0x49) {
            mimeType = 'image/gif';
        } else if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49) {
            mimeType = 'image/webp';
        }
        
        const promptText = '이 이미지가 이모티콘/스티커로 사용하기에 부적절한 콘텐츠가 포함되어 있는지 분석해주세요.\n\n' +
            '부적절한 콘텐츠 기준:\n' +
            '1. 정치적인 내용 (정치인, 정치 관련 상징, 정치적 메시지 등)\n' +
            '2. 선정적인 내용 (성적인 표현, 노출, 성인 콘텐츠 등)\n' +
            '3. 잔인한 내용 (폭력, 피, 상해, 죽음 관련 등)\n' +
            '4. 역겨운 내용 (혐오스러운 표현, 혐오 발언, 차별적 내용 등)\n' +
            '5. 불법적인 내용 (마약, 불법 활동 등)\n\n' +
            '위 기준에 해당하지 않는 모든 이미지는 적절한 것으로 분류해주세요.\n' +
            '(일반 사진, 음식, 동물, 풍경, 캐릭터, 만화, 밈, 텍스트 등은 모두 적절함)\n\n' +
            '응답은 반드시 다음 JSON 형식으로만 해주세요:\n' +
            '{"classification": "APPROPRIATE|INAPPROPRIATE", "reason": "분류 이유를 한 줄로"}';
        
        // Google AI Studio API 직접 호출
        const apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';
        
        // 디버깅 로그
        console.log('Gemini API 직접 호출:', {
            apiUrl,
            apiKeyLength: apiKey ? apiKey.length : 0
        });
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: promptText
                        },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Image
                            }
                        }
                    ]
                }]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API 응답 오류:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: errorText
            });
            
            // 지역 제한 오류인지 확인
            if (errorText.includes('User location is not supported')) {
                return { 
                    isValid: false, 
                    reason: '현재 지역에서는 AI 검증 서비스를 사용할 수 없습니다. 다른 지역에서 접속해 주세요.',
                    error: '지역 제한: ' + errorText
                };
            }
            
            return { 
                isValid: false, 
                reason: 'AI 검증 시스템 연결 오류 (상세: ' + errorText + ')',
                error: 'HTTP ' + response.status + ': ' + errorText
            };
        }
        
        const result = await response.json();
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
            return { 
                isValid: false, 
                reason: 'AI 응답을 해석할 수 없습니다',
                error: 'Empty response content'
            };
        }
        
        // JSON 응답 파싱
        try {
            const parsed = JSON.parse(content.trim());
            const isValid = parsed.classification === 'APPROPRIATE';
            return {
                isValid,
                reason: parsed.reason || '분류 완료',
                classification: parsed.classification
            };
        } catch (parseError) {
            // JSON 파싱 실패 시 텍스트에서 분류 추출
            const upperContent = content.toUpperCase();
            if (upperContent.includes('INAPPROPRIATE')) {
                return { isValid: false, reason: '부적절한 콘텐츠로 분류됨' };
            } else if (upperContent.includes('APPROPRIATE')) {
                return { isValid: true, reason: '텍스트 분석으로 적절한 콘텐츠로 승인' };
            } else {
                // 파싱 실패하고 명확하지 않은 경우 검증 실패로 처리
                return { 
                    isValid: false, 
                    reason: 'AI 응답 형식 오류로 검증 실패',
                    error: 'JSON parse failed: ' + parseError.message
                };
            }
        }
        
    } catch (error) {
        console.error('Gemini validation error:', error);
        // API 오류 시 검증 실패로 처리 (보안 우선)
        return { 
            isValid: false, 
            reason: 'AI 검증 시스템 연결 오류',
            error: error.message || 'Unknown error'
        };
    }
}

// URL을 절대 URL로 변환하는 함수
export function toAbsoluteUrl(url, baseUrl) {
    if (!url) return url;
    
    // 이미 절대 URL인 경우
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // 다른 도메인의 URL이면 현재 도메인으로 변환
        try {
            const urlObj = new URL(url);
            const baseUrlObj = new URL(baseUrl);
            
            // 같은 도메인이면 그대로 반환
            if (urlObj.host === baseUrlObj.host) {
                return url;
            }
            
            // 다른 도메인이면 현재 도메인으로 변환 (경로는 유지)
            return baseUrl + urlObj.pathname;
        } catch (e) {
            // URL 파싱 실패시 원본 반환
            return url;
        }
    }
    
    return baseUrl + url; // 상대 URL을 절대 URL로 변환
}

// 팩 객체의 URL들을 절대 URL로 변환
export function convertPackToAbsoluteUrls(pack, baseUrl) {
    if (!pack) return pack;
    
    const convertedPack = { ...pack };
    
    if (convertedPack.thumbnail) {
        convertedPack.thumbnail = toAbsoluteUrl(convertedPack.thumbnail, baseUrl);
    }
    
    if (convertedPack.emoticons && Array.isArray(convertedPack.emoticons)) {
        convertedPack.emoticons = convertedPack.emoticons.map(url => toAbsoluteUrl(url, baseUrl));
    }
    
    return convertedPack;
}

// HTML 응답에 보안 헤더 추가
export function createHtmlResponse(content, status = 200) {
    const response = new Response(content, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
    
    // 보안 헤더 추가
    const securityHeaders = {
        'Permissions-Policy': getPermissionsPolicyHeader(),
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    
    return response;
}

// Permissions-Policy 헤더 문자열 생성
export function getPermissionsPolicyHeader() {
    return [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'fullscreen=(self)'
    ].join(', ');
}

// CORS 및 보안 헤더 추가 함수 (크롬 확장 프로그램 지원 개선)
export function addCorsHeaders(response) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Date, Server, X-RateLimit-Limit, X-RateLimit-Remaining',
        'Access-Control-Max-Age': '86400', // 24시간
        'Access-Control-Allow-Credentials': 'false',
        'Permissions-Policy': getPermissionsPolicyHeader(),
        'Vary': 'Origin'
    };
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    
    // Content-Type이 설정되지 않았다면 JSON으로 설정
    if (!response.headers.get('Content-Type') && response.body) {
        try {
            JSON.parse(response.body);
            response.headers.set('Content-Type', 'application/json; charset=utf-8');
        } catch (e) {
            // JSON이 아니면 그대로 둠
        }
    }
    
    return response;
}

// OPTIONS preflight 요청 처리
export function handleOptions() {
    return addCorsHeaders(new Response(null, { status: 204 }));
} 

// IP 기반 업로드 제한 관련 함수들

/**
 * 클라이언트의 실제 IP 주소를 가져옵니다.
 * Cloudflare를 통한 요청의 경우 적절한 헤더에서 IP를 추출합니다.
 */
export async function getClientIP(request) {
    // Cloudflare에서 제공하는 실제 클라이언트 IP 헤더들을 확인
    return request.headers.get('CF-Connecting-IP') || 
           request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
           request.headers.get('X-Real-IP') || 
           '127.0.0.1'; // 기본값
}

/**
 * IP 주소를 안전하게 해시화하는 함수
 * 
 * 보안 조치:
 * - SHA-256 해시 알고리즘 사용
 * - Salt 추가로 레인보우 테이블 공격 방지
 * - 원본 IP 복구 불가능
 * - 동일한 IP는 항상 동일한 해시값 생성 (추적 가능)
 */
export async function hashIP(ip) {
    // Salt를 추가하여 레인보우 테이블 공격 방지
    const salt = 'plakker_ip_salt_2025_secure_hash';
    const dataToHash = salt + ip + salt; // 양쪽에 salt 추가
    
    // TextEncoder를 사용하여 문자열을 Uint8Array로 변환
    const encoder = new TextEncoder();
    const data = encoder.encode(dataToHash);
    
    // SHA-256 해시 생성
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // 해시를 16진수 문자열로 변환
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}

/**
 * 로깅용 IP 마스킹 함수
 * 
 * 보안 조치:
 * - 원본 IP 주소를 부분적으로 마스킹하여 개인정보 보호
 * - IPv4: 뒤 2옥텟 마스킹 (예: 192.168.*.*)
 * - IPv6: 뒤 4그룹 마스킹 (예: 2001:db8:85a3:8d3::****)
 * - 디버깅 시에도 완전한 IP 노출 방지
 */
export function maskIP(ip) {
    if (!ip || ip === '127.0.0.1') {
        return 'localhost';
    }
    
    // IPv4 마스킹 (예: 192.168.1.100 -> 192.168.*.*)
    if (ip.includes('.')) {
        const parts = ip.split('.');
        if (parts.length === 4) {
            return `${parts[0]}.${parts[1]}.*.*`;
        }
    }
    
    // IPv6 마스킹 (첫 4그룹만 표시)
    if (ip.includes(':')) {
        const parts = ip.split(':');
        if (parts.length >= 4) {
            return `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}::****`;
        }
    }
    
    // 알 수 없는 형식의 경우 앞 4자리만 표시
    return ip.substring(0, 4) + '****';
}

export function getTodayDateString() {
    // UTC 기준으로 오늘 날짜 문자열 생성 (YYYY-MM-DD)
    const today = new Date();
    return today.getUTCFullYear() + '-' + 
           String(today.getUTCMonth() + 1).padStart(2, '0') + '-' + 
           String(today.getUTCDate()).padStart(2, '0');
}

/**
 * IP별 업로드 제한 확인
 * 
 * 보안 조치:
 * - IP 주소는 해시화되어 저장됨 (원본 IP 복구 불가능)
 * - KV 스토리지에 해시값만 저장되므로 외부 유출 시에도 안전
 * - 오류 발생 시 IP 마스킹 처리된 로그만 기록
 */
export async function checkUploadLimit(env, ip, limit = 5) {
    try {
        const hashedIP = await hashIP(ip);
        const dateKey = getTodayDateString();
        const uploadKey = `uploads:${hashedIP}:${dateKey}`;
        
        const currentCount = await env.PLAKKER_KV.get(uploadKey);
        const count = currentCount ? parseInt(currentCount) : 0;
        
        return {
            allowed: count < limit,
            currentCount: count,
            limit: limit,
            remaining: Math.max(0, limit - count)
        };
    } catch (error) {
        console.error('업로드 제한 확인 오류:', maskIP(ip), error.message);
        // 오류 시에는 업로드를 허용 (fail-open)
        return {
            allowed: true,
            currentCount: 0,
            limit: limit,
            remaining: limit
        };
    }
}

/**
 * IP별 업로드 카운트 증가
 * 
 * 보안 조치:
 * - IP 주소는 해시화되어 저장됨
 * - TTL 설정으로 24시간 후 자동 삭제 (데이터 최소화)
 * - 오류 발생 시 IP 마스킹 처리된 로그만 기록
 */
export async function incrementUploadCount(env, ip) {
    try {
        const hashedIP = await hashIP(ip);
        const dateKey = getTodayDateString();
        const uploadKey = `uploads:${hashedIP}:${dateKey}`;
        
        const currentCount = await env.PLAKKER_KV.get(uploadKey);
        const count = currentCount ? parseInt(currentCount) : 0;
        const newCount = count + 1;
        
        // 24시간 후 자동 삭제되도록 TTL 설정 (86400초 = 24시간)
        await env.PLAKKER_KV.put(uploadKey, newCount.toString(), {
            expirationTtl: 86400
        });
        
        return newCount;
    } catch (error) {
        console.error('업로드 카운트 증가 오류:', maskIP(ip), error.message);
        return 0;
    }
} 