# Google Chat Webhook MCP Server

[![CI](https://github.com/ice3x2/google-chat-webhook-mcp/workflows/CI/badge.svg)](https://github.com/ice3x2/google-chat-webhook-mcp/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) 서버로 Google Chat 웹훅을 통해 메시지를 전송합니다. Markdown을 Google Chat Cards V2 형식으로 자동 변환하며, 이미지 검증, 자동 로깅, 폴백 처리를 지원합니다.

## 주요 기능

- 🚀 **MCP 프로토콜 지원**: Claude Desktop 및 다른 MCP 클라이언트와 통합
- 📝 **Markdown → Cards V2 자동 변환**: 헤더, 리스트, 코드블록, 표, 이미지 등 지원
- 🖼️ **이미지 URL 검증**: HEAD 요청으로 유효성 확인 (HTTP 상태, Content-Type, 크기)
- 🔄 **자동 폴백**: Cards V2 실패 시 텍스트로 자동 전환
- 📊 **구조화된 로깅**: JSON 형식, 30일 자동 보관
- ✅ **테스트 자동화**: 스냅샷 테스트, 통합 테스트, CI/CD 파이프라인

## 설치

### 1. 저장소 클론

```bash
git clone https://github.com/ice3x2/google-chat-webhook-mcp.git
cd google-chat-webhook-mcp
npm install
npm run build
```

### 2. Claude Desktop 설정

`claude_desktop_config.json` 파일에 추가:

```json
{
  "mcpServers": {
    "google-chat": {
      "command": "node",
      "args": ["/path/to/google-chat-webhook-mcp/dist/index.js"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
      }
    }
  }
}
```

### 3. Google Chat Webhook URL 생성

1. Google Chat 스페이스 열기
2. 상단 메뉴 → "앱 및 통합" → "Webhook 관리"
3. "Webhook 추가" 클릭
4. 이름 입력 후 URL 복사
5. 환경 변수에 설정

## 사용법

### MCP 도구

#### 1. `send_google_chat_text`
간단한 텍스트 메시지 전송

```typescript
{
  "text": "안녕하세요, Google Chat!"
}
```

#### 2. `send_google_chat_cards_v2`
Cards V2 형식으로 직접 전송

```typescript
{
  "text": "Card Message",
  "cardsV2": [/* Cards V2 객체 */]
}
```

#### 3. `send_google_chat_markdown` (추천)
Markdown을 Cards V2로 자동 변환

```typescript
{
  "markdown": "# 제목\n\n**굵은 글씨** 와 *기울임*\n\n- 리스트 항목 1\n- 리스트 항목 2",
  "cardTitle": "마크다운 카드",
  "fallbackToText": true  // 실패 시 텍스트로 폴백
}
```

### 지원하는 Markdown 문법

| 문법 | 예시 | Google Chat 렌더링 |
|------|------|-------------------|
| **헤더** | `# H1`, `## H2` | 굵은 글씨 + 크기 차등 |
| **굵게** | `**bold**` | **bold** |
| **기울임** | `*italic*` | *italic* |
| **인라인 코드** | `` `code` `` | `code` |
| **코드블록** | ` ```language\ncode\n``` ` | 고정폭 폰트 박스 |
| **순서 리스트** | `1. item` | 1. item |
| **비순서 리스트** | `- item` | • item |
| **중첩 리스트** | `  - nested` | Em space 들여쓰기 |
| **표** | `\| A \| B \|` | 고정폭 폰트 표 |
| **이미지** | `![alt](url)` | 이미지 위젯 (검증 후) |
| **링크** | `[text](url)` | 클릭 가능한 링크 |

## 환경 변수

```env
# Required
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx

# Logging (Optional)
LOG_LEVEL=INFO                   # DEBUG, INFO, WARN, ERROR
LOG_DIR=./logs                   # Log directory path
LOG_RETENTION_DAYS=30            # Number of days to keep logs
LOG_ENABLE_CONSOLE=true          # Enable console output
```

## 환경 변수

### 필수

- `GOOGLE_CHAT_WEBHOOK_URL`: Google Chat Webhook URL

### 선택 (로깅)

- `LOG_LEVEL`: 로그 레벨 (DEBUG, INFO, WARN, ERROR) - 기본값: INFO
- `LOG_DIR`: 로그 디렉토리 경로 - 기본값: ./logs
- `LOG_RETENTION_DAYS`: 로그 보관 일수 - 기본값: 30
- `LOG_ENABLE_CONSOLE`: 콘솔 출력 여부 - 기본값: true

### 설정 예시

**.env 파일**:
```env
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx
LOG_LEVEL=INFO
LOG_DIR=./logs
LOG_RETENTION_DAYS=30
LOG_ENABLE_CONSOLE=true
```

## 개발

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 개발 모드 (TypeScript 직접 실행)
npm run dev

# Lint 검사
npm run lint

# Lint 자동 수정
npm run lint:fix

# 테스트
npm run test:snapshot           # 스냅샷 테스트 (12개)
npm run test:logging            # 로깅 시스템 테스트
npm run test:integration        # 통합 테스트 (웹훅 필요)
npm test                        # 전체 테스트
```

## 아키텍처

```
src/
├── index.ts                    # 진입점
├── server.ts                   # MCP 서버 설정
├── tools/                      # MCP 도구
│   ├── sendTextMessage.ts      # 텍스트 전송
│   ├── sendCardsV2Message.ts   # Cards V2 전송
│   ├── sendMarkdownMessage.ts  # Markdown 전송 (메인)
│   └── markdownToCards.ts      # Markdown → Cards V2 변환
├── utils/                      # 유틸리티
│   ├── imageValidator.ts       # 이미지 URL 검증
│   ├── cardsV2Validator.ts     # Cards V2 스키마 검증
│   ├── logger.ts               # 로깅 시스템
│   └── logCleaner.ts           # 로그 정리
└── types/                      # 타입 정의
    ├── markdown.ts
    ├── googleChat.ts
    └── log.ts
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

## 제한사항

### 이미지

- ✅ **지원**: HTTPS URL만 허용
- ✅ **크기**: 최대 5MB
- ✅ **타입**: Content-Type이 `image/*`여야 함
- ⚠️ **검증 실패**: 텍스트 링크로 폴백

### Markdown

- ⚠️ Google Chat은 제한된 HTML만 지원
- ⚠️ 복잡한 중첩 구조는 단순화됨
- ⚠️ 일부 Markdown 문법은 미지원 (예: 각주, 정의 리스트)

## FAQ

### Q: Claude Desktop에서 설정이 안 됩니다
**A**: `claude_desktop_config.json` 경로 확인:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Claude Desktop을 재시작해야 합니다.

### Q: 이미지가 표시되지 않습니다
**A**: 확인 사항:
1. HTTPS URL인가? (HTTP는 불가)
2. 이미지 크기가 5MB 이하인가?
3. URL이 공개 접근 가능한가?
4. 로그 확인: `logs/app-YYYY-MM-DD.log`에서 `image_validation_failed` 검색

### Q: Cards V2 변환이 실패합니다
**A**: `fallbackToText: true` 옵션 사용 시 자동으로 텍스트로 폴백됩니다.
로그에서 실패 원인을 확인할 수 있습니다.

### Q: 로그가 너무 많이 쌓입니다
**A**: 환경 변수로 조정:
```env
LOG_LEVEL=WARN              # INFO 대신 WARN만
LOG_RETENTION_DAYS=7        # 7일만 보관
```

## CI/CD

GitHub Actions로 자동화:
- ✅ Node.js 18.x, 20.x 매트릭스 빌드
- ✅ ESLint, 빌드, 테스트
- ✅ 스냅샷 테스트 (12개)
- ✅ 통합 테스트 (master 브랜치)

워크플로우: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

## 기여

이슈와 PR을 환영합니다!

## 라이선스

MIT License - [LICENSE](LICENSE)

## 문서

- [로깅 설계](docs/logging-design.md)
- [CI 설정 가이드](docs/ci-setup.md)
- [Markdown 구현 계획](docs/markdown-to-cards-implementation.md)

## 관련 프로젝트

- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Claude Desktop](https://claude.ai/desktop)
- [Google Chat API](https://developers.google.com/chat)
