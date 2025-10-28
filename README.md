# Google Chat Webhook MCP Server

간단한 MCP 서버로 Google Chat 웹훅으로 메시지를 전송합니다. 현재는 텍스트와 Cards V2 형식을 지원하며, Markdown을 Cards V2로 자동 변환합니다.

## 기능

- ✅ **텍스트 메시지 전송**: 간단한 텍스트 메시지
- ✅ **Cards V2 메시지 전송**: 구조화된 카드 메시지
- ✅ **Markdown → Cards V2 변환**: 자동 변환 및 폴백 지원
- ✅ **이미지 검증**: URL HEAD 검증 (HTTP 상태, 타입, 크기)
- ✅ **자동 로깅**: 30일 보관 정책, JSON 형식

## 설정

### 환경 변수

```env
# Required
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx

# Logging (Optional)
LOG_LEVEL=INFO                   # DEBUG, INFO, WARN, ERROR
LOG_DIR=./logs                   # Log directory path
LOG_RETENTION_DAYS=30            # Number of days to keep logs
LOG_ENABLE_CONSOLE=true          # Enable console output
```

## 개발

```bash
# 설치
npm install

# 빌드
npm run build

# 실행
npm start

# 테스트
npm run test:snapshot           # 스냅샷 테스트
npm run test:logging            # 로깅 테스트
npm test                        # 전체 테스트
```

## 로깅

### 로그 파일 구조

```
logs/
├── app-2025-10-29.log          # 일별 로그 (모든 레벨)
├── errors-2025-10-29.log       # 에러 전용 로그
└── ...                         # 30일 자동 삭제
```

### 로그 포맷 (JSON)

```json
{
  "timestamp": "2025-10-29T12:34:56.789Z",
  "level": "INFO",
  "module": "sendMarkdownMessage",
  "event": "message_sent",
  "messageId": "spaces/xxx/messages/yyy",
  "elapsed": 123,
  "usedFallback": false,
  "cardTitle": "Test Card"
}
```

### 로그 이벤트

- `message_sent`: 메시지 전송 성공
- `fallback_used`: 폴백 사용 (Cards V2 → Text)
- `image_validation_failed`: 이미지 검증 실패
- `send_failed`: 전송 실패
- `validation_failed`: 검증 실패

### 로그 정리

- 서버 시작 시 자동 정리 (30일 이상 로그 삭제)
- 24시간마다 자동 실행
- 환경 변수 `LOG_RETENTION_DAYS`로 설정 가능

