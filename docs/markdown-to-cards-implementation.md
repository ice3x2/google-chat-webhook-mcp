# Markdown to Google Chat Cards V2 구현 계획

## 목차
1. [개요](#개요)
2. [기술 스택 선택](#기술-스택-선택)
3. [새로운 MCP 도구 스펙](#새로운-mcp-도구-스펙)
4. [Phase별 구현 계획](#phase별-구현-계획)
5. [Markdown → Cards V2 매핑 규칙](#markdown--cards-v2-매핑-규칙)
6. [폴백(Fallback) 전략](#폴백fallback-전략)
7. [에러 처리 및 검증](#에러-처리-및-검증)
8. [테스트 계획](#테스트-계획)

---

## 개요

### 목적
Markdown 형식의 텍스트를 입력받아 Google Chat의 Cards V2 형식으로 자동 변환하여 전송하는 새로운 MCP 도구를 구현합니다.

### 핵심 요구사항
- ✅ 별도의 MCP 도구로 구현 (`send_google_chat_markdown`)
- ✅ 기존 도구(`send_google_chat_text`, `send_google_chat_cards_v2`)와 독립적으로 동작
- ✅ Markdown 파싱 실패 시 예외를 던지지 않고 일반 텍스트로 폴백
- ✅ 주니어 개발자도 이해하고 유지보수 가능한 코드 구조

---

## 기술 스택 선택

### Markdown 파서 비교

| 라이브러리 | 주간 다운로드 | 크기 | 장점 | 단점 | 선택 여부 |
|---------|------------|------|------|------|----------|
| **marked** | 19M | 428 KB | ⚡ 매우 빠름<br/>📦 간단한 API<br/>🔧 확장 쉬움<br/>✅ TypeScript 내장 | 🔸 AST 접근이 제한적 | ✅ **채택** |
| markdown-it | 11M | 767 KB | 🔌 풍부한 플러그인<br/>⚙️ 세밀한 설정<br/>📊 CommonMark 준수 | 🐢 상대적으로 느림<br/>🔸 복잡한 API | ⏸️ 대안 |
| remark | 2.5M | 15.7 KB | 🌳 AST 기반 처리<br/>🔄 unified 생태계<br/>🎯 정확한 제어 | 📚 학습 곡선 높음<br/>🔧 설정 복잡 | ⏸️ 대안 |

### 최종 선택: **marked**

#### 선택 근거
1. **단순성**: API가 직관적이고 학습이 쉬움 (주니어 친화적 ✅)
2. **성능**: 가장 빠른 파싱 속도
3. **크기**: 적절한 번들 크기
4. **확장성**: 커스텀 렌더러로 Cards V2 변환 로직을 깔끔하게 구현 가능
5. **안정성**: 가장 많이 사용됨 (주간 19M 다운로드)
6. **TypeScript**: 내장 타입 정의 제공

#### 설치할 패키지
```bash
npm install marked
npm install --save-dev @types/node  # 이미 설치됨
```

---

## 새로운 MCP 도구 스펙

### 도구 이름
`send_google_chat_markdown`

### 입력 스키마 (zod)
```typescript
{
  markdown: string;           // Markdown 형식의 텍스트 (필수)
  cardTitle?: string;         // 카드 헤더 제목 (선택)
  fallbackToText?: boolean;   // 파싱 실패 시 일반 텍스트로 전송 (기본값: true)
}
```

### 출력 형식
성공:
```json
{
  "success": true,
  "messageId": "spaces/xxx/messages/yyy",
  "usedFallback": false
}
```

파싱 실패 후 폴백:
```json
{
  "success": true,
  "messageId": "spaces/xxx/messages/yyy",
  "usedFallback": true,
  "fallbackReason": "Parsing failed: invalid markdown syntax"
}
```

실패:
```json
{
  "success": false,
  "error": "Webhook URL not configured"
}
```

### 동작 흐름도
```
[입력: Markdown]
       ↓
[marked로 파싱 시도]
       ↓
  파싱 성공? ──No──→ [일반 텍스트로 폴백] → [sendTextMessage 호출]
       ↓ Yes                                           ↓
[AST → Cards V2 변환]                                 ↓
       ↓                                              ↓
[zod로 Cards V2 검증]                                  ↓
       ↓                                              ↓
  검증 성공? ──No──→ [일반 텍스트로 폴백] ────────────→ ↓
       ↓ Yes                                          ↓
[sendCardsV2Message 호출] ←─────────────────────────→ [결과 반환]
```

---

## Phase별 구현 계획

### Phase 0: 준비 단계 (30분)
**목표**: 개발 환경 구성 및 기초 파일 생성

#### 작업 내용
1. `marked` 패키지 설치
   ```bash
   npm install marked
   ```

2. 파일 구조 생성
   ```
   src/
   ├── tools/
   │   ├── sendMarkdownMessage.ts      # 새 도구 구현
   │   └── markdownToCards.ts          # 변환 로직
   ├── utils/
   │   └── cardsV2Validator.ts         # Cards V2 검증 스키마
   └── types/
       └── markdown.ts                  # Markdown 관련 타입
   ```

3. 타입 정의 작성 (`src/types/markdown.ts`)

#### 검증 방법
- `npm run build` 통과
- 파일이 올바르게 생성되었는지 확인

---

### Phase 1: 기본 Markdown 변환 (2-3시간)
**목표**: 헤더, 문단, 줄바꿈 등 기본 요소 변환

#### 지원 Markdown 요소
- ✅ 헤더 (H1~H3)
- ✅ 일반 문단
- ✅ 줄바꿈
- ✅ 굵게(**bold**)
- ✅ 기울임(*italic*)
- ✅ 인라인 코드(`code`)

#### 구현 파일
**`src/tools/markdownToCards.ts`**

```typescript
import { marked } from 'marked';
import type { CardsV2, Card, Section, Widget } from '../types/googleChat.js';

/**
 * Markdown 텍스트를 Google Chat Cards V2로 변환
 * 
 * @param markdown - 변환할 Markdown 텍스트
 * @param cardTitle - 카드 헤더에 표시할 제목 (선택)
 * @returns Cards V2 배열
 * @throws 파싱 실패 시 Error (호출자에서 catch하여 폴백 처리)
 */
export function markdownToCardsV2(
  markdown: string,
  cardTitle?: string
): CardsV2[] {
  try {
    // marked의 lexer로 토큰화
    const tokens = marked.lexer(markdown);
    
    // 위젯 배열 생성
    const widgets: Widget[] = [];
    
    for (const token of tokens) {
      switch (token.type) {
        case 'heading':
          widgets.push(createHeadingWidget(token));
          break;
        case 'paragraph':
          widgets.push(createParagraphWidget(token));
          break;
        case 'space':
          // 빈 공간은 무시
          break;
        default:
          // 지원하지 않는 요소는 텍스트로 폴백
          widgets.push(createTextWidget(token.raw || ''));
      }
    }
    
    // 위젯이 없으면 빈 문단 추가
    if (widgets.length === 0) {
      widgets.push({ textParagraph: { text: '(내용 없음)' } });
    }
    
    // 카드 구성
    const card: Card = {
      sections: [{ widgets }]
    };
    
    // 제목이 있으면 헤더 추가
    if (cardTitle) {
      card.header = { title: cardTitle };
    }
    
    return [{ cardId: `md-card-${Date.now()}`, card }];
    
  } catch (error) {
    // 파싱 에러를 상위로 전달
    throw new Error(`Markdown parsing failed: ${error}`);
  }
}

// 헤더 위젯 생성 (H1~H3만 지원)
function createHeadingWidget(token: any): Widget {
  const level = token.depth; // 1, 2, 3...
  const text = token.text;
  
  // H1은 굵게, H2는 보통, H3는 작게
  const prefix = level === 1 ? '**' : level === 2 ? '**' : '';
  const formattedText = prefix ? `${prefix}${text}${prefix}` : text;
  
  return {
    textParagraph: { text: formattedText }
  };
}

// 문단 위젯 생성
function createParagraphWidget(token: any): Widget {
  // marked가 인라인 마크다운(굵게, 기울임 등)을 이미 HTML로 변환했을 수 있으므로
  // token.text에서 추출 (또는 token.tokens를 순회)
  const text = token.text || token.raw;
  
  return {
    textParagraph: { text: cleanText(text) }
  };
}

// 일반 텍스트 위젯 생성
function createTextWidget(text: string): Widget {
  return {
    textParagraph: { text: cleanText(text) }
  };
}

// 텍스트 정리 (HTML 태그 제거 등)
function cleanText(text: string): string {
  // marked는 기본적으로 HTML을 생성하므로, 텍스트만 추출
  return text
    .replace(/<\/?[^>]+(>|$)/g, '') // HTML 태그 제거
    .trim();
}
```

#### 테스트 케이스
```markdown
# 제목
일반 문단입니다.

**굵은 텍스트**와 *기울임* 그리고 `인라인 코드`
```

예상 결과: 3개의 textParagraph 위젯

#### 검증 방법
- 단위 테스트 작성 (`tests/markdownToCards.test.ts`)
- `scripts/test-markdown-convert.ts` 스크립트로 실제 변환 테스트

---

### Phase 2: 리스트 및 링크 지원 (1-2시간)
**목표**: 목록과 링크 변환

#### 지원 Markdown 요소
- ✅ 순서 없는 목록 (ul)
- ✅ 순서 있는 목록 (ol)
- ✅ 링크 `[텍스트](URL)`

#### 구현 전략

**목록 처리**
```typescript
function createListWidget(token: any): Widget {
  const items = token.items || [];
  const isOrdered = token.ordered;
  
  const lines = items.map((item: any, index: number) => {
    const prefix = isOrdered ? `${index + 1}. ` : '• ';
    return prefix + cleanText(item.text);
  });
  
  return {
    textParagraph: { text: lines.join('\n') }
  };
}
```

**링크 처리**
- Google Chat은 URL을 자동으로 링크화하므로 `[텍스트](URL)` → `텍스트: URL` 형식으로 변환

```typescript
function processLinks(text: string): string {
  // [링크텍스트](url) 패턴을 찾아서 "링크텍스트: url"로 변환
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1: $2');
}
```

#### 테스트 케이스
```markdown
## 할 일 목록
- 첫 번째 항목
- 두 번째 항목

1. 순서 있는 항목 1
2. 순서 있는 항목 2

[Google](https://google.com) 링크입니다.
```

---

### Phase 3: 코드 블록 및 이미지 (1-2시간)
**목표**: 코드 블록과 이미지 지원

#### 지원 Markdown 요소
- ✅ 펜스 코드 블록 (\`\`\`언어)
- ✅ 이미지 `![alt](url)`

#### 구현 전략

**코드 블록**
```typescript
function createCodeWidget(token: any): Widget {
  const lang = token.lang || '';
  const code = token.text;
  
  // 코드 블록을 프리포맷 텍스트로 표시
  const formattedCode = `\`\`\`${lang}\n${code}\n\`\`\``;
  
  return {
    textParagraph: { text: formattedCode }
  };
}
```

**이미지**
```typescript
function createImageWidget(token: any): Widget {
  const alt = token.text || 'Image';
  const url = token.href;
  
  // Google Chat Cards V2는 image 위젯 지원
  return {
    image: {
      imageUrl: url,
      altText: alt
    }
  };
}
```

#### 테스트 케이스
```markdown
## 코드 예시
```javascript
function hello() {
  console.log("Hello, World!");
}
```

![로고](https://example.com/logo.png)
```

---

### Phase 4: 폴백 로직 및 검증 (1시간)
**목표**: 에러 처리 및 자동 폴백 구현

#### `src/tools/sendMarkdownMessage.ts` 구현

```typescript
import { markdownToCardsV2 } from './markdownToCards.js';
import { sendCardsV2Message } from './sendCardsV2Message.js';
import { sendTextMessage } from './sendTextMessage.js';

interface MarkdownMessageOptions {
  markdown: string;
  cardTitle?: string;
  fallbackToText?: boolean;
}

interface MarkdownMessageResult {
  success: boolean;
  messageId?: string;
  usedFallback?: boolean;
  fallbackReason?: string;
  error?: string;
}

/**
 * Markdown을 Cards V2로 변환하여 Google Chat에 전송
 * 변환 실패 시 자동으로 일반 텍스트로 폴백
 */
export async function sendMarkdownMessage(
  webhookUrl: string,
  options: MarkdownMessageOptions
): Promise<MarkdownMessageResult> {
  const { markdown, cardTitle, fallbackToText = true } = options;
  
  // 1단계: Markdown → Cards V2 변환 시도
  try {
    const cardsV2 = markdownToCardsV2(markdown, cardTitle);
    
    // 2단계: Cards V2 전송 시도
    try {
      const response = await sendCardsV2Message(webhookUrl, {
        text: cardTitle || 'Markdown Message',
        cardsV2
      });
      
      return {
        success: true,
        messageId: response.name,
        usedFallback: false
      };
      
    } catch (sendError) {
      // Cards V2 전송 실패 → 폴백
      if (fallbackToText) {
        const fallbackResponse = await sendTextMessage(webhookUrl, {
          text: markdown // 원본 Markdown 그대로 전송
        });
        
        return {
          success: true,
          messageId: fallbackResponse.name,
          usedFallback: true,
          fallbackReason: `Cards V2 send failed: ${sendError}`
        };
      } else {
        throw sendError;
      }
    }
    
  } catch (parseError) {
    // 파싱 실패 → 폴백
    if (fallbackToText) {
      const fallbackResponse = await sendTextMessage(webhookUrl, {
        text: markdown // 원본 Markdown 그대로 전송
      });
      
      return {
        success: true,
        messageId: fallbackResponse.name,
        usedFallback: true,
        fallbackReason: `Markdown parsing failed: ${parseError}`
      };
      
    } else {
      return {
        success: false,
        error: `Markdown parsing failed: ${parseError}`
      };
    }
  }
}
```

#### 검증 로직 추가 (`src/utils/cardsV2Validator.ts`)

```typescript
import { z } from 'zod';

// Cards V2 검증 스키마
const WidgetSchema = z.object({
  textParagraph: z.object({
    text: z.string()
  }).optional(),
  image: z.object({
    imageUrl: z.string().url(),
    altText: z.string().optional()
  }).optional()
}).refine(
  (data) => data.textParagraph || data.image,
  { message: 'Widget must have either textParagraph or image' }
);

const SectionSchema = z.object({
  widgets: z.array(WidgetSchema).min(1)
});

const CardSchema = z.object({
  header: z.object({
    title: z.string()
  }).optional(),
  sections: z.array(SectionSchema).min(1)
});

const CardsV2Schema = z.array(
  z.object({
    cardId: z.string(),
    card: CardSchema
  })
);

/**
 * Cards V2 구조를 검증
 * @throws {z.ZodError} 검증 실패 시
 */
export function validateCardsV2(cardsV2: any): void {
  CardsV2Schema.parse(cardsV2);
}
```

---

### Phase 5: MCP 서버 통합 (30분)
**목표**: 새 도구를 MCP 서버에 등록

#### `src/server.ts` 업데이트

```typescript
import { sendMarkdownMessage } from './tools/sendMarkdownMessage.js';

// 기존 코드...

// 3. Markdown → Cards V2 전송 도구 등록
server.tool(
  'send_google_chat_markdown',
  'Markdown 형식의 텍스트를 Google Chat Cards V2로 변환하여 전송합니다. 파싱 실패 시 자동으로 일반 텍스트로 전송됩니다.',
  {
    markdown: z.string().describe('전송할 Markdown 형식의 텍스트'),
    cardTitle: z.string().optional().describe('카드 헤더 제목 (선택)'),
    fallbackToText: z.boolean().optional().default(true).describe('파싱 실패 시 일반 텍스트로 전송 여부')
  } as any,
  async ({ markdown, cardTitle, fallbackToText }) => {
    if (!webhookUrl) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: 'GOOGLE_CHAT_WEBHOOK_URL environment variable not set'
          }, null, 2)
        }]
      };
    }

    try {
      const result = await sendMarkdownMessage(webhookUrl, {
        markdown: markdown as string,
        cardTitle: cardTitle as string | undefined,
        fallbackToText: fallbackToText !== false
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message || String(error)
          }, null, 2)
        }]
      };
    }
  } as any
);
```

---

### Phase 6: 테스트 및 문서화 (1-2시간)
**목표**: 통합 테스트 및 사용 문서 작성

#### 테스트 스크립트 (`scripts/test-markdown-send.ts`)

```typescript
import { sendMarkdownMessage } from '../src/tools/sendMarkdownMessage.js';

const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;

if (!webhookUrl) {
  console.error('GOOGLE_CHAT_WEBHOOK_URL not set');
  process.exit(1);
}

const testMarkdown = `
# 빌드 성공 ✅

프로젝트 빌드가 성공적으로 완료되었습니다.

## 상세 정보
- **커밋**: abc123def
- **브랜치**: main
- **시간**: 2분 30초

## 변경 사항
1. 버그 수정
2. 성능 개선
3. 문서 업데이트

[로그 보기](https://example.com/logs)

\`\`\`bash
npm run build
> Build successful!
\`\`\`
`;

async function test() {
  console.log('Markdown 전송 테스트...\n');
  
  try {
    const result = await sendMarkdownMessage(webhookUrl!, {
      markdown: testMarkdown,
      cardTitle: '빌드 알림'
    });
    
    console.log('결과:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('에러:', error);
    process.exit(1);
  }
}

test();
```

#### 사용 설명서 업데이트 (`README.md`)

---

## Markdown → Cards V2 매핑 규칙

### 완전 매핑표

| Markdown 요소 | Cards V2 위젯 | 예시 입력 | 예시 출력 |
|--------------|--------------|----------|----------|
| `# H1` | `textParagraph` (굵게) | `# 제목` | **제목** |
| `## H2` | `textParagraph` (굵게) | `## 소제목` | **소제목** |
| `### H3` | `textParagraph` | `### 작은제목` | 작은제목 |
| 문단 | `textParagraph` | `일반 텍스트` | 일반 텍스트 |
| `**굵게**` | 텍스트 강조 | `**중요**` | **중요** (가능 시) |
| `*기울임*` | 텍스트 강조 | `*강조*` | *강조* (가능 시) |
| `` `코드` `` | 인라인 코드 | `` `var x` `` | `var x` |
| 목록 (ul) | `textParagraph` (줄 구분) | `- 항목1\n- 항목2` | • 항목1<br>• 항목2 |
| 목록 (ol) | `textParagraph` (줄 구분) | `1. 첫째\n2. 둘째` | 1. 첫째<br>2. 둘째 |
| `[링크](url)` | 텍스트 + URL | `[구글](https://google.com)` | 구글: https://google.com |
| 코드 블록 | `textParagraph` (프리포맷) | `` ```js\ncode\n``` `` | \`\`\`js<br>code<br>\`\`\` |
| `![이미지](url)` | `image` | `![로고](url)` | (이미지 위젯) |
| 테이블 | ❌ (텍스트 폴백) | Markdown 테이블 | 플레인 텍스트 |
| HTML | ❌ (제거 또는 폴백) | `<div>...</div>` | 텍스트만 추출 |

### 제한 사항
- ❌ **테이블**: Cards V2에 표 위젯이 없으므로 텍스트로 변환
- ❌ **중첩 목록**: 1단계만 지원 (들여쓰기 무시)
- ❌ **폼 요소**: 지원 불가
- ⚠️ **인라인 포맷**: Google Chat의 텍스트 포맷 제한으로 완벽하지 않을 수 있음

---

## 폴백(Fallback) 전략

### 폴백이 발생하는 경우

1. **파싱 실패**
   - 잘못된 Markdown 문법
   - marked 라이브러리 에러

2. **변환 실패**
   - 지원하지 않는 복잡한 구조
   - 내부 로직 에러

3. **검증 실패**
   - 생성된 Cards V2가 스키마에 맞지 않음

4. **전송 실패**
   - Google Chat API가 400 에러 반환
   - 잘못된 Cards V2 구조

### 폴백 동작

```typescript
try {
  // Markdown → Cards V2 변환 및 전송 시도
  return sendAsCardsV2(markdown);
} catch (error) {
  if (fallbackToText) {
    // 실패 시 원본 Markdown을 일반 텍스트로 전송
    return sendAsPlainText(markdown);
  } else {
    throw error;
  }
}
```

### 폴백 로깅

모든 폴백은 응답에 기록됩니다:
```json
{
  "success": true,
  "usedFallback": true,
  "fallbackReason": "Markdown parsing failed: unexpected token at line 5"
}
```

---

## 에러 처리 및 검증

### 에러 처리 레벨

1. **입력 검증**
   ```typescript
   if (!markdown || markdown.trim() === '') {
     throw new Error('Markdown content is empty');
   }
   ```

2. **파싱 에러**
   ```typescript
   try {
     const tokens = marked.lexer(markdown);
   } catch (error) {
     // 폴백 또는 에러 반환
   }
   ```

3. **변환 에러**
   ```typescript
   try {
     const cardsV2 = tokensToCardsV2(tokens);
     validateCardsV2(cardsV2); // zod 검증
   } catch (error) {
     // 폴백 또는 에러 반환
   }
   ```

4. **HTTP 에러**
   ```typescript
   try {
     await axios.post(webhookUrl, payload);
   } catch (error) {
     if (error.response?.status === 400) {
       // Cards V2 스키마 에러 → 폴백
     }
     throw error;
   }
   ```

### 검증 체크리스트

- ✅ `markdown` 파라미터 필수
- ✅ 빈 문자열 방지
- ✅ Cards V2 스키마 검증 (zod)
- ✅ 이미지 URL 유효성 (URL 형식)
- ✅ 카드 크기 제한 (위젯 최대 개수)

---

## 테스트 계획

### 단위 테스트 (Unit Tests)

**테스트 파일**: `tests/markdownToCards.test.ts`

```typescript
import { describe, it, expect } from '@jest/globals';
import { markdownToCardsV2 } from '../src/tools/markdownToCards';

describe('markdownToCardsV2', () => {
  it('헤더를 textParagraph로 변환', () => {
    const result = markdownToCardsV2('# 제목');
    expect(result[0].card.sections[0].widgets).toHaveLength(1);
    expect(result[0].card.sections[0].widgets[0].textParagraph).toBeDefined();
  });
  
  it('목록을 줄바꿈으로 변환', () => {
    const result = markdownToCardsV2('- A\n- B');
    const text = result[0].card.sections[0].widgets[0].textParagraph?.text;
    expect(text).toContain('• A');
    expect(text).toContain('• B');
  });
  
  it('빈 Markdown은 에러', () => {
    expect(() => markdownToCardsV2('')).toThrow();
  });
});
```

### 통합 테스트 (Integration Tests)

**테스트 파일**: `scripts/test-markdown-send.ts`

1. 기본 Markdown 전송
2. 복잡한 Markdown (헤더+목록+코드)
3. 파싱 실패 케이스 (잘못된 문법)
4. 폴백 동작 확인

### 실제 웹훅 테스트

```bash
# 환경 변수 설정
export GOOGLE_CHAT_WEBHOOK_URL="https://..."

# 테스트 실행
npm run test:markdown
```

### 예상 테스트 케이스

| 케이스 | 입력 | 예상 결과 |
|--------|------|----------|
| 단순 텍스트 | `Hello` | 1개 위젯 |
| 헤더 3개 | `# A\n## B\n### C` | 3개 위젯 |
| 목록 | `- A\n- B` | 1개 위젯 (줄바꿈) |
| 링크 | `[구글](url)` | 텍스트 변환 |
| 이미지 | `![alt](url)` | image 위젯 |
| 코드 블록 | `` ```js\ncode\n``` `` | textParagraph |
| 빈 입력 | `` | 에러 또는 빈 카드 |
| 잘못된 문법 | `# [미완성` | 폴백 → 텍스트 |

---

## 구현 체크리스트

### Phase 0: 준비
- [ ] `marked` 설치
- [ ] 파일 구조 생성
- [ ] 타입 정의 작성

### Phase 1: 기본 변환
- [ ] `markdownToCards.ts` 구현
- [ ] 헤더, 문단, 줄바꿈 변환
- [ ] 단위 테스트 작성

### Phase 2: 리스트 및 링크
- [ ] 목록 변환 로직
- [ ] 링크 처리 로직
- [ ] 테스트 추가

### Phase 3: 코드 블록 및 이미지
- [ ] 코드 블록 위젯
- [ ] 이미지 위젯
- [ ] 테스트 추가

### Phase 4: 폴백 로직
- [ ] `sendMarkdownMessage.ts` 구현
- [ ] try-catch 폴백
- [ ] 에러 로깅

### Phase 5: MCP 통합
- [ ] `server.ts`에 도구 등록
- [ ] 빌드 및 실행 확인

### Phase 6: 테스트 및 문서
- [ ] 통합 테스트 스크립트
- [ ] 실제 웹훅 테스트
- [ ] README 업데이트

---

## 예상 소요 시간

| Phase | 작업 | 시간 |
|-------|------|------|
| Phase 0 | 준비 | 30분 |
| Phase 1 | 기본 변환 | 2-3시간 |
| Phase 2 | 리스트/링크 | 1-2시간 |
| Phase 3 | 코드/이미지 | 1-2시간 |
| Phase 4 | 폴백 로직 | 1시간 |
| Phase 5 | MCP 통합 | 30분 |
| Phase 6 | 테스트/문서 | 1-2시간 |
| **합계** | | **7-11시간** |

---

## 주니어 개발자를 위한 가이드

### 핵심 개념 설명

#### 1. Markdown이란?
```markdown
# 이것은 제목입니다
**굵은 텍스트**와 *기울임* 텍스트를 사용할 수 있습니다.
- 목록 항목 1
- 목록 항목 2
```

Markdown은 간단한 문법으로 서식 있는 텍스트를 작성하는 방법입니다.

#### 2. Cards V2란?
Google Chat에서 메시지를 카드 형태로 예쁘게 보여주는 JSON 형식입니다.

```json
{
  "cardsV2": [{
    "card": {
      "sections": [{
        "widgets": [{
          "textParagraph": { "text": "안녕하세요" }
        }]
      }]
    }
  }]
}
```

#### 3. marked 라이브러리 사용법

```typescript
import { marked } from 'marked';

// Markdown → 토큰(구조화된 데이터)
const tokens = marked.lexer('# 제목\n문단');

// 토큰 확인
console.log(tokens);
// [
//   { type: 'heading', depth: 1, text: '제목' },
//   { type: 'paragraph', text: '문단' }
// ]
```

#### 4. 에러 처리 패턴

```typescript
async function safeConvert(markdown: string) {
  try {
    // 1단계: 변환 시도
    const result = dangerousConvert(markdown);
    return { success: true, data: result };
    
  } catch (error) {
    // 2단계: 실패하면 안전한 대안 사용
    return { success: false, fallback: markdown };
  }
}
```

### 자주 하는 실수

❌ **실수 1**: marked 출력을 직접 Cards V2로 사용
```typescript
// 잘못된 코드
const html = marked.parse(markdown); // HTML 문자열 반환
return { text: html }; // Google Chat은 HTML을 제대로 렌더링 안 함
```

✅ **올바른 방법**: 토큰을 순회하며 Cards V2 위젯 생성
```typescript
const tokens = marked.lexer(markdown);
const widgets = tokens.map(token => convertToWidget(token));
```

❌ **실수 2**: 에러를 무시
```typescript
// 나쁜 코드
const result = markdownToCards(markdown); // 에러 시 프로그램 중단
```

✅ **올바른 방법**: 항상 try-catch
```typescript
try {
  const result = markdownToCards(markdown);
} catch (error) {
  // 폴백 처리
}
```

### 디버깅 팁

1. **토큰 확인**: 변환 전에 marked의 토큰 구조를 `console.log`로 확인
   ```typescript
   const tokens = marked.lexer(markdown);
   console.log(JSON.stringify(tokens, null, 2));
   ```

2. **단계별 검증**: 각 단계의 출력을 확인
   ```typescript
   const tokens = marked.lexer(markdown);        // 1단계
   const widgets = tokensToWidgets(tokens);      // 2단계
   const cardsV2 = widgetsToCards(widgets);      // 3단계
   ```

3. **실제 웹훅 테스트**: 작은 예시부터 시작
   ```bash
   node scripts/test-markdown-send.ts
   ```

### 추가 학습 자료

- [Marked 공식 문서](https://marked.js.org/)
- [Google Chat Cards V2 가이드](https://developers.google.com/chat/api/guides/message-formats/cards)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

---

## 결론

이 문서는 Markdown을 Google Chat Cards V2로 변환하는 새로운 MCP 도구의 전체 구현 계획을 담고 있습니다.

### 핵심 포인트
1. ✅ **marked** 라이브러리 사용 (단순하고 빠름)
2. ✅ **Phase별 점진적 구현** (기본 → 고급)
3. ✅ **자동 폴백** (파싱 실패 시 일반 텍스트로 전송)
4. ✅ **주니어 친화적** (명확한 코드 구조와 상세한 주석)

### 다음 단계
Phase 0부터 순서대로 구현을 시작하면 됩니다.
```bash
# 1. 패키지 설치
npm install marked

# 2. 파일 생성 및 구현
# (Phase 1부터 시작)

# 3. 테스트
npm run build
node scripts/test-markdown-send.ts
```

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025-10-28  
**작성자**: GitHub Copilot
