import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'error' | 'warn' | 'debug';
  message: string;
  test?: string;
}

interface TestLogsViewerProps {
  isRunning: boolean;
  currentTest: string | null;
}

export function TestLogsViewer({ isRunning, currentTest }: TestLogsViewerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isRunning && currentTest) {
      // Simulate real-time logs for the current test
      const logMessages = [
        `Starting test: ${currentTest}`,
        'Launching browser...',
        'Navigating to application...',
        'Waiting for page to load...',
        'Taking screenshot: initial-state.png',
        'Executing test steps...',
        'Validating assertions...',
        'Recording video frame...',
        `Test completed: ${currentTest}`
      ];

      let messageIndex = 0;
      const interval = setInterval(() => {
        if (messageIndex < logMessages.length) {
          const newLog: LogEntry = {
            id: `${Date.now()}-${messageIndex}`,
            timestamp: new Date(),
            level: messageIndex === logMessages.length - 1 ? 'info' : 'debug',
            message: logMessages[messageIndex],
            test: currentTest
          };
          
          setLogs(prev => [...prev, newLog]);
          messageIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800);

      return () => clearInterval(interval);
    }
  }, [isRunning, currentTest]);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'warn': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'debug': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  return (
    <Card className="h-96">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Test Execution Logs</span>
          {isRunning && (
            <Badge variant="outline" className="animate-pulse">
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80" ref={scrollRef}>
          <div className="space-y-1 font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                No logs available. Run tests to see execution output.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 p-2 rounded border-l-2 border-l-muted">
                  <span className="text-xs text-muted-foreground min-w-[80px]">
                    {formatTime(log.timestamp)}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`${getLevelColor(log.level)} text-xs min-w-[50px] justify-center`}
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="flex-1 break-words">
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}