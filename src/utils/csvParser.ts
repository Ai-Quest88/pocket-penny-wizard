
export interface ParsedTransaction {
  description: string;
  amount: string;
  category: string;
  date: string;
  currency: string;
}

export interface ParseError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  errors: ParseError[];
  detectedCurrency?: string;
}

const parseDate = (dateStr: string): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const cleanDate = dateStr.trim().replace(/"/g, '');
  
  // Try YYYY-MM-DD format first (ISO format)
  const isoMatch = cleanDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Try DD/MM/YYYY format (European format)
  const euroMatch = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (euroMatch) {
    const [, day, month, year] = euroMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime()) && parseInt(day) <= 31 && parseInt(month) <= 12) {
      return date.toISOString().split('T')[0];
    }
  }

  // Try MM/DD/YYYY format (US format) as fallback
  const usMatch = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime()) && parseInt(day) <= 31 && parseInt(month) <= 12) {
      return date.toISOString().split('T')[0];
    }
  }

  return null;
};

const parseAmount = (amountStr: string): number | null => {
  if (!amountStr || amountStr.trim() === '') return null;
  
  // Remove quotes, commas, and any currency symbols
  const cleanAmount = amountStr.trim().replace(/[",+]/g, '');
  const amount = parseFloat(cleanAmount);
  
  return isNaN(amount) ? null : amount;
};

const detectCurrency = (content: string): string | null => {
  const lines = content.split('\n').slice(0, 10); // Check first 10 lines
  
  // Currency symbols and codes to look for
  const currencyPatterns = [
    { pattern: /\$/, currency: 'USD' },
    { pattern: /€/, currency: 'EUR' },
    { pattern: /£/, currency: 'GBP' },
    { pattern: /¥/, currency: 'JPY' },
    { pattern: /\bUSD\b/i, currency: 'USD' },
    { pattern: /\bEUR\b/i, currency: 'EUR' },
    { pattern: /\bGBP\b/i, currency: 'GBP' },
    { pattern: /\bAUD\b/i, currency: 'AUD' },
    { pattern: /\bCAD\b/i, currency: 'CAD' },
    { pattern: /\bJPY\b/i, currency: 'JPY' },
  ];

  for (const line of lines) {
    for (const { pattern, currency } of currencyPatterns) {
      if (pattern.test(line)) {
        return currency;
      }
    }
  }

  return null;
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

const detectCsvFormat = (fields: string[]): 'format1' | 'format2' | 'unknown' => {
  if (fields.length >= 4) {
    const secondField = fields[1].trim().replace(/"/g, '');
    if (/^[+-]?\d+\.?\d*$/.test(secondField)) {
      return 'format2'; // Date, Amount, Description, Balance
    }
  }
  
  if (fields.length >= 3) {
    return 'format1'; // Date, Description, Amount, Currency
  }
  
  return 'unknown';
};

export const parseCSV = (content: string): ParseResult => {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];

  if (lines.length === 0) {
    errors.push({
      row: 0,
      field: 'file',
      value: 'empty',
      message: 'CSV file appears to be empty'
    });
    return { transactions, errors };
  }

  // Detect currency from CSV content
  const detectedCurrency = detectCurrency(content);

  const startIndex = 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const fields = parseCsvLine(line);
    
    if (fields.length < 3) {
      errors.push({
        row: i + 1,
        field: 'line',
        value: line,
        message: 'Insufficient columns. Expected at least: Date, Amount/Description, Description/Amount'
      });
      continue;
    }

    const format = detectCsvFormat(fields);
    let date: string, description: string, amount: string, currency: string;

    if (format === 'format2') {
      // User's format: Date, Amount, Description, Balance
      [date, amount, description] = fields;
      currency = detectedCurrency || 'AUD'; // Default to AUD for Australian bank format
    } else if (format === 'format1') {
      // Original format: Date, Description, Amount, Currency
      [date, description, amount, currency = detectedCurrency || 'USD'] = fields;
    } else {
      errors.push({
        row: i + 1,
        field: 'format',
        value: line,
        message: 'Unable to detect CSV format'
      });
      continue;
    }

    const parsedDate = parseDate(date);
    const parsedAmount = parseAmount(amount);

    // Validate required fields
    if (!parsedDate) {
      errors.push({
        row: i + 1,
        field: 'date',
        value: date,
        message: 'Invalid date format. Expected DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD'
      });
    }

    if (!description || description.trim() === '') {
      errors.push({
        row: i + 1,
        field: 'description',
        value: description,
        message: 'Description is required'
      });
    }

    if (parsedAmount === null) {
      errors.push({
        row: i + 1,
        field: 'amount',
        value: amount,
        message: 'Invalid amount format. Expected a number'
      });
    }

    // Only add transaction if all required fields are valid
    if (parsedDate && description && description.trim() && parsedAmount !== null) {
      transactions.push({
        description: description.trim().replace(/"/g, ''),
        amount: parsedAmount.toString(),
        category: 'other',
        date: parsedDate,
        currency: currency?.trim() || detectedCurrency || 'USD'
      });
    }
  }

  return { transactions, errors, detectedCurrency };
};
