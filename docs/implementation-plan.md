# Google Chat Webhook MCP 서버 구현 계획

## 1. 프로젝트 개요

### 목적
- Google Chat 웹훅을 통해 메시지를 전송하는 MCP (Model Context Protocol) 서버 구현
- Claude Code, GitHub Copilot 등 MCP 클라이언트에서 사용 가능

### 주요 기능
- Google Chat 웹훅으로 텍스트 메시지 전송
- Google Chat Cards V2 형식 메시지 전송
- 웹훅 URL을 설정값으로 관리

## 2. 기술 스택

### 개발 언어 및 프레임워크
- **Node.js** (TypeScript)
- **MCP SDK** (@modelcontextprotocol/sdk)

### 주요 라이브러리
- `@modelcontextprotocol/sdk` - MCP 서버 구현
- `axios` 또는 `node-fetch` - HTTP 요청 처리
- `zod` - 스키마 검증

## 3. 프로젝트 구조

```
GoogleChatWebHook/
├── src/
│   ├── index.ts                 # MCP 서버 진입점
│   ├── server.ts                # MCP 서버 구현
│   ├── tools/
│   │   ├── sendTextMessage.ts   # 텍스트 메시지 전송 도구
│   │   └── sendCardsV2Message.ts # Cards V2 메시지 전송 도구
│   ├── types/
│   │   └── googleChat.ts        # Google Chat 타입 정의
│   └── utils/
│       └── webhook.ts           # 웹훅 요청 유틸리티
├── docs/
│   └── implementation-plan.md   # 본 문서
├── package.json
├── tsconfig.json
└── README.md
```

## 4. MCP 서버 설계

### 4.1 서버 설정 (Configuration)

**설정 파라미터:**
- `webhookUrl` (required): Google Chat 웹훅 URL

**설정 예시 (Claude Code):**
```json
{
  "mcpServers": {
    "google-chat-webhook": {
      "command": "node",
      "args": ["path/to/build/index.js"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "https://chat.googleapis.com/v1/spaces/..."
      }
    }
  }
}
```

### 4.2 MCP Tools 정의

#### Tool 1: `send_google_chat_text`
**설명:** 구글 챗에 텍스트 메시지를 전송합니다.

**입력 파라미터:**
- `text` (string, required): 전송할 텍스트 메시지

**출력:**
- 성공: `{ success: true, message: "Message sent successfully" }`
- 실패: `{ success: false, error: "Error message" }`

**예시:**
```json
{
  "text": "안녕하세요! 테스트 메시지입니다."
}
```

#### Tool 2: `send_google_chat_cards_v2`
**설명:** 구글 챗에 Cards V2 형식의 메시지를 전송합니다.

**입력 파라미터:**
- `cardsV2` (array, required): Google Chat Cards V2 JSON 구조
- `text` (string, optional): 카드와 함께 표시할 텍스트

**출력:**
- 성공: `{ success: true, message: "Card message sent successfully" }`
- 실패: `{ success: false, error: "Error message" }`

**예시:**
```json
{
  "text": "작업 완료 알림",
  "cardsV2": [
    {
      "cardId": "unique-card-id",
      "card": {
        "header": {
          "title": "작업 완료",
          "subtitle": "프로젝트 빌드가 완료되었습니다"
        },
        "sections": [
          {
            "widgets": [
              {
                "textParagraph": {
                  "text": "모든 테스트가 성공적으로 통과했습니다."
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## 5. 구현 세부사항

### 5.1 Google Chat Webhook API

**엔드포인트:**
```
POST https://chat.googleapis.com/v1/spaces/{space}/messages
```

**텍스트 메시지 페이로드:**
```json
{
  "text": "메시지 내용"
}
```

**Cards V2 메시지 페이로드:**
```json
{
  "text": "선택적 텍스트",
  "cardsV2": [
    {
      "cardId": "card-id",
      "card": {
        // Card 구조
      }
    }
  ]
}
```

### 5.2 에러 처리

1. **웹훅 URL 검증**
   - 환경 변수에서 웹훅 URL 확인
   - URL 형식 검증 (Google Chat 웹훅 URL 패턴)

2. **HTTP 요청 에러 처리**
   - 네트워크 오류
   - 400/401/403/404/500 등 HTTP 상태 코드
   - 타임아웃

3. **입력 검증**
   - 필수 파라미터 확인
   - JSON 스키마 검증 (Cards V2)

### 5.3 보안 고려사항

1. **웹훅 URL 보호**
   - 환경 변수로 관리
   - 로그에 URL 노출 방지

2. **입력 검증**
   - XSS 방지를 위한 입력 검증
   - JSON 페이로드 크기 제한

## 6. 구현 단계

### Phase 1: 기본 구조 설정
1. ✅ 프로젝트 초기화 (npm init, TypeScript 설정)
2. ✅ MCP SDK 설치 및 기본 서버 구조 구현
3. ✅ 환경 변수 설정 구조 구현

### Phase 2: 텍스트 메시지 기능
1. ✅ 웹훅 유틸리티 함수 구현
2. ✅ `send_google_chat_text` 도구 구현
3. ✅ 에러 처리 및 로깅

### Phase 3: Cards V2 기능
1. ✅ Google Chat Cards V2 타입 정의
2. ✅ `send_google_chat_cards_v2` 도구 구현
3. ✅ Cards V2 스키마 검증

### Phase 4: 테스트 및 문서화
1. ✅ 로컬 테스트
2. ✅ README 작성 (사용법, 설정 예시)
3. ✅ Claude Code 설정 가이드
4. ✅ GitHub Copilot 설정 가이드

## 7. 사용 시나리오

### 시나리오 1: 빌드 완료 알림
AI가 프로젝트 빌드를 완료한 후 Google Chat으로 알림 전송

### 시나리오 2: 에러 리포트
코드 분석 중 발견된 이슈를 Cards V2 형식으로 전송

### 시나리오 3: 작업 진행 상황
장시간 실행되는 작업의 진행 상황을 주기적으로 전송

## 8. 테스트 계획

### 단위 테스트
- 웹훅 요청 함수 테스트
- 입력 검증 테스트
- 에러 처리 테스트

### 통합 테스트
- MCP 클라이언트와의 통신 테스트
- 실제 Google Chat 웹훅 전송 테스트

## 9. 배포 및 사용

### 로컬 개발
```bash
npm install
npm run build
npm run start
```

### Claude Code 연동
1. 프로젝트 빌드
2. Claude Code 설정 파일에 MCP 서버 추가
3. Claude Code 재시작

### GitHub Copilot 연동
1. VS Code MCP 설정 파일 수정
2. 웹훅 URL 환경 변수 설정
3. VS Code 재시작

## 10. 향후 확장 가능성

1. **추가 메시지 형식**
   - 이미지 첨부
   - 파일 업로드
   - 인터랙티브 버튼

2. **고급 기능**
   - 메시지 스레드 관리
   - 사용자 멘션
   - 메시지 업데이트/삭제

3. **다중 웹훅 지원**
   - 여러 Google Chat 공간에 동시 전송
   - 웹훅 별칭 관리

## 11. 참고 자료

- [MCP Protocol Documentation](https://modelcontextprotocol.io/)
- [Google Chat Webhooks Guide](https://developers.google.com/chat/how-tos/webhooks)
- [Google Chat Cards V2 Reference](https://developers.google.com/chat/api/guides/message-formats/cards)
