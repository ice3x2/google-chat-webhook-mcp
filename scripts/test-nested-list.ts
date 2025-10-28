import { sendMarkdownMessage } from '../src/tools/sendMarkdownMessage';

async function run() {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';

  const sampleWithNestedList = `# H1 제목
## H2 소제목
### H3 작은제목

일반 문단입니다.

**중첩 리스트 테스트:**

- 첫 번째 항목
  - 중첩 항목 1-1
  - 중첩 항목 1-2
    - 더 깊은 중첩 1-2-1
- 두 번째 항목
  - 중첩 항목 2-1
- 세 번째 항목

**순서 있는 리스트:**

1. 항목 1
2. 항목 2
   - 중첩 순서없음
   - 또 다른 중첩
3. 항목 3
`;

  console.log('Webhook:', webhook ? 'SET' : 'NOT SET');

  try {
    const result = await sendMarkdownMessage(webhook, { 
      markdown: sampleWithNestedList, 
      cardTitle: '헤더 및 중첩 리스트 테스트',
      fallbackToText: true 
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Test failed:', e);
  }
}

run();
