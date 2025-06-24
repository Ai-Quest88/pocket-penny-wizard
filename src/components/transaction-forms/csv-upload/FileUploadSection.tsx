import React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download } from "lucide-react"
import * as Papa from 'papaparse'

interface FileUploadSectionProps {
  onFileUpload: (data: any[], fileHeaders: string[]) => void
  isProcessing: boolean
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  onFileUpload,
  isProcessing
}) => {
  const downloadTemplate = () => {
    const template = 'Date,Amount,Description,Category,Currency\n2024-01-01,-50.00,Coffee Shop,Food & Dining,AUD\n2024-01-02,2000.00,Salary,Income,AUD'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transaction_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Function to detect column types based on data patterns
  const detectColumnTypes = (data: string[][]): string[] => {
    if (data.length === 0) return [];
    
    const numColumns = data[0].length;
    const columnTypes: string[] = [];
    
    // Analyze each column
    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
      const columnValues = data.slice(0, Math.min(5, data.length)).map(row => row[colIndex] || '');
      const columnType = detectColumnType(columnValues);
      columnTypes.push(columnType);
    }
    
    console.log('Detected column types:', columnTypes);
    return columnTypes;
  };

  // Function to detect what type of data a column contains
  const detectColumnType = (values: string[]): string => {
    const nonEmptyValues = values.filter(v => v && v.trim());
    if (nonEmptyValues.length === 0) return 'Unknown';
    
    let dateCount = 0;
    let amountCount = 0;
    let currencyCount = 0;
    
    for (const value of nonEmptyValues) {
      const trimmed = value.trim();
      
      // Check if it looks like a date
      if (isDateLike(trimmed)) {
        dateCount++;
      }
      
      // Check if it looks like an amount/number
      if (isAmountLike(trimmed)) {
        amountCount++;
      }
      
      // Check if it looks like a currency code
      if (isCurrencyLike(trimmed)) {
        currencyCount++;
      }
    }
    
    const total = nonEmptyValues.length;
    
    // If 80% or more values match a pattern, consider it that type
    if (dateCount / total >= 0.8) return 'Date';
    if (amountCount / total >= 0.8) return 'Amount';
    if (currencyCount / total >= 0.8) return 'Currency';
    
    // Default to description for text columns
    return 'Description';
  };

  // Helper functions to detect data patterns
  const isDateLike = (value: string): boolean => {
    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{1,2}-\d{1,2}$/,        // YYYY-MM-DD
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,      // MM/DD/YYYY or DD/MM/YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/,        // MM-DD-YYYY or DD-MM-YYYY
      /^\d{1,2}\.\d{1,2}\.\d{4}$/,      // MM.DD.YYYY or DD.MM.YYYY
    ];
    
    return datePatterns.some(pattern => pattern.test(value)) || !isNaN(Date.parse(value));
  };

  const isAmountLike = (value: string): boolean => {
    // Remove common currency symbols and whitespace
    const cleaned = value.replace(/[$£€¥₹,\s]/g, '');
    
    // Check if it's a valid number (including negative)
    return /^-?\d+(\.\d{1,2})?$/.test(cleaned) && !isNaN(parseFloat(cleaned));
  };

  const isCurrencyLike = (value: string): boolean => {
    // Common currency codes
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR'];
    return currencies.includes(value.toUpperCase());
  };

  // Function to create smart column names based on detected types
  const createSmartHeaders = (columnTypes: string[]): string[] => {
    const typeCount: { [key: string]: number } = {};
    
    return columnTypes.map(type => {
      typeCount[type] = (typeCount[type] || 0) + 1;
      
      // If it's the first occurrence, use the simple name
      if (typeCount[type] === 1) {
        return type;
      } else {
        // If multiple columns of same type, add a number
        return `${type} ${typeCount[type]}`;
      }
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download CSV Template
        </Button>
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
