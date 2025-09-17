import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, CheckCircle, XCircle, Clock, AlertCircle, Square } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { realE2ETestRunner, TestSuite, TestResult } from '@/services/RealE2ETestRunner';


const E2ETestDashboard: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'currency-conversion',
      name: 'Currency Conversion System',
      description: 'Tests for Story 1.1: Currency conversion functionality',
      story: 'Story 1.1',
      status: 'pending',
      tests: [
        { id: 'cc-1', name: 'should display currency selector on dashboard', status: 'pending' },
        { id: 'cc-2', name: 'should change currency and update all amounts', status: 'pending' },
        { id: 'cc-3', name: 'should display currency symbols correctly', status: 'pending' },
        { id: 'cc-4', name: 'should maintain currency preference across page navigation', status: 'pending' },
        { id: 'cc-5', name: 'should handle exchange rate API errors gracefully', status: 'pending' },
      ]
    },
    {
      id: 'financial-year',
      name: 'Financial Year Management',
      description: 'Tests for Story 1.2: Financial year calculations and reporting',
      story: 'Story 1.2',
      status: 'pending',
      tests: [
        { id: 'fy-1', name: 'should display financial year information on dashboard', status: 'pending' },
        { id: 'fy-2', name: 'should navigate to reports page and show financial year reports', status: 'pending' },
        { id: 'fy-3', name: 'should display net worth trend over time', status: 'pending' },
        { id: 'fy-4', name: 'should display assets and liabilities overview', status: 'pending' },
        { id: 'fy-5', name: 'should handle different financial year periods', status: 'pending' },
        { id: 'fy-6', name: 'should calculate financial year correctly for current date', status: 'pending' },
        { id: 'fy-7', name: 'should show income and expense breakdown by financial year', status: 'pending' },
      ]
    },
    {
      id: 'csv-import',
      name: 'CSV Import System',
      description: 'Tests for Story 1.3: CSV file upload and processing',
      story: 'Story 1.3',
      status: 'pending',
      tests: [
        { id: 'csv-1', name: 'should display CSV upload button on transactions page', status: 'pending' },
        { id: 'csv-2', name: 'should open CSV upload dialog when upload button is clicked', status: 'pending' },
        { id: 'csv-3', name: 'should show CSV and Excel template options', status: 'pending' },
        { id: 'csv-4', name: 'should show generate test data option', status: 'pending' },
        { id: 'csv-5', name: 'should handle CSV file upload', status: 'pending' },
        { id: 'csv-6', name: 'should validate CSV file format', status: 'pending' },
        { id: 'csv-7', name: 'should close upload dialog when close button is clicked', status: 'pending' },
        { id: 'csv-8', name: 'should handle empty CSV file gracefully', status: 'pending' },
        { id: 'csv-9', name: 'should show file format requirements', status: 'pending' },
      ]
    },
    {
      id: 'integrated-features',
      name: 'Integrated Features',
      description: 'End-to-end tests combining all three stories',
      story: 'Stories 1.1-1.3',
      status: 'pending',
      tests: [
        { id: 'int-1', name: 'should demonstrate complete workflow: CSV import → Currency conversion → Financial year reporting', status: 'pending' },
        { id: 'int-2', name: 'should maintain currency preference across all features', status: 'pending' },
        { id: 'int-3', name: 'should handle currency conversion with financial year data', status: 'pending' },
        { id: 'int-4', name: 'should demonstrate CSV import with currency conversion', status: 'pending' },
        { id: 'int-5', name: 'should show financial year calculations with different currencies', status: 'pending' },
        { id: 'int-6', name: 'should handle error states gracefully across all features', status: 'pending' },
      ]
    }
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'skipped':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      running: 'secondary',
      skipped: 'outline',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const runTestSuite = async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    setIsRunning(true);
    setCurrentTest(suiteId);

    try {
      // Update suite status to running
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? { ...s, status: 'running' as const }
          : s
      ));

      // Run the actual E2E tests
      const result = await realE2ETestRunner.runTestSuite(suiteId);
      
      // Update the test suites with real results
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId ? result : s
      ));

      toast({
        title: "Test Suite Completed",
        description: `Finished running ${suite.name}`,
      });
    } catch (error) {
      console.error('Test suite failed:', error);
      
      // Update suite status to failed
      setTestSuites(prev => prev.map(s => 
        s.id === suiteId 
          ? { ...s, status: 'failed' as const }
          : s
      ));

      toast({
        title: "Test Suite Failed",
        description: `Failed to run ${suite.name}: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
      setCurrentTest(null);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    try {
      const results = await realE2ETestRunner.runAllTests();
      setTestSuites(results);
      
      toast({
        title: "All Tests Completed",
        description: "Finished running all E2E test suites",
      });
    } catch (error) {
      console.error('Failed to run all tests:', error);
      toast({
        title: "Tests Failed",
        description: `Failed to run tests: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const stopTests = () => {
    realE2ETestRunner.stopTests();
    setIsRunning(false);
    setCurrentTest(null);
    
    toast({
      title: "Tests Stopped",
      description: "Test execution has been stopped",
    });
  };


  const getOverallStats = () => {
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
    const passedTests = testSuites.reduce((sum, suite) => 
      sum + suite.tests.filter(t => t.status === 'passed').length, 0
    );
    const failedTests = testSuites.reduce((sum, suite) => 
      sum + suite.tests.filter(t => t.status === 'failed').length, 0
    );
    const runningTests = testSuites.reduce((sum, suite) => 
      sum + suite.tests.filter(t => t.status === 'running').length, 0
    );

    return { totalTests, passedTests, failedTests, runningTests };
  };

  const stats = getOverallStats();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">E2E Test Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive end-to-end testing for Stories 1.1-1.3
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button 
              onClick={stopTests}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Tests
            </Button>
          ) : (
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Run All Tests
            </Button>
          )}
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{stats.totalTests}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-green-600">{stats.passedTests}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedTests}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">
                  {stats.totalTests > 0 ? Math.round((stats.passedTests / stats.totalTests) * 100) : 0}%
                </p>
              </div>
              <div className="w-8 h-8">
                <Progress 
                  value={stats.totalTests > 0 ? (stats.passedTests / stats.totalTests) * 100 : 0} 
                  className="w-full h-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Suites */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="story-1.1">Story 1.1</TabsTrigger>
          <TabsTrigger value="story-1.2">Story 1.2</TabsTrigger>
          <TabsTrigger value="story-1.3">Story 1.3</TabsTrigger>
          <TabsTrigger value="integrated">Integrated</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {testSuites.map((suite) => (
            <Card key={suite.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {suite.name}
                      {getStatusIcon(suite.status)}
                    </CardTitle>
                    <CardDescription>{suite.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(suite.status)}
                    <Button
                      size="sm"
                      onClick={() => runTestSuite(suite.id)}
                      disabled={isRunning}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-3 w-3" />
                      Run Suite
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {suite.tests.map((test) => (
                      <div key={test.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.status)}
                          <span className="text-sm">{test.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {test.duration && (
                            <span className="text-xs text-muted-foreground">
                              {test.duration}ms
                            </span>
                          )}
                          {getStatusBadge(test.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {testSuites.map((suite) => (
          <TabsContent key={suite.id} value={suite.id} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {suite.name}
                      {getStatusIcon(suite.status)}
                    </CardTitle>
                    <CardDescription>{suite.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(suite.status)}
                    <Button
                      size="sm"
                      onClick={() => runTestSuite(suite.id)}
                      disabled={isRunning}
                      className="flex items-center gap-2"
                    >
                      <Play className="h-3 w-3" />
                      Run Suite
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {suite.tests.map((test) => (
                      <div key={test.id} className="p-3 border rounded space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(test.status)}
                            <span className="font-medium">{test.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {test.duration && (
                              <span className="text-xs text-muted-foreground">
                                {test.duration}ms
                              </span>
                            )}
                            {getStatusBadge(test.status)}
                          </div>
                        </div>
                        {test.error && (
                          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                            {test.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default E2ETestDashboard;
