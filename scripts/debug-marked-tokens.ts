import { marked } from 'marked';

const sampleWithNestedList = `# H1 제목
## H2 소제목

일반 문단입니다.

**중첩 리스트 테스트:**

- 첫 번째 항목
  - 중첩 항목 1-1
  - 중첩 항목 1-2
- 두 번째 항목

**순서 있는 리스트:**

1. 항목 1
2. 항목 2
   - 중첩 순서없음
3. 항목 3
`;

const tokens = marked.lexer(sampleWithNestedList);

console.log(JSON.stringify(tokens, null, 2));
