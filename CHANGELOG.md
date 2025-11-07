# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2025-11-08

### En

#### Fixed

- **Logger Permission Error Resolution**: Resolve EPERM error when running MCP server in IDE and containerized environments
  - Change default log directory from `./logs` to `~/.google-chat-webhook-mcp/logs` (user home directory based)
  - Resolve permission shortage issue when IDE sets CWD to `Program Files` directory
  - Gracefully fallback to console logging when file write permission is denied
  - Prevent process crash by detecting and handling EPERM/EACCES errors
  - Add user guidance error messages (LOG_DIR environment variable setup method)

#### Added

- **Logger Permission Fix Documentation**: New document `docs/logger-permission-fix.md`
  - Problem root cause analysis and cause chain explanation
  - 3-step solution detailed explanation
  - Configuration examples for Windows/macOS/Linux
  - Test scenarios and validation methods
  - Docker/Container environment recommendations

#### Changed

- **Logger Initialization**: Add permission error handling logic to `ensureLogDir()` method
- **Error Handling**: Add EPERM/EACCES error handling to `writeLog()` and `cleanOldLogs()` methods
- **Console Messages**: Provide user guidance messages when permission issues occur

### Ko

#### 수정

- **로거 권한 오류 해결**: IDE 및 컨테이너 환경에서 MCP 서버 실행 시 발생하는 EPERM 오류 해결
  - 기본 로그 디렉토리를 `./logs`에서 `~/.google-chat-webhook-mcp/logs`로 변경 (사용자 홈 디렉토리 기반)
  - IDE가 `Program Files` 디렉토리에 CWD를 설정할 때 발생하던 권한 부족 문제 해결
  - 파일 쓰기 권한이 없을 때 콘솔 로깅으로 우아하게 폴백
  - EPERM/EACCES 오류 감지 및 처리로 프로세스 크래시 방지
  - 사용자 가이드 에러 메시지 추가 (LOG_DIR 환경 변수 설정 방법)

#### 추가

- **로거 권한 오류 수정 문서**: 새로운 문서 `docs/logger-permission-fix.md`
  - 문제 원인 분석 및 근본 원인 체인 설명
  - 3단계 해결책 상세 설명
  - Windows/macOS/Linux 설정 예시
  - 테스트 시나리오 및 검증 방법
  - Docker/Container 환경 권장사항

#### 변경

- **로거 초기화**: `ensureLogDir()` 메서드에 권한 오류 처리 로직 추가
- **에러 처리**: `writeLog()` 및 `cleanOldLogs()` 메서드에 EPERM/EACCES 오류 처리 추가
- **콘솔 메시지**: 권한 문제 시 사용자 가이드 메시지 제공

---

## [0.1.3] - 2025-10-29

### En

#### Added

- **Webhook URL Validation**: Validate Google Chat webhook URL when server starts
  - Enforce HTTPS protocol only
  - Validate `chat.googleapis.com` domain
  - Validate `/v1/spaces/` path
  - Ensure `key` or `token` parameter exists
- **New Log Events**: `server_start_failed`, `invalid_webhook_url`, `server_starting`

#### Changed

- **Environment Variable Mandatory**: Block server startup if `GOOGLE_CHAT_WEBHOOK_URL` environment variable is not set
  - Previous: Display warning and start in mock mode
  - Current: Display clear error message and exit process (exit code 1)
- **Error Message Improvement**: Provide detailed guidance when webhook URL format is incorrect

#### Fixed

- **Security Enhancement**: Prevent server startup with invalid webhook URL
- **User Experience**: Enable quick problem identification with clear error messages

#### Technical Details

```typescript
// Validation Rules
✓ HTTPS protocol only
✓ chat.googleapis.com domain only
✓ /v1/spaces/ path required
✓ key or token parameter required

// Valid URL Example
https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=YOUR_KEY&token=YOUR_TOKEN
```

### Ko

#### 추가

- **웹훅 URL 검증**: 서버 시작 시 Google Chat 웹훅 URL 검증
  - HTTPS 프로토콜 필수 검증
  - `chat.googleapis.com` 도메인 검증
  - `/v1/spaces/` 경로 검증
  - `key` 또는 `token` 파라미터 존재 검증
- **새로운 로그 이벤트**: `server_start_failed`, `invalid_webhook_url`, `server_starting`

#### 변경

- **환경 변수 필수화**: `GOOGLE_CHAT_WEBHOOK_URL` 환경 변수가 없으면 서버 시작 차단
  - 이전: 경고 메시지만 출력하고 mock 모드로 시작
  - 현재: 명확한 에러 메시지와 함께 프로세스 종료 (exit code 1)
- **에러 메시지 개선**: 웹훅 URL 형식 오류 시 상세한 가이드 제공

#### 수정

- **보안 강화**: 잘못된 웹훅 URL로 서버가 시작되는 것을 방지
- **사용자 경험**: 명확한 에러 메시지로 설정 오류 빠르게 파악 가능

#### 기술 상세

```typescript
// 검증 규칙
✓ HTTPS 프로토콜만 허용
✓ chat.googleapis.com 도메인만 허용
✓ /v1/spaces/ 경로 필수
✓ key 또는 token 파라미터 필수

// 올바른 URL 예시
https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=YOUR_KEY&token=YOUR_TOKEN
```

---

## [0.1.2] - 2025-10-29

### En

#### Added

- **ES Module Compatibility Fix**: Add `.js` extension to all local import statements
  - Comply with Node.js ES module specification
  - Resolve `ERR_MODULE_NOT_FOUND` error
- **Stdin Hang Fix**: Add `process.stdin.resume()`
  - Keep MCP server process alive while waiting for stdin messages
  - Fix hang issue when running `npx google-chat-webhook-mcp`
- **Shebang Addition**: Add `#!/usr/bin/env node` to `index.ts`
  - Enable direct execution in Unix/Linux environments

#### Technical Details

- Add `.js` extension to all local import paths
  - `'./server'` → `'./server.js'`
  - `'../utils/logger'` → `'../utils/logger.js'`
- Add `process.stdin.resume()` to `server.ts` to activate stdin stream
- Output MCP server messages to `console.error()` to prevent stdout protocol conflicts

### Ko

#### 추가

- **ES 모듈 호환성 수정**: 모든 로컬 import 문에 `.js` 확장자 추가
  - Node.js ES 모듈 사양 준수
  - `ERR_MODULE_NOT_FOUND` 에러 해결
- **Stdin Hang 이슈 수정**: `process.stdin.resume()` 추가
  - MCP 서버가 stdin으로부터 메시지를 대기하도록 프로세스 유지
  - `npx google-chat-webhook-mcp` 실행 시 hang 걸리는 문제 해결
- **Shebang 추가**: `index.ts`에 `#!/usr/bin/env node` 추가
  - Unix/Linux 환경에서 직접 실행 가능

#### 기술 상세

- 모든 `import` 문의 로컬 경로에 `.js` 확장자 명시
  - `'./server'` → `'./server.js'`
  - `'../utils/logger'` → `'../utils/logger.js'`
- `server.ts`에 `process.stdin.resume()` 추가하여 stdin 스트림 활성화
- MCP 서버 메시지를 `console.error()`로 출력하여 stdout 프로토콜 충돌 방지

---

## [0.1.1] - 2025-10-29

### En

#### Fixed

- **ES Module Compatibility**: Add `.js` extension to all local import statements
  - Comply with Node.js ES module specification
  - Resolve `ERR_MODULE_NOT_FOUND` error
- **Stdin Hang Issue**: Add `process.stdin.resume()`
  - Keep MCP server process alive waiting for stdin messages
  - Fix hang issue when running `npx google-chat-webhook-mcp`
- **Shebang Addition**: Add `#!/usr/bin/env node` to `index.ts`
  - Enable direct execution in Unix/Linux environments

#### Technical Details

- Add `.js` extension to all local import paths
  - `'./server'` → `'./server.js'`
  - `'../utils/logger'` → `'../utils/logger.js'`
- Add `process.stdin.resume()` to `server.ts` to activate stdin stream
- Output MCP server messages to `console.error()` to prevent stdout protocol conflicts

### Ko

#### 수정

- **ES 모듈 호환성**: 모든 로컬 import 문에 `.js` 확장자 추가
  - Node.js ES 모듈 사양 준수
  - `ERR_MODULE_NOT_FOUND` 에러 해결
- **Stdin Hang 이슈**: `process.stdin.resume()` 추가
  - MCP 서버가 stdin으로부터 메시지를 대기하도록 프로세스 유지
  - `npx google-chat-webhook-mcp` 실행 시 hang 걸리는 문제 해결
- **Shebang 추가**: `index.ts`에 `#!/usr/bin/env node` 추가
  - Unix/Linux 환경에서 직접 실행 가능

#### 기술 상세

- 모든 `import` 문의 로컬 경로에 `.js` 확장자 명시
  - `'./server'` → `'./server.js'`
  - `'../utils/logger'` → `'../utils/logger.js'`
- `server.ts`에 `process.stdin.resume()` 추가하여 stdin 스트림 활성화
- MCP 서버 메시지를 `console.error()`로 출력하여 stdout 프로토콜 충돌 방지

---

## [0.1.0] - 2025-10-29

### En

#### Added

##### Phase 0-2: Core Implementation
- **MCP Server**: Model Context Protocol server based on StdioServerTransport
- **3 MCP Tools**:
  - `send_google_chat_text`: Send text messages
  - `send_google_chat_cards_v2`: Send Cards V2 messages
  - `send_google_chat_markdown`: Auto convert Markdown to Cards V2 (with fallback support)
- **Markdown → Cards V2 Conversion**: Token parsing based on marked library
  - Headers (H1-H6): Bold + size differentiation
  - Inline formats: Bold, italic, inline code
  - Lists: Ordered/unordered lists, nested support (em space indentation)
  - Code blocks: Fixed-width font, language label
  - Tables: Fixed-width font table rendering
  - Images: URL → image widget conversion
  - Links: Clickable hyperlinks
- **Cards V2 Schema Validation**: Zod-based schema validation

##### Phase 3.1: Test Automation
- **SnapshotTester Class**: Automated regression testing
- **12 Test Cases**:
  - Basic formatting (headers, bold, italic, code)
  - Nested lists (3-level depth)
  - Code blocks (by language)
  - Tables (complex structures)
  - Images (valid/invalid)
  - Mixed content
  - Edge cases (minimal/special characters/long text)
  - Korean content
  - Multi-level headers
- **npm Scripts**: `test:snapshot`, `test:snapshot:update`

##### Phase 3.2: Image Validation
- **imageValidator Utility**: Image validation based on HEAD request
  - HTTP status code check (2xx only)
  - Content-Type check (image/* required)
  - Size check (5MB limit)
  - 5-second timeout
- **Fallback Processing**: Replace with text link on validation failure

##### Phase 3.3: Logging System
- **Logger Class**: Structured JSON logging
  - 4-level log levels (DEBUG, INFO, WARN, ERROR)
  - Daily log files (app-YYYY-MM-DD.log)
  - Error-exclusive log files (errors-YYYY-MM-DD.log)
  - Color console output
- **LogCleaner**: Automatic log cleanup
  - 30-day retention policy
  - Auto-run every 24 hours
  - Environment variable configuration available
- **Logging Integration**:
  - sendMarkdownMessage: Send success/failure, fallback usage, elapsed time
  - imageValidator: Image validation failure details
  - sendCardsV2Message: Send failure
- **Environment Variables**: LOG_LEVEL, LOG_DIR, LOG_RETENTION_DAYS, LOG_ENABLE_CONSOLE

##### Phase 3.4: CI/CD Pipeline
- **GitHub Actions Workflow** (.github/workflows/ci.yml):
  - Node.js 18.x, 20.x matrix build
  - Steps: Checkout → Setup → Install → Lint → Build → Test
  - Snapshot test + logging test auto-run
  - Integration test (master branch, webhook Secret used)
  - Artifact upload (build results, test results, logs)
- **ESLint Configuration** (eslint.config.mjs):
  - ESLint v9.x flat configuration
  - TypeScript support (@typescript-eslint)
  - Warning output (no build blocking)
  - npm Scripts: `lint`, `lint:fix`
- **Test Scripts**:
  - test-error-logging.ts: Error case testing
  - test-logging-integration.ts: Real webhook integration testing
- **Documentation**: CI configuration guide (docs/ci-setup.md)

##### Documentation
- **README.md**: Comprehensive user guide
  - Installation and configuration (Claude Code integration)
  - Usage (3 MCP tools)
  - Markdown syntax support list
  - Environment variable description
  - Architecture diagram
  - FAQ section
  - CI/CD badges
- **docs/logging-design.md**: Logging system design document
- **docs/ci-setup.md**: CI/CD configuration guide
- **docs/markdown-to-cards-implementation.md**: Markdown implementation plan
- **.env.example**: Environment variable examples

#### Technical Details

- **Dependencies**:
  - @modelcontextprotocol/sdk: ^1.20.0
  - axios: ^1.0.0
  - marked: ^16.4.1
  - zod: ^3.21.4
- **Dev Dependencies**:
  - TypeScript: ^5.0.0
  - ESLint: ^9.38.0
  - @typescript-eslint: ^8.46.2
- **Node.js**: 18.x, 20.x support
- **Build**: TypeScript → JavaScript (dist/)

#### Known Issues

- Some image URLs may fail validation due to timeout (network environment dependent)
- Complex nested Markdown structures may be simplified during rendering

### Ko

#### 추가

##### Phase 0-2: 핵심 구현
- **MCP 서버**: StdioServerTransport 기반 Model Context Protocol 서버
- **3가지 MCP 도구**:
  - `send_google_chat_text`: 텍스트 메시지 전송
  - `send_google_chat_cards_v2`: Cards V2 메시지 전송
  - `send_google_chat_markdown`: Markdown → Cards V2 자동 변환 (폴백 지원)
- **Markdown → Cards V2 변환**: marked 라이브러리 기반 토큰 파싱
  - 헤더 (H1-H6): 굵게 + 크기 차등
  - 인라인 포맷: 굵게, 기울임, 인라인 코드
  - 리스트: 순서/비순서 리스트, 중첩 지원 (em space 들여쓰기)
  - 코드블록: 고정폭 폰트, 언어 라벨
  - 표: 고정폭 폰트 표 렌더링
  - 이미지: URL → 이미지 위젯 변환
  - 링크: 클릭 가능한 하이퍼링크
- **Cards V2 스키마 검증**: Zod 기반 스키마 검증

##### Phase 3.1: 테스트 자동화
- **SnapshotTester 클래스**: 자동화된 회귀 테스트
- **12개 테스트 케이스**:
  - 기본 포맷 (헤더, 굵게, 기울임, 코드)
  - 중첩 리스트 (3단계 깊이)
  - 코드블록 (언어별)
  - 표 (복잡한 구조)
  - 이미지 (유효/무효)
  - 복합 콘텐츠
  - 엣지케이스 (최소/특수문자/긴 텍스트)
  - 한글 콘텐츠
  - 다단계 헤더
- **npm 스크립트**: `test:snapshot`, `test:snapshot:update`

##### Phase 3.2: 이미지 검증
- **imageValidator 유틸리티**: HEAD 요청 기반 이미지 검증
  - HTTP 상태 코드 확인 (2xx만 허용)
  - Content-Type 확인 (image/* 필수)
  - 크기 확인 (5MB 제한)
  - 5초 타임아웃
- **폴백 처리**: 검증 실패 시 텍스트 링크로 대체

##### Phase 3.3: 로깅 시스템
- **Logger 클래스**: 구조화된 JSON 로깅
  - 4단계 로그 레벨 (DEBUG, INFO, WARN, ERROR)
  - 일별 로그 파일 (app-YYYY-MM-DD.log)
  - 에러 전용 로그 파일 (errors-YYYY-MM-DD.log)
  - 컬러 콘솔 출력
- **LogCleaner**: 자동 로그 정리
  - 30일 보관 정책
  - 24시간마다 자동 실행
  - 환경 변수 설정 가능
- **로깅 통합**:
  - sendMarkdownMessage: 전송 성공/실패, 폴백 사용, 경과 시간
  - imageValidator: 이미지 검증 실패 상세
  - sendCardsV2Message: 전송 실패
- **환경 변수**: LOG_LEVEL, LOG_DIR, LOG_RETENTION_DAYS, LOG_ENABLE_CONSOLE

##### Phase 3.4: CI/CD 파이프라인
- **GitHub Actions 워크플로우** (.github/workflows/ci.yml):
  - Node.js 18.x, 20.x 매트릭스 빌드
  - 단계: Checkout → Setup → Install → Lint → Build → Test
  - 스냅샷 테스트 + 로깅 테스트 자동 실행
  - 통합 테스트 (master 브랜치, 웹훅 Secret 사용)
  - 아티팩트 업로드 (빌드 결과, 테스트 결과, 로그)
- **ESLint 설정** (eslint.config.mjs):
  - ESLint v9.x 플랫 구성
  - TypeScript 지원 (@typescript-eslint)
  - 경고 출력 (빌드 차단 안함)
  - npm 스크립트: `lint`, `lint:fix`
- **테스트 스크립트**:
  - test-error-logging.ts: 에러 케이스 테스트
  - test-logging-integration.ts: 실제 웹훅 통합 테스트
- **문서**: CI 설정 가이드 (docs/ci-setup.md)

##### 문서화
- **README.md**: 포괄적인 사용 가이드
  - 설치 및 설정 (Claude Code 연동)
  - 사용법 (3가지 MCP 도구)
  - Markdown 문법 지원 목록
  - 환경 변수 설명
  - 아키텍처 다이어그램
  - FAQ 섹션
  - CI/CD 배지
- **docs/logging-design.md**: 로깅 시스템 설계 문서
- **docs/ci-setup.md**: CI/CD 설정 가이드
- **docs/markdown-to-cards-implementation.md**: Markdown 구현 계획
- **.env.example**: 환경 변수 예시

#### 기술 상세

- **Dependencies**:
  - @modelcontextprotocol/sdk: ^1.20.0
  - axios: ^1.0.0
  - marked: ^16.4.1
  - zod: ^3.21.4
- **Dev Dependencies**:
  - TypeScript: ^5.0.0
  - ESLint: ^9.38.0
  - @typescript-eslint: ^8.46.2
- **Node.js**: 18.x, 20.x 지원
- **Build**: TypeScript → JavaScript (dist/)

#### 알려진 문제

- 일부 이미지 URL이 타임아웃으로 검증 실패할 수 있음 (네트워크 환경 의존)
- 복잡한 중첩 Markdown 구조는 단순화되어 렌더링됨

---

## [Unreleased]

### En

#### TODO (Phase 3.5-3.7)

- [ ] Phase 3.5: Documentation Enhancement
  - [ ] Integration test result documentation
  - [ ] Detailed API documentation
  - [ ] Extended troubleshooting
- [x] Phase 3.6: Security Review
  - [x] Add webhook URL validation
  - [x] Make environment variable mandatory
  - [ ] Dependency CVE scanning
  - [ ] External image policy
- [x] Phase 3.7: Release Preparation
  - [x] Publish npm package (v0.1.0, v0.1.1, v0.1.2, v0.1.3, v0.1.4)
  - [x] Create GitHub Release
  - [x] Fix ES Module compatibility
  - [x] Add webhook URL validation

### Ko

#### TODO (Phase 3.5-3.7)

- [ ] Phase 3.5: 문서화 보강
  - [ ] 통합 테스트 결과 문서화
  - [ ] API 상세 문서
  - [ ] 트러블슈팅 확장
- [x] Phase 3.6: 보안 검토
  - [x] 웹훅 URL 검증 추가
  - [x] 환경 변수 필수화
  - [ ] 의존성 CVE 스캔
  - [ ] 외부 이미지 정책
- [x] Phase 3.7: 릴리스 준비
  - [x] npm 패키지 퍼블리시 (v0.1.0, v0.1.1, v0.1.2, v0.1.3, v0.1.4)
  - [x] GitHub Release 생성
  - [x] ES Module 호환성 수정
  - [x] 웹훅 URL 검증

---

[0.1.4]: https://github.com/ice3x2/google-chat-webhook-mcp/releases/tag/v0.1.4
[0.1.3]: https://github.com/ice3x2/google-chat-webhook-mcp/releases/tag/v0.1.3
[0.1.2]: https://github.com/ice3x2/google-chat-webhook-mcp/releases/tag/v0.1.2
[0.1.1]: https://github.com/ice3x2/google-chat-webhook-mcp/releases/tag/v0.1.1
[0.1.0]: https://github.com/ice3x2/google-chat-webhook-mcp/releases/tag/v0.1.0
