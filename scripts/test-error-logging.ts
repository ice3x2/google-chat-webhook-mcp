/**
 * 로깅 시스템 에러 케이스 테스트
 */

import { validateImageUrl } from '../src/utils/imageValidator';
import { sendMarkdownMessage } from '../src/tools/sendMarkdownMessage';
import * as fs from 'fs';
import * as path from 'path';

async function testErrorLogging() {
  console.log('=== 에러 로깅 테스트 ===\n');

  const logDir = process.env.LOG_DIR || './logs';
  const date = new Date().toISOString().split('T')[0];
  const errorLogFile = path.join(logDir, `errors-${date}.log`);

  // 에러 로그 전 라인 수
  let beforeErrorCount = 0;
  if (fs.existsSync(errorLogFile)) {
    beforeErrorCount = fs.readFileSync(errorLogFile, 'utf-8').split('\n').filter(l => l.trim()).length;
  }

  console.log('1. 이미지 검증 실패 테스트...');
  
  // 존재하지 않는 이미지
  const result1 = await validateImageUrl('https://example.com/nonexistent.jpg');
  console.log(`   결과: ${result1.valid ? '✅ 유효함' : '❌ 유효하지 않음'}`);
  console.log(`   에러: ${result1.error}`);

  // 잘못된 Content-Type
  const result2 = await validateImageUrl('https://www.google.com');
  console.log(`   결과: ${result2.valid ? '✅ 유효함' : '❌ 유효하지 않음'}`);
  console.log(`   에러: ${result2.error}`);

  console.log('');

  console.log('2. 잘못된 웹훅 URL 테스트...');
  try {
    await sendMarkdownMessage('https://invalid-webhook-url.com/test', {
      markdown: '# 테스트',
      cardTitle: 'Error Test',
      fallbackToText: false,
    });
  } catch (error) {
    console.log(`   ✅ 예상된 에러 발생: ${error instanceof Error ? error.message : String(error)}`);
  }

  console.log('');

  // 에러 로그 파일 확인
  console.log('3. 에러 로그 파일 확인...');
  if (fs.existsSync(errorLogFile)) {
    const afterErrorCount = fs.readFileSync(errorLogFile, 'utf-8').split('\n').filter(l => l.trim()).length;
    const newErrors = afterErrorCount - beforeErrorCount;
    
    console.log(`   ✅ 새로운 에러 로그: ${newErrors}개`);

    if (newErrors > 0) {
      const lines = fs.readFileSync(errorLogFile, 'utf-8').split('\n').filter(l => l.trim());
      const latestErrors = lines.slice(-Math.min(3, newErrors));
      
      console.log(`   📝 최근 에러 로그 (최대 3개):`);
      latestErrors.forEach((line, idx) => {
        try {
          const log = JSON.parse(line);
          console.log(`      [${idx + 1}] ${log.module} - ${log.event}`);
          console.log(`          Error: ${log.error}`);
        } catch (e) {
          console.log(`      [${idx + 1}] 파싱 실패: ${line.substring(0, 50)}...`);
        }
      });
    }
  } else {
    console.log(`   ℹ️  에러 로그 파일이 아직 없습니다: ${errorLogFile}`);
  }

  console.log('\n=== 에러 로깅 테스트 완료 ===');
}

// 테스트 실행
testErrorLogging().catch(err => {
  console.error('테스트 실패:', err);
  process.exit(1);
});
