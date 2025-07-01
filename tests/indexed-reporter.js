import { DefaultReporter } from '@jest/reporters';

export default class CustomReporter extends DefaultReporter {
  constructor(globalConfig, reporterOptions, reporterContext) {
    super(globalConfig, reporterOptions, reporterContext);
    this._globalConfig = globalConfig;
    this._options = reporterOptions;
    this._context = reporterContext;
  }

  onRunComplete(testContexts, results) {
    // 先调用父类的方法，显示默认的测试结果
    super.onRunComplete(testContexts, results);

    // 然后添加你的自定义输出
    console.log('\n--- Custom Reporter Additional Info ---');
    console.log('Test Contexts:', testContexts);
    console.log('Results Summary:', {
      numTotalTests: results.numTotalTests,
      numPassedTests: results.numPassedTests,
      numFailedTests: results.numFailedTests,
      numPendingTests: results.numPendingTests,
    });
  }

  onTestStart(test) {
    // 调用父类方法
    super.onTestStart(test);

    // 添加自定义逻辑
    console.log(`🚀 Starting test: ${test.path}`);
  }

  onTestResult(test, testResult, aggregatedResult) {
    // 调用父类方法
    super.onTestResult(test, testResult, aggregatedResult);

    // 添加自定义逻辑
    const status = testResult.numFailingTests > 0 ? '❌' : '✅';
    console.log(`${status} Completed: ${test.path}`);
  }

  // Optionally, reporters can force Jest to exit with non zero code by returning
  // an `Error` from `getLastError()` method.
  getLastError() {
    if (this._shouldFail) {
      return new Error('Custom error reported!');
    }
  }
}
