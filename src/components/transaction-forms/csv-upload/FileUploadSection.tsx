import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"
import * as Papa from 'papaparse'
import * as XLSX from 'xlsx'

interface FileUploadSectionProps {
  onFileUpload: (data: any[], fileHeaders: string[]) => void
  isProcessing: boolean
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onFileUpload,
  isProcessing
}) => {
  const downloadTemplate = () => {
    const template = 'Date,Amount,Description,Category,Currency\n01/01/2024,-50.00,Coffee Shop,Food & Dining,AUD\n02/01/2024,2000.00,Salary,Income,AUD'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transaction_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadExcelTemplate = () => {
    // Create sample data with DD/MM/YYYY format
    const templateData = [
      ['Date', 'Amount', 'Description', 'Category', 'Currency'],
      ['01/01/2024', -50.00, 'Coffee Shop', 'Food & Dining', 'AUD'],
      ['02/01/2024', 2000.00, 'Salary', 'Income', 'AUD'],
      ['03/01/2024', -25.50, 'Gas Station', 'Transportation', 'AUD'],
      ['04/01/2024', -120.00, 'Grocery Store', 'Food & Dining', 'AUD']
    ]

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(templateData)
    
    // Add some formatting - make headers bold (if supported)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:E1')
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!worksheet[cellAddress]) continue
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E2E8F0' } }
      }
    }
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 12 }, // Date
      { width: 10 }, // Amount
      { width: 20 }, // Description
      { width: 15 }, // Category
      { width: 10 }  // Currency
    ]
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')
    
    // Save the file
    XLSX.writeFile(workbook, 'transaction_template.xlsx')
  }

  // Helper function to convert Excel serial number to DD/MM/YYYY format
  const convertExcelDateToDDMMYYYY = (excelDate: number): string => {
    try {
      console.log('Converting Excel date serial', excelDate, 'to DD/MM/YYYY');
      
      // XLSX library already handles the conversion
      const date = XLSX.SSF.parse_date_code(excelDate);
      
      // Format as DD/MM/YYYY
      const day = date.d.toString().padStart(2, '0');
      const month = date.m.toString().padStart(2, '0');
      const year = date.y;
      
      const result = `${day}/${month}/${year}`;
      console.log('Converted to:', result);
      
      return result;
    } catch (error) {
      try {
        // Fallback method if XLSX.SSF fails
        console.log('Fallback Excel date conversion for', excelDate);
        
        // Excel starts counting from January 1, 1900
        // Excel has a leap year bug where it counts 1900 as a leap year
        let adjustedDate = excelDate;
        if (adjustedDate > 59) {
          // Subtract 1 to account for Excel's leap year bug (1900 wasn't actually a leap year)
          adjustedDate -= 1;
        }
        
        // Convert to milliseconds
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        const excelEpoch = new Date(Date.UTC(1900, 0, 1)); // Jan 1, 1900 in UTC
        
        // Add days to the epoch date
        const jsDate = new Date(excelEpoch.getTime() + (adjustedDate - 1) * millisecondsPerDay);
        
        // Format as DD/MM/YYYY
        const day = jsDate.getUTCDate().toString().padStart(2, '0');
        const month = (jsDate.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = jsDate.getUTCFullYear();
        
        const result = `${day}/${month}/${year}`;
        console.log('Fallback converted to:', result);
        
        return result;
      } catch (fallbackError) {
        console.error('Error in fallback date conversion:', fallbackError);
        return String(excelDate);
      }
    }
  };

  // Function to detect column types based on data patterns with validation
  const detectColumnTypes = (data: string[][]): string[] => {
    if (data.length === 0) return [];
    
    const numColumns = data[0].length;
    const columnTypes: string[] = [];
    let dateColumnFound = false;
    let amountColumnFound = false;
    
    // Debug the input data
    console.log('Data for column type detection:', JSON.stringify(data.slice(0, 3)));
    
    // Analyze each column and assign names based on CONTENT, not original headers
    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
      // Get values for this column from multiple rows for better detection
      const columnValues = data.slice(0, Math.min(10, data.length)).map(row => {
        const value = row[colIndex];
        console.log(`Column ${colIndex} value:`, value, typeof value);
        return value;
      });
      
      let columnName = detectColumnType(columnValues);
      console.log(`Column ${colIndex} will be named:`, columnName);
      
      // Track what we've found to avoid duplicates
      if (columnName === 'Date') {
        dateColumnFound = true;
      } else if (columnName === 'Amount') {
        amountColumnFound = true;
      }
      
      columnTypes.push(columnName);
    }
    
    console.log('Final detected column names:', columnTypes);
    return columnTypes;
  };

  // Function to detect what type of data a column contains
  const detectColumnType = (values: string[]): string => {
    const nonEmptyValues = values.filter(v => v && v.toString().trim() !== '');
    if (nonEmptyValues.length === 0) return 'Description';
    
    let dateCount = 0;
    let amountCount = 0;
    let currencyCount = 0;
    let excelDateCount = 0;
    
    for (const value of nonEmptyValues) {
      const trimmed = value.toString().trim();
      const numValue = parseFloat(trimmed);
      
      // Check for Excel serial dates (typically 5-digit numbers between 40000-50000 for recent years)
      if (!isNaN(numValue) && numValue >= 40000 && numValue <= 50000 && Number.isInteger(numValue)) {
        excelDateCount++;
      }
      // Check if it looks like a regular date string
      else if (isDateLike(trimmed)) {
        dateCount++;
      }
      // Check if it looks like an amount/number (including negative values)
      else if (isAmountLike(trimmed)) {
        amountCount++;
      }
      // Check if it looks like a currency code
      else if (isCurrencyLike(trimmed)) {
        currencyCount++;
      }
    }
    
    const total = nonEmptyValues.length;
    
    // Prioritize Excel serial dates for date detection (must be high confidence)
    if (excelDateCount / total >= 0.8) return 'Date';
    // Regular date strings
    if (dateCount / total >= 0.8) return 'Date';
    // Amount detection (including negative numbers)
    if (amountCount / total >= 0.7) return 'Amount';
    // Currency detection
    if (currencyCount / total >= 0.8) return 'Currency';
    
    // Default to description for text columns
    return 'Description';
  };

  // Helper functions to detect data patterns
  const isDateLike = (value: string): boolean => {
    // Only accept strict date patterns - no ambiguous formats
    const strictDatePatterns = [
      /^\d{4}-\d{1,2}-\d{1,2}$/,        // YYYY-MM-DD
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,      // DD/MM/YYYY or MM/DD/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/,        // DD-MM-YYYY or MM-DD-YYYY
      /^\d{1,2}\.\d{1,2}\.\d{4}$/,      // DD.MM.YYYY or MM.DD.YYYY
    ];
    
    // Must match a strict pattern AND be parseable as date
    if (!strictDatePatterns.some(pattern => pattern.test(value))) {
      return false;
    }
    
    // Additional validation - must be a reasonable date
    const parsedDate = new Date(value);
    if (isNaN(parsedDate.getTime())) return false;
    
    // Should be between reasonable years (1900-2100)
    const year = parsedDate.getFullYear();
    return year >= 1900 && year <= 2100;
  };

  const isAmountLike = (value: string): boolean => {
    // Remove common currency symbols, whitespace, and thousand separators
    const cleaned = value.replace(/[$£€¥₹,\s]/g, '');
    
    // Check if it's a valid number (including negative, with optional decimals)
    // Allow for more decimal places and handle various formats
    const numberPattern = /^-?\d+(\.\d+)?$/;
    return numberPattern.test(cleaned) && !isNaN(parseFloat(cleaned));
  };

  const isCurrencyLike = (value: string): boolean => {
    // Common currency codes
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];
    return currencies.includes(value.toUpperCase());
  };

  // Function to create smart column names based on detected types
  const createSmartHeaders = (columnTypes: string[]): string[] => {
    // Use the detected column types directly as headers - no duplicates or Notes creation
    return columnTypes.map((type, index) => {
      // Use the detected content type as the header name
      return type;
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileExtension = file.name.toLowerCase().split('.').pop()
    console.log('File extension:', fileExtension)

    if (fileExtension === 'csv') {
      handleCSVFile(file)
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      handleExcelFile(file)
    } else {
      console.error('Unsupported file format:', fileExtension)
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)')
    }
  }

  const handleCSVFile = (file: File) => {
    Papa.parse(file, {
      header: false, // Parse without headers first to detect if headers exist
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const firstRow = results.data[0] as string[];
          console.log('First row:', firstRow);
          
          // Try to detect if first row contains headers or data
          const hasHeaders = detectHeaders(firstRow);
          console.log('Has headers:', hasHeaders);
          
          let headers: string[];
          let data: any[];
          
          if (hasHeaders) {
            // Parse again with headers
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (headerResults) => {
                headers = headerResults.meta.fields || [];
                data = headerResults.data;
                console.log('CSV with headers parsed:', { headers, dataLength: data.length });
                onFileUpload(data, headers);
              }
            });
          } else {
            // No headers detected, analyze data patterns to create smart headers
            const rawData = results.data as string[][];
            const columnTypes = detectColumnTypes(rawData);
            headers = createSmartHeaders(columnTypes);
            
            // Convert array data to object format
            data = rawData.map(row => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = row[index] || '';
              });
              return obj;
            });
            
            console.log('CSV without headers parsed with smart detection:', { 
              headers, 
              columnTypes, 
              dataLength: data.length 
            });
            onFileUpload(data, headers);
          }
        } else {
          console.error('No data found in CSV file');
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
      }
    });
  }

  const handleExcelFile = (file: File) => {
    console.log('Starting Excel file processing for:', file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        console.log('Workbook loaded, sheet names:', workbook.SheetNames);
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        console.log('Excel file loaded, sheet name:', sheetName);
        
        // Convert to array of arrays first to detect headers
        const rawData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, // Returns array of arrays
          defval: '', // Default value for empty cells
          blankrows: false // Skip blank rows
        }) as any[][];
        
        console.log('Raw Excel data:', rawData);
        console.log('First few rows:', rawData.slice(0, 3));
        
        if (rawData.length === 0) {
          console.error('No data found in Excel file');
          alert('No data found in the Excel file');
          return;
        }
        
        const firstRow = rawData[0];
        console.log('First row for header detection:', firstRow);
        
        // Convert first row to strings for header detection
        const firstRowStrings = firstRow.map(cell => String(cell || '').trim());
        const hasHeaders = detectHeaders(firstRowStrings);
        console.log('Excel has headers:', hasHeaders);
        
        let headers: string[];
        let finalData: any[];
        
        if (hasHeaders) {
          // Use first row as headers
          headers = firstRowStrings;
          
          // Convert remaining rows to objects
          finalData = rawData.slice(1).map((row, rowIndex) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              let cellValue = row[index];
              
              // Handle Excel date serial numbers - convert to original format and preserve it
              if (typeof cellValue === 'number' && cellValue > 40000 && cellValue < 50000) {
                const dateString = convertExcelDateToDDMMYYYY(cellValue);
                console.log(`🔍 Header path: Converting Excel date ${cellValue} -> ${dateString}`);
                cellValue = dateString;
              }
              
              obj[header] = cellValue || '';
              
              // Extra debugging for date columns
              if (String(header).toLowerCase().includes('date')) {
                console.log(`⚠️ Header path: Date column "${header}" value set to:`, obj[header]);
              }
            });
            return obj;
          });
        } else {
          // No headers detected, analyze data patterns to create smart headers
          // First, convert Excel serial dates to proper date strings
          const processedRows: any[][] = [];
          
          for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
            const row = rawData[rowIndex];
            const processedRow: any[] = [];
            
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
              let cellValue = row[colIndex];
              
              // Handle Excel date serial numbers - convert to original format
              if (typeof cellValue === 'number' && cellValue > 40000 && cellValue < 50000) {
                const formattedDate = convertExcelDateToDDMMYYYY(cellValue);
                console.log(`Converting row ${rowIndex} col ${colIndex} Excel date ${cellValue} -> ${formattedDate}`);
                processedRow.push(formattedDate);
              } else {
                processedRow.push(cellValue);
              }
            }
            
            processedRows.push(processedRow);
          }
          
          // Now detect column types from the processed data
          const stringData = processedRows.map(row => 
            row.map(cell => String(cell || ''))
          );
          
          const columnTypes = detectColumnTypes(stringData);
          headers = createSmartHeaders(columnTypes);
          
          // Convert all rows to objects using smart headers
          finalData = processedRows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
        }
        
        console.log('Excel file parsed successfully:', { 
          headers, 
          dataLength: finalData.length,
          sampleData: finalData.slice(0, 3)
        });
        
        // Additional debug for the actual values being passed
        console.log('FINAL DATA BEING PASSED TO PREVIEW:');
        console.log('Headers:', headers);
        console.log('Sample final data objects:', JSON.stringify(finalData.slice(0, 2), null, 2));
        
        onFileUpload(finalData, headers);
        
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert(`Error reading Excel file: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure it's a valid Excel file.`);
      }
    };
    
    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      alert('Error reading the file. Please try again.');
    };
    
    reader.readAsArrayBuffer(file);
  }

  const detectHeaders = (firstRow: string[]): boolean => {
    const headerKeywords = ['date', 'description', 'amount', 'currency', 'memo', 'transaction', 'value', 'debit', 'credit'];
    
    return firstRow.some(cell => {
      if (!cell || typeof cell !== 'string') return false;
      const lowerCell = cell.toLowerCase().trim();
      return headerKeywords.some(keyword => lowerCell.includes(keyword));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="file-upload">Select File</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            CSV Template
          </Button>
          <Button variant="outline" size="sm" onClick={downloadExcelTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Excel Template
          </Button>
        </div>
      </div>
      
      <Input
        id="file-upload"
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        disabled={isProcessing}
      />
      <p className="text-sm text-muted-foreground">
        Supported formats: CSV (.csv), Excel (.xlsx), Excel 97-2003 (.xls)
      </p>
    </div>
  )
}