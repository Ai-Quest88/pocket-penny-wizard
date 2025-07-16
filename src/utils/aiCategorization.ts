import { categories } from '@/types/transaction-forms';
import { supabase } from '@/integrations/supabase/client';

let isInitialized = false;

// Test Google Gemini API connectivity via edge function
export const testGeminiConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Testing Google Gemini API connection via edge function...');
    
    const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
      },
      body: JSON.stringify({
        testMode: true
      })
    });

    console.log('Edge function response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error details:', errorText);
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${response.statusText} - ${errorText}` 
      };
    }

    const data = await response.json();
    console.log('Google Gemini API test successful via edge function:', data);
    
    if (data.success) {
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
    
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Initialize the Google Gemini classifier
export const initializeAIClassifier = async () => {
  if (isInitialized) return true;
  
  console.log('Google Gemini AI classifier ready (using edge function with model alternation)');
  isInitialized = true;
  return true;
};

// Comprehensive Australian transaction categorization rules
const comprehensiveAustralianRules = (description: string): string | null => {
  const lowerDesc = description.toLowerCase();
  
  // === INCOME PATTERNS ===
  if (lowerDesc.includes('salary') || lowerDesc.includes('wage') || lowerDesc.includes('payroll') ||
      lowerDesc.includes('direct credit') && lowerDesc.includes('salary') ||
      lowerDesc.includes('novel aquatech') || lowerDesc.includes('employer') ||
      lowerDesc.includes('pay ') || lowerDesc.includes(' pay') || lowerDesc.includes('income')) {
    return 'Salary';
  }
  
  // ATO and government payments
  if (lowerDesc.includes('ato ') || lowerDesc.includes('012721') || 
      lowerDesc.includes('government') || lowerDesc.includes('centrelink') ||
      lowerDesc.includes('family tax') || lowerDesc.includes('child care') ||
      lowerDesc.includes('jobkeeper') || lowerDesc.includes('jobseeker')) {
    return 'Government Benefits';
  }
  
  // Rental income
  if (lowerDesc.includes('rent') && (lowerDesc.includes('credit') || lowerDesc.includes('income')) ||
      lowerDesc.includes('rental') || lowerDesc.includes('future rent')) {
    return 'Rental Income';
  }
  
  // === TRANSPORT & TOLLS ===
  // Toll roads (very specific to Australia)
  if (lowerDesc.includes('linkt') || lowerDesc.includes('408856') || 
      lowerDesc.includes('toll') || lowerDesc.includes('etoll') ||
      lowerDesc.includes('citylink') || lowerDesc.includes('eastlink') ||
      lowerDesc.includes('m1 ') || lowerDesc.includes('m2 ') || lowerDesc.includes('m4 ') ||
      lowerDesc.includes('harbour bridge') || lowerDesc.includes('harbour tunnel')) {
    return 'Tolls';
  }
  
  // Public transport
  if (lowerDesc.includes('opal') || lowerDesc.includes('myki') || lowerDesc.includes('go card') ||
      lowerDesc.includes('translink') || lowerDesc.includes('public transport') ||
      lowerDesc.includes('train') || lowerDesc.includes('bus') || lowerDesc.includes('metro') ||
      lowerDesc.includes('ferry') || lowerDesc.includes('tram')) {
    return 'Public Transport';
  }
  
  // Ride sharing
  if (lowerDesc.includes('uber') || lowerDesc.includes('taxi') || lowerDesc.includes('ola') ||
      lowerDesc.includes('didi') || lowerDesc.includes('13cabs')) {
    return 'Transportation';
  }
  
  // === FOOD & GROCERIES ===
  // Major Australian supermarkets
  if (lowerDesc.includes('woolworths') || lowerDesc.includes('coles') || 
      lowerDesc.includes('aldi') || lowerDesc.includes('iga') ||
      lowerDesc.includes('harris farm') || lowerDesc.includes('costco') ||
      lowerDesc.includes('foodworks') || lowerDesc.includes('supa iga')) {
    return 'Groceries';
  }
  
  // Fast food chains
  if (lowerDesc.includes('mcdonald') || lowerDesc.includes('kfc') || lowerDesc.includes('subway') ||
      lowerDesc.includes('hungry jack') || lowerDesc.includes('red rooster') ||
      lowerDesc.includes('nando') || lowerDesc.includes('domino') || lowerDesc.includes('pizza hut') ||
      lowerDesc.includes('grill\'d') || lowerDesc.includes('oporto')) {
    return 'Fast Food';
  }
  
  // Food delivery
  if (lowerDesc.includes('uber eats') || lowerDesc.includes('deliveroo') || 
      lowerDesc.includes('menulog') || lowerDesc.includes('doordash') ||
      lowerDesc.includes('food delivery') || lowerDesc.includes('delivery')) {
    return 'Food Delivery';
  }
  
  // Restaurants and cafes
  if (lowerDesc.includes('restaurant') || lowerDesc.includes('cafe') || lowerDesc.includes('coffee') ||
      lowerDesc.includes('dining') || lowerDesc.includes('bistro') || lowerDesc.includes('pub') ||
      lowerDesc.includes('bar ') || lowerDesc.includes('grill') || lowerDesc.includes('kitchen')) {
    return 'Restaurants';
  }
  
  // === FUEL & AUTOMOTIVE ===
  // Australian fuel stations
  if (lowerDesc.includes('bp ') || lowerDesc.includes('shell') || lowerDesc.includes('caltex') ||
      lowerDesc.includes('ampol') || lowerDesc.includes('7-eleven') || lowerDesc.includes('united') ||
      lowerDesc.includes('liberty') || lowerDesc.includes('metro petroleum') ||
      lowerDesc.includes('fuel') || lowerDesc.includes('petrol') || lowerDesc.includes('diesel')) {
    return 'Gas & Fuel';
  }
  
  // === UTILITIES ===
  // Australian telcos
  if (lowerDesc.includes('telstra') || lowerDesc.includes('optus') || lowerDesc.includes('vodafone') ||
      lowerDesc.includes('tpg') || lowerDesc.includes('belong') || lowerDesc.includes('boost') ||
      lowerDesc.includes('amaysim') || lowerDesc.includes('more telecom') ||
      lowerDesc.includes('phone') || lowerDesc.includes('mobile') || lowerDesc.includes('internet')) {
    return 'Utilities';
  }
  
  // Energy providers
  if (lowerDesc.includes('origin') || lowerDesc.includes('agl') || lowerDesc.includes('energy australia') ||
      lowerDesc.includes('red energy') || lowerDesc.includes('electricity') || lowerDesc.includes('gas bill') ||
      lowerDesc.includes('power') || lowerDesc.includes('energy') || lowerDesc.includes('water')) {
    return 'Utilities';
  }
  
  // === HEALTHCARE ===
  if (lowerDesc.includes('cbhs') || lowerDesc.includes('000187') || // CBHS health fund
      lowerDesc.includes('medicare') || lowerDesc.includes('health fund') ||
      lowerDesc.includes('doctor') || lowerDesc.includes('medical') || lowerDesc.includes('pharmacy') ||
      lowerDesc.includes('chemist') || lowerDesc.includes('hospital') || lowerDesc.includes('dental') ||
      lowerDesc.includes('physiotherapy') || lowerDesc.includes('optometrist')) {
    return 'Healthcare';
  }
  
  // === EDUCATION ===
  if (lowerDesc.includes('school') || lowerDesc.includes('academy') || lowerDesc.includes('brilliant acadmy') ||
      lowerDesc.includes('university') || lowerDesc.includes('tafe') || lowerDesc.includes('education') ||
      lowerDesc.includes('tuition') || lowerDesc.includes('course') || lowerDesc.includes('numeropro') ||
      lowerDesc.includes('pre uni') || lowerDesc.includes('band committee') || lowerDesc.includes('kidsof')) {
    return 'Education';
  }
  
  // === GOVERNMENT & TAXES ===
  if (lowerDesc.includes('revenue') || lowerDesc.includes('tax office') || 
      lowerDesc.includes('ato') || lowerDesc.includes('act revenue') || 
      lowerDesc.includes('nsw revenue') || lowerDesc.includes('vic revenue') ||
      lowerDesc.includes('068249') || lowerDesc.includes('council') ||
      lowerDesc.includes('rates') || lowerDesc.includes('rego') || lowerDesc.includes('registration')) {
    return 'Taxes';
  }
  
  // === TRANSFERS & BANKING ===
  if (lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from') ||
      lowerDesc.includes('bpay') || lowerDesc.includes('direct credit') ||
      lowerDesc.includes('commbank app') || lowerDesc.includes('savings') ||
      lowerDesc.includes('atm') || lowerDesc.includes('withdrawal') ||
      lowerDesc.includes('payid') || lowerDesc.includes('fast transfer') ||
      lowerDesc.includes('wdl atm') || lowerDesc.includes('non cba atm')) {
    return 'Transfer'; // Note: This will be handled by built-in rules for direction
  }
  
  // Credit card payments
  if (lowerDesc.includes('citibank creditcards') || lowerDesc.includes('credit card') ||
      lowerDesc.includes('49502') || lowerDesc.includes('nab cards')) {
    return 'Banking';
  }
  
  // === SHOPPING ===
  // Department stores
  if (lowerDesc.includes('target') || lowerDesc.includes('kmart') || lowerDesc.includes('big w') ||
      lowerDesc.includes('myer') || lowerDesc.includes('david jones') || lowerDesc.includes('harris scarfe')) {
    return 'Shopping';
  }
  
  // Online shopping
  if (lowerDesc.includes('amazon') || lowerDesc.includes('ebay') || lowerDesc.includes('paypal') ||
      lowerDesc.includes('online') || lowerDesc.includes('shopping')) {
    return 'Shopping';
  }
  
  // Home & Garden
  if (lowerDesc.includes('pool shop') || lowerDesc.includes('bunnings') || lowerDesc.includes('home depot') ||
      lowerDesc.includes('masters') || lowerDesc.includes('hardware')) {
    return 'Home & Garden';
  }
  
  // === ENTERTAINMENT ===
  if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify') || lowerDesc.includes('stan') ||
      lowerDesc.includes('disney') || lowerDesc.includes('amazon prime') || lowerDesc.includes('youtube') ||
      lowerDesc.includes('cinema') || lowerDesc.includes('movie') || lowerDesc.includes('theatre') ||
      lowerDesc.includes('bowling') || lowerDesc.includes('gaming') || lowerDesc.includes('badminton') ||
      lowerDesc.includes('ce la vi') || lowerDesc.includes('observation') || lowerDesc.includes('lunch') ||
      lowerDesc.includes('dinner')) {
    return 'Entertainment';
  }
  
  // === PROFESSIONAL SERVICES ===
  if (lowerDesc.includes('accountant') || lowerDesc.includes('lawyer') || lowerDesc.includes('solicitor') ||
      lowerDesc.includes('consultant') || lowerDesc.includes('service') || lowerDesc.includes('professional') ||
      lowerDesc.includes('rental management') || lowerDesc.includes('property company') || 
      lowerDesc.includes('shieldmate') || lowerDesc.includes('cleaning')) {
    return 'Professional Services';
  }
  
  // === PERSONAL CARE ===
  if (lowerDesc.includes('hairdresser') || lowerDesc.includes('barber') || lowerDesc.includes('beauty') ||
      lowerDesc.includes('massage') || lowerDesc.includes('spa') || lowerDesc.includes('salon')) {
    return 'Personal Care';
  }
  
  // === INVESTMENTS ===
  if (lowerDesc.includes('btc markets') || lowerDesc.includes('coinbase') || lowerDesc.includes('crypto') ||
      lowerDesc.includes('bitcoin') || lowerDesc.includes('investment') || lowerDesc.includes('trading') ||
      lowerDesc.includes('shares') || lowerDesc.includes('dividend') || lowerDesc.includes('interest')) {
    return 'Investment';
  }
  
  // === PERSONAL TRANSFERS (catch remaining personal payments) ===
  if (lowerDesc.includes('gift') || lowerDesc.includes('cake') || 
      lowerDesc.includes('fence work') || lowerDesc.includes('roof') ||
      lowerDesc.includes('cushion') || lowerDesc.includes('inv-') ||
      lowerDesc.includes('invoice') || lowerDesc.includes('expense') ||
      lowerDesc.includes('maxxmattress') || lowerDesc.includes('shuttles')) {
    return 'Gifts & Donations';
  }
  
  // === TRAVEL & TRANSPORT (international) ===
  if (lowerDesc.includes('singapore') || lowerDesc.includes('international transaction') ||
      lowerDesc.includes('bus/mrt') || lowerDesc.includes('vietnamairl')) {
    return 'Travel';
  }
  
  // === FEES ===
  if (lowerDesc.includes('fee') || lowerDesc.includes('withdrawal fee') ||
      lowerDesc.includes('transaction fee') || lowerDesc.includes('international transaction fee')) {
    return 'Banking';
  }
  
  return null;
};

// Minimal essential rules for critical financial categories only (as fallback)
const essentialBuiltInRules = (description: string): string | null => {
  // First try comprehensive rules
  const comprehensiveResult = comprehensiveAustralianRules(description);
  if (comprehensiveResult) return comprehensiveResult;
  
  const lowerDesc = description.toLowerCase();
  
  // Only absolute essentials - let AI handle everything else
  if (lowerDesc.includes('transfer to') || lowerDesc.includes('transfer from') ||
      lowerDesc.includes('bpay') || lowerDesc.includes('direct credit')) {
    return 'Transfer'; // Note: This will be handled by built-in rules for direction
  }
  
  if (lowerDesc.includes('revenue') || lowerDesc.includes('tax office') || 
      lowerDesc.includes('ato') || lowerDesc.includes('act revenue') || 
      lowerDesc.includes('nsw revenue') || lowerDesc.includes('vic revenue')) {
    return 'Taxes';
  }
  
  return null;
};

// Smart batch processing with token limits and retry logic
export const categorizeTransactionsBatch = async (
  descriptions: string[], 
  userId: string,
  amounts?: number[],
  onProgress?: (processed: number, total: number, results: string[]) => void
): Promise<string[]> => {
  const overallStartTime = Date.now();
  console.log(`🚀 Starting smart batch categorization for ${descriptions.length} transactions at ${new Date().toISOString()}`);
  console.log('Sample descriptions:', descriptions.slice(0, 3));
  
  // Optimal batch size for best AI accuracy (tested: 10=excellent, 15=optimal, 20=very good, 30=good, 60=poor)
  const BATCH_SIZE = 15;
  
  console.log(`📦 Using batch size: ${BATCH_SIZE} transactions per batch`);
  console.log(`📊 Total batches to process: ${Math.ceil(descriptions.length / BATCH_SIZE)}`);
  
  const results: string[] = new Array(descriptions.length);
  let processedCount = 0;
  let successfulAIBatches = 0;
  let failedAIBatches = 0;
  let totalAIResponseTime = 0;
  
  // Split into batches
  for (let i = 0; i < descriptions.length; i += BATCH_SIZE) {
    const batchDescriptions = descriptions.slice(i, i + BATCH_SIZE);
    const batchStartIndex = i;
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(descriptions.length / BATCH_SIZE);
    
    console.log(`\n📡 Processing batch ${batchNumber}/${totalBatches} (${batchDescriptions.length} transactions)`);
    console.log(`📋 Batch progress: ${processedCount}/${descriptions.length} transactions completed so far`);
    
    const batchStartTime = Date.now();
    let usedFallback = false;
    
    try {
      // Try AI categorization for this batch with retry logic
      console.log(`🤖 Attempting AI categorization for batch ${batchNumber}...`);
      const batchResults = await processBatchWithRetry(batchDescriptions, userId, 3);
      
      const batchTime = Date.now() - batchStartTime;
      totalAIResponseTime += batchTime;
      successfulAIBatches++;
      
      // Store results in correct positions
      for (let j = 0; j < batchResults.length; j++) {
        results[batchStartIndex + j] = batchResults[j];
      }
      
      processedCount += batchResults.length;
      
      // Analyze this batch's results
      const miscCount = batchResults.filter(cat => cat === 'Uncategorized').length;
      const batchSuccessRate = ((batchResults.length - miscCount) / batchResults.length * 100).toFixed(1);
      
      console.log(`✅ Batch ${batchNumber} AI SUCCESS in ${batchTime}ms: ${batchResults.length} transactions categorized`);
      console.log(`📈 Batch ${batchNumber} success rate: ${batchSuccessRate}% (${batchResults.length - miscCount}/${batchResults.length} categorized, ${miscCount} uncategorized)`);
      console.log(`📝 Sample categories: ${batchResults.slice(0, 3).join(', ')}`);
      
    } catch (error) {
      const batchTime = Date.now() - batchStartTime;
      failedAIBatches++;
      usedFallback = true;
      
      console.warn(`⚠️ Batch ${batchNumber} AI FAILED after ${batchTime}ms, using comprehensive rules fallback:`, {
        batchNumber: batchNumber,
        totalBatches: totalBatches,
        batchSize: batchDescriptions.length,
        errorMessage: error.message,
        errorType: error.name,
        timeSpent: batchTime
      });
      
      // Fallback to enhanced built-in rules for this batch (includes transfer direction)
      let fallbackMiscCount = 0;
      for (let j = 0; j < batchDescriptions.length; j++) {
        const description = batchDescriptions[j];
        const amount = amounts ? amounts[batchStartIndex + j] : undefined;
        
        // Import the built-in rules function
        const { categorizeByBuiltInRules } = await import('@/utils/transactionCategories');
        const category = categorizeByBuiltInRules(description, amount) || comprehensiveAustralianRules(description) || 'Uncategorized';
        results[batchStartIndex + j] = category;
        
        if (category === 'Uncategorized') {
          fallbackMiscCount++;
          console.log(`⚠️ UNCATEGORIZED (fallback): "${description.substring(0, 50)}..." -> ${category}`);
        } else {
          console.log(`🏷️ Fallback rule: "${description.substring(0, 30)}..." -> ${category}`);
        }
      }
      
      const fallbackSuccessRate = ((batchDescriptions.length - fallbackMiscCount) / batchDescriptions.length * 100).toFixed(1);
      console.log(`🛡️ Batch ${batchNumber} FALLBACK complete: ${fallbackSuccessRate}% success rate (${batchDescriptions.length - fallbackMiscCount}/${batchDescriptions.length} categorized)`);
      
      processedCount += batchDescriptions.length;
    }
    
    // Update progress
    if (onProgress) {
      onProgress(processedCount, descriptions.length, results.slice(0, processedCount));
    }
    
    // Log overall progress
    const overallProgress = (processedCount / descriptions.length * 100).toFixed(1);
    console.log(`📊 Overall progress: ${overallProgress}% (${processedCount}/${descriptions.length}) - AI batches: ${successfulAIBatches} success, ${failedAIBatches} failed`);
    
    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < descriptions.length) {
      console.log(`⏱️ Brief pause before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const totalTime = Date.now() - overallStartTime;
  const avgAIResponseTime = successfulAIBatches > 0 ? (totalAIResponseTime / successfulAIBatches).toFixed(0) : 'N/A';
  
  console.log(`\n🎯 ALL BATCHES COMPLETED in ${totalTime}ms`);
  console.log(`📊 Final Statistics:`, {
    totalTransactions: descriptions.length,
    totalBatches: Math.ceil(descriptions.length / BATCH_SIZE),
    successfulAIBatches: successfulAIBatches,
    failedAIBatches: failedAIBatches,
    aiSuccessRate: `${((successfulAIBatches / (successfulAIBatches + failedAIBatches)) * 100).toFixed(1)}%`,
    avgAIResponseTime: `${avgAIResponseTime}ms`,
    totalProcessingTime: `${totalTime}ms`
  });
  
  // Final results analysis
  const finalMiscCount = results.filter(r => r === 'Uncategorized').length;
  const finalSuccessCount = results.filter(r => r && r !== 'Uncategorized').length;
  const overallSuccessRate = ((finalSuccessCount / descriptions.length) * 100).toFixed(1);
  
  console.log(`📈 FINAL CATEGORIZATION RESULTS:`, {
    totalProcessed: descriptions.length,
    successfullyCategorized: finalSuccessCount,
    uncategorized: finalMiscCount,
    overallSuccessRate: `${overallSuccessRate}%`,
    timestamp: new Date().toISOString()
  });
  
  // Log category distribution
  const categoryDistribution = results.reduce((acc, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log(`📊 Category distribution:`, Object.entries(categoryDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10) // Top 10 categories
    .reduce((acc, [cat, count]) => {
      acc[cat] = count;
      return acc;
    }, {} as Record<string, number>)
  );
  
  if (finalMiscCount > descriptions.length * 0.3) {
    console.warn(`⚠️ HIGH UNCATEGORIZED RATE: ${finalMiscCount}/${descriptions.length} (${(finalMiscCount/descriptions.length*100).toFixed(1)}%) transactions could not be categorized`);
    console.warn(`💡 Consider: 1) Checking Google Gemini API status, 2) Adding more comprehensive rules, 3) Reviewing transaction descriptions`);
  }
  
  return results;
};

// Helper function to process a single batch with retry logic
async function processBatchWithRetry(
  descriptions: string[], 
  userId: string, 
  maxRetries: number = 3
): Promise<string[]> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries} for batch of ${descriptions.length} transactions`);
      console.log(`📋 Sample descriptions:`, descriptions.slice(0, 3));
      
      const requestBody = { 
        descriptions,
        userId,
        batchMode: true
      };

      console.log(`📡 Making request to AI service at ${new Date().toISOString()}...`);
      console.log(`📦 Request payload size: ${JSON.stringify(requestBody).length} characters`);
      
      const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
        },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Date.now() - startTime;
      console.log(`📊 AI Response received in ${responseTime}ms - Status: ${response.status} ${response.statusText}`);
      console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ AI Service Error Response (${response.status}):`, errorText);
        
        // Log specific error details for different status codes
        if (response.status === 429) {
          console.error(`🚫 RATE LIMIT: Google Gemini API rate limit exceeded on attempt ${attempt}`);
        } else if (response.status === 500) {
          console.error(`💥 SERVER ERROR: Google Gemini API internal server error on attempt ${attempt}`);
        } else if (response.status === 503) {
          console.error(`🔧 SERVICE UNAVAILABLE: Google Gemini API temporarily unavailable on attempt ${attempt}`);
        } else if (response.status === 401) {
          console.error(`🔑 UNAUTHORIZED: Google Gemini API authentication failed on attempt ${attempt}`);
        } else if (response.status === 400) {
          console.error(`📝 BAD REQUEST: Invalid request to Google Gemini API on attempt ${attempt}`);
          console.error(`📦 Request body that caused error:`, JSON.stringify(requestBody, null, 2));
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`📦 AI Response data received:`, {
        hasCategories: !!data.categories,
        isArray: Array.isArray(data.categories),
        categoriesLength: data.categories?.length || 0,
        expectedLength: descriptions.length,
        responseTime: responseTime,
        source: data.source || 'unknown',
        model: data.model || 'unknown'
      });
      
      // Log sample of actual categories returned
      if (data.categories && Array.isArray(data.categories)) {
        console.log(`📝 Sample AI categories returned:`, data.categories.slice(0, 5));
        
        // Count category distribution
        const categoryCount = data.categories.reduce((acc, cat) => {
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log(`📊 Category distribution:`, categoryCount);
        
        const miscCount = categoryCount['Uncategorized'] || 0;
        const successRate = ((data.categories.length - miscCount) / data.categories.length * 100).toFixed(1);
        console.log(`📈 AI Success rate: ${successRate}% (${data.categories.length - miscCount}/${data.categories.length} categorized, ${miscCount} uncategorized)`);
      }
      
      if (data.categories && Array.isArray(data.categories) && data.categories.length === descriptions.length) {
        console.log(`✅ Batch AI success on attempt ${attempt} in ${responseTime}ms`);
        return data.categories;
      }
      
      console.error(`🚫 Invalid AI response format:`, {
        hasCategories: !!data.categories,
        isArray: Array.isArray(data.categories),
        expectedLength: descriptions.length,
        actualLength: data.categories?.length || 0,
        fullResponse: data
      });
      
      throw new Error(`Invalid response: expected ${descriptions.length} categories, got ${data.categories?.length || 0}`);
      
    } catch (error) {
      lastError = error as Error;
      const responseTime = Date.now() - startTime;
      
      console.error(`❌ Attempt ${attempt} failed after ${responseTime}ms:`, {
        attemptNumber: attempt,
        maxRetries: maxRetries,
        errorName: error.name,
        errorMessage: error.message,
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
        batchSize: descriptions.length,
        isNetworkError: error.message.includes('fetch'),
        isTimeoutError: error.message.includes('timeout'),
        isRateLimit: error.message.includes('429'),
        isServerError: error.message.includes('500') || error.message.includes('503'),
        stack: error.stack?.split('\n').slice(0, 3) // First 3 lines of stack trace
      });
      
      // Log specific retry strategy based on error type
      if (attempt < maxRetries) {
        const delay = 500 * Math.pow(2, attempt - 1);
        
        if (error.message.includes('429')) {
          console.log(`⏱️ Rate limit hit - waiting ${delay * 2}ms before retry (extended delay for rate limit)...`);
          await new Promise(resolve => setTimeout(resolve, delay * 2));
        } else if (error.message.includes('500') || error.message.includes('503')) {
          console.log(`⏱️ Server error - waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.log(`⏱️ Generic error - waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } else {
        console.error(`💀 All ${maxRetries} attempts failed. Final error:`, {
          finalError: error.message,
          totalTimeSpent: Date.now() - startTime,
          willFallbackToRules: true
        });
      }
    }
  }
  
  console.error(`🔥 BATCH COMPLETELY FAILED: All ${maxRetries} retry attempts exhausted`);
  console.error(`📋 Failed batch details:`, {
    batchSize: descriptions.length,
    sampleDescriptions: descriptions.slice(0, 3),
    finalError: lastError?.message || 'Unknown error',
    timestamp: new Date().toISOString(),
    willUseFallbackRules: true
  });
  
  throw lastError || new Error('All retry attempts failed');
}

// Single transaction categorization with correct priority order
export const categorizeTransactionAI = async (description: string, userId: string): Promise<string> => {
  console.log(`AI categorization for: "${description}"`);
  
  try {
    const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
      },
      body: JSON.stringify({ description, userId })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.category && categories.includes(data.category)) {
      console.log(`Categorized "${description}" -> ${data.category} (source: ${data.source})`);
      return data.category;
    }
    
  } catch (error) {
    console.warn(`AI categorization failed for "${description}":`, error);
  }
  
  console.log(`Using essential rules fallback for "${description}"`);
  return essentialBuiltInRules(description) || 'Uncategorized';
};

// Legacy function for backward compatibility
export const categorizeTransactionWithAI = async (description: string): Promise<string> => {
  try {
    const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
      },
      body: JSON.stringify({ description, userId: 'legacy-call' })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.category && categories.includes(data.category)) {
      return data.category;
    }
    
    throw new Error('Invalid category returned from AI');
  } catch (error) {
    console.warn(`Legacy AI categorization failed for "${description}":`, error);
    return essentialBuiltInRules(description) || 'Uncategorized';
  }
};

// Check if AI categorization is available
export const isAICategorizationAvailable = () => {
  return true;
};

// Debug function to test categorization on sample transactions
export const debugCategorization = async () => {
  const sampleTransactions = [
    "Direct Debit 408856 Linkt Sydney 613938075365",
    "Direct Debit 424700 NumeroPro Kidsof 85553268 PHBASC",
    "UBER *EATS HELP.UBER.C Sydney AU AUS Card xx9484",
    "Direct Credit 421520 NOVEL AQUATECH P Devesh salary",
    "WOOLWORTHS 1249 THORNLEIGH NSW AU Cash Out $200.00 Purchase $40.99",
    "Transfer To Maxxmattress CommBank App Cushion final payment"
  ];

  console.log('🧪 Testing categorization on sample transactions...');
  
  for (const description of sampleTransactions) {
    // Test comprehensive rules
    const ruleResult = comprehensiveAustralianRules(description);
    console.log(`📝 Rules: "${description}" -> ${ruleResult || 'UNCATEGORIZED'}`);
    
    // Test single AI categorization
    try {
      const aiResult = await categorizeTransactionAI(description, 'debug-user');
      console.log(`🤖 AI: "${description}" -> ${aiResult}`);
    } catch (error) {
      console.error(`❌ AI failed: "${description}" ->`, error.message);
    }
  }
};
