import { SnapshotTester } from '../src/test/snapshotTester';
import { testCases } from '../tests/testCases';

const updateSnapshots = process.argv.includes('--update') || process.argv.includes('-u');

async function runSnapshotTests() {
  console.log('🎯 Starting snapshot tests...\n');
  
  if (updateSnapshots) {
    console.log('📝 UPDATE MODE: Snapshots will be created/updated\n');
  }

  const tester = new SnapshotTester('tests/snapshots');

  try {
    await tester.runTests(testCases, updateSnapshots);
    
    // Save results
    tester.saveResults('tests/snapshot-test-results.json');

    // Exit with error code if any tests failed
    const results = tester.getResults();
    const failed = results.filter(r => !r.passed).length;
    
    if (failed > 0 && !updateSnapshots) {
      console.log(`\n❌ ${failed} test(s) failed`);
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Test runner error:', error);
    process.exit(1);
  }
}

runSnapshotTests();
