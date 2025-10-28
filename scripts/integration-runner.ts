import { sendMarkdownMessage } from '../src/tools/sendMarkdownMessage';
import * as fs from 'fs';

async function run() {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';
  if (!webhook) {
    console.error('Please set GOOGLE_CHAT_WEBHOOK_URL env var');
    process.exit(1);
  }

  const sample = `# 이미지 테스트\n\n다음은 이미지입니다:\n\n![pin image](https://i.pinimg.com/originals/d7/7b/0c/d77b0c8130f4d9d515cbfc248c39e904.jpg)\n\n문단 끝.`;

  console.log('Webhook:', webhook ? 'SET' : 'NOT SET');

  try {
    const result = await sendMarkdownMessage(webhook, {
      markdown: sample,
      cardTitle: '이미지 통합 테스트',
      fallbackToText: true
    });

    const out = { timestamp: new Date().toISOString(), result };
    fs.writeFileSync('integration-result.json', JSON.stringify(out, null, 2));
    console.log('Result written to integration-result.json');
  } catch (e) {
    console.error('Integration test failed:', e);
    process.exit(2);
  }
}

run();
