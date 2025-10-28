import { markdownToCardsV2 } from '../tools/markdownToCards';
import { validateCardsV2 } from '../utils/cardsV2Validator';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface TestCase {
  name: string;
  markdown: string;
  cardTitle?: string;
  description?: string;
}

export interface SnapshotResult {
  testName: string;
  passed: boolean;
  cardsV2?: any[];
  error?: string;
  validationError?: string;
  snapshotMatch?: boolean;
  diff?: any;
}

export class SnapshotTester {
  private snapshotDir: string;
  private results: SnapshotResult[] = [];

  constructor(snapshotDir: string = 'tests/snapshots') {
    this.snapshotDir = snapshotDir;
    if (!existsSync(this.snapshotDir)) {
      mkdirSync(this.snapshotDir, { recursive: true });
    }
  }

  async runTest(testCase: TestCase, updateSnapshot: boolean = false): Promise<SnapshotResult> {
    const result: SnapshotResult = {
      testName: testCase.name,
      passed: false,
    };

    try {
      // Convert markdown to Cards V2
      let cardsV2 = await markdownToCardsV2(testCase.markdown, testCase.cardTitle);
      
      // Normalize cardId for snapshot comparison (remove timestamps)
      cardsV2 = this.normalizeCardsV2(cardsV2);
      
      result.cardsV2 = cardsV2;

      // Validate Cards V2 structure
      try {
        validateCardsV2(cardsV2);
      } catch (valErr: any) {
        result.validationError = String(valErr);
        result.passed = false;
        this.results.push(result);
        return result;
      }

      // Compare with snapshot
      const snapshotPath = join(this.snapshotDir, `${this.sanitizeFilename(testCase.name)}.json`);
      
      if (updateSnapshot || !existsSync(snapshotPath)) {
        // Create or update snapshot
        writeFileSync(snapshotPath, JSON.stringify(cardsV2, null, 2));
        result.snapshotMatch = true;
        result.passed = true;
        console.log(`📸 ${updateSnapshot ? 'Updated' : 'Created'} snapshot: ${testCase.name}`);
      } else {
        // Compare with existing snapshot
        const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf-8'));
        const match = this.deepEqual(cardsV2, snapshot);
        result.snapshotMatch = match;
        result.passed = match;

        if (!match) {
          result.diff = {
            expected: snapshot,
            actual: cardsV2,
          };
          console.log(`❌ Snapshot mismatch: ${testCase.name}`);
        } else {
          console.log(`✅ Snapshot match: ${testCase.name}`);
        }
      }
    } catch (error: any) {
      result.error = String(error);
      result.passed = false;
      console.log(`💥 Test error: ${testCase.name} - ${error.message || error}`);
    }

    this.results.push(result);
    return result;
  }

  async runTests(testCases: TestCase[], updateSnapshots: boolean = false): Promise<void> {
    console.log(`\n🧪 Running ${testCases.length} snapshot tests...\n`);
    
    for (const testCase of testCases) {
      await this.runTest(testCase, updateSnapshots);
    }

    this.printSummary();
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== typeof obj2) return false;

    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) return false;

      for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!this.deepEqual(obj1[key], obj2[key])) return false;
      }

      return true;
    }

    return false;
  }

  private sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private normalizeCardsV2(cardsV2: any[]): any[] {
    // Normalize cardId to remove timestamps for consistent snapshots
    return cardsV2.map((card, index) => ({
      ...card,
      cardId: `md-card-${index}`,
    }));
  }

  private printSummary(): void {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary');
    console.log('='.repeat(50));
    console.log(`Total: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(50) + '\n');

    if (failed > 0) {
      console.log('Failed tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.testName}`);
          if (r.error) console.log(`    Error: ${r.error}`);
          if (r.validationError) console.log(`    Validation: ${r.validationError}`);
        });
      console.log('');
    }
  }

  getResults(): SnapshotResult[] {
    return [...this.results];
  }

  saveResults(filePath: string): void {
    const summary = {
      timestamp: new Date().toISOString(),
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      results: this.results,
    };

    writeFileSync(filePath, JSON.stringify(summary, null, 2));
    console.log(`💾 Saved test results to ${filePath}`);
  }
}
