export interface ParsedTransaction {
  description: string;
  amount: string;
  category: string;
  date: string;
  currency: string;
  account?: string;
  comment?: string;
  balance?: string;
}

export interface ParseError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface ParseResult {
  success: boolean;
  transactions?: ParsedTransaction[];
  errors?: ParseError[];
  headers?: string[];
  preview?: Record<string, string>[];
  autoMappings?: Record<string, string>;
  totalRows?: number;
  error?: string;
}

const parseDate = (dateStr: string): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const cleanDate = dateStr.trim().replace(/"/g, '');
  
  // Try YYYY-MM-DD format first (ISO format) - prioritize this format
  const isoMatch = cleanDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    // Validate the date components
    if (yearNum >= 1900 && monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      const date = new Date(yearNum, monthNum - 1, dayNum);
      // Double check the date is valid (handles leap years, month lengths)
      if (date.getFullYear() === yearNum && date.getMonth() === monthNum - 1 && date.getDate() === dayNum) {
        return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      }
    }
  }

  // Try DD/MM/YYYY format (Australian/UK format)
  const ddmmyyyyMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    // Validate the date components
    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
      const date = new Date(yearNum, monthNum - 1, dayNum);
      // Double check the date is valid (handles leap years, month lengths)
      if (date.getFullYear() === yearNum && date.getMonth() === monthNum - 1 && date.getDate() === dayNum) {
        return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      }
    }
  }

  // Try MM/DD/YYYY format (US format) as last resort
  const mmddyyyyMatch = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    // Only accept if day is <= 12 (to avoid confusion with DD/MM)
    if (dayNum <= 12 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
      const date = new Date(yearNum, monthNum - 1, dayNum);
      if (date.getFullYear() === yearNum && date.getMonth() === monthNum - 1 && date.getDate() === dayNum) {
        return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
      }
    }
  }

  return null;
};

const parseAmount = (amountStr: string): string | null => {
  if (!amountStr || amountStr.trim() === '') return null;
  
  // Remove quotes, commas, extra spaces, and any currency symbols
  const cleanAmount = amountStr.trim().replace(/[",+\s]/g, '');
  const amount = parseFloat(cleanAmount);
  
  return isNaN(amount) ? null : cleanAmount;
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
    // Look for Australian indicators
    { pattern: /\bAUS\b/i, currency: 'AUD' },
    { pattern: /\bAUSTRALIA\b/i, currency: 'AUD' },
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

const detectHeadersInternal = (firstRow: string[]): boolean => {
  // Check if first row contains common header patterns
  const headerPatterns = [
    /^date$/i, /^transaction\s*date$/i, /^posting\s*date$/i,
    /^amount$/i, /^debit$/i, /^credit$/i, /^value$/i,
    /^description$/i, /^narrative$/i, /^details$/i, /^memo$/i,
    /^category$/i, /^type$/i,
    /^account$/i, /^currency$/i
  ];
  
  // If any field matches header patterns and no field looks like actual data
  const hasHeaderPattern = firstRow.some(field => 
    headerPatterns.some(pattern => pattern.test(field.trim()))
  );
  
  // Check if first row contains actual transaction data (dates, amounts)
  const hasDataPattern = firstRow.some(field => {
    const trimmed = field.trim();
    // Check for date patterns
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) return true;
    // Check for amount patterns
    if (/^[+-]?\d+\.?\d*$/.test(trimmed.replace(/[,\s]/g, ''))) return true;
    return false;
  });
  
  // If we have header patterns and no data patterns, it's likely headers
  // If we have no clear header patterns but also no clear data patterns, assume headers
  // This makes the detection more permissive
  return hasHeaderPattern || (!hasHeaderPattern && !hasDataPattern && firstRow.length >= 3);
};

const analyzeColumnContent = (data: string[][], columnIndex: number): { isDate: boolean; isAmount: boolean; isText: boolean } => {
  let dateCount = 0;
  let amountCount = 0;
  let textCount = 0;
  
  // Sample first 10 rows to determine column type
  const sampleSize = Math.min(10, data.length);
  
  console.info(`Analyzing column ${columnIndex} content:`, data.slice(0, Math.min(3, data.length)).map(row => row[columnIndex]));
  
  for (let i = 0; i < sampleSize; i++) {
    const value = data[i][columnIndex]?.toString().trim();
    if (!value) continue;
    
    // Check if it's a date
    const datePatterns = [
      /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,  // MM/DD/YYYY or DD/MM/YYYY
      /^\d{1,2}-\d{1,2}-\d{2,4}$/,   // MM-DD-YYYY or DD-MM-YYYY
      /^\d{4}-\d{1,2}-\d{1,2}$/,     // YYYY-MM-DD
      /^\d{1,2}\s+\w+\s+\d{4}$/,     // DD MMM YYYY
    ];
    
    const isDatePattern = datePatterns.some(pattern => pattern.test(value));
    const isDateParseable = !isNaN(Date.parse(value));
    
    if (isDatePattern || isDateParseable) {
      dateCount++;
      console.info(`  "${value}" -> DATE (pattern: ${isDatePattern}, parseable: ${isDateParseable})`);
    }
    
    // Check if it's an amount (number, possibly with currency symbols)
    const cleanedValue = value.replace(/[$,£€¥₹\s]/g, '');
    if (/^-?\d+\.?\d*$/.test(cleanedValue) && !isNaN(parseFloat(cleanedValue))) {
      amountCount++;
      console.info(`  "${value}" -> AMOUNT`);
    }
    
    // Check if it's primarily text (contains letters, but exclude date-like patterns)
    const isDateLike = datePatterns.some(pattern => pattern.test(value)) || !isNaN(Date.parse(value));
    if (value.length > 3 && /[a-zA-Z]/.test(value) && !isDateLike) {
      textCount++;
      console.info(`  "${value}" -> TEXT`);
    }
  }
  
  return {
    isDate: dateCount >= sampleSize * 0.7,
    isAmount: amountCount >= sampleSize * 0.7,
    isText: textCount >= sampleSize * 0.5
  };
};

export const autoMapColumns = (headers: string[], data: string[][] = []): Record<string, string> => {
  const mapping: Record<string, string> = {};
  
  console.info('AutoMapColumns - headers:', headers);
  console.info('AutoMapColumns - data sample:', data.slice(0, 3));
  
  // Analyze each column's content to determine its type
  const columnAnalysis: { [key: string]: { isDate: boolean; isAmount: boolean; isText: boolean } } = {};
  
  headers.forEach((header, index) => {
    const contentAnalysis = data.length > 0 ? analyzeColumnContent(data, index) : { isDate: false, isAmount: false, isText: false };
    columnAnalysis[header] = contentAnalysis;
    console.info(`Column "${header}" analysis:`, contentAnalysis);
  });
  
  // Create a mapping that assigns proper field names based on content analysis
  // This will map the CSV headers to the correct transaction fields
  
  // Find the column that actually contains dates
  const dateColumn = headers.find(header => columnAnalysis[header].isDate);
  if (dateColumn) {
    mapping.date = dateColumn;
    console.info(`  -> Mapped "${dateColumn}" as DATE (content contains dates)`);
  }
  
  // Find the column that actually contains amounts
  const amountColumn = headers.find(header => columnAnalysis[header].isAmount);
  if (amountColumn) {
    mapping.amount = amountColumn;
    console.info(`  -> Mapped "${amountColumn}" as AMOUNT (content contains numbers)`);
  }
  
  // Find the best column for description (prefer actual text content over header names)
  const descriptionColumn = headers.find(header => 
    header !== mapping.date && 
    header !== mapping.amount &&
    (columnAnalysis[header].isText || header.toLowerCase().includes('description'))
  );
  
  if (descriptionColumn) {
    mapping.description = descriptionColumn;
    console.info(`  -> Mapped "${descriptionColumn}" as DESCRIPTION (text content or description header)`);
  }
  
  // Fallback mapping if content analysis didn't find clear matches
  if (!mapping.date) {
    const dateHeader = headers.find(h => /^date$/i.test(h.toLowerCase().trim()));
    if (dateHeader) {
      mapping.date = dateHeader;
      console.info(`  -> Mapped "${dateHeader}" as DATE (header name fallback)`);
    }
  }
  
  if (!mapping.amount) {
    const amountHeader = headers.find(h => /^amount$/i.test(h.toLowerCase().trim()));
    if (amountHeader) {
      mapping.amount = amountHeader;
      console.info(`  -> Mapped "${amountHeader}" as AMOUNT (header name fallback)`);
    }
  }
  
  if (!mapping.description) {
    const remainingHeaders = headers.filter(h => h !== mapping.date && h !== mapping.amount);
    if (remainingHeaders.length > 0) {
      mapping.description = remainingHeaders[0];
      console.info(`  -> Mapped "${remainingHeaders[0]}" as DESCRIPTION (fallback)`);
    }
  }
  
  console.info('Final mapping result:', mapping);
  return mapping;
};

const detectCsvFormat = (fields: string[], content: string): 'format1' | 'format2' | 'format3' | 'unknown' => {
  // Check for your specific format: Date,Amount,Description,Balance
  if (fields.length >= 4) {
    const firstField = fields[0].trim();
    const secondField = fields[1].trim();
    
    // Check if first field looks like a date (d/m/yyyy)
    const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    // Check if second field looks like an amount (number with optional spaces)
    const amountPattern = /^\s*\d+\.?\d*\s*$/;
    
    if (datePattern.test(firstField) && amountPattern.test(secondField)) {
      return 'format3'; // Your format: Date, Amount, Description, Balance
    }
    
    // Fallback to existing format detection
    if (/^[+-]?\d+\.?\d*$/.test(secondField.replace(/\s/g, ''))) {
      return 'format2'; // Date, Amount, Description, Balance
    }
  }
  
  if (fields.length >= 3) {
    return 'format1'; // Date, Description, Amount, Currency
  }
  
  return 'unknown';
};

const parseCSVInternal = (content: string): ParseResult => {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const transactions: ParsedTransaction[] = [];
  const errors: ParseError[] = [];

  if (lines.length === 0) {
    return {
      success: false,
      error: 'File appears to be empty'
    };
  }

  // Detect currency from content - default to AUD for Australian data
  const detectedCurrency = detectCurrency(content) || 'AUD';

  // Parse first row to check for headers
  const firstRowFields = parseCsvLine(lines[0]);
  const hasHeaders = detectHeadersInternal(firstRowFields);
  let autoMappedColumns: Record<string, string> = {};
  
  // Always provide headers for the UI - either detected headers or generic column names
  let headers = hasHeaders ? firstRowFields : firstRowFields.map((_, index) => `Column ${index + 1}`);
  
  let startIndex = 0;
  if (hasHeaders) {
    startIndex = 1;
    // Get data rows for content analysis
    const dataRows = lines.slice(1, Math.min(11, lines.length)).map(line => parseCsvLine(line));
    autoMappedColumns = autoMapColumns(firstRowFields, dataRows);
    console.log('Auto-mapped columns:', autoMappedColumns);
    
    // Rename headers based on content analysis - only rename if header doesn't already describe the content
    const updatedHeaders = [...headers];
    headers.forEach((header, index) => {
      const contentAnalysis = analyzeColumnContent(dataRows, index);
      const headerLower = header.toLowerCase().trim();
      
      // Only rename if the header name doesn't already match what the content contains
      if (contentAnalysis.isDate && !headerLower.includes('date')) {
        updatedHeaders[index] = 'Date';
        console.log(`Renamed header "${header}" to "Date" based on content`);
      } else if (contentAnalysis.isAmount && !headerLower.includes('amount') && !headerLower.includes('debit') && !headerLower.includes('credit')) {
        updatedHeaders[index] = 'Amount';
        console.log(`Renamed header "${header}" to "Amount" based on content`);
      } else if (contentAnalysis.isText && !headerLower.includes('description') && !headerLower.includes('memo') && !headerLower.includes('details') && !headerLower.includes('narrative')) {
        updatedHeaders[index] = 'Description';
        console.log(`Renamed header "${header}" to "Description" based on content`);
      }
    });
    
    headers = updatedHeaders;
    console.log('Updated headers based on content:', headers);
  } else {
    // If no headers detected, analyze first rows to auto-detect column types
    const dataRows = lines.slice(0, Math.min(10, lines.length)).map(line => parseCsvLine(line));
    autoMappedColumns = autoMapColumns(headers, dataRows);
    console.log('Auto-mapped columns (no headers):', autoMappedColumns);
  }
  
  // Calculate total number of data rows
  const totalDataRows = lines.length - startIndex;
  
  // Generate preview data
  const preview: Record<string, string>[] = [];
  const previewLines = lines.slice(startIndex, startIndex + 5); // Show first 5 data rows
  
  for (const line of previewLines) {
    const fields = parseCsvLine(line);
    const previewRow: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      previewRow[header] = fields[index] || '';
    });
    
    preview.push(previewRow);
  }
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const fields = parseCsvLine(line);
    
    if (fields.length < 3) {
      errors.push({
        row: i + 1,
        field: 'line',
        value: line,
        message: 'Insufficient columns. Expected at least: Date, Amount, Description'
      });
      continue;
    }

    let date: string, description: string, amount: string, currency: string;

    // Use auto-mapped columns if available
    if (hasHeaders && Object.keys(autoMappedColumns).length >= 3) {
      const dateIndex = firstRowFields.indexOf(autoMappedColumns.date);
      const amountIndex = firstRowFields.indexOf(autoMappedColumns.amount);
      const descriptionIndex = firstRowFields.indexOf(autoMappedColumns.description);
      
      date = dateIndex >= 0 ? fields[dateIndex] || '' : fields[0] || '';
      amount = amountIndex >= 0 ? fields[amountIndex] || '' : fields[1] || '';
      description = descriptionIndex >= 0 ? fields[descriptionIndex] || '' : fields[2] || '';
      currency = detectedCurrency;
    } else {
      // Fall back to format detection
      const format = detectCsvFormat(fields, content);
      
      if (format === 'format3' || format === 'format2') {
        // Format: Date, Amount, Description (removed balance)
        [date, amount, description] = fields;
        currency = detectedCurrency;
      } else if (format === 'format1') {
        // Original format: Date, Description, Amount, Currency
        [date, description, amount, currency = detectedCurrency] = fields;
      } else {
        errors.push({
          row: i + 1,
          field: 'format',
          value: line,
          message: 'Unable to detect file format'
        });
        continue;
      }
    }

    const parsedDate = parseDate(date);
    const parsedAmount = parseAmount(amount);

    // Validate required fields
    if (!parsedDate) {
      errors.push({
        row: i + 1,
        field: 'date',
        value: date,
        message: 'Invalid date format. Expected DD/MM/YYYY, YYYY-MM-DD, or MM/DD/YYYY'
      });
    }

    if (!description || description.trim() === '') {
      errors.push({
        row: i + 1,
        field: 'description',
        value: description || '',
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

    // Only add transaction if date and description are valid (amount can be missing)
    if (parsedDate && description && description.trim()) {
      transactions.push({
        description: description.trim().replace(/"/g, ''),
        amount: parsedAmount || '', // Empty string if amount is missing
        category: 'other',
        date: parsedDate,
        currency: currency?.trim() || detectedCurrency,
        account: undefined,
        comment: undefined
      });
    }
  }

  return { 
    success: errors.length === 0 || transactions.length > 0,
    transactions, 
    errors, 
    headers: headers,
    preview,
    autoMappings: autoMappedColumns,
    totalRows: totalDataRows,
    error: errors.length > 0 && transactions.length === 0 ? errors.map(e => e.message).join(', ') : undefined
  };
};

export const parseCsvFile = async (
  file: File,
  mapping?: Record<string, string>,
  defaults?: { defaultCurrency: string; defaultAccount: string }
): Promise<ParseResult> => {
  try {
    let content: string;
    
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Handle Excel files
      const arrayBuffer = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      content = XLSX.utils.sheet_to_csv(worksheet);
    } else {
      // Handle CSV files
      content = await file.text();
    }
    
    const result = parseCSVInternal(content);
    
    // If mapping is provided, apply it to transform the data
    if (mapping && result.success && result.transactions) {
      // Transform transactions based on mapping
      // This would need additional implementation based on specific requirements
    }
    
    return result;
  } catch (err) {
    console.error('Error parsing file:', err);
    return {
      success: false,
      error: 'Error reading file. Please ensure it is a valid CSV or Excel file.'
    };
  }
};

// Keep legacy export for compatibility
export const parseCSVFile = parseCsvFile;

export const parseExcelFile = async (
  file: File,
  mapping: Record<string, string>,
  defaultCurrency: string,
  defaultAccount: string
): Promise<Array<{
  date: string;
  amount: number;
  description: string;
  category: string;
  currency: string;
  account: string;
}>> => {
  const arrayBuffer = await file.arrayBuffer();
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to CSV format and reuse existing CSV parsing logic
  const csvString = XLSX.utils.sheet_to_csv(worksheet);
  const result = parseCSVInternal(csvString);
  
  if (result.errors.length > 0) {
    throw new Error(`Excel parsing errors: ${result.errors.map(e => e.message).join(', ')}`);
  }
  
  return result.transactions.map(tx => ({
    date: tx.date,
    amount: parseFloat(tx.amount),
    description: tx.description,
    category: tx.category,
    currency: tx.currency || defaultCurrency,
    account: defaultAccount || 'Default Account'
  }));
};

// Test-compatible functions for the test suite
export const detectHeaders = (headers: string[]): { date: string | null; description: string | null; amount: string | null; currency: string | null } => {
  const result = { date: null, description: null, amount: null, currency: null };
  
  // First pass: look for exact matches (case insensitive)
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    
    // Exact matches take priority
    if (lowerHeader === 'date' && !result.date) {
      result.date = header;
    } else if (lowerHeader === 'description' && !result.description) {
      result.description = header;
    } else if (lowerHeader === 'amount' && !result.amount) {
      result.amount = header;
    } else if (lowerHeader === 'currency' && !result.currency) {
      result.currency = header;
    }
  });
  
  // Second pass: look for partial matches if exact matches not found
  headers.forEach(header => {
    const lowerHeader = header.toLowerCase().trim();
    
    // Date detection (partial matches)
    if (!result.date && (/transaction.*date/i.test(lowerHeader) || /posting.*date/i.test(lowerHeader))) {
      result.date = header;
    }
    // Description detection (partial matches)
    else if (!result.description && (/^narrative$/i.test(lowerHeader) || /^details$/i.test(lowerHeader) || /^memo$/i.test(lowerHeader))) {
      result.description = header;
    }
    // Amount detection (partial matches)
    else if (!result.amount && (/^debit$/i.test(lowerHeader) || /^credit$/i.test(lowerHeader) || /^value$/i.test(lowerHeader))) {
      result.amount = header;
    }
  });
  
  return result;
};

export const mapHeaders = (headers: string[]): { date: string | null; description: string | null; amount: string | null; currency: string | null } => {
  return detectHeaders(headers);
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateTransactionData = (transaction: { Date?: string; Description?: string; Amount?: string; Currency?: string; date?: string; description?: string; amount?: string; currency?: string }): ValidationResult => {
  const errors: string[] = [];
  
  // Handle both uppercase and lowercase property names
  const date = transaction.Date || transaction.date;
  const description = transaction.Description || transaction.description;
  const amount = transaction.Amount || transaction.amount;
  const currency = transaction.Currency || transaction.currency;
  
  // Validate date
  if (!date || date.trim() === '') {
    errors.push('Date is required');
  } else {
    const parsedDate = parseDate(date);
    if (!parsedDate) {
      errors.push('Invalid date format');
    }
  }
  
  // Validate description
  if (!description || description.trim() === '') {
    errors.push('Description is required');
  }
  
  // Validate amount
  if (!amount || amount.trim() === '') {
    errors.push('Amount is required');
  } else {
    const parsedAmount = parseAmount(amount);
    if (parsedAmount === null) {
      errors.push('Invalid amount format');
    }
  }
  
  // Validate currency (optional)
  if (currency && currency.trim() !== '') {
    const validCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF', 'CNY'];
    if (!validCurrencies.includes(currency.toUpperCase())) {
      errors.push('Invalid currency code');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Override parseCSV to return array directly for tests
export const parseCSV = (content: string): any[] => {
  const result = parseCSVInternal(content);
  
  if (!result.success || !result.transactions) {
    return [];
  }
  
  // Convert ParsedTransaction[] to the format expected by tests
  return result.transactions.map(tx => ({
    Date: tx.date,
    Description: tx.description,
    Amount: tx.amount === '' ? undefined : tx.amount
  }));
};

