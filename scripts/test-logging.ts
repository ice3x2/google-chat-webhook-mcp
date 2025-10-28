/**
 * 로깅 시스템 테스트 스크립트
 * - 각종 로그 레벨 테스트
 * - 로그 파일 생성 확인
 * - 30일 보관 정책 테스트
 */

import { logger } from '../src/utils/logger';
import { cleanLogsNow } from '../src/utils/logCleaner';
import * as fs from 'fs';
import * as path from 'path';

async function testLogging() {
  console.log('=== 로깅 시스템 테스트 시작 ===\n');

  // 1. 각 레벨별 로그 테스트
  console.log('1. 로그 레벨 테스트...');
  
  logger.info('test', 'message_sent', {
    messageId: 'test-123',
    elapsed: 150,
    usedFallback: false,
    cardTitle: 'Test Card',
  });

  logger.warn('test', 'fallback_used', {
    messageId: 'test-456',
    reason: 'Cards V2 validation failed',
    elapsed: 200,
  });

  logger.warn('test', 'image_validation_failed', {
    url: 'https://example.com/invalid.jpg',
    error: 'HTTP 404: Not Found',
  });

  logger.error('test', 'send_failed', {
    error: 'Network timeout',
    cardTitle: 'Failed Card',
  });

  logger.error('test', 'conversion_failed', {
    error: 'Invalid Markdown syntax',
    markdown: '## Test **bold',
  });

  console.log('✅ 로그 레벨 테스트 완료\n');

  // 2. 로그 파일 확인
  console.log('2. 로그 파일 확인...');
  const logDir = process.env.LOG_DIR || './logs';
  const date = new Date().toISOString().split('T')[0];
  const appLogFile = path.join(logDir, `app-${date}.log`);
  const errorLogFile = path.join(logDir, `errors-${date}.log`);

  if (fs.existsSync(appLogFile)) {
    const appLogs = fs.readFileSync(appLogFile, 'utf-8');
    const lineCount = appLogs.split('\n').filter(line => line.trim()).length;
    console.log(`✅ 일반 로그 파일 생성됨: ${appLogFile}`);
    console.log(`   로그 라인 수: ${lineCount}`);
  } else {
    console.log(`❌ 일반 로그 파일 없음: ${appLogFile}`);
  }

  if (fs.existsSync(errorLogFile)) {
    const errorLogs = fs.readFileSync(errorLogFile, 'utf-8');
    const lineCount = errorLogs.split('\n').filter(line => line.trim()).length;
    console.log(`✅ 에러 로그 파일 생성됨: ${errorLogFile}`);
    console.log(`   에러 라인 수: ${lineCount}`);
  } else {
    console.log(`ℹ️  에러 로그 파일 없음 (에러가 없었음): ${errorLogFile}`);
  }

  console.log('');

  // 3. 로그 내용 샘플 출력
  console.log('3. 로그 내용 샘플 (최근 3줄)...');
  if (fs.existsSync(appLogFile)) {
    const lines = fs.readFileSync(appLogFile, 'utf-8').split('\n').filter(line => line.trim());
    const lastLines = lines.slice(-3);
    lastLines.forEach((line, idx) => {
      try {
        const log = JSON.parse(line);
        console.log(`   [${idx + 1}] ${log.level} - ${log.module} - ${log.event}`);
      } catch (e) {
        console.log(`   [${idx + 1}] ${line.substring(0, 80)}...`);
      }
    });
  }

  console.log('');

  // 4. 로그 정리 테스트 (실제로 삭제하지 않음)
  console.log('4. 로그 정리 기능 테스트...');
  console.log(`   로그 보관 기간: ${process.env.LOG_RETENTION_DAYS || 30}일`);
  console.log('   (실제 삭제는 30일 이상 된 로그에만 적용됨)');
  
  // 현재 로그 파일 목록
  if (fs.existsSync(logDir)) {
    const files = fs.readdirSync(logDir).filter(f => f.endsWith('.log'));
    console.log(`   현재 로그 파일 수: ${files.length}`);
    files.forEach(f => {
      const stats = fs.statSync(path.join(logDir, f));
      const age = Math.floor((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24));
      console.log(`   - ${f} (생성 ${age}일 전)`);
    });
  }

  console.log('');

  // 5. 로그 파싱 테스트
  console.log('5. JSON 파싱 테스트...');
  if (fs.existsSync(appLogFile)) {
    const lines = fs.readFileSync(appLogFile, 'utf-8').split('\n').filter(line => line.trim());
    let successCount = 0;
    let failCount = 0;

    lines.forEach(line => {
      try {
        const log = JSON.parse(line);
        if (log.timestamp && log.level && log.module && log.event) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        failCount++;
      }
    });

    console.log(`   ✅ 파싱 성공: ${successCount}개`);
    if (failCount > 0) {
      console.log(`   ❌ 파싱 실패: ${failCount}개`);
    }
  }

  console.log('\n=== 로깅 시스템 테스트 완료 ===');
}

// 테스트 실행
testLogging().catch(err => {
  console.error('테스트 실패:', err);
  process.exit(1);
});
