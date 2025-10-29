# Google Chat Webhook MCP Server

[![CI](https://github.com/ice3x2/google-chat-webhook-mcp/workflows/CI/badge.svg)](https://github.com/ice3x2/google-chat-webhook-mcp/actions)
[![npm version](https://img.shields.io/npm/v/google-chat-webhook-mcp.svg)](https://www.npmjs.com/package/google-chat-webhook-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) 서버로 Google Chat 웹훅을 통해 메시지를 전송합니다. Markdown을 Google Chat Cards V2 형식으로 자동 변환하며, 이미지 검증, 자동 로깅, 폴백 처리를 지원합니다.

## 주요 기능

- 🚀 **MCP 프로토콜 지원**: Claude Desktop, GitHub Copilot 등과 통합
- 📝 **Markdown → Cards V2 자동 변환**: 헤더, 리스트, 코드블록, 표, 이미지 등 지원
- 🖼️ **이미지 URL 검증**: HEAD 요청으로 유효성 확인 (HTTP 상태, Content-Type, 크기)
- 🔄 **자동 폴백**: Cards V2 실패 시 텍스트로 자동 전환
- 📊 **구조화된 로깅**: JSON 형식, 30일 자동 보관
- ✅ **테스트 자동화**: 스냅샷 테스트, 통합 테스트, CI/CD 파이프라인

## 설치

### npm 설치 (권장)

```bash
npm install -g google-chat-webhook-mcp
```

### 소스 설치 (개발용)

```bash
git clone https://github.com/ice3x2/google-chat-webhook-mcp.git
cd google-chat-webhook-mcp
npm install
npm run build
```

## Google Chat Webhook URL 생성

MCP 서버 설정 전에 먼저 Google Chat Webhook URL을 생성해야 합니다:

1. Google Chat 스페이스 열기
2. 상단 메뉴 → "앱 및 통합" → "Webhook 관리"
3. "Webhook 추가" 클릭
4. 이름 입력 후 **URL 복사**
5. 아래 설정에서 사용

## MCP 클라이언트 설정

### 1. Claude Desktop

#### 설정 파일 위치

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### npm 설치 시

```json
{
  "mcpServers": {
    "google-chat": {
      "command": "npx",
      "args": ["-y", "google-chat-webhook-mcp"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
      }
    }
  }
}
```

#### 소스 설치 시

```json
{
  "mcpServers": {
    "google-chat": {
      "command": "node",
      "args": ["C:\\path\\to\\google-chat-webhook-mcp\\dist\\index.js"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
      }
    }
  }
}
```

**⚠️ 주의**: Windows 경로는 `\\` 또는 `/` 사용 (예: `C:/path/to/...`)

#### 적용 방법

1. Claude Desktop 완전 종료 (시스템 트레이에서도 종료)
2. 설정 파일 저장
3. Claude Desktop 재시작
4. 채팅창에서 "Send a message to Google Chat" 같은 명령 사용

### 2. GitHub Copilot (VS Code)

GitHub Copilot은 아직 공식적으로 MCP를 지원하지 않지만, MCP 브릿지를 통해 사용 가능합니다.

#### 방법 1: MCP Bridge 확장 사용 (실험적)

1. VS Code에서 MCP Bridge 확장 설치 (있는 경우)
2. `.vscode/settings.json` 또는 사용자 설정에 추가:

```json
{
  "mcp.servers": {
    "google-chat": {
      "command": "npx",
      "args": ["-y", "google-chat-webhook-mcp"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
      }
    }
  }
}
```

#### 방법 2: GitHub Copilot Chat의 Custom Instructions

현재 GitHub Copilot은 MCP를 네이티브 지원하지 않으므로, 대안으로:

1. `.github/copilot-instructions.md` 파일 생성:
```markdown
When I ask to send messages to Google Chat, use the terminal to run:
npx -y google-chat-webhook-mcp
With environment variable GOOGLE_CHAT_WEBHOOK_URL set to our webhook.
```

2. 또는 VS Code 터미널에서 직접 실행:
```bash
# PowerShell
$env:GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
npx -y google-chat-webhook-mcp

# Bash/Zsh
export GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
npx -y google-chat-webhook-mcp
```

**📝 참고**: GitHub Copilot의 공식 MCP 지원은 향후 추가될 예정입니다. 현재는 Claude Desktop에서 가장 안정적으로 사용할 수 있습니다.

### 3. 기타 MCP 클라이언트

MCP 프로토콜을 지원하는 모든 클라이언트에서 사용 가능합니다:

```json
{
  "command": "npx",
  "args": ["-y", "google-chat-webhook-mcp"],
  "env": {
    "GOOGLE_CHAT_WEBHOOK_URL": "your-webhook-url"
  }
}

1. Google Chat 스페이스 열기
2. 상단 메뉴 → "앱 및 통합" → "Webhook 관리"
3. "Webhook 추가" 클릭
4. 이름 입력 후 URL 복사
5. 환경 변수에 설정

## 사용법

### MCP 도구 (3가지)

Claude Desktop이나 다른 MCP 클라이언트에서 다음 도구들을 사용할 수 있습니다:

#### 1. `send_google_chat_text`
간단한 텍스트 메시지 전송

**예시 (Claude Desktop):**
```
Send "Hello from Claude!" to Google Chat
```

**파라미터:**
```json
{
  "text": "안녕하세요, Google Chat!"
}
```

#### 2. `send_google_chat_cards_v2`
Cards V2 형식으로 직접 전송 (고급 사용자용)

**파라미터:**
```json
{
  "text": "Card Message",
  "cardsV2": [
    {
      "cardId": "unique-card",
      "card": {
        "header": { "title": "Card Title" },
        "sections": [
          {
            "widgets": [
              { "textParagraph": { "text": "Card content" } }
            ]
          }
        ]
      }
    }
  ]
}
```

#### 3. `send_google_chat_markdown` ⭐ **추천**
Markdown을 Cards V2로 자동 변환하여 전송

**예시 (Claude Desktop):**
```
Send this markdown to Google Chat:
# Project Update
- Task 1: ✅ Completed
- Task 2: 🚧 In Progress
**Deadline**: Tomorrow
```

**파라미터:**
```json
{
  "markdown": "# 제목\n\n**굵은 글씨**와 *기울임*\n\n- 리스트 항목 1\n- 리스트 항목 2\n\n```python\nprint('Hello')\n```",
  "cardTitle": "마크다운 메시지",
  "fallbackToText": true
}
```

**옵션:**
- `cardTitle`: 카드 상단에 표시될 제목 (선택)
- `fallbackToText`: 변환 실패 시 텍스트로 자동 전송 (기본값: false)

### Claude Desktop 사용 예시

설정 완료 후 Claude와 자연어로 대화하면 자동으로 MCP 도구를 사용합니다:

**👤 사용자:**
> "Google Chat에 프로젝트 상태 업데이트를 보내줘. 완료된 작업 3개, 진행 중인 작업 2개를 마크다운 리스트로 작성해서."

**🤖 Claude:**
> (자동으로 `send_google_chat_markdown` 도구 호출)
> 
> Google Chat에 메시지를 전송했습니다. 프로젝트 상태가 업데이트되었습니다.

**👤 사용자:**
> "방금 보낸 메시지에 코드 예제도 추가해줘."

**🤖 Claude:**
> (다시 Markdown으로 메시지 생성 및 전송)


### 지원하는 Markdown 문법

Claude나 MCP 클라이언트에서 Markdown으로 메시지를 작성하면 자동으로 Google Chat Cards V2로 변환됩니다.

| 문법 | Markdown 예시 | Google Chat 렌더링 |
|------|---------------|-------------------|
| **헤더** | `# H1`, `## H2`, `### H3` | 굵은 글씨 + 크기 차등 |
| **굵게** | `**bold**` 또는 `__bold__` | **bold** |
| **기울임** | `*italic*` 또는 `_italic_` | *italic* |
| **인라인 코드** | `` `code` `` | `code` (고정폭 폰트) |
| **코드블록** | ` ```python\ncode\n``` ` | 구문 강조 박스 |
| **순서 리스트** | `1. First\n2. Second` | 1. First<br>2. Second |
| **비순서 리스트** | `- Item` 또는 `* Item` | • Item |
| **중첩 리스트** | `  - nested` (2칸 들여쓰기) | 　• nested (Em space) |
| **표** | `\| A \| B \|\n\|--\|--\|` | 고정폭 폰트 표 |
| **이미지** | `![alt](https://...)` | 이미지 위젯 (URL 검증 후) |
| **링크** | `[텍스트](https://...)` | 클릭 가능한 링크 |
| **수평선** | `---` 또는 `***` | 구분선 |
| **인용문** | `> quote` | 들여쓰기 + 회색 텍스트 |

**예시 Markdown:**
```markdown
# 프로젝트 배포 완료 🚀

## 주요 변경사항

- **성능 개선**: API 응답 속도 30% 향상
- **버그 수정**: 로그인 오류 해결
- 새 기능 추가

## 배포 상태

| 환경 | 상태 | 버전 |
|------|------|------|
| Production | ✅ | v2.1.0 |
| Staging | ✅ | v2.1.0 |

## 다음 단계

1. 모니터링 24시간
2. 사용자 피드백 수집
3. 다음 스프린트 계획

코드 예제:
```python
def deploy():
    print("Deploying v2.1.0...")
    return True
```

자세한 내용은 [문서](https://docs.example.com)를 참조하세요.
```

**변환 결과:** Google Chat에서 헤더, 리스트, 표, 코드블록이 모두 시각적으로 구분되어 표시됩니다.

## 환경 변수

### 필수 환경 변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `GOOGLE_CHAT_WEBHOOK_URL` | Google Chat Webhook URL | `https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx` |

### 선택 환경 변수 (로깅)

| 변수명 | 설명 | 기본값 | 허용값 |
|--------|------|--------|--------|
| `LOG_LEVEL` | 로그 레벨 | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `LOG_DIR` | 로그 디렉토리 경로 | `./logs` | 절대/상대 경로 |
| `LOG_RETENTION_DAYS` | 로그 보관 일수 | `30` | 숫자 (일) |
| `LOG_ENABLE_CONSOLE` | 콘솔 출력 여부 | `true` | `true`, `false` |

### 설정 방법

#### Claude Desktop (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "google-chat": {
      "command": "npx",
      "args": ["-y", "google-chat-webhook-mcp"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx",
        "LOG_LEVEL": "INFO",
        "LOG_RETENTION_DAYS": "30"
      }
    }
  }
}
```

#### .env 파일 (개발용)

프로젝트 루트에 `.env` 파일 생성:

```env
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx
LOG_LEVEL=INFO
LOG_DIR=./logs
LOG_RETENTION_DAYS=30
LOG_ENABLE_CONSOLE=true
```

#### 시스템 환경 변수

**Windows (PowerShell):**
```powershell
$env:GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
```

**Linux/macOS (Bash/Zsh):**
```bash
export GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
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

### Google Chat API 제약사항

| 항목 | 제한 | 대응 방법 |
|------|------|-----------|
| **이미지 프로토콜** | HTTPS만 지원 | HTTP URL은 텍스트 링크로 대체 |
| **이미지 크기** | 최대 5MB | 검증 실패 시 링크로 표시 |
| **이미지 인증** | 공개 URL만 가능 | 인증 필요 시 접근 불가 |
| **Content-Type** | `image/*`만 허용 | HTML 페이지 등은 거부 |
| **Markdown 지원** | 제한적 | 미지원 문법은 근사치로 변환 |

### Markdown 변환 제약사항

**✅ 완전 지원:**
- 헤더 (H1~H6)
- 굵게, 기울임, 인라인 코드
- 순서/비순서 리스트 (최대 3단계 중첩)
- 코드블록 (구문 강조)
- 표 (고정폭 폰트)
- 링크, 이미지

**⚠️ 부분 지원:**
- 복잡한 중첩 구조 → 단순화됨
- HTML 태그 → 텍스트로 변환
- 인용문 → 들여쓰기로 표현

**❌ 미지원:**
- 각주 (footnotes)
- 정의 리스트 (definition lists)
- 수학 수식 (LaTeX)
- 작업 체크박스 (`- [ ]`, `- [x]`)
- Emoji 단축코드 (`:smile:` 등, 유니코드 이모지는 가능)

### MCP 클라이언트 호환성

| 클라이언트 | 지원 상태 | 비고 |
|------------|----------|------|
| **Claude Desktop** | ✅ 완전 지원 | 권장 환경 |
| **GitHub Copilot** | ⚠️ 실험적 | MCP 공식 지원 대기 중 |
| **Cursor** | ⚠️ 미검증 | MCP 지원 시 동작 예상 |
| **기타 MCP 클라이언트** | ⚠️ 미검증 | MCP 표준 준수 시 동작 |

### 성능 및 제한

- **이미지 검증 타임아웃**: 5초
- **Webhook 요청 타임아웃**: 5초
- **로그 파일 크기**: 무제한 (30일 자동 삭제)
- **동시 요청**: 제한 없음 (Google Chat API 제한 준수)

### 보안 고려사항

⚠️ **Webhook URL은 민감 정보입니다:**
- Git에 커밋하지 마세요
- 공개 저장소에 노출 금지
- 정기적으로 재생성 권장
- `.env` 파일은 `.gitignore`에 포함 필수

## FAQ

### Q: Claude Desktop에서 MCP 서버가 인식되지 않습니다
**A**: 다음을 확인하세요:

1. **설정 파일 위치**가 올바른지 확인:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. **JSON 형식**이 유효한지 확인 (쉼표, 따옴표 등)

3. **Claude Desktop 완전 재시작**:
   - 시스템 트레이/메뉴바에서도 종료
   - 다시 실행

4. **npm 패키지 설치 확인**:
   ```bash
   npm list -g google-chat-webhook-mcp
   ```

5. **로그 확인** (Claude Desktop 개발자 도구):
   - View → Developer → Developer Tools → Console

### Q: GitHub Copilot에서 사용할 수 있나요?
**A**: GitHub Copilot은 아직 MCP를 공식 지원하지 않습니다. 

**현재 가능한 방법:**
- VS Code 터미널에서 직접 실행
- MCP Bridge 확장 사용 (실험적)
- GitHub Copilot의 향후 업데이트 대기

**권장:** 현재는 **Claude Desktop**에서 사용하는 것이 가장 안정적입니다.

### Q: 이미지가 표시되지 않습니다
**A**: 이미지 URL 검증 실패 원인:

1. **HTTPS만 지원** (HTTP는 불가)
2. **파일 크기**: 5MB 이하여야 함
3. **공개 접근**: 인증 없이 접근 가능한 URL이어야 함
4. **Content-Type**: 응답 헤더가 `image/*`여야 함

**디버깅:**
```bash
# 로그 확인
cat logs/app-YYYY-MM-DD.log | grep "image_validation_failed"
```

**검증 실패 시 동작:**
- 이미지는 텍스트 링크로 대체됨
- 예: `⚠️ 이미지 로드 실패: https://... (HTTP 404: Not Found)`

### Q: Cards V2 변환이 실패합니다
**A**: 다음을 확인하세요:

1. **fallbackToText 옵션 사용**:
   ```json
   {
     "markdown": "...",
     "fallbackToText": true
   }
   ```
   변환 실패 시 자동으로 텍스트로 전송됩니다.

2. **로그에서 원인 확인**:
   ```bash
   cat logs/errors-YYYY-MM-DD.log
   ```

3. **지원하지 않는 Markdown 문법**:
   - 각주 (footnotes)
   - 정의 리스트 (definition lists)
   - 복잡한 HTML 태그

### Q: 로그 파일이 너무 많이 쌓입니다
**A**: 환경 변수로 조정:

```json
{
  "env": {
    "LOG_LEVEL": "WARN",
    "LOG_RETENTION_DAYS": "7"
  }
}
```

- `LOG_LEVEL=ERROR`: 에러만 기록
- `LOG_RETENTION_DAYS=7`: 7일만 보관
- `LOG_ENABLE_CONSOLE=false`: 콘솔 출력 비활성화

### Q: npx 실행 시 "command not found" 오류
**A**: Node.js와 npm이 설치되어 있는지 확인:

```bash
node --version  # v18.0.0 이상 권장
npm --version
```

설치되지 않았다면:
- **Windows**: https://nodejs.org/ 에서 다운로드
- **macOS**: `brew install node`
- **Linux**: `sudo apt install nodejs npm` (Ubuntu/Debian)

### Q: Webhook URL을 어떻게 안전하게 관리하나요?
**A**: 

1. **환경 변수 사용** (설정 파일에 직접 쓰지 마세요)
2. **Git에 커밋하지 마세요** (.gitignore 확인)
3. **정기적으로 재생성** (유출 의심 시)
4. **Google Chat에서 Webhook 삭제**로 무효화 가능

### Q: 여러 Google Chat 스페이스에 메시지를 보내고 싶습니다
**A**: 각 스페이스마다 다른 MCP 서버 인스턴스 등록:

```json
{
  "mcpServers": {
    "google-chat-team-a": {
      "command": "npx",
      "args": ["-y", "google-chat-webhook-mcp"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "https://chat.googleapis.com/.../team-a/..."
      }
    },
    "google-chat-team-b": {
      "command": "npx",
      "args": ["-y", "google-chat-webhook-mcp"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "https://chat.googleapis.com/.../team-b/..."
      }
    }
  }
}
```

Claude에서 "Send to team-a" 또는 "Send to team-b"로 구분하여 사용할 수 있습니다.

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
