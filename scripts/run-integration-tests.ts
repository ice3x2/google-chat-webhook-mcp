import { MockWebhookServer } from '../src/test/mockWebhookServer';
import { sendMarkdownMessage } from '../src/tools/sendMarkdownMessage';
import { testCases } from '../tests/testCases';
import { writeFileSync } from 'fs';

async function runIntegrationTests() {
  console.log('🚀 Starting integration tests with mock webhook server...\n');

  const server = new MockWebhookServer(3456); // Changed from 3000 to avoid conflicts
  let webhookUrl: string;

  try {
    // Start mock server
    webhookUrl = await server.start();
    console.log('');
    
    // Wait for server to be fully ready (important for Express routing)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const results: any[] = [];

    // Run tests against mock server
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`[${i + 1}/${testCases.length}] Testing: ${testCase.name}`);

      try {
        const startTime = Date.now();
        const result = await sendMarkdownMessage(webhookUrl, {
          markdown: testCase.markdown,
          cardTitle: testCase.cardTitle,
          fallbackToText: true,
        });
        const elapsed = Date.now() - startTime;

        const testResult = {
          testName: testCase.name,
          success: result.success,
          elapsed,
          messageId: result.messageId,
          usedFallback: result.usedFallback,
          fallbackReason: result.fallbackReason,
          error: result.error,
        };

        results.push(testResult);

        if (result.success) {
          console.log(`  ✅ Success (${elapsed}ms)${result.usedFallback ? ' [FALLBACK]' : ''}`);
        } else {
          console.log(`  ❌ Failed: ${result.error}`);
        }
      } catch (error: any) {
        console.log(`  💥 Error: ${error.message || error}`);
        results.push({
          testName: testCase.name,
          success: false,
          error: String(error),
        });
      }

      console.log('');
    }

    // Get all requests received by mock server
    const requests = server.getRequests();
    
    // Save results
    const output = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        withFallback: results.filter(r => r.usedFallback).length,
      },
      results,
      serverRequests: requests,
    };

    writeFileSync('tests/integration-test-results.json', JSON.stringify(output, null, 2));
    console.log('💾 Saved integration test results to tests/integration-test-results.json\n');

    // Save mock server requests
    server.saveRequestsToFile('tests/mock-webhook-requests.json');

    // Print summary
    console.log('='.repeat(50));
    console.log('📊 Integration Test Summary');
    console.log('='.repeat(50));
    console.log(`Total: ${output.summary.total}`);
    console.log(`✅ Passed: ${output.summary.passed}`);
    console.log(`❌ Failed: ${output.summary.failed}`);
    console.log(`🔄 Fallback Used: ${output.summary.withFallback}`);
    console.log(`📬 Server Requests: ${requests.length}`);
    console.log('='.repeat(50) + '\n');

    // Stop server
    await server.stop();

    // Exit with appropriate code
    if (output.summary.failed > 0) {
      console.log('❌ Some tests failed');
      process.exit(1);
    } else {
      console.log('✅ All integration tests passed!');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('💥 Integration test error:', error);
    if (server) {
      await server.stop();
    }
    process.exit(1);
  }
}

runIntegrationTests();
