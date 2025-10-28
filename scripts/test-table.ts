import { sendMarkdownMessage } from '../src/tools/sendMarkdownMessage';

async function run() {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';

  const sampleWithTable = `# 테스트 표

| 이름 | 나이 | 직업 |
|------|------|------|
| 홍길동 | 30 | 개발자 |
| 김철수 | 25 | 디자이너 |
| 이영희 | 28 | 기획자 |

표가 고정폭 텍스트로 변환됩니다.
`;

  console.log('Webhook:', webhook ? 'SET' : 'NOT SET');

  try {
    const result = await sendMarkdownMessage(webhook, { 
      markdown: sampleWithTable, 
      cardTitle: '표 테스트',
      fallbackToText: true 
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Test failed:', e);
  }
}

run();
