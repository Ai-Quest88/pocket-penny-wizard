import { useEffect, useRef, useState } from 'react';

export interface TestWebSocketMessage {
  type: 'TEST_START' | 'TEST_PROGRESS' | 'TEST_UPDATE' | 'TEST_COMPLETE' | 'TEST_STOPPED' | 'VIDEO_FOUND' | 'FINAL_RESULTS';
  testTitle?: string;
  status?: 'passed' | 'failed' | 'running' | 'pending';
  duration?: number;
  totalTests?: number;
  completedTests?: number;
  videoPath?: string;
  exitCode?: number;
  results?: any;
  timestamp?: number;
}

export function useTestWebSocket(onMessage: (message: TestWebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  
  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket('ws://localhost:8081');
        
        ws.onopen = () => {
          console.log('Connected to test dashboard server');
          setIsConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            onMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('Disconnected from test dashboard server');
          setIsConnected(false);
          
          // Attempt to reconnect after 3 seconds
          setTimeout(() => {
            connect();
          }, 3000);
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        // Retry connection
        setTimeout(() => {
          connect();
        }, 3000);
      }
    };
    
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onMessage]);
  
  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };
  
  const runTests = (category?: string) => {
    sendMessage({
      type: 'RUN_TESTS',
      category
    });
  };
  
  const stopTests = () => {
    sendMessage({
      type: 'STOP_TESTS'
    });
  };
  
  return {
    isConnected,
    runTests,
    stopTests
  };
}