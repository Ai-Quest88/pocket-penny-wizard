
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

  // Try DD/MM/YYYY format (European format) - this matches your data
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
  // Format 1: Date, Description, Amount, Currency (original expected format)
  // Format 2: Date, Amount, Description, Balance (user's format)
  
  if (fields.length >= 4) {
    // Check if second field looks like an amount (starts with + or - and contains numbers)
    const secondField = fields[1].trim().replace(/"/g, '');
    if (/^[+-]?\d+\.?\d*$/.test(secondField)) {
      return 'format2'; // User's format: Date, Amount, Description, Balance
    }
  }
  
  if (fields.length >= 3) {
    return 'format1'; // Original format: Date, Description, Amount, Currency
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

  // Process each line (no header expected for the user's format)
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
      currency = 'AUD'; // Default currency for Australian bank format
    } else if (format === 'format1') {
      // Original format: Date, Description, Amount, Currency
      [date, description, amount, currency = 'USD'] = fields;
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
        category: 'other', // Default category
        date: parsedDate,
        currency: currency?.trim() || 'AUD'
      });
    }
  }

  return { transactions, errors };
};
