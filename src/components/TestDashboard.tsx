import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  BarChart3,
  TestTube,
  Bug,
  Zap,
  Shield
} from 'lucide-react'

interface TestResult {
  id: string
  name: string
  type: 'unit' | 'integration' | 'component' | 'e2e'
  status: 'passed' | 'failed' | 'running' | 'pending'
  duration: number
  coverage?: number
  error?: string
  timestamp: string
}

interface TestSuite {
  name: string
  type: 'unit' | 'integration' | 'component' | 'e2e'
  total: number
  passed: number
  failed: number
  running: number
  pending: number
  coverage: number
  duration: number
  tests: TestResult[]
}

const TestDashboard: React.FC = () => {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedSuite, setSelectedSuite] = useState<string>('all')

  // Mock test data - in real implementation, this would come from test runners
  useEffect(() => {
    const mockTestSuites: TestSuite[] = [
      {
        name: 'Unit Tests',
        type: 'unit',
        total: 45,
        passed: 42,
        failed: 2,
        running: 0,
        pending: 1,
        coverage: 87.5,
        duration: 1250,
        tests: [
          {
            id: 'currency-utils',
            name: 'Currency Utils',
            type: 'unit',
            status: 'passed',
            duration: 45,
            coverage: 95,
            timestamp: '2024-01-15T10:30:00Z'
          },
          {
            id: 'financial-year-utils',
            name: 'Financial Year Utils',
            type: 'unit',
            status: 'passed',
            duration: 32,
            coverage: 92,
            timestamp: '2024-01-15T10:30:00Z'
          },
          {
            id: 'csv-parser',
            name: 'CSV Parser',
            type: 'unit',
            status: 'failed',
            duration: 28,
            coverage: 78,
            error: 'Invalid date format validation failed',
            timestamp: '2024-01-15T10:30:00Z'
          }
        ]
      },
      {
        name: 'Integration Tests',
        type: 'integration',
        total: 12,
        passed: 10,
        failed: 1,
        running: 0,
        pending: 1,
        coverage: 82.3,
        duration: 3200,
        tests: [
          {
            id: 'transaction-categorizer',
            name: 'Transaction Categorizer',
            type: 'integration',
            status: 'passed',
            duration: 1200,
            coverage: 85,
            timestamp: '2024-01-15T10:35:00Z'
          },
          {
            id: 'api-integration',
            name: 'API Integration',
            type: 'integration',
            status: 'failed',
            duration: 800,
            coverage: 70,
            error: 'Supabase connection timeout',
            timestamp: '2024-01-15T10:35:00Z'
          }
        ]
      },
      {
        name: 'Component Tests',
        type: 'component',
        total: 28,
        passed: 26,
        failed: 1,
        running: 0,
        pending: 1,
        coverage: 91.2,
        duration: 1800,
        tests: [
          {
            id: 'dashboard-card',
            name: 'Dashboard Card',
            type: 'component',
            status: 'passed',
            duration: 65,
            coverage: 95,
            timestamp: '2024-01-15T10:40:00Z'
          },
          {
            id: 'transaction-form',
            name: 'Transaction Form',
            type: 'component',
            status: 'failed',
            duration: 120,
            coverage: 88,
            error: 'Form validation not working correctly',
            timestamp: '2024-01-15T10:40:00Z'
          }
        ]
      },
      {
        name: 'E2E Tests',
        type: 'e2e',
        total: 9,
        passed: 8,
        failed: 0,
        running: 1,
        pending: 0,
        coverage: 0,
        duration: 4500,
        tests: [
          {
            id: 'auth-flow',
            name: 'Authentication Flow',
            type: 'e2e',
            status: 'passed',
            duration: 1200,
            timestamp: '2024-01-15T10:45:00Z'
          },
          {
            id: 'transaction-management',
            name: 'Transaction Management',
            type: 'e2e',
            status: 'running',
            duration: 0,
            timestamp: '2024-01-15T10:50:00Z'
          }
        ]
      }
    ]

    setTestSuites(mockTestSuites)
  }, [])

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  const getTypeIcon = (type: TestResult['type']) => {
    switch (type) {
      case 'unit':
        return <TestTube className="h-4 w-4" />
      case 'integration':
        return <Zap className="h-4 w-4" />
      case 'component':
        return <Bug className="h-4 w-4" />
      case 'e2e':
        return <Shield className="h-4 w-4" />
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    // Simulate test execution
    setTimeout(() => {
      setIsRunning(false)
    }, 5000)
  }

  const runTestSuite = async (suiteName: string) => {
    setIsRunning(true)
    // Simulate test suite execution
    setTimeout(() => {
      setIsRunning(false)
    }, 3000)
  }

  const totalTests = testSuites.reduce((sum, suite) => sum + suite.total, 0)
  const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passed, 0)
  const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failed, 0)
  const totalRunning = testSuites.reduce((sum, suite) => sum + suite.running, 0)
  const totalPending = testSuites.reduce((sum, suite) => sum + suite.pending, 0)
  const overallCoverage = testSuites.reduce((sum, suite) => sum + suite.coverage, 0) / testSuites.length

  const filteredSuites = selectedSuite === 'all' 
    ? testSuites 
    : testSuites.filter(suite => suite.type === selectedSuite)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Test Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive testing overview for Pocket Penny Wizard
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runAllTests} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-muted-foreground">
              {totalRunning} running, {totalPending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPassed}</div>
            <p className="text-xs text-muted-foreground">
              {((totalPassed / totalTests) * 100).toFixed(1)}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalFailed}</div>
            <p className="text-xs text-muted-foreground">
              {totalFailed > 0 ? 'Needs attention' : 'All tests passing'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCoverage.toFixed(1)}%</div>
            <Progress value={overallCoverage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Test Suites */}
      <Tabs value={selectedSuite} onValueChange={setSelectedSuite}>
        <TabsList>
          <TabsTrigger value="all">All Tests</TabsTrigger>
          <TabsTrigger value="unit">Unit Tests</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
          <TabsTrigger value="component">Components</TabsTrigger>
          <TabsTrigger value="e2e">E2E Tests</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedSuite} className="space-y-4">
          {filteredSuites.map((suite) => (
            <Card key={suite.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(suite.type)}
                    <CardTitle>{suite.name}</CardTitle>
                    <Badge variant="outline">{suite.total} tests</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Coverage: {suite.coverage.toFixed(1)}%
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => runTestSuite(suite.name)}
                      disabled={isRunning}
                    >
                      Run Suite
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {suite.passed} passed, {suite.failed} failed, {suite.running} running, {suite.pending} pending
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {suite.tests.map((test) => (
                      <div 
                        key={test.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(test.status)}
                          <div>
                            <div className="font-medium">{test.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Duration: {test.duration}ms
                              {test.coverage && ` • Coverage: ${test.coverage}%`}
                            </div>
                            {test.error && (
                              <div className="text-sm text-red-600 mt-1">
                                Error: {test.error}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
      </Tabs>
    </div>
  )
}

export default TestDashboard
