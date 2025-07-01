class CustomReporter {
  constructor(globalConfig, reporterOptions, reporterContext) {
    this._globalConfig = globalConfig;
    this._options = reporterOptions;
    this._context = reporterContext;
  }

  onRunComplete(testContexts, results) {
    // 先调用父类的方法，显示默认的测试结果

    // 然后添加你的自定义输出
    console.log('\n--- Custom Reporter Additional Info ---');
    console.log('Results Summary:', {
      numTotalTests: results.numTotalTests,
      numPassedTests: results.numPassedTests,
      numFailedTests: results.numFailedTests,
      numPendingTests: results.numPendingTests,
    });
  }

  onTestStart(test) {
    console.log(`🚀 Starting test: ${test.path}`);
  }

  onTestResult(test, testResult, aggregatedResult) {
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
const CR = new Proxy(CustomReporter, {
  construct(target, args) {
    console.log('Creating an instance of CustomReporter with args:', args);
    const inst = Reflect.construct(target, args);
    return new Proxy(inst, {
      get(target, prop, receiver) {
        console.log('Reading:', prop);
        return Reflect.get(target, prop, receiver);
      },
    });
  },
});
export default CR;
