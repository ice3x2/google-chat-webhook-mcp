import { sendMarkdownMessage } from '../src/tools/sendMarkdownMessage';

async function run() {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';

  const sample = `# 통합 테스트\n\n이것은 통합 테스트용 마크다운입니다.\n\n- 항목 A\n- 항목 B\n\n[클릭](https://example.com)\n\n**강조**`; 

  console.log('Webhook:', webhook ? 'SET' : 'NOT SET (will use mock)');

  try {
    const result = await sendMarkdownMessage(webhook, { markdown: sample, cardTitle: 'Integration Test', fallbackToText: true });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Integration test failed:', e);
  }
}

run();
