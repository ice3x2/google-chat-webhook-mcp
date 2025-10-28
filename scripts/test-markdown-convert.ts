import { markdownToCardsV2 } from '../src/tools/markdownToCards';

const sample = `# 제목

이것은 일반 문단입니다.

## 소제목
- 첫 항목
- 두 번째 항목

**굵은 텍스트** 와 *기울임* 그리고 ` + "`인라인 코드`" + `

\`\`\`javascript
console.log('hello');
\`\`\`
`;

function run() {
  try {
    const cards = markdownToCardsV2(sample, '테스트 카드');
    console.log(JSON.stringify(cards, null, 2));
  } catch (e) {
    console.error('Conversion failed:', e);
  }
}

run();
