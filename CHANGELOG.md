# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2025-10-29

### Added

- **Webhook URL Validation**: 서버 시작 시 Google Chat 웹훅 URL 검증
  - HTTPS 프로토콜 필수 검증
  - `chat.googleapis.com` 도메인 검증
  - `/v1/spaces/` 경로 검증
  - `key` 또는 `token` 파라미터 존재 검증
- **새로운 로그 이벤트**: `server_start_failed`, `invalid_webhook_url`, `server_starting`

### Changed

- **환경 변수 필수화**: `GOOGLE_CHAT_WEBHOOK_URL` 환경 변수가 없으면 서버 시작 차단
  - 이전: 경고 메시지만 출력하고 mock 모드로 시작
  - 현재: 명확한 에러 메시지와 함께 프로세스 종료 (exit code 1)
- **에러 메시지 개선**: 웹훅 URL 형식 오류 시 상세한 가이드 제공

### Fixed

- **보안 강화**: 잘못된 웹훅 URL로 서버가 시작되는 것을 방지
- **사용자 경험**: 명확한 에러 메시지로 설정 오류 빠르게 파악 가능

### Technical Details

```typescript
// 검증 규칙
✓ HTTPS 프로토콜만 허용
✓ chat.googleapis.com 도메인만 허용
✓ /v1/spaces/ 경로 필수
✓ key 또는 token 파라미터 필수

// 예시 올바른 URL
https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=YOUR_KEY&token=YOUR_TOKEN
```

## [0.1.1] - 2025-10-29

### Fixed

- **ES Module Compatibility**: 모든 로컬 import 문에 `.js` 확장자 추가
  - Node.js ES 모듈 사양 준수
  - `ERR_MODULE_NOT_FOUND` 에러 해결
- **Stdin Hang Issue**: `process.stdin.resume()` 추가
  - MCP 서버가 stdin으로부터 메시지를 대기하도록 프로세스 유지
  - `npx google-chat-webhook-mcp` 실행 시 hang 걸리는 문제 해결
- **Shebang 추가**: `index.ts`에 `#!/usr/bin/env node` 추가
  - Unix/Linux 환경에서 직접 실행 가능

### Technical Details

- 모든 `import` 문의 로컬 경로에 `.js` 확장자 명시
  - `'./server'` → `'./server.js'`
  - `'../utils/logger'` → `'../utils/logger.js'`
- `server.ts`에 `process.stdin.resume()` 추가하여 stdin 스트림 활성화
- MCP 서버 메시지를 `console.error()`로 출력하여 stdout 프로토콜 충돌 방지

## [0.1.0] - 2025-10-29

### Added

#### Phase 0-2: Core Implementation
- **MCP Server**: StdioServerTransport 기반 Model Context Protocol 서버
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

#### Phase 3.1: Test Automation
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

#### Phase 3.2: Image Validation
- **imageValidator 유틸리티**: HEAD 요청 기반 이미지 검증
  - HTTP 상태 코드 확인 (2xx만 허용)
  - Content-Type 확인 (image/* 필수)
  - 크기 확인 (5MB 제한)
  - 5초 타임아웃
- **폴백 처리**: 검증 실패 시 텍스트 링크로 대체

#### Phase 3.3: Logging System
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

#### Phase 3.4: CI/CD Pipeline
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

#### Documentation
- **README.md**: 포괄적인 사용 가이드
  - 설치 및 설정 (Claude Desktop 연동)
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

### Technical Details

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

### Known Issues

- 일부 이미지 URL이 타임아웃으로 검증 실패할 수 있음 (네트워크 환경 의존)
- 복잡한 중첩 Markdown 구조는 단순화되어 렌더링됨

## [Unreleased]

### TODO (Phase 3.5-3.7)

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
  - [x] npm 패키지 퍼블리시 (v0.1.0, v0.1.1, v0.1.2)
  - [x] GitHub Release 생성
  - [x] ES Module 호환성 수정
  - [x] 웹훅 URL 검증

[0.1.2]: https://github.com/ice3x2/google-chat-webhook-mcp/releases/tag/v0.1.2
[0.1.1]: https://github.com/ice3x2/google-chat-webhook-mcp/releases/tag/v0.1.1
[0.1.0]: https://github.com/ice3x2/google-chat-webhook-mcp/releases/tag/v0.1.0
