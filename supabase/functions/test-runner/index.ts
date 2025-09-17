import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { headers } = req
  const upgradeHeader = headers.get("upgrade") || ""

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 })
  }

  const { socket, response } = Deno.upgradeWebSocket(req)
  
  // Test execution state
  let isRunning = false
  let currentTestIndex = 0
  
  const mockTests = [
    { id: '1', title: 'User Authentication Flow', category: 'smoke' },
    { id: '2', title: 'Dashboard Load Performance', category: 'critical' },
    { id: '3', title: 'Transaction Creation', category: 'critical' },
    { id: '4', title: 'CSV Upload Functionality', category: 'regression' },
    { id: '5', title: 'Budget Management', category: 'critical' },
    { id: '6', title: 'Asset Calculations', category: 'regression' }
  ]

  socket.onopen = () => {
    console.log('Test dashboard client connected')
    socket.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'WebSocket connection established'
    }))
  }

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'RUN_TESTS':
          await runTestSuite(data.category)
          break
        case 'STOP_TESTS':
          stopTests()
          break
      }
    } catch (error) {
      console.error('Error processing message:', error)
      socket.send(JSON.stringify({
        type: 'ERROR',
        error: error.message
      }))
    }
  }

  async function runTestSuite(category?: string) {
    if (isRunning) return
    
    isRunning = true
    currentTestIndex = 0
    
    const filteredTests = category 
      ? mockTests.filter(test => test.category === category)
      : mockTests
    
    socket.send(JSON.stringify({
      type: 'TEST_START',
      totalTests: filteredTests.length,
      timestamp: Date.now()
    }))

    for (const test of filteredTests) {
      if (!isRunning) break
      
      // Send test started
      socket.send(JSON.stringify({
        type: 'TEST_UPDATE',
        testId: test.id,
        testTitle: test.title,
        status: 'running',
        progress: Math.round((currentTestIndex / filteredTests.length) * 100),
        timestamp: Date.now()
      }))

      // Simulate test execution time
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
      
      if (!isRunning) break
      
      // Determine test result (80% pass rate)
      const passed = Math.random() > 0.2
      const duration = 1500 + Math.random() * 3000
      
      socket.send(JSON.stringify({
        type: 'TEST_UPDATE',
        testId: test.id,
        testTitle: test.title,
        status: passed ? 'passed' : 'failed',
        duration: Math.round(duration),
        error: passed ? undefined : 'Assertion failed: Expected element to be visible',
        videoPath: `/test-results/videos/${test.title.replace(/\s+/g, '-').toLowerCase()}.webm`,
        progress: Math.round(((currentTestIndex + 1) / filteredTests.length) * 100),
        timestamp: Date.now()
      }))
      
      currentTestIndex++
    }

    if (isRunning) {
      socket.send(JSON.stringify({
        type: 'TEST_COMPLETE',
        totalTests: filteredTests.length,
        completedTests: currentTestIndex,
        timestamp: Date.now()
      }))
    }
    
    isRunning = false
  }

  function stopTests() {
    isRunning = false
    socket.send(JSON.stringify({
      type: 'TEST_STOPPED',
      message: 'Test execution stopped by user',
      timestamp: Date.now()
    }))
  }

  socket.onclose = () => {
    console.log('Test dashboard client disconnected')
    isRunning = false
  }

  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  return response
})