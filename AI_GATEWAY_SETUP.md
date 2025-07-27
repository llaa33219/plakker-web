# 🚀 Cloudflare AI Gateway 설정 가이드

Cloudflare Workers에서 지역 제한으로 인해 Gemini API 직접 호출이 안 될 때 AI Gateway를 사용하여 문제를 해결하는 방법입니다.

## 📋 설정 단계

### 1️⃣ Cloudflare AI Gateway 생성

1. **Cloudflare 대시보드 접속**
   - https://dash.cloudflare.com/ 로 이동
   - 로그인

2. **AI Gateway 생성**
   - 좌측 메뉴에서 `AI` > `AI Gateway` 클릭
   - `Create Gateway` 버튼 클릭
   - **Gateway name**: `plakker-gateway` 입력
   - `Create` 버튼 클릭

3. **Account ID 확인**
   - 대시보드 우측 사이드바에서 **Account ID** 복사
   - 또는 URL에서 확인: `https://dash.cloudflare.com/{ACCOUNT_ID}/...`

### 2️⃣ wrangler.toml 설정

```toml
[vars]
ENVIRONMENT = "production"
GEMINI_API_KEY = "AIzaSyAgLwJmesiDug0FOab3TRN8Dyv8AeTd8cA"
CF_ACCOUNT_ID = "여기에_실제_ACCOUNT_ID_입력"
CF_GATEWAY_ID = "plakker-gateway"
```

### 3️⃣ 환경변수 설정 (프로덕션)

```bash
# API 키들을 안전하게 환경변수로 설정
wrangler secret put GEMINI_API_KEY
wrangler secret put CF_ACCOUNT_ID
```

## 🔧 테스트 방법

AI Gateway가 올바르게 설정되었는지 테스트:

```bash
# Account ID와 Gateway ID를 실제 값으로 변경
curl "https://gateway.ai.cloudflare.com/v1/{ACCOUNT_ID}/plakker-gateway/google-ai-studio/v1/models/gemini-2.5-flash:generateContent" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: AIzaSyAgLwJmesiDug0FOab3TRN8Dyv8AeTd8cA" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello, this is a test"}]
    }]
  }'
```

## 🎯 작동 원리

```
직접 호출 (지역 제한으로 실패):
플래커 서버 → Gemini API ❌

AI Gateway 경유 (성공):
플래커 서버 → Cloudflare AI Gateway → Gemini API ✅
```

## 📊 AI Gateway 장점

- ✅ **지역 제한 우회**: 전 세계 어디서나 API 호출 가능
- 📈 **모니터링**: 요청 수, 토큰 사용량, 오류율 추적
- 💰 **비용 최적화**: 캐싱으로 API 호출 비용 절약
- 🛡️ **보안**: Rate limiting, 인증 등 추가 보안 기능
- 📊 **Analytics**: 상세한 사용 통계 제공

## ⚠️ 주의사항

1. **Account ID 확인**: wrangler.toml의 `CF_ACCOUNT_ID`를 실제 값으로 변경 필수
2. **Gateway 이름**: `plakker-gateway`로 정확히 생성
3. **API 키**: Gemini API 키가 유효한지 확인
4. **권한**: Cloudflare 계정에 AI Gateway 사용 권한 필요

## 🔍 문제 해결

### "Gateway not found" 오류
- AI Gateway가 올바르게 생성되었는지 확인
- Gateway 이름이 `plakker-gateway`인지 확인

### "Invalid API key" 오류  
- Gemini API 키가 유효한지 확인
- `x-goog-api-key` 헤더가 올바르게 설정되었는지 확인

### "Account ID invalid" 오류
- Cloudflare 대시보드에서 정확한 Account ID 복사
- wrangler.toml에 올바르게 설정되었는지 확인 