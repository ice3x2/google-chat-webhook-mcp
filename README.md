
---
# Google Chat Webhook MCP Server

[![CI](https://github.com/ice3x2/google-chat-webhook-mcp/workflows/CI/badge.svg)](https://github.com/ice3x2/google-chat-webhook-mcp/actions)
[![npm version](https://img.shields.io/npm/v/google-chat-webhook-mcp.svg)](https://www.npmjs.com/package/google-chat-webhook-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An MCP (Model Context Protocol) server that sends messages to Google Chat via webhooks. Automatically converts Markdown to Google Chat Cards V2 format with image validation, structured logging, and fallback handling.

## Features

- 🚀 **MCP Protocol Support**: Integrates with Claude Code, GitHub Copilot, and other MCP clients
 - � **MCP Protocol Support**: Integrates with Claude Code, GitHub Copilot, and other MCP clients
- �📝 **Markdown → Cards V2 Auto-conversion**: Supports headers, lists, code blocks, tables, images, and more
- 🖼️ **Image URL Validation**: Validates with HEAD requests (HTTP status, Content-Type, size)
- 🔄 **Auto Fallback**: Automatically falls back to text when Cards V2 fails
- 📊 **Structured Logging**: JSON format with 30-day retention
- ✅ **Test Automation**: Snapshot tests, integration tests, CI/CD pipeline

## Installation

### npm (Recommended)

```bash
npm install -g google-chat-webhook-mcp
```

### From Source (Development)

```bash
git clone https://github.com/ice3x2/google-chat-webhook-mcp.git
cd google-chat-webhook-mcp
npm install
npm run build
```

## Google Chat Webhook Setup

Before configuring the MCP server, create a Google Chat Webhook URL:

1. Open your Google Chat space
2. Menu → "Apps & integrations" → "Manage webhooks"
3. Click "Add webhook"
4. Enter a name and **copy the URL**
5. Use it in the configuration below

## MCP Client Configuration

### 1. Claude Code

#### Config File Location

- **Windows**: `%USERPROFILE%\.claude.json`
- **macOS/Linux**: `~/.claude.json`

**Note**: Claude Desktop uses different paths:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

#### npm Installation

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

#### Source Installation

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

**⚠️ Note**: Use `\\` or `/` for Windows paths (e.g., `C:/path/to/...`)

#### Configuration Scopes

Claude Code supports three configuration scopes:

1. **User Scope** (Global): `~/.claude.json` - Available across all projects
2. **Project Scope** (Shared): `.mcp.json` in project root - Version-controlled, team-shared
3. **Local Scope** (Private): Project-specific, personal settings

**Priority**: Local > Project > User

#### Project-Scoped Configuration (.mcp.json)

For team-shared MCP servers, create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "google-chat": {
      "command": "npx",
      "args": ["-y", "google-chat-webhook-mcp"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "${GOOGLE_CHAT_WEBHOOK_URL}"
      }
    }
  }
}
```

**Benefits**:
- ✅ Version-controlled with Git
- ✅ Team-shared configuration
- ✅ Environment variable support: `${VAR}` or `${VAR:-default}`
- ✅ Project-specific MCP servers

**Environment Variables**: Each team member can set their own webhook URL:
```bash
# Linux/macOS
export GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"

# Windows (PowerShell)
$env:GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
```

#### How to Apply

**User-scoped configuration** (~/.claude.json):
1. Edit `~/.claude.json` (or `%USERPROFILE%\.claude.json` on Windows)
2. Save the file
3. Restart Claude Code if already running

**Project-scoped configuration** (.mcp.json):
1. Create `.mcp.json` in project root
2. Set environment variables for sensitive data
3. Commit `.mcp.json` to version control
4. Use commands like "Send a message to Google Chat"

### 2. GitHub Copilot (VS Code)

[VS Code GitHub Copilot](https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode) supports MCP through **agent mode**. Configure MCP servers in workspace or user settings.

#### Configuration File Locations

Choose one of the following:

- **User Settings**: `~/.vscode/settings.json` or `%APPDATA%\Code\User\settings.json` (Windows)
- **Workspace Settings**: `.vscode/settings.json` in your project root
 - **Claude Code Config** (Auto-import): Copy from `~/.claude.json`

#### Configuration (mcp.json format)

Add to `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
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

#### Features

- **Agent Mode Integration**: MCP tools available in agent workflow
- **Per-Session Tool Selection**: Choose which tools to enable per session
- **STDIO & SSE Support**: Both transport types supported
- **Debugging**: Restart commands and output logging built-in

#### Using with Agent Mode

1. Open GitHub Copilot Chat in VS Code
2. Enable agent mode (if not already enabled)
3. Start a conversation - Copilot will automatically access MCP tools
4. Tools require approval before execution

**Example:**
```
@workspace Send a deployment summary to Google Chat
```

**📝 Note**: GitHub Copilot's MCP support includes agent mode, allowing sophisticated workflows. Make sure you're using the latest VS Code and GitHub Copilot extension.

### 3. Other MCP Clients

Works with any MCP-compatible client:

```json
{
  "command": "npx",
  "args": ["-y", "google-chat-webhook-mcp"],
  "env": {
    "GOOGLE_CHAT_WEBHOOK_URL": "your-webhook-url"
  }
}
```

## Usage

### MCP Tools (3 Tools)

Available tools in Claude Code or other MCP clients:

#### 1. `send_google_chat_text`
Send simple text messages

**Example (Claude Code):**
```
Send "Hello from Claude!" to Google Chat
```

**Parameters:**
```json
{
  "text": "Hello, Google Chat!"
}
```

#### 2. `send_google_chat_cards_v2`
Send Cards V2 format directly (advanced users)

**Parameters:**
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

#### 3. `send_google_chat_markdown` ⭐ **Recommended**
Convert Markdown to Cards V2 and send

**Example (Claude Code):**
```
Send this markdown to Google Chat:
# Project Update
- Task 1: ✅ Completed
- Task 2: 🚧 In Progress
**Deadline**: Tomorrow
```

**Parameters:**
```json
{
  "markdown": "# Title\n\n**Bold** and *italic*\n\n- List item 1\n- List item 2\n\n```python\nprint('Hello')\n```",
  "cardTitle": "Markdown Message",
  "fallbackToText": true
}
```

**Options:**
- `cardTitle`: Title shown at the top of the card (optional)
- `fallbackToText`: Auto-send as text on conversion failure (default: false)

### Claude Code Usage Example
 
After setup, Claude will automatically use MCP tools when you chat naturally:

**👤 User:**
> "Send a project status update to Google Chat. Show 3 completed tasks and 2 in-progress tasks as a markdown list."

**🤖 Claude:**
> (Automatically calls `send_google_chat_markdown` tool)
> 
> I've sent the message to Google Chat. The project status has been updated.

### Supported Markdown Syntax

Markdown written in Claude or MCP clients is automatically converted to Google Chat Cards V2.

| Syntax | Markdown Example | Google Chat Rendering |
|--------|------------------|----------------------|
| **Headers** | `# H1`, `## H2`, `### H3` | Bold with size differences |
| **Bold** | `**bold**` or `__bold__` | **bold** |
| **Italic** | `*italic*` or `_italic_` | *italic* |
| **Inline Code** | `` `code` `` | `code` (monospace) |
| **Code Block** | ` ```python\ncode\n``` ` | Syntax-highlighted box |
| **Ordered List** | `1. First\n2. Second` | 1. First<br>2. Second |
| **Unordered List** | `- Item` or `* Item` | • Item |
| **Nested List** | `  - nested` (2-space indent) | 　• nested (Em space) |
| **Table** | `\| A \| B \|\n\|--\|--\|` | Monospace table |
| **Image** | `![alt](https://...)` | Image widget (after validation) |
| **Link** | `[text](https://...)` | Clickable link |
| **Horizontal Rule** | `---` or `***` | Divider |
| **Blockquote** | `> quote` | Indented + gray text |

**Example Markdown:**
```markdown
# Project Deployment Complete 🚀

## Key Changes

- **Performance**: API response 30% faster
- **Bug Fix**: Login error resolved
- New feature added

## Deployment Status

| Environment | Status | Version |
|-------------|--------|---------|
| Production | ✅ | v2.1.0 |
| Staging | ✅ | v2.1.0 |

## Next Steps

1. Monitor for 24 hours
2. Collect user feedback
3. Plan next sprint

Code example:
```python
def deploy():
    print("Deploying v2.1.0...")
    return True
```

See [documentation](https://docs.example.com) for details.
```

**Result:** Headers, lists, tables, and code blocks are all visually distinguished in Google Chat.

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CHAT_WEBHOOK_URL` | Google Chat Webhook URL | `https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx` |

### Optional (Logging)

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `LOG_LEVEL` | Log level | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `LOG_DIR` | Log directory path | `./logs` | Absolute/relative path |
| `LOG_RETENTION_DAYS` | Days to keep logs | `30` | Number (days) |
| `LOG_ENABLE_CONSOLE` | Enable console output | `true` | `true`, `false` |

### Configuration Methods

#### Claude Code (~/.claude.json)

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

#### .env File (Development)

Create `.env` in project root:

```env
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx
LOG_LEVEL=INFO
LOG_DIR=./logs
LOG_RETENTION_DAYS=30
LOG_ENABLE_CONSOLE=true
```

## Limitations

### Google Chat API Constraints

| Item | Limit | Workaround |
|------|-------|------------|
| **Image Protocol** | HTTPS only | HTTP URLs replaced with text links |
| **Image Size** | Max 5MB | Show as link on validation failure |
| **Image Auth** | Public URLs only | No access if auth required |
| **Content-Type** | `image/*` only | HTML pages rejected |
| **Markdown Support** | Limited | Unsupported syntax approximated |

### Markdown Conversion Limitations

**✅ Fully Supported:**
- Headers (H1~H6)
- Bold, italic, inline code
- Ordered/unordered lists (up to 3 levels)
- Code blocks (syntax highlighting)
- Tables (monospace)
- Links, images

**⚠️ Partial Support:**
- Complex nesting → Simplified
- HTML tags → Converted to text
- Blockquotes → Shown as indents

**❌ Not Supported:**
- Footnotes
- Definition lists
- Math formulas (LaTeX)
- Task checkboxes (`- [ ]`, `- [x]`)
- Emoji shortcodes (`:smile:`, Unicode emojis work)



## FAQ


### Q: Images not displaying
**A**: Image validation failure causes:

1. **HTTPS only** (HTTP not supported)
2. **File size**: Must be under 5MB
3. **Public access**: Must be accessible without auth
4. **Content-Type**: Response header must be `image/*`

**Debug:**
```bash
cat logs/app-YYYY-MM-DD.log | grep "image_validation_failed"
```

### Q: Cards V2 conversion fails
**A**: Use `fallbackToText` option:

```json
{
  "markdown": "...",
  "fallbackToText": true
}
```

Check logs for details:
```bash
cat logs/errors-YYYY-MM-DD.log
```

### Q: Too many log files
**A**: Adjust with environment variables:

```json
{
  "env": {
    "LOG_LEVEL": "WARN",
    "LOG_RETENTION_DAYS": "7"
  }
}
```

### Q: Multiple Google Chat spaces
**A**: Register separate MCP server instances:

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

## License

MIT License - [LICENSE](LICENSE)

## Links

- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [Claude Code](https://claude.ai/desktop)
- [Google Chat API](https://developers.google.com/chat)

---
Korean:

[![CI](https://github.com/ice3x2/google-chat-webhook-mcp/workflows/CI/badge.svg)](https://github.com/ice3x2/google-chat-webhook-mcp/actions)
[![npm version](https://img.shields.io/npm/v/google-chat-webhook-mcp.svg)](https://www.npmjs.com/package/google-chat-webhook-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP (Model Context Protocol) 서버로 Google Chat 웹훅을 통해 메시지를 전송합니다. Markdown을 Google Chat Cards V2 형식으로 자동 변환하며, 이미지 검증, 자동 로깅, 폴백 처리를 지원합니다.

## 주요 기능

- 🚀 **MCP 프로토콜 지원**: Claude Code, GitHub Copilot 등과 통합
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

### 1. Claude Code

#### 설정 파일 위치

- **Windows**: `%USERPROFILE%\.claude.json`
- **macOS/Linux**: `~/.claude.json`

**참고**: Claude Desktop은 다른 경로를 사용합니다:
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

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

#### 설정 스코프

Claude Code는 3가지 설정 스코프를 지원합니다:

1. **User Scope** (전역): `~/.claude.json` - 모든 프로젝트에서 사용 가능
2. **Project Scope** (공유): 프로젝트 루트의 `.mcp.json` - 버전 관리, 팀 공유 가능
3. **Local Scope** (개인): 프로젝트별 개인 설정

**우선순위**: Local > Project > User

#### 프로젝트 수준 설정 (.mcp.json)

팀과 공유할 MCP 서버 설정은 프로젝트 루트에 `.mcp.json` 파일을 생성하세요:

```json
{
  "mcpServers": {
    "google-chat": {
      "command": "npx",
      "args": ["-y", "google-chat-webhook-mcp"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "${GOOGLE_CHAT_WEBHOOK_URL}"
      }
    }
  }
}
```

**장점**:
- ✅ Git으로 버전 관리 가능
- ✅ 팀과 설정 공유
- ✅ 환경 변수 지원: `${VAR}` 또는 `${VAR:-기본값}`
- ✅ 프로젝트별 MCP 서버 설정

**환경 변수 설정**: 각 팀원이 자신의 Webhook URL을 설정할 수 있습니다:
```bash
# Linux/macOS
export GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"

# Windows (PowerShell)
$env:GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/xxx/messages?key=xxx&token=xxx"
```

#### 적용 방법

**User 수준 설정** (~/.claude.json):
1. `~/.claude.json` 편집 (Windows는 `%USERPROFILE%\.claude.json`)
2. 파일 저장
3. Claude Code가 실행 중이면 재시작

**Project 수준 설정** (.mcp.json):
1. 프로젝트 루트에 `.mcp.json` 생성
2. 민감한 데이터는 환경 변수로 설정
3. `.mcp.json`을 버전 관리 시스템에 커밋
4. "Send a message to Google Chat" 같은 명령 사용

### 2. GitHub Copilot (VS Code)

[VS Code GitHub Copilot](https://code.visualstudio.com/docs/copilot/chat/chat-agent-mode)은 **에이전트 모드**를 통해 MCP를 지원합니다. 워크스페이스 또는 사용자 설정에서 MCP 서버를 구성할 수 있습니다.

#### 설정 파일 위치

다음 중 하나를 선택:

- **사용자 설정**: `~/.vscode/settings.json` 또는 `%APPDATA%\Code\User\settings.json` (Windows)
- **워크스페이스 설정**: 프로젝트 루트의 `.vscode/settings.json`
- **Claude Code 설정** (자동 가져오기): `~/.claude.json`에서 복사

#### 설정 방법 (mcp.json 형식)

`settings.json`에 추가:

```json
{
  "github.copilot.chat.mcp.servers": {
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

#### 기능

- **에이전트 모드 통합**: 에이전트 워크플로우에서 MCP 도구 사용 가능
- **세션별 도구 선택**: 세션마다 활성화할 도구 선택 가능
- **STDIO & SSE 지원**: 두 전송 방식 모두 지원
- **디버깅**: 재시작 명령 및 출력 로깅 내장

#### 에이전트 모드에서 사용하기

1. VS Code에서 GitHub Copilot 채팅 열기
2. 에이전트 모드 활성화 (기본 활성화된 경우도 있음)
3. 대화 시작 - Copilot이 자동으로 MCP 도구에 접근
4. 도구 실행 전 승인 필요

**예시:**
```
@workspace 배포 요약을 Google Chat에 전송해줘
```

**📝 참고**: GitHub Copilot의 MCP 지원은 에이전트 모드를 포함하여 정교한 워크플로우를 지원합니다. 최신 버전의 VS Code와 GitHub Copilot 확장을 사용하세요.

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

Claude Code이나 다른 MCP 클라이언트에서 다음 도구들을 사용할 수 있습니다:

#### 1. `send_google_chat_text`
간단한 텍스트 메시지 전송

**예시 (Claude Code):**
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

**예시 (Claude Code):**
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

### Claude Code 사용 예시

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

#### Claude Code (~/.claude.json)

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
- [Claude Code](https://claude.ai/desktop)
- [Google Chat API](https://developers.google.com/chat)
