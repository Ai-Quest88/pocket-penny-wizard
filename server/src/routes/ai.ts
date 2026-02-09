import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// POST /api/ai/compile-knowledge — Stub for user knowledge compilation
router.post('/compile-knowledge', async (req: AuthRequest, res: Response) => {
  // MVP: no-op stub — real implementation would re-analyze user patterns
  return res.json({ success: true, message: 'Knowledge compilation scheduled' });
});

// POST /api/ai/extract-transactions — Extract transactions from CSV text
router.post('/extract-transactions', async (req: AuthRequest, res: Response) => {
  try {
    const { csvText, testMode } = req.body;

    if (testMode) {
      return res.json({ success: true, message: 'AI CSV extraction ready' });
    }

    if (!csvText || typeof csvText !== 'string') {
      return res.status(400).json({ error: 'csvText is required' });
    }

    // If no Gemini key, use simple CSV parser fallback
    if (!GEMINI_API_KEY) {
      const transactions = parseCSVLocally(csvText);
      return res.json({
        transactions,
        success: true,
        rawCount: csvText.trim().split('\n').length - 1,
        extractedCount: transactions.length,
      });
    }

    // Use Gemini AI
    const result = await extractWithGemini(csvText);
    return res.json(result);
  } catch (err: any) {
    console.error('Extract transactions error:', err);
    return res.status(500).json({ transactions: [], success: false, error: err.message });
  }
});

// POST /api/ai/categorize — Categorize transactions
// Accepts either {transactions: [{description, amount?, date?}]} or {descriptions: [...], batchMode: true}
router.post('/categorize', async (req: AuthRequest, res: Response) => {
  try {
    let txList: any[];
    const { transactions, descriptions, batchMode, userContext } = req.body;

    // Support both request shapes for backward compatibility
    if (Array.isArray(transactions)) {
      txList = transactions;
    } else if (batchMode && Array.isArray(descriptions)) {
      txList = descriptions.map((d: string) => ({ description: d }));
    } else {
      return res.status(400).json({ error: 'transactions array or descriptions array required' });
    }

    if (!GEMINI_API_KEY) {
      // Fallback: keyword-based categorization
      const categorized = txList.map((tx: any) => ({
        category: categorizeByKeywords(tx.description || tx),
        confidence: 0.7,
        source: 'system_keywords',
        group_name: 'Expenses',
        is_new_category: false,
      }));
      return res.json(categorized);
    }

    // Use Gemini for categorization, passing user context if available
    const categorized = await categorizeWithGemini(txList, userContext);
    return res.json(categorized);
  } catch (err: any) {
    console.error('Categorize error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Simple CSV parser fallback (no AI needed)
function parseCSVLocally(csvText: string) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  const transactions: any[] = [];

  // Find column indices
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const descIdx = headers.findIndex(h => h.includes('description') || h.includes('memo') || h.includes('narrative') || h.includes('details'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('value'));
  const creditIdx = headers.findIndex(h => h.includes('credit'));
  const debitIdx = headers.findIndex(h => h.includes('debit'));

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const dateStr = dateIdx >= 0 ? values[dateIdx]?.trim() : '';
    const description = descIdx >= 0 ? values[descIdx]?.trim() : values[1]?.trim() || '';
    let amount = 0;

    if (amountIdx >= 0) {
      amount = parseFloat(values[amountIdx]?.replace(/[^-\d.]/g, '') || '0');
    } else if (creditIdx >= 0 && debitIdx >= 0) {
      const credit = parseFloat(values[creditIdx]?.replace(/[^-\d.]/g, '') || '0');
      const debit = parseFloat(values[debitIdx]?.replace(/[^-\d.]/g, '') || '0');
      amount = credit > 0 ? credit : -debit;
    }

    if (!description || isNaN(amount)) continue;

    // Parse date
    const date = parseDate(dateStr);

    transactions.push({
      date,
      description,
      amount,
      type: amount >= 0 ? 'income' : 'expense',
    });
  }

  return transactions;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  // DD/MM/YYYY
  const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    return `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  // Try native parse
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

  return new Date().toISOString().split('T')[0];
}

function categorizeByKeywords(description: string): string {
  const desc = description.toLowerCase();
  const rules: [string[], string][] = [
    [['woolworths', 'coles', 'aldi', 'iga', 'grocery', 'supermarket'], 'Groceries'],
    [['restaurant', 'cafe', 'coffee', 'mcdonald', 'kfc', 'pizza', 'uber eats', 'doordash'], 'Food & Dining'],
    [['salary', 'wages', 'payroll', 'income', 'bonus'], 'Salary'],
    [['netflix', 'spotify', 'disney', 'subscription', 'youtube'], 'Subscriptions'],
    [['uber', 'lyft', 'taxi', 'toll', 'linkt', 'opal', 'myki', 'petrol', 'fuel', 'shell', 'bp'], 'Transportation'],
    [['electricity', 'gas', 'water', 'telstra', 'optus', 'vodafone', 'internet', 'nbn'], 'Bills & Utilities'],
    [['pharmacy', 'chemist', 'doctor', 'medical', 'health'], 'Healthcare'],
    [['bunnings', 'ikea', 'kmart', 'target', 'big w', 'shop'], 'Shopping'],
    [['transfer', 'tfr', 'xfer'], 'Transfer'],
    [['rent', 'mortgage', 'home loan'], 'Housing'],
    [['insurance'], 'Insurance'],
    [['interest'], 'Interest'],
    [['atm', 'cash'], 'Cash'],
  ];

  for (const [keywords, category] of rules) {
    if (keywords.some(k => desc.includes(k))) return category;
  }
  return 'Uncategorized';
}

async function extractWithGemini(csvText: string) {
  const lines = csvText.trim().split('\n');
  const rawCount = lines.length - 1;
  const chunks = chunkCSV(csvText, 50);
  const allTransactions: any[] = [];

  for (const chunk of chunks) {
    const transactions = await processChunkWithGemini(chunk);
    allTransactions.push(...transactions);
  }

  return {
    transactions: allTransactions,
    success: true,
    rawCount,
    extractedCount: allTransactions.length,
  };
}

function chunkCSV(csvText: string, rowsPerChunk: number): string[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];
  const header = lines[0];
  const dataLines = lines.slice(1);
  const chunks: string[] = [];
  for (let i = 0; i < dataLines.length; i += rowsPerChunk) {
    chunks.push([header, ...dataLines.slice(i, i + rowsPerChunk)].join('\n'));
  }
  return chunks;
}

async function processChunkWithGemini(csvChunk: string) {
  const prompt = `You are a CSV transaction extraction AI. Extract transactions from this CSV data and return them as a JSON array.

RULES:
1. Detect the date format automatically and convert to YYYY-MM-DD
2. Combine credit/debit into single amount (negative for expenses)
3. Clean descriptions
4. Determine type: expense, income, or transfer
5. Remove currency symbols, return amounts as numbers

CSV DATA:
${csvChunk}

Return ONLY a valid JSON array: [{"date":"2024-01-15","description":"...","amount":-85.50,"type":"expense"}]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    }
  );

  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  const data = await response.json();
  let content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed)
      ? parsed.filter((tx: any) => tx.date && tx.description && typeof tx.amount === 'number')
      : [];
  } catch {
    return [];
  }
}

async function categorizeWithGemini(transactions: any[], userContext?: any) {
  const descriptions = transactions.map((t: any) => t.description || t).join('\n');

  // Build context section if user has existing categories
  let contextSection = '';
  if (userContext?.mostUsedCategories?.length) {
    contextSection = `\nThe user already has these categories: ${userContext.mostUsedCategories.join(', ')}. Prefer mapping to these existing categories when appropriate.\n`;
  }

  const prompt = `You are a financial transaction categorizer. Categorize each transaction description into a financial category.
${contextSection}
For each transaction, determine:
- category: a concise category name (e.g. "Groceries", "Food & Dining", "Salary", "Transportation")
- confidence: 0.0 to 1.0 how confident you are
- group_name: one of "Income", "Expenses", or "Transfer"
- is_new_category: true if this doesn't match common financial categories

Transaction descriptions (one per line):
${descriptions}

Return ONLY a valid JSON array with exactly one object per transaction:
[{"category":"Food & Dining","confidence":0.9,"group_name":"Expenses","source":"ai","is_new_category":false}]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
    const data = await response.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(content);
  } catch (err) {
    console.error('Gemini categorization failed, falling back to keywords:', err);
    // Fallback to keyword-based
    return transactions.map((tx: any) => ({
      category: categorizeByKeywords(tx.description || tx),
      confidence: 0.7,
      source: 'system_keywords',
      group_name: 'Expenses',
      is_new_category: false,
    }));
  }
}

export default router;
