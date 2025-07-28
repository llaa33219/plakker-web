# Plakker - 이모티콘 공유 플랫폼

Cloudflare Workers로 구동되는 이모티콘 팩 공유 사이트입니다.

**🔗 사이트 주소: https://plakker.bloupla.net**

## 기능

- 🎨 **이모티콘 팩 업로드**: 제목, 썸네일, 제작자 정보와 함께 여러 이모티콘을 업로드
- 📱 **반응형 웹**: 모바일과 데스크톱 모두 지원
- 🔍 **팩 브라우징**: 썸네일과 함께 팩 목록을 페이지네이션으로 탐색
- 👀 **상세 보기**: 팩의 모든 이모티콘을 150x150 그리드로 표시
- 🔗 **API 지원**: REST API로 팩 정보와 이모티콘 목록 조회
- 💾 **클라우드 저장**: Cloudflare R2와 KV를 사용한 안정적인 저장

## 요구사항

- Cloudflare 계정
- wrangler CLI 도구

## 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. Cloudflare 리소스 생성

#### KV 네임스페이스 생성
```bash
wrangler kv:namespace create "PLAKKER_KV"
wrangler kv:namespace create "PLAKKER_KV" --preview
```

#### R2 버킷 생성
```bash
wrangler r2 bucket create plakker-storage
wrangler r2 bucket create plakker-storage-preview
```

### 3. wrangler.toml 설정

생성된 KV 네임스페이스와 R2 버킷 ID를 `wrangler.toml`에 설정:

```toml
name = "plakker"
main = "src/index.js"
compatibility_date = "2025-01-15"

[[kv_namespaces]]
binding = "PLAKKER_KV"
id = "your-kv-namespace-id"          # 실제 KV ID로 변경

[[r2_buckets]]
binding = "PLAKKER_R2"
bucket_name = "plakker-storage"

[vars]
ENVIRONMENT = "production"

# Custom Domain 설정 (2025년 최신 방식)
routes = [
  { pattern = "plakker.bloupla.net", custom_domain = true }
]
```

### 4. 먼저 기본 배포

```bash
npm run deploy
```

### 5. 도메인 설정

Cloudflare에서 도메인 설정:
1. Cloudflare 대시보드에서 **Workers & Pages** 이동
2. 배포된 **plakker** Worker 선택
3. **Settings** > **Triggers** > **Custom Domains** 클릭
4. **Add Custom Domain** 버튼 클릭
5. `plakker.bloupla.net` 입력 후 **Add Domain** 클릭
6. DNS 레코드가 자동으로 설정됩니다

> **참고**: wrangler.toml에서 routes 설정은 제거했습니다. Cloudflare 대시보드에서 직접 커스텀 도메인을 설정하는 것이 더 안정적입니다.

### 6. 개발 서버 실행

```bash
npm run dev
```

## 배포

### 프로덕션 배포
```bash
npm run deploy
```

## API 문서

### 팩 목록 조회
```
GET /api/packs?page={page}
```

**응답:**
```json
{
  "packs": [
    {
      "id": "pack_id",
      "title": "예시 팩 1",
      "creator": "예시 제작자 1",
      "thumbnail": "https://plakker.bloupla.net/r2/thumbnails/pack_id_thumbnail",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "currentPage": 1,
  "hasNext": true,
  "total": 25
}
```

### 특정 팩 조회
```
GET /api/pack/{pack_id}
```

**응답:**
```json
{
  "id": "pack_id",
  "title": "예시 팩 1",
  "creator": "예시 제작자 1",
  "creatorLink": "https://example.com/creator1",
  "thumbnail": "https://plakker.bloupla.net/r2/thumbnails/pack_id_thumbnail",
  "emoticons": [
    "https://plakker.bloupla.net/r2/emoticons/pack_id_0",
    "https://plakker.bloupla.net/r2/emoticons/pack_id_1",
    "https://plakker.bloupla.net/r2/emoticons/pack_id_2"
  ],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### 팩 업로드
```
POST /api/upload
Content-Type: multipart/form-data

- title: 팩 제목 (필수)
- creator: 제작자 (필수)
- creatorLink: 제작자 링크 (선택)
- thumbnail: 썸네일 이미지 (필수)
- emoticons: 이모티콘 이미지들 (최소 3개, 필수)
```

## 프로젝트 구조

```
plakker/
├── src/
│   └── index.js          # 메인 Worker 코드
├── wrangler.toml         # Cloudflare Workers 설정
├── package.json          # 프로젝트 설정
└── README.md            # 이 문서
```

## 기술 스택

- **런타임**: Cloudflare Workers
- **스토리지**: Cloudflare R2 (이미지), Cloudflare KV (메타데이터)
- **프론트엔드**: 바닐라 JavaScript, HTML, CSS
- **빌드 도구**: Wrangler

## 주요 특징

- **서버리스**: Cloudflare Workers의 엣지 컴퓨팅 활용
- **글로벌 CDN**: 전 세계 어디서나 빠른 로딩
- **자동 스케일링**: 트래픽에 따른 자동 확장
- **비용 효율적**: 사용량 기반 과금

## 제한사항

- 개별 파일 크기: 최대 25MB (Cloudflare Workers 제한)
- 요청 CPU 시간: 최대 50ms (무료 플랜 기준)
- KV 읽기/쓰기: 일일 한도 적용

## 라이선스

MIT License 

## 보안 및 개인정보 보호

### IP 주소 보호
- **해시화 저장**: 모든 IP 주소는 SHA-256 + Salt로 해시화되어 저장됩니다
- **원본 복구 불가**: 해시화된 데이터로는 원본 IP 주소를 복구할 수 없습니다
- **로그 마스킹**: 모든 로그에서 IP 주소는 마스킹 처리됩니다 (예: 192.168.*.*)
- **자동 삭제**: 업로드 제한 데이터는 24시간 후 자동 삭제됩니다
- **API 비노출**: 어떤 API 응답에도 IP 주소가 포함되지 않습니다

### 업로드 제한
- IP당 일일 5개 이모티콘 팩 업로드 제한
- UTC 기준 자정에 제한 카운트 리셋
- 해시화된 IP 기반으로 추적하여 개인정보 보호 