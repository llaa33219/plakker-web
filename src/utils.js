// 유틸리티 함수들

// ID 생성 함수
export function generateId() {
    return 'pack_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 캐시 무효화를 위한 버전 생성 함수들
export function generateCacheVersion() {
    const now = new Date();
    const timestamp = now.getTime();
    const dateString = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeString = now.toTimeString().slice(0, 8).replace(/:/g, '');
    
    // 날짜 + 시간 + 타임스탬프 마지막 4자리
    return dateString + timeString + timestamp.toString().slice(-4);
}

export function generateContentHash(content) {
    // 간단한 해시 함수 (실제 프로덕션에서는 crypto.subtle.digest 사용 권장)
    let hash = 0;
    if (content.length === 0) return hash.toString();
    
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32비트 정수로 변환
    }
    
    return Math.abs(hash).toString(36);
}

export function getCacheKey(type = 'static') {
    const version = generateCacheVersion();
    return `${type}_${version}`;
}

// WebP 파일이 애니메이션인지 확인하는 함수
export function isAnimatedWebP(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // WebP 파일인지 확인 (RIFF....WEBP)
    if (uint8Array.length < 12) return false;
    
    const riffHeader = String.fromCharCode(...uint8Array.slice(0, 4));
    const webpHeader = String.fromCharCode(...uint8Array.slice(8, 12));
    
    if (riffHeader !== 'RIFF' || webpHeader !== 'WEBP') {
        return false;
    }
    
    // ANIM 청크를 찾아 애니메이션 여부 확인
    for (let i = 12; i < uint8Array.length - 4; i++) {
        const chunkType = String.fromCharCode(...uint8Array.slice(i, i + 4));
        if (chunkType === 'ANIM') {
            return true;
        }
    }
    
    return false;
}

// 애니메이션 파일인지 확인 (GIF 또는 애니메이션 WebP)
export function isAnimatedImage(file, arrayBuffer) {
    if (!file || !file.type) return false;
    
    const fileType = file.type.toLowerCase();
    
    // GIF는 항상 애니메이션으로 처리
    if (fileType === 'image/gif') {
        return true;
    }
    
    // WebP의 경우 애니메이션 여부 확인
    if (fileType === 'image/webp' && arrayBuffer) {
        return isAnimatedWebP(arrayBuffer);
    }
    
    return false;
}

// HTML 특수문자 이스케이프 함수 (이제 유니코드 변환된 텍스트용)
export function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    
    // 이미 안전한 유니코드로 변환된 텍스트는 그대로 반환
    // 추가로 남은 위험 요소만 이스케이프
    return text
        .replace(/&(?![a-zA-Z0-9#]{1,7};)/g, '&amp;') // 이미 인코딩된 것은 제외
        .replace(/\//g, '&#x2F;');
}

// HTML 특수문자를 시각적으로 유사한 유니코드 문자로 변환 (실행 방지하면서 외형 유지)
export function convertToSafeUnicode(text) {
    if (typeof text !== 'string') return '';
    
    return text
        .replace(/</g, '\uFF1C')    // 전각 부등호 (U+FF1C) ＜
        .replace(/>/g, '\uFF1E')    // 전각 부등호 (U+FF1E) ＞
        .replace(/"/g, '\u201C')    // 좌측 큰따옴표 (U+201C) "
        .replace(/'/g, '\u2018')    // 좌측 작은따옴표 (U+2018) '
        .replace(/&/g, '\uFF06');   // 전각 앰퍼샌드 (U+FF06) ＆
}

// 입력 텍스트 검증 및 안전화 함수
export function sanitizeTextInput(text, maxLength = 100) {
    if (typeof text !== 'string') return '';
    
    // 앞뒤 공백 제거
    text = text.trim();
    
    // 길이 제한
    if (text.length > maxLength) {
        text = text.substring(0, maxLength);
    }
    
    // 연속된 공백을 하나로 변환
    text = text.replace(/\s+/g, ' ');
    
    // 위험한 스크립트 관련 키워드 제거
    text = text.replace(/javascript:/gi, '');
    text = text.replace(/data:/gi, '');
    text = text.replace(/vbscript:/gi, '');
    
    // HTML 특수문자를 안전한 유니코드로 변환
    text = convertToSafeUnicode(text);
    
    return text.trim();
}

// URL 검증 함수 - 개선된 버전
export function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';
    
    url = url.trim();
    
    // 빈 문자열이면 그대로 반환
    if (!url) return '';
    
    // http:// 또는 https://로 시작하지 않으면 https:// 추가
    if (!url.match(/^https?:\/\//i)) {
        url = 'https://' + url;
    }
    
    try {
        const urlObj = new URL(url);
        // 허용된 프로토콜만 허용
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return '';
        }
        
        // 기본적인 도메인 검증 - 점이 포함되어 있고 유효한 문자만 포함
        const hostname = urlObj.hostname;
        if (!hostname || hostname.length === 0) {
            return '';
        }
        
        // 도메인이 최소한의 형식을 갖추고 있는지 확인 (예: example.com)
        // 너무 엄격하지 않게 기본적인 패턴만 확인
        if (!hostname.includes('.') || hostname.startsWith('.') || hostname.endsWith('.')) {
            return '';
        }
        
        // 악의적인 프로토콜이나 스크립트 패턴 차단
        const fullUrl = urlObj.href.toLowerCase();
        const dangerousPatterns = [
            'javascript:', 'data:', 'file:', 'ftp:', 'ftps:',
            'vbscript:', 'about:', 'chrome:', 'chrome-extension:'
        ];
        
        for (const pattern of dangerousPatterns) {
            if (fullUrl.startsWith(pattern)) {
                return '';
            }
        }
        
        return urlObj.href;
    } catch (error) {
        // URL 파싱에 실패한 경우, 기본적인 형식 검증만 수행
        // 완전히 거부하지 말고 기본적인 웹 URL 패턴인지 확인
        
        // 기본적인 웹 URL 패턴 검증 (더 관대함)
        // 도메인.확장자 형태의 기본 패턴
        const basicUrlPattern = /^https?:\/\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]+\.[a-zA-Z]{2,}[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=%]*$/i;
        
        if (basicUrlPattern.test(url)) {
            return url;
        }
        
        return '';
    }
}

// 서버 측에서는 리사이즈를 하지 않음 (클라이언트에서 처리됨)
export async function resizeImage(imageBuffer, width = 150, height = 150) {
    // 클라이언트에서 이미 리사이즈된 이미지가 전송되므로 원본 반환
    return imageBuffer;
}

// Hugging Face Llama 4 API 테스트 함수
export async function testLlamaAPI(env) {
    const result = {
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT || 'unknown',
        settings: {
            hasHfToken: !!env.HF_TOKEN,
            hfTokenLength: env.HF_TOKEN ? env.HF_TOKEN.length : 0
        }
    };

    // 필수 설정 확인
    if (!env.HF_TOKEN) {
        result.test = {
            success: false,
            message: 'HF_TOKEN이 설정되지 않았습니다. Cloudflare 대시보드에서 환경변수를 추가하거나 wrangler secret put을 사용하세요.',
            error: 'Missing HF_TOKEN'
        };
    } else {
        // 실제 API 테스트
        try {
            const hfToken = env.HF_TOKEN;
            
            // Hugging Face Llama 4 API 테스트
            const apiUrl = 'https://router.huggingface.co/v1/chat/completions';
            
            result.test = {
                apiUrl,
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${hfToken}`
                },
                body: JSON.stringify({
                    model: "meta-llama/Llama-4-Scout-17B-16E-Instruct:fireworks-ai",
                    messages: [{
                        role: "user",
                        content: "Hello, this is a test message. Please respond with TEST_SUCCESS."
                    }],
                    max_tokens: 50
                })
            });
            
            const responseText = await response.text();
            
            result.test.response = {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                body: responseText
            };
            
            if (response.ok) {
                result.test.success = true;
                result.test.message = '✅ Llama 4 API 연결 성공!';
            } else {
                result.test.success = false;
                
                if (response.status === 401 || response.status === 403) {
                    result.test.message = `❌ API 토큰 인증 실패 (HTTP ${response.status})
                    
**해결 방법:**
1. Hugging Face에서 새 토큰 생성
2. 토큰이 Inference API 사용 권한을 가지고 있는지 확인
3. Cloudflare 대시보드에서 HF_TOKEN 환경변수 업데이트`;
                } else if (response.status === 429) {
                    result.test.message = `❌ API 호출 한도 초과 (HTTP ${response.status})
                    
**해결 방법:**
1. 잠시 후 다시 시도
2. Hugging Face Pro 계정으로 업그레이드`;
                } else {
                    result.test.message = `❌ API 호출 실패 (HTTP ${response.status}): ${responseText}`;
                }
            }
            
        } catch (error) {
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
            <h1>Llama 4 API 연결 테스트</h1>
            
            <div class="section">
                <h2>설정 현황</h2>
                            <div class="status ${result.settings.hasHfToken ? 'success' : 'error'}">
                <strong>전체 설정 상태:</strong> ${result.settings.hasHfToken ? '설정 완료' : '설정 미완료'}
                </div>
                
                <h3>환경 변수</h3>
                <ul>
                    <li><strong>HF_TOKEN:</strong> ${result.settings.hasHfToken ? `설정됨 (${result.settings.hfTokenLength}자)` : '미설정'}</li>
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
                            <li><a href="https://huggingface.co/settings/tokens" target="_blank">Hugging Face</a>에서 토큰 생성</li>
                            <li>Cloudflare 대시보드에서 HF_TOKEN 환경변수 설정</li>
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

// Hugging Face Qwen API를 통한 이모티콘 검증
export async function validateEmoticonWithQwen(imageBuffer, hfToken, env) {
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
        
        // Hugging Face Qwen API 직접 호출
        const apiUrl = 'https://router.huggingface.co/v1/chat/completions';
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${hfToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "Qwen/Qwen2.5-VL-72B-Instruct:nebius",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: promptText,
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${base64Image}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 200,
                stream: false
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            
            if (response.status === 401 || response.status === 403) {
                return { 
                    isValid: false, 
                    reason: 'AI API 토큰 인증 오류 - 관리자에게 문의하세요',
                    error: 'Authentication failed: ' + errorText
                };
            } else if (response.status === 429) {
                return { 
                    isValid: false, 
                    reason: 'AI API 호출 한도 초과 - 잠시 후 다시 시도해주세요',
                    error: 'Rate limit exceeded: ' + errorText
                };
            } else {
                return { 
                    isValid: false, 
                    reason: 'AI 검증 시스템 연결 오류',
                    error: 'HTTP ' + response.status + ': ' + errorText
                };
            }
        }
        
        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        
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
        return { 
            isValid: false, 
            reason: 'AI 검증 중 오류가 발생했습니다',
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

// 🔒 SECURITY ENHANCEMENT: 관리자 페이지용 강화된 보안 헤더 적용
export function createSecureAdminHtmlResponse(content, status = 200) {
    const response = new Response(content, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
    
    // 강화된 보안 헤더 적용
    const securityHeaders = getEnhancedSecurityHeaders(true);
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });
    
    return response;
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

// 선별적 CORS 헤더 추가 함수 (보안 강화)
export function addSelectiveCorsHeaders(response, isPublicAPI = false) {
    if (isPublicAPI) {
        // 공개 API (이모티콘 목록/상세): 모든 도메인 허용 (확장 프로그램 지원)
        const publicCorsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin, User-Agent, DNT, Cache-Control, X-Requested-With, If-Modified-Since',
            'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Date, Server',
            'Access-Control-Max-Age': '86400', // 24시간
            'Access-Control-Allow-Credentials': 'false',
            'Vary': 'Origin'
        };
        
        Object.entries(publicCorsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
    } else {
        // 관리자 API: 제한적 CORS (같은 도메인만)
        const restrictedCorsHeaders = {
            'Access-Control-Allow-Origin': 'null', // 제한적 허용
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
            'Access-Control-Allow-Credentials': 'true',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
        };
        
        Object.entries(restrictedCorsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
    }
    
    // 공통 보안 헤더
    response.headers.set('Permissions-Policy', getPermissionsPolicyHeader());
    
    return response;
}

// CORS 및 보안 헤더 추가 함수 (크롬 확장 프로그램 지원 개선) - 기존 함수는 유지하되 공개 API 전용으로 사용
export function addCorsHeaders(response) {
    return addSelectiveCorsHeaders(response, true); // 기본적으로 공개 API로 처리
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
export function getClientIP(request) {
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
        return 0;
    }
}

// 🔒 SECURITY ENHANCEMENT: KV 기반 Rate Limiting (지속성 확보)
export async function checkAdminRateLimitKV(env, clientIP) {
    try {
        const now = Date.now();
        const windowMs = 60 * 1000; // 1분
        const maxRequests = 50; // 1분에 50개 요청 제한
        const rateLimitKey = `admin_rate:${await hashIP(clientIP)}`;
        
        const record = await env.PLAKKER_KV.get(rateLimitKey, 'json');
        
        if (!record) {
            // 첫 요청
            await env.PLAKKER_KV.put(rateLimitKey, JSON.stringify({
                requests: 1,
                firstRequest: now
            }), { expirationTtl: Math.ceil(windowMs / 1000) });
            
            return { allowed: true, remaining: maxRequests - 1 };
        }
        
        // 윈도우 만료 확인
        if ((now - record.firstRequest) > windowMs) {
            await env.PLAKKER_KV.put(rateLimitKey, JSON.stringify({
                requests: 1,
                firstRequest: now
            }), { expirationTtl: Math.ceil(windowMs / 1000) });
            
            return { allowed: true, remaining: maxRequests - 1 };
        }
        
        // 요청 횟수 확인
        if (record.requests >= maxRequests) {
            return { allowed: false, remaining: 0 };
        }
        
        // 요청 수 증가
        await env.PLAKKER_KV.put(rateLimitKey, JSON.stringify({
            ...record,
            requests: record.requests + 1
        }), { expirationTtl: Math.ceil(windowMs / 1000) });
        
        return { 
            allowed: true, 
            remaining: maxRequests - record.requests - 1 
        };
        
    } catch (error) {
        // KV 오류 시 허용 (fail-open)
        return { allowed: true, remaining: 0 };
    }
}

// 🔒 SECURITY ENHANCEMENT: 강화된 환경변수 검증
export function validateSecurityEnvironment(env) {
    const errors = [];
    const warnings = [];
    
    // JWT_SECRET 검증
    if (!env.JWT_SECRET) {
        errors.push('JWT_SECRET이 설정되지 않았습니다.');
    } else {
        if (env.JWT_SECRET.length < 32) {
            errors.push('JWT_SECRET은 최소 32자 이상이어야 합니다.');
        }
        if (!/^[A-Za-z0-9+/=]{32,}$/.test(env.JWT_SECRET)) {
            warnings.push('JWT_SECRET에 특수문자가 포함되어 있습니다. Base64 문자만 사용하는 것을 권장합니다.');
        }
    }
    
    // ADMIN_PASSWORD_HASH 검증
    if (!env.ADMIN_PASSWORD_HASH) {
        errors.push('ADMIN_PASSWORD_HASH가 설정되지 않았습니다.');
    } else {
        const parts = env.ADMIN_PASSWORD_HASH.split(':');
        if (parts.length !== 2) {
            errors.push('ADMIN_PASSWORD_HASH는 hash:salt 형식이어야 합니다.');
        } else if (parts[0].length < 32 || parts[1].length < 32) {
            errors.push('ADMIN_PASSWORD_HASH의 해시와 솔트는 각각 32자 이상이어야 합니다.');
        }
    }
    
    // HF_TOKEN 검증 (선택사항)
    if (env.HF_TOKEN && env.HF_TOKEN.length < 20) {
        warnings.push('HF_TOKEN이 너무 짧습니다. 유효한 토큰인지 확인해주세요.');
    }
    
    // ADMIN_URL_PATH 검증
    if (env.ADMIN_URL_PATH) {
        if (!env.ADMIN_URL_PATH.startsWith('/')) {
            errors.push('ADMIN_URL_PATH는 "/"로 시작해야 합니다.');
        }
        if (env.ADMIN_URL_PATH === '/admin') {
            warnings.push('ADMIN_URL_PATH가 기본 경로입니다. 보안을 위해 다른 경로를 사용하는 것을 권장합니다.');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
        securityLevel: errors.length === 0 ? (warnings.length === 0 ? 'HIGH' : 'MEDIUM') : 'LOW'
    };
}

// 🔒 SECURITY ENHANCEMENT: 향상된 보안 헤더 생성
export function getEnhancedSecurityHeaders(isAdminPage = false) {
    const baseHeaders = {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': getPermissionsPolicyHeader()
    };
    
    if (isAdminPage) {
        // 관리자 페이지용 강화된 보안 헤더
        return {
            ...baseHeaders,
            'Content-Security-Policy': `
                default-src 'self';
                script-src 'self' 'unsafe-inline';
                style-src 'self' 'unsafe-inline';
                img-src 'self' data: https:;
                font-src 'self';
                connect-src 'self';
                frame-ancestors 'none';
                base-uri 'self';
                form-action 'self';
                upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim(),
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'X-Admin-Page': 'true'
        };
    } else {
        // 일반 페이지용 기본 보안 헤더
        return {
            ...baseHeaders,
            'Content-Security-Policy': `
                default-src 'self';
                script-src 'self' 'unsafe-inline' 'unsafe-eval';
                style-src 'self' 'unsafe-inline';
                img-src 'self' data: https: http:;
                font-src 'self' data:;
                connect-src 'self';
                frame-src 'none';
                object-src 'none';
            `.replace(/\s+/g, ' ').trim()
        };
    }
}

// 캐시 관련 HTTP 헤더 생성
export function getCacheHeaders(maxAge = 3600, mustRevalidate = false) {
    const headers = new Headers();
    
    if (mustRevalidate) {
        // 즉시 만료, 항상 재검증 필요 (개발/테스트용)
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        headers.set('Pragma', 'no-cache');
        headers.set('Expires', '0');
    } else {
        // 일반 캐시 정책
        headers.set('Cache-Control', `public, max-age=${maxAge}`);
        headers.set('ETag', `"${generateCacheVersion()}"`);
    }
    
    // 캐시 무효화를 위한 추가 헤더
    headers.set('Vary', 'Accept-Encoding');
    headers.set('Last-Modified', new Date().toUTCString());
    
    return headers;
}

// 정적 리소스용 캐시 무효화 헤더
export function getStaticResourceHeaders(contentType, isDevelopment = false) {
    const headers = getCacheHeaders(isDevelopment ? 0 : 86400, isDevelopment); // 개발: 즉시만료, 프로덕션: 1일
    headers.set('Content-Type', contentType);
    
    // 추가 보안 헤더
    headers.set('X-Content-Type-Options', 'nosniff');
    
    return headers;
} 

// 보안 관련 함수들

// 간단한 Base64URL 인코딩/디코딩 (JWT용)
function base64UrlEncode(str) {
    return btoa(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function base64UrlDecode(str) {
    try {
        str += '==='.slice((str.length + 3) % 4);
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        return atob(str);
    } catch (error) {
        throw new Error('Invalid base64 string');
    }
}

// 간단한 HMAC-SHA256 구현 (Web Crypto API 전용)
async function simpleHmac(key, message) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);
    
    // Cloudflare Workers에서는 crypto.subtle이 항상 사용 가능해야 함
    if (typeof crypto === 'undefined' || !crypto.subtle) {
        throw new Error('Web Crypto API not available - secure cryptography is required');
    }
    
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return new Uint8Array(signature);
}

// JWT 토큰 생성
export async function createJWT(payload, secret, expiresInSeconds = 3600) {
    const header = {
        typ: 'JWT',
        alg: 'HS256'
    };
    
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
        ...payload,
        iat: now,
        exp: now + expiresInSeconds
    };
    
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    
    const message = `${encodedHeader}.${encodedPayload}`;
    const signature = await simpleHmac(secret, message);
    
    // 시그니처를 base64url로 인코딩
    const signatureBase64 = base64UrlEncode(String.fromCharCode(...signature));
    
    return `${message}.${signatureBase64}`;
}

// JWT 토큰 검증
export async function verifyJWT(token, secret) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return { valid: false, error: 'Invalid token format' };
        }
        
        const [encodedHeader, encodedPayload, encodedSignature] = parts;
        
        // 시그니처 검증
        const message = `${encodedHeader}.${encodedPayload}`;
        const expectedSignature = await simpleHmac(secret, message);
        const expectedSignatureBase64 = base64UrlEncode(String.fromCharCode(...expectedSignature));
        
        if (encodedSignature !== expectedSignatureBase64) {
            return { valid: false, error: 'Invalid signature' };
        }
        
        // 페이로드 디코딩
        const payload = JSON.parse(base64UrlDecode(encodedPayload));
        
        // 만료 시간 검증
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
            return { valid: false, error: 'Token expired' };
        }
        
        return { valid: true, payload };
    } catch (error) {
        return { valid: false, error: 'Token validation failed' };
    }
}

// 비밀번호 해싱 (Web Crypto API 전용)
export async function hashPassword(password, salt = null) {
    // Web Crypto API 필수 요구
    if (typeof crypto === 'undefined' || !crypto.subtle || !crypto.getRandomValues) {
        throw new Error('Web Crypto API not available - secure cryptography is required');
    }
    
    // Salt 생성
    if (!salt) {
        salt = crypto.getRandomValues(new Uint8Array(16));
    }
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password + Array.from(salt).join(''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    return {
        hash: Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join(''),
        salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
    };
}

// 비밀번호 해시 검증 함수 (보안 강화)
export async function verifyPassword(password, storedHash, storedSalt) {
    try {
        if (!password || !storedHash || !storedSalt) {
            return false;
        }
        
        // Salt를 바이트 배열로 복원
        const saltBytes = new Uint8Array(
            storedSalt.match(/.{2}/g).map(byte => parseInt(byte, 16))
        );
        
        // 입력된 비밀번호를 같은 salt로 해싱
        const { hash } = await hashPassword(password, saltBytes);
        
        // 타이밍 공격 방지를 위한 상수 시간 비교
        if (hash.length !== storedHash.length) {
            return false;
        }
        
        let result = 0;
        for (let i = 0; i < hash.length; i++) {
            result |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
        }
        
        return result === 0;
    } catch (error) {
        // 에러 발생 시 항상 false 반환
        return false;
    }
}

// 관리자 비밀번호 해시 생성 헬퍼 함수 (초기 설정용)
export async function generateAdminPasswordHash(password) {
    try {
        const { hash, salt } = await hashPassword(password);
        return `${hash}:${salt}`;
    } catch (error) {
        throw new Error('비밀번호 해시 생성 실패');
    }
}

// IP 주소 유효성 검증
export function isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    
    // IPv4 검증
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(ip)) return true;
    
    // IPv6 간단 검증
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv6Regex.test(ip)) return true;
    
    return false;
}

// 안전한 세션 ID 생성 (Web Crypto API 전용)
export function generateSecureSessionId() {
    // Web Crypto API 필수 요구
    if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
        throw new Error('Web Crypto API not available - secure random generation is required');
    }
    
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
} 

// 매직 바이트를 통한 파일 타입 검증 (보안 강화)
export function validateFileByMagicBytes(arrayBuffer, expectedType) {
    const uint8Array = new Uint8Array(arrayBuffer);
    
    if (uint8Array.length < 4) {
        return false;
    }
    
    // 각 이미지 타입의 매직 바이트 검증
    switch (expectedType.toLowerCase()) {
        case 'image/jpeg':
        case 'image/jpg':
            // JPEG: FF D8 FF
            return uint8Array[0] === 0xFF && uint8Array[1] === 0xD8 && uint8Array[2] === 0xFF;
            
        case 'image/png':
            // PNG: 89 50 4E 47 0D 0A 1A 0A
            return uint8Array[0] === 0x89 && uint8Array[1] === 0x50 && 
                   uint8Array[2] === 0x4E && uint8Array[3] === 0x47;
                   
        case 'image/gif':
            // GIF87a: 47 49 46 38 37 61 또는 GIF89a: 47 49 46 38 39 61
            return uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && 
                   uint8Array[2] === 0x46 && uint8Array[3] === 0x38 &&
                   (uint8Array[4] === 0x37 || uint8Array[4] === 0x39) &&
                   uint8Array[5] === 0x61;
                   
        case 'image/webp':
            // WebP: 52 49 46 46 ... 57 45 42 50
            return uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && 
                   uint8Array[2] === 0x46 && uint8Array[3] === 0x46 &&
                   uint8Array.length >= 12 &&
                   uint8Array[8] === 0x57 && uint8Array[9] === 0x45 &&
                   uint8Array[10] === 0x42 && uint8Array[11] === 0x50;
                   
        default:
            return false;
    }
}

// 강화된 이미지 파일 검증 (MIME 타입 + 매직 바이트)
export async function validateImageFile(file) {
    if (!file || !file.type) {
        return { valid: false, error: '파일이 유효하지 않습니다.' };
    }
    
    const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/gif'];
    
    // MIME 타입 검증
    if (!allowedImageTypes.includes(file.type.toLowerCase())) {
        return { valid: false, error: '지원되지 않는 파일 형식입니다.' };
    }
    
    // 매직 바이트 검증
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        if (!validateFileByMagicBytes(arrayBuffer, file.type)) {
            return { valid: false, error: '파일 내용이 형식과 일치하지 않습니다.' };
        }
        
        return { valid: true, arrayBuffer };
    } catch (error) {
        return { valid: false, error: '파일을 읽을 수 없습니다.' };
    }
} 