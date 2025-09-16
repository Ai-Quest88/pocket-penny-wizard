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
  const wsRef = useRef<WebSocket | null>(null);
  const [messageHandlers, setMessageHandlers] = useState<((message: TestWebSocketMessage) => void)[]>([]);
  
  const addMessageHandler = useCallback((handler: (message: TestWebSocketMessage) => void) => {
    setMessageHandlers(prev => [...prev, handler]);
    return () => {
      setMessageHandlers(prev => prev.filter(h => h !== handler));
    };
  }, []);

  useEffect(() => {
    const connect = () => {
      try {
        // Use Supabase function URL for WebSocket connection
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}/functions/v1/test-runner`;
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('Connected to test runner');
          setIsConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const message: TestWebSocketMessage = JSON.parse(event.data);
            console.log('Test message received:', message);
            
            // Update running state based on message type
            if (message.type === 'TEST_START') {
              setIsRunning(true);
            } else if (message.type === 'TEST_COMPLETE' || message.type === 'TEST_STOPPED') {
              setIsRunning(false);
            }
            
            // Notify all handlers
            messageHandlers.forEach(handler => handler(message));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
        
        ws.onclose = () => {
          console.log('Disconnected from test runner');
          setIsConnected(false);
          setIsRunning(false);
          
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
  }, [messageHandlers]);
  
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);
  
  const runTests = useCallback((category?: string) => {
    return sendMessage({
      type: 'RUN_TESTS',
      category
    });
  }, [sendMessage]);
  
  const stopTests = useCallback(() => {
    return sendMessage({
      type: 'STOP_TESTS'
    });
  }, [sendMessage]);
  
  return {
    isConnected,
    isRunning,
    runTests,
    stopTests,
    addMessageHandler
  };
}