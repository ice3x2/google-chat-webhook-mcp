# Logger 권한 오류 해결 방안

## 문제 상황

MCP 서버를 IDE (예: IntelliJ IDEA)에서 실행할 때 다음과 같은 오류 발생:

```
Error: EPERM: operation not permitted, mkdir 'C:\Program Files\JetBrains\IntelliJ IDEA 2024.3.4.1\bin\logs'
```

## 근본 원인 분석

### 원인 체인

1. **Logger 기본 설정 문제**
   - Logger 클래스가 기본 로그 디렉토리를 `./logs`로 설정
   - `./logs` 경로는 현재 작업 디렉토리(CWD, Current Working Directory) 기준

2. **CWD 불일치**
   - IDE에서 MCP 서버를 실행할 때, CWD가 IDE의 bin 디렉토리로 설정됨
   - 예: `C:\Program Files\JetBrains\IntelliJ IDEA 2024.3.4.1\bin`
   - 따라서 `./logs` → `C:\Program Files\JetBrains\IntelliJ IDEA 2024.3.4.1\bin\logs` 해석

3. **권한 부족 (EPERM)**
   - `Program Files` 디렉토리는 관리자 권한 필요
   - Node.js 프로세스가 일반 사용자 권한으로 실행 중
   - `fs.mkdirSync()` 실패 → `EPERM: operation not permitted`

### 오류 스택 분석

```
at Logger.ensureLogDir (file:///...google-chat-webhook-mcp/dist/utils/logger.js:31:16)
at new Logger (file:///...google-chat-webhook-mcp/dist/utils/logger.js:24:14)
```

- Logger 생성자에서 즉시 `ensureLogDir()` 호출
- 이 시점에 디렉토리 생성 시도 → 권한 오류 → 프로세스 크래시

## 해결책 (3단계 개선)

### 1단계: 기본 로그 디렉토리를 사용자 홈으로 변경

**문제점 해결:**
- IDE 환경과 무관하게 항상 쓰기 권한 있는 경로 사용
- CWD 설정에 영향받지 않음

**구현:**

```typescript
import * as os from 'os';
import * as path from 'path';

// 기본 로그 디렉토리를 사용자 홈 디렉토리 기반으로 설정
let defaultLogDir = process.env.LOG_DIR;
if (!defaultLogDir) {
  try {
    const homeDir = os.homedir();
    defaultLogDir = path.join(homeDir, '.google-chat-webhook-mcp', 'logs');
  } catch {
    defaultLogDir = './logs';
  }
}
```

**Windows 예시:**
- 사용자: `beom`
- 기본 로그 경로: `C:\Users\beom\.google-chat-webhook-mcp\logs`
- 항상 쓰기 권한 있음 ✓

**macOS/Linux 예시:**
- 사용자: `beom`
- 기본 로그 경로: `/Users/beom/.google-chat-webhook-mcp/logs` 또는 `/home/beom/.google-chat-webhook-mcp/logs`

### 2단계: 권한 오류를 우아하게 처리 (폴백)

**개선사항:**
- 권한 부족 시 프로세스가 크래시되지 않음
- 콘솔 로깅으로 자동 폴백
- 사용자에게 명확한 에러 메시지 제공

**구현:**

```typescript
private ensureLogDir(): void {
  try {
    if (!fs.existsSync(this.config.dir)) {
      fs.mkdirSync(this.config.dir, { recursive: true });
    }
  } catch (error) {
    const err = error as any;
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      console.warn(
        `⚠️  Cannot create log directory: ${this.config.dir}\n` +
        `   Reason: ${err.code === 'EPERM' ? 'Permission denied' : 'Access denied'}\n` +
        `   Logging to console only. Set LOG_DIR environment variable to a writable path.`
      );
      this.isFileLoggingDisabled = true;
    } else {
      throw error;
    }
  }
}
```

**에러 처리 플로우:**

```
Logger 생성 → mkdirSync 실패 (EPERM) 
  ↓
isFileLoggingDisabled = true 설정
  ↓
console.warn() 으로 사용자 알림
  ↓
MCP 서버 정상 시작 (콘솔 로깅만)
```

### 3단계: 파일 쓰기 시 오류 처리

**추가 보호:**
- writeLog() 에서 파일 쓰기 시도 시 권한 오류 캐치
- 재시도하지 않고 플래그 유지
- 다른 오류는 throw하여 디버깅 용이

```typescript
private writeLog(entry: LogEntry): void {
  // ... 기존 로직 ...
  
  if (!this.isFileLoggingDisabled) {
    try {
      fs.appendFileSync(this.getLogFilename(false), logLine, 'utf-8');
      // ...
    } catch (error) {
      const err = error as any;
      if (err.code === 'EPERM' || err.code === 'EACCES') {
        this.isFileLoggingDisabled = true;
        console.warn(`⚠️  File logging disabled due to permission error`);
      } else {
        throw error;
      }
    }
  }
  
  // 콘솔 출력은 항상 수행
  if (this.config.enableConsole) {
    // ... 콘솔 출력 ...
  }
}
```

## 사용 방법

### 기본 사용 (권장)
아무것도 설정하지 않음 - 자동으로 `~/.google-chat-webhook-mcp/logs` 사용

### 커스텀 로그 디렉토리 (수동 설정)

**Windows PowerShell:**
```powershell
$env:LOG_DIR = "C:\Logs\mcp"
npm run build  # 또는 node dist/index.js
```

**cmd.exe:**
```batch
set LOG_DIR=C:\Logs\mcp
npm run build
```

**bash/PowerShell (Linux/macOS):**
```bash
export LOG_DIR=/var/log/mcp
npm run build
```

### MCP 설정 파일 (.mcp.json)
```json
{
  "mcpServers": {
    "google-chat-webhook": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "${env:GOOGLE_CHAT_WEBHOOK_URL}",
        "LOG_DIR": "${env:USERPROFILE}\\.mcp-logs"
      }
    }
  }
}
```

**macOS/Linux:**
```json
{
  "mcpServers": {
    "google-chat-webhook": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "GOOGLE_CHAT_WEBHOOK_URL": "${env:GOOGLE_CHAT_WEBHOOK_URL}",
        "LOG_DIR": "${env:HOME}/.mcp-logs"
      }
    }
  }
}
```

## 테스트 시나리오

### 시나리오 1: 기본 동작 (권장)
```bash
cd /any/directory  # 아무 디렉토리에서나
node dist/index.js
# 예상: ~/.google-chat-webhook-mcp/logs에 로그 생성
```

### 시나리오 2: IDE에서 실행
1. IntelliJ IDEA 또는 VS Code 열기
2. MCP를 구성하지 않고 직접 실행
3. 예상: 
   - ⚠️ 권한 오류 메시지 출력
   - 콘솔 로깅 활성화
   - MCP 서버 정상 작동

### 시나리오 3: 카스텀 로그 디렉토리
```powershell
$env:LOG_DIR = "C:\Logs\mcp"
node dist/index.js
# 예상: C:\Logs\mcp에 로그 생성
```

### 시나리오 4: 읽기 전용 디렉토리
```powershell
$env:LOG_DIR = "C:\Windows\System32\logs"
node dist/index.js
# 예상: 
# - ⚠️ Permission denied 메시지
# - 콘솔 로깅으로 폴백
# - MCP 서버 계속 실행
```

## 변경 사항 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| 기본 로그 경로 | `./logs` (CWD 기준) | `~/.google-chat-webhook-mcp/logs` (사용자 홈 기준) |
| 권한 오류 처리 | 프로세스 크래시 | 콘솔 로깅으로 폴백 + 경고 메시지 |
| IDE 호환성 | IDE 환경 dependent | IDE 환경 independent |
| 에러 복구력 | 낮음 | 높음 (우아한 degradation) |

## 추가 권장사항

### 1. IDE 설정에서 환경 변수 확인
IDE에서 MCP 서버를 실행할 때 설정한 환경 변수 확인:

**IntelliJ IDEA:**
- Settings → Tools → MCP → 서버 설정 → Environment variables 확인

**VS Code:**
- `.vscode/settings.json` 또는 `.vscode/mcp.json` 확인

### 2. 로그 위치 검증
MCP 서버 시작 시 로그 위치 출력하도록 개선:

```typescript
logger.info('server', 'server_starting', {
  logDir: this.config.dir,
  fileLoggingDisabled: this.isFileLoggingDisabled,
});
```

### 3. Docker/Container 환경
컨테이너에서 실행할 때:

```dockerfile
ENV LOG_DIR=/var/log/mcp
RUN mkdir -p $LOG_DIR && chmod 777 $LOG_DIR
```

---

**관련 파일:**
- `src/utils/logger.ts` - Logger 클래스 (권한 처리 로직 추가)
- `src/server.ts` - MCP 서버 시작 코드

