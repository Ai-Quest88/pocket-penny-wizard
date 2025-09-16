#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');

class TestDashboard {
  constructor() {
    this.results = this.loadTestResults();
    this.port = process.env.TEST_DASHBOARD_PORT || 8080;
  }

  loadTestResults() {
    try {
      const resultsPath = path.join(process.cwd(), 'test-results/results.json');
      if (fs.existsSync(resultsPath)) {
        return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      }
    } catch (error) {
      console.log('No test results found, run tests first');
    }
    return { stats: { total: 0, passed: 0, failed: 0 }, tests: [] };
  }

  generateHTML() {
    const { stats, tests = [] } = this.results;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Dashboard - Financial App</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2.5em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #22c55e; }
        .failed { color: #ef4444; }
        .total { color: #3b82f6; }
        .test-list { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .test-item { padding: 15px; border-bottom: 1px solid #e5e5e5; display: flex; justify-content: between; align-items: center; }
        .test-item:last-child { border-bottom: none; }
        .test-status { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-passed { background: #dcfce7; color: #166534; }
        .status-failed { background: #fee2e2; color: #991b1b; }
        .test-title { flex: 1; margin-right: 10px; }
        .test-duration { color: #666; font-size: 0.9em; }
        .refresh-btn { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .refresh-btn:hover { background: #2563eb; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Financial App Test Dashboard</h1>
            <p>Comprehensive test results and monitoring</p>
            <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Results</button>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number total">${stats.total || 0}</div>
                <div>Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number passed">${stats.passed || 0}</div>
                <div>Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number failed">${stats.failed || 0}</div>
                <div>Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${stats.total ? Math.round((stats.passed / stats.total) * 100) : 0}%</div>
                <div>Success Rate</div>
            </div>
        </div>
        
        <div class="test-list">
            <div style="padding: 15px; background: #f8f9fa; font-weight: bold;">Recent Test Results</div>
            ${tests.length > 0 ? tests.map(test => `
                <div class="test-item">
                    <div class="test-title">${test.title || 'Unknown Test'}</div>
                    <div class="test-duration">${test.duration || 0}ms</div>
                    <div class="test-status ${test.status === 'passed' ? 'status-passed' : 'status-failed'}">
                        ${test.status || 'unknown'}
                    </div>
                </div>
            `).join('') : '<div style="padding: 20px; text-align: center; color: #666;">No test results available. Run tests first with: npm run test</div>'}
        </div>
        
        <div style="margin-top: 20px; text-align: center; color: #666;">
            <p>Last updated: ${new Date().toLocaleString()}</p>
            <p>Run <code>npm run test</code> to generate new results</p>
        </div>
    </div>
</body>
</html>`;
  }

  start() {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.generateHTML());
    });

    server.listen(this.port, () => {
      console.log(`🚀 Test Dashboard running at: http://localhost:${this.port}`);
      console.log('📊 View your test results in the browser');
    });
  }
}

if (require.main === module) {
  const dashboard = new TestDashboard();
  dashboard.start();
}

module.exports = TestDashboard;