
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
  
  // Try different date formats
  const formats = [
    // DD/MM/YYYY or DD-MM-YYYY
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // MM/DD/YYYY or MM-DD-YYYY  
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
    // YYYY/MM/DD
    /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/
  ];

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
  
  const cleanAmount = amountStr.trim().replace(/"/g, '').replace(/,/g, '');
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

export const parseCSV = (content: string): ParseResult => {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];

  if (lines.length < 2) {
    errors.push({
      row: 0,
      field: 'file',
      value: 'empty',
      message: 'CSV file appears to be empty or has no data rows'
    });
    return { transactions, errors };
  }

  // Skip header row and process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fields = parseCsvLine(line);
    
    if (fields.length < 3) {
      errors.push({
        row: i + 1,
        field: 'line',
        value: line,
        message: 'Insufficient columns. Expected at least: Date, Description, Amount'
      });
      continue;
    }

    const [date, description, amount, currency] = fields;
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
    if (parsedDate && description.trim() && parsedAmount !== null) {
      transactions.push({
        description: description.trim(),
        amount: parsedAmount.toString(),
        category: 'other', // Default category
        date: parsedDate,
        currency: currency?.trim() || 'USD' // Default currency
      });
    }
  }

  return { transactions, errors };
};
