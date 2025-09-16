#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

class TestDashboardServer {
  constructor() {
    this.wss = new WebSocket.Server({ port: 8081 });
    this.clients = new Set();
    this.currentTests = new Map();
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('Dashboard client connected');
      
      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('Dashboard client disconnected');
      });
      
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(data);
        } catch (error) {
          console.error('Error parsing client message:', error);
        }
      });
    });
  }
  
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  handleClientMessage(data) {
    switch (data.type) {
      case 'RUN_TESTS':
        this.runTests(data.category);
        break;
      case 'STOP_TESTS':
        this.stopTests();
        break;
    }
  }
  
  runTests(category) {
    const args = ['playwright', 'test'];
    
    if (category) {
      args.push('--grep', `@${category}`);
    }
    
    // Add options for video recording and JSON output
    args.push(
      '--reporter=list,json',
      '--video=on',
      '--trace=on',
      '--output-dir=test-results'
    );
    
    this.testProcess = spawn('npx', args, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let testOutput = '';
    let testCount = 0;
    let totalTests = 0;
    
    this.broadcast({
      type: 'TEST_START',
      timestamp: Date.now()
    });
    
    this.testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      testOutput += output;
      
      // Parse test progress
      this.parseTestOutput(output);
    });
    
    this.testProcess.stderr.on('data', (data) => {
      console.error('Test stderr:', data.toString());
    });
    
    this.testProcess.on('close', (code) => {
      this.broadcast({
        type: 'TEST_COMPLETE',
        exitCode: code,
        timestamp: Date.now()
      });
      
      // Parse final results
      this.parseFinalResults();
      this.testProcess = null;
    });
  }
  
  stopTests() {
    if (this.testProcess) {
      this.testProcess.kill('SIGTERM');
      this.testProcess = null;
      
      this.broadcast({
        type: 'TEST_STOPPED',
        timestamp: Date.now()
      });
    }
  }
  
  parseTestOutput(output) {
    const lines = output.split('\n');
    
    lines.forEach(line => {
      // Parse test start
      const testStartMatch = line.match(/Running (\d+) test/);
      if (testStartMatch) {
        this.broadcast({
          type: 'TEST_PROGRESS',
          totalTests: parseInt(testStartMatch[1]),
          completedTests: 0
        });
      }
      
      // Parse individual test results
      const passedMatch = line.match(/✓ (.+?) \((\d+)ms\)/);
      const failedMatch = line.match(/✗ (.+?) \((\d+)ms\)/);
      const runningMatch = line.match(/▶ (.+)/);
      
      if (passedMatch) {
        this.broadcast({
          type: 'TEST_UPDATE',
          testTitle: passedMatch[1],
          status: 'passed',
          duration: parseInt(passedMatch[2]),
          timestamp: Date.now()
        });
      } else if (failedMatch) {
        this.broadcast({
          type: 'TEST_UPDATE',
          testTitle: failedMatch[1],
          status: 'failed',
          duration: parseInt(failedMatch[2]),
          timestamp: Date.now()
        });
      } else if (runningMatch) {
        this.broadcast({
          type: 'TEST_UPDATE',
          testTitle: runningMatch[1],
          status: 'running',
          timestamp: Date.now()
        });
      }
    });
  }
  
  parseFinalResults() {
    try {
      const resultsPath = path.join(process.cwd(), 'test-results/results.json');
      if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
        
        // Find video files
        const testResultsDir = path.join(process.cwd(), 'test-results');
        this.findVideoFiles(testResultsDir, results);
        
        this.broadcast({
          type: 'FINAL_RESULTS',
          results: results,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error parsing final results:', error);
    }
  }
  
  findVideoFiles(dir, results) {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      files.forEach(file => {
        if (file.isDirectory()) {
          this.findVideoFiles(path.join(dir, file.name), results);
        } else if (file.name.endsWith('.webm')) {
          // Associate video with test based on file structure
          const videoPath = path.join(dir, file.name);
          const relativePath = path.relative(process.cwd(), videoPath);
          
          this.broadcast({
            type: 'VIDEO_FOUND',
            videoPath: relativePath,
            timestamp: Date.now()
          });
        }
      });
    } catch (error) {
      console.error('Error finding video files:', error);
    }
  }
  
  start() {
    console.log('🚀 Test Dashboard Server running on ws://localhost:8081');
    console.log('📊 WebSocket server ready for test execution');
  }
}

if (require.main === module) {
  const server = new TestDashboardServer();
  server.start();
}

module.exports = TestDashboardServer;