import { useState, useEffect, useRef, useCallback } from 'react';

export interface TestWebSocketMessage {
  type: 'CONNECTED' | 'TEST_START' | 'TEST_UPDATE' | 'TEST_COMPLETE' | 'TEST_STOPPED' | 'ERROR';
  testId?: string;
  testTitle?: string;
  status?: 'passed' | 'failed' | 'running' | 'pending';
  duration?: number;
  totalTests?: number;
  completedTests?: number;
  progress?: number;
  videoPath?: string;
  error?: string;
  message?: string;
  timestamp?: number;
}

export function useTestWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const messageHandlersRef = useRef<((message: TestWebSocketMessage) => void)[]>([]);
  
  const addMessageHandler = useCallback((handler: (message: TestWebSocketMessage) => void) => {
    messageHandlersRef.current.push(handler);
    return () => {
      messageHandlersRef.current = messageHandlersRef.current.filter(h => h !== handler);
    };
  }, []);

  const simulateTestExecution = useCallback(async (category?: string) => {
    console.log('Starting test simulation...', category);
    setIsRunning(true);
    
    const mockTests = [
      { id: '1', title: 'User Authentication Flow', category: 'smoke' },
      { id: '2', title: 'Dashboard Load Performance', category: 'critical' },
      { id: '3', title: 'Transaction Creation', category: 'critical' },
      { id: '4', title: 'CSV Upload Functionality', category: 'regression' },
      { id: '5', title: 'Budget Management', category: 'critical' },
      { id: '6', title: 'Asset Calculations', category: 'regression' }
    ];

    const filteredTests = category 
      ? mockTests.filter(test => test.category === category)
      : mockTests;

    console.log('Tests to run:', filteredTests.length);

    // Notify test start
    messageHandlersRef.current.forEach(handler => handler({
      type: 'TEST_START',
      totalTests: filteredTests.length
    }));

    // Execute tests progressively
    for (let i = 0; i < filteredTests.length; i++) {
      const test = filteredTests[i];
      console.log('Running test:', test.title);
      
      // Test running
      messageHandlersRef.current.forEach(handler => handler({
        type: 'TEST_UPDATE',
        testTitle: test.title,
        status: 'running',
        progress: Math.round((i / filteredTests.length) * 100)
      }));

      // Simulate test execution time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));

      // Test result (80% pass rate)
      const passed = Math.random() > 0.2;
      const duration = 1500 + Math.random() * 3000;

      console.log('Test completed:', test.title, passed ? 'PASSED' : 'FAILED');

      messageHandlersRef.current.forEach(handler => handler({
        type: 'TEST_UPDATE',
        testTitle: test.title,
        status: passed ? 'passed' : 'failed',
        duration: Math.round(duration),
        error: passed ? undefined : 'Assertion failed: Expected element to be visible',
        videoPath: passed ? `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4` : undefined,
        progress: Math.round(((i + 1) / filteredTests.length) * 100)
      }));
    }

    // Test completion
    console.log('All tests completed');
    messageHandlersRef.current.forEach(handler => handler({
      type: 'TEST_COMPLETE',
      totalTests: filteredTests.length
    }));

    setIsRunning(false);
  }, []);

  useEffect(() => {
    console.log('Setting up WebSocket connection...');
    
    const connect = () => {
      try {
        console.log('Simulating WebSocket connection...');
        setIsConnected(true);
        
        // Simulate connection established
        setTimeout(() => {
          messageHandlersRef.current.forEach(handler => handler({
            type: 'CONNECTED',
            message: 'Simulated connection established'
          }));
        }, 1000);
        
      } catch (error) {
        console.error('Failed to connect:', error);
        setIsConnected(false);
      }
    };
    connect();
  }, []);
  
  const runTests = useCallback((category?: string) => {
    console.log('Running tests...', category);
    simulateTestExecution(category);
    return true;
  }, [simulateTestExecution]);
  
  const stopTests = useCallback(() => {
    console.log('Stopping tests...');
    setIsRunning(false);
    
    messageHandlersRef.current.forEach(handler => handler({
      type: 'TEST_STOPPED',
      message: 'Tests stopped by user'
    }));
    return true;
  }, []);

  return {
    isConnected,
    isRunning,
    runTests,
    stopTests,
    addMessageHandler
  };
}