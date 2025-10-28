/**
 * 실제 메시지 전송을 통한 로깅 통합 테스트
 * 환경 변수 GOOGLE_CHAT_WEBHOOK_URL이 필요함
 */

import { sendMarkdownMessage } from '../src/tools/sendMarkdownMessage';
import * as fs from 'fs';
import * as path from 'path';

async function testLoggingIntegration() {
  console.log('=== 로깅 통합 테스트 ===\n');

  const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('⚠️  GOOGLE_CHAT_WEBHOOK_URL이 설정되지 않았습니다.');
    console.log('   목업(mock) 모드로 테스트합니다.\n');
  } else {
    console.log('✅ Webhook URL 감지됨 - 실제 전송 테스트\n');
  }

  // 로그 디렉토리 확인
  const logDir = process.env.LOG_DIR || './logs';
  const date = new Date().toISOString().split('T')[0];
  const appLogFile = path.join(logDir, `app-${date}.log`);

  // 전송 전 로그 라인 수 기록
  let beforeLineCount = 0;
  if (fs.existsSync(appLogFile)) {
    beforeLineCount = fs.readFileSync(appLogFile, 'utf-8').split('\n').filter(l => l.trim()).length;
  }

  console.log('1. 정상 메시지 전송 테스트...');
  try {
    const result = await sendMarkdownMessage(webhookUrl || '', {
      markdown: '# 로깅 테스트\n\n**굵은 글씨**와 *기울임*을 포함한 테스트 메시지입니다.',
      cardTitle: 'Logging Test',
      fallbackToText: true,
    });

    console.log(`   결과: ${result.success ? '✅ 성공' : '❌ 실패'}`);
    console.log(`   폴백 사용: ${result.usedFallback ? 'Yes' : 'No'}`);
    if (result.messageId) {
      console.log(`   메시지 ID: ${result.messageId}`);
    }
  } catch (error) {
    console.log(`   ❌ 에러: ${error}`);
  }

  console.log('');

  // 로그 파일 확인
  console.log('2. 로그 파일 확인...');
  if (fs.existsSync(appLogFile)) {
    const afterLineCount = fs.readFileSync(appLogFile, 'utf-8').split('\n').filter(l => l.trim()).length;
    const newLines = afterLineCount - beforeLineCount;
    
    console.log(`   ✅ 새로운 로그 라인: ${newLines}개`);

    // 최신 로그 출력
    const lines = fs.readFileSync(appLogFile, 'utf-8').split('\n').filter(l => l.trim());
    const latestLog = lines[lines.length - 1];
    
    if (latestLog) {
      try {
        const log = JSON.parse(latestLog);
        console.log(`   📝 최신 로그:`);
        console.log(`      - Level: ${log.level}`);
        console.log(`      - Module: ${log.module}`);
        console.log(`      - Event: ${log.event}`);
        console.log(`      - Timestamp: ${log.timestamp}`);
        
        if (log.messageId) {
          console.log(`      - Message ID: ${log.messageId}`);
        }
        if (log.elapsed !== undefined) {
          console.log(`      - Elapsed: ${log.elapsed}ms`);
        }
      } catch (e) {
        console.log(`   ⚠️  로그 파싱 실패: ${latestLog.substring(0, 50)}...`);
      }
    }
  } else {
    console.log(`   ❌ 로그 파일이 생성되지 않았습니다: ${appLogFile}`);
  }

  console.log('\n=== 로깅 통합 테스트 완료 ===');
}

// 테스트 실행
testLoggingIntegration().catch(err => {
  console.error('테스트 실패:', err);
  process.exit(1);
});
