import { sendMarkdownMessage } from '../src/tools/sendMarkdownMessage';
import { readFileSync, writeFileSync } from 'fs';

const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL || '';

const markdown = `# 이미지 검증 테스트

## 유효한 이미지 (httpbin.org - placeholder)
![Valid Image](https://httpbin.org/image/jpeg)

## 텍스트 내용
이것은 일반 텍스트입니다. **굵은 글씨**와 *기울임*도 표시됩니다.

## 목록
- 첫 번째 항목
- 두 번째 항목
  - 중첩 항목 1
  - 중첩 항목 2

## 잘못된 이미지 (404 에러)
![Invalid Image](https://example.com/nonexistent.jpg)

## 유효한 공개 이미지
![공개 이미지](https://via.placeholder.com/150)

완료!
`;

async function run() {
  if (!webhookUrl) {
    console.error('❌ GOOGLE_CHAT_WEBHOOK_URL 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  console.log('🚀 Sending markdown with images to Google Chat...\n');
  console.log('Markdown content:');
  console.log('---');
  console.log(markdown);
  console.log('---\n');

  try {
    const startTime = Date.now();
    const result = await sendMarkdownMessage(webhookUrl, {
      markdown,
      cardTitle: '이미지 검증 테스트',
      fallbackToText: true,
    });
    const elapsed = Date.now() - startTime;

    console.log(`✅ Message sent successfully in ${elapsed}ms`);
    console.log(`Result:`, JSON.stringify(result, null, 2));

    const outputData = {
      timestamp: new Date().toISOString(),
      elapsed,
      result,
      markdown,
    };

    writeFileSync('integration-result-image-validation.json', JSON.stringify(outputData, null, 2));
    console.log('\n📄 Result saved to integration-result-image-validation.json');
  } catch (error: any) {
    console.error('❌ Error sending message:', error.message || error);
    process.exit(1);
  }
}

run();
