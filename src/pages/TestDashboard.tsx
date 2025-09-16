import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Download,
  Video,
  Monitor
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { TestVideoViewer } from '@/components/TestVideoViewer';
import { useTestWebSocket } from '@/hooks/useTestWebSocket';

interface TestResult {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  duration: number;
  category: string;
  error?: string;
  screenshot?: string;
  videoPath?: string;
  timestamp?: number;
}

interface TestStats {
  total: number;
  passed: number;
  failed: number;
  running: number;
  pending: number;
  successRate: number;
}

export default function TestDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [runningTest, setRunningTest] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const { isConnected, isRunning, runTests, stopTests, addMessageHandler } = useTestWebSocket();
  const [testStats, setTestStats] = useState<TestStats>({
    total: 0,
    passed: 0,
    failed: 0,
    running: 0,
    pending: 0,
    successRate: 0
  });
  const { toast } = useToast();

  const mockTestData: TestResult[] = [
    {
      id: '1',
      title: 'User Authentication Flow',
      status: 'pending',
      duration: 0,
      category: 'smoke',
      timestamp: Date.now()
    },
    {
      id: '2',
      title: 'Dashboard Load Performance',
      status: 'pending',
      duration: 0,
      category: 'critical',
      timestamp: Date.now()
    },
    {
      id: '3',
      title: 'Transaction Creation',
      status: 'pending',
      duration: 0,
      category: 'critical',
      timestamp: Date.now()
    },
    {
      id: '4',
      title: 'CSV Upload Functionality',
      status: 'pending',
      duration: 0,
      category: 'regression',
      timestamp: Date.now()
    },
    {
      id: '5',
      title: 'Budget Management',
      status: 'pending',
      duration: 0,
      category: 'critical',
      timestamp: Date.now()
    },
    {
      id: '6',
      title: 'Asset Calculations',
      status: 'pending',
      duration: 0,
      category: 'regression',
      timestamp: Date.now()
    }
  ];

  useEffect(() => {
    // Initialize with mock data
    setTestResults(mockTestData);
    updateStats(mockTestData);
    
    // Set up WebSocket message handler
    const removeHandler = addMessageHandler(handleWebSocketMessage);
    return removeHandler;
  }, [addMessageHandler]);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('Handling message:', message);
    
    switch (message.type) {
      case 'CONNECTED':
        setConnectionStatus('Connected');
        toast({
          title: "Test Runner Connected",
          description: "Ready to execute tests",
        });
        break;
        
      case 'TEST_START':
        setCurrentProgress(0);
        setTestResults(prev => prev.map(test => ({
          ...test,
          status: 'pending' as const,
          duration: 0,
          error: undefined
        })));
        toast({
          title: "Tests Started",
          description: `Running ${message.totalTests} tests...`,
        });
        break;
        
      case 'TEST_UPDATE':
        if (message.testTitle) {
          setRunningTest(message.status === 'running' ? message.testTitle : null);
          setCurrentProgress(message.progress || 0);
          
          setTestResults(prev => prev.map(test => 
            test.title === message.testTitle 
              ? { 
                  ...test, 
                  status: message.status || 'running',
                  duration: message.duration || 0,
                  error: message.error,
                  videoPath: message.videoPath,
                  timestamp: Date.now()
                }
              : test
          ));
        }
        break;
        
      case 'TEST_COMPLETE':
        setRunningTest(null);
        setCurrentProgress(100);
        toast({
          title: "Tests Completed",
          description: `Finished running ${message.totalTests} tests`,
        });
        break;
        
      case 'TEST_STOPPED':
        setRunningTest(null);
        toast({
          title: "Tests Stopped",
          description: "Test execution was stopped",
          variant: "destructive"
        });
        break;
        
      case 'ERROR':
        setConnectionStatus('Error');
        toast({
          title: "Test Error",
          description: message.error || 'An error occurred',
          variant: "destructive"
        });
        break;
    }
  }, [toast]);

  // Update connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? 'Connected' : 'Disconnected');
  }, [isConnected]);
  const updateStats = (results: TestResult[]) => {
    const stats = {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      running: results.filter(r => r.status === 'running').length,
      pending: results.filter(r => r.status === 'pending').length,
      successRate: 0
    };
    
    if (stats.total > 0) {
      stats.successRate = Math.round((stats.passed / stats.total) * 100);
    }
    
    setTestStats(stats);
  };

  const handleRunTests = async (category?: string) => {
    if (!isConnected) {
      toast({
        title: "Connection Error",
        description: "Not connected to test runner. Please wait for connection.",
        variant: "destructive"
      });
      return;
    }

    const success = runTests(category);
    if (!success) {
      toast({
        title: "Failed to Start Tests",
        description: "Could not communicate with test runner",
        variant: "destructive"
      });
    }
  };

  const handleStopTests = () => {
    stopTests();
  };

  // Update stats whenever test results change
  useEffect(() => {
    updateStats(testResults);
  }, [testResults]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and execute your application's test suite with video recording
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Test Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{testStats.passed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{testStats.failed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testStats.successRate}%</div>
            <Progress value={testStats.successRate} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            {isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {connectionStatus}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Run tests by category or execute the full test suite with video recording
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Progress value={currentProgress} className="flex-1" />
                  <span className="text-sm text-muted-foreground">{currentProgress}%</span>
                </div>
                
                {runningTest && (
                  <div className="text-sm text-muted-foreground">
                    Currently running: {runningTest}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => handleRunTests()} 
                disabled={isRunning || !isConnected}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run All Tests
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleRunTests('smoke')} 
                disabled={isRunning || !isConnected}
              >
                <Play className="h-4 w-4 mr-2" />
                Smoke Tests
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleRunTests('critical')} 
                disabled={isRunning || !isConnected}
              >
                <Play className="h-4 w-4 mr-2" />
                Critical Tests
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleRunTests('regression')} 
                disabled={isRunning || !isConnected}
              >
                <Play className="h-4 w-4 mr-2" />
                Regression Tests
              </Button>
              
              {isRunning && (
                <Button 
                  variant="destructive" 
                  onClick={handleStopTests}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Tests
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="videos">Test Videos</TabsTrigger>
          <TabsTrigger value="coverage">Coverage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Results</CardTitle>
              <CardDescription>
                Latest test execution results with detailed status information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div 
                    key={result.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.category} • {result.duration}ms
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {result.error}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Test Execution Videos
              </CardTitle>
              <CardDescription>
                Watch recorded test executions to understand failures and verify functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {testResults
                  .filter(result => result.status !== 'pending')
                  .map((result) => (
                    <TestVideoViewer
                      key={result.id}
                      videoPath={result.videoPath}
                      testTitle={result.title}
                      status={result.status}
                    />
                  ))}
              </div>
              
              {testResults.filter(r => r.status !== 'pending').length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No test videos available. Run tests to see execution recordings.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="coverage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Coverage</CardTitle>
              <CardDescription>
                Code coverage metrics across different components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Coverage</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Components</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Services</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Utils</span>
                    <span>95%</span>
                  </div>
                  <Progress value={95} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Test execution times and performance trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Performance charts and metrics will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test History</CardTitle>
              <CardDescription>
                Historical test results and trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                Historical test data and trends will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}