import { ChangeEvent, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { usePapaParse } from 'react-papaparse';
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categories } from "@/types/transaction-forms";
import { supabase } from "@/integrations/supabase/client";
import { categorizeTransactionsBatch } from "@/utils/aiCategorization";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import * as XLSX from 'xlsx';

interface ImportTransactionsProps {
  onSuccess?: () => void;
}

interface CSVRow {
  [key: string]: any;
}

// Date conversion function to handle various formats including Excel serial dates
const formatDateForSupabase = (dateValue: string | number): string => {
  if (!dateValue && dateValue !== 0) {
    return new Date().toISOString().split('T')[0];
  }

  try {
    console.log(`🗓️ Formatting date: "${dateValue}" (type: ${typeof dateValue})`);
    
    // Handle Excel serial dates (numbers)
    if (typeof dateValue === 'number' || (!isNaN(Number(dateValue)) && Number(dateValue) > 40000)) {
      const serialDate = Number(dateValue);
      if (serialDate > 40000 && serialDate < 60000) { // Reasonable range for Excel dates (2009-2164)
        // Excel serial date: days since 1900-01-01 (with leap year bug correction)
        // Excel incorrectly treats 1900 as a leap year, so we need to adjust
        const excelEpochCorrection = new Date(1899, 11, 30); // December 30, 1899
        const days = serialDate; // Excel serial dates are days since December 30, 1899
        const date = new Date(excelEpochCorrection.getTime() + days * 24 * 60 * 60 * 1000);
        const result = date.toISOString().split('T')[0];
        console.log(`🗓️ Excel serial date ${serialDate} -> ${result}`);
        return result;
      }
    }

    const dateString = String(dateValue).trim();
    
    // Handle DD/MM/YYYY format specifically (Australian/UK format)
    const ddmmyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = dateString.match(ddmmyyyyPattern);
    
    if (match) {
      const [, day, month, year] = match;
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      // Validate date components
      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
        // Create date in YYYY-MM-DD format for proper parsing
        const isoDateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log(`🗓️ Converted DD/MM/YYYY ${dateString} -> ${isoDateString}`);
        return isoDateString;
      }
    }
    
    // Handle YYYY-MM-DD format (ISO format)
    const isoPattern = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
    const isoMatch = dateString.match(isoPattern);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) {
        const result = date.toISOString().split('T')[0];
        console.log(`🗓️ ISO format ${dateString} -> ${result}`);
        return result;
      }
    }
    
    // Handle MM/DD/YYYY format (US format) as fallback
    const mmddyyyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const usMatch = dateString.match(mmddyyyyPattern);
    if (usMatch) {
      const [, month, day, year] = usMatch;
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      // Only accept if day is <= 12 (to avoid confusion with DD/MM)
      if (dayNum <= 12 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900) {
        const date = new Date(yearNum, monthNum - 1, dayNum);
        if (!isNaN(date.getTime())) {
          const result = date.toISOString().split('T')[0];
          console.log(`🗓️ US format ${dateString} -> ${result}`);
          return result;
        }
      }
    }
    
    // Fallback for other formats
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const result = date.toISOString().split('T')[0];
      console.log(`🗓️ Fallback conversion ${dateString} -> ${result}`);
      return result;
    }
    
    console.warn(`Invalid date format: ${dateValue}. Using current date.`);
    return new Date().toISOString().split('T')[0];
  } catch (error) {
    console.error("Error formatting date:", error);
    return new Date().toISOString().split('T')[0];
  }
};

const ImportTransactions = ({ onSuccess }: ImportTransactionsProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [headerMappings, setHeaderMappings] = useState<{ [key: string]: string }>({
    date: '',
    description: '',
    amount: '',
    currency: '',
  });
  const [isMappingHeaders, setIsMappingHeaders] = useState(false);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const { session } = useAuth();
  const { readString } = usePapaParse();
  const [uploading, setUploading] = useState(false);
  const [duplicateCheckEnabled, setDuplicateCheckEnabled] = useState(true);

  useEffect(() => {
    if (csvHeaders.length > 0) {
      const autoMappings = autoDetectHeaders(csvHeaders);
      setHeaderMappings(autoMappings);
    }
  }, [csvHeaders]);

  const onDrop = (acceptedFiles: File[]) => {
    setCsvFile(acceptedFiles[0]);
    setIsMappingHeaders(true);
    parseFile(acceptedFiles[0]);
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: { 
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      if (!csvText) {
        toast({
          title: "Error",
          description: "Could not read file content",
          variant: "destructive",
        });
        return;
      }

      readString(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const headers = (results.meta.fields || []).filter(h => h);
            if (headers.length > 0) {
              setPreviewData(results.data.slice(0, 5) as CSVRow[]);
              setCsvHeaders(headers);
            } else {
              toast({
                title: "Error parsing CSV",
                description: "Could not detect headers in the CSV file.",
                variant: "destructive",
              });
              setIsMappingHeaders(false);
            }
          } else {
            toast({
              title: "Error parsing CSV",
              description: "No data found in the CSV file.",
              variant: "destructive",
            });
            setIsMappingHeaders(false);
          }
        },
        error: (error) => {
          toast({
            title: "Error parsing CSV",
            description: error.message,
            variant: "destructive",
          });
          setIsMappingHeaders(false);
        },
      });
    };
    reader.readAsText(file);
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          toast({
            title: "Error",
            description: "Could not read Excel file content",
            variant: "destructive",
          });
          return;
        }

        console.log("📊 Parsing Excel file...");
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with raw values to handle dates properly
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: true,
          defval: ''
        }) as any[][];

        if (jsonData.length < 1) {
          toast({
            title: "Error parsing Excel",
            description: "Excel file appears to be empty.",
            variant: "destructive",
          });
          setIsMappingHeaders(false);
          return;
        }

        console.log("📊 Raw Excel data (first 3 rows):", jsonData.slice(0, 3));

        // Check if first row looks like headers or data
        const firstRow = jsonData[0];
        const hasProperHeaders = firstRow.every(cell => 
          typeof cell === 'string' && 
          cell.toString().toLowerCase().match(/(date|description|amount|transaction|balance|currency)/)
        );

        let headers: string[];
        let dataRows: CSVRow[];

        if (hasProperHeaders) {
          console.log("📋 Excel file has proper headers");
          // First row contains headers
          headers = firstRow.map(h => String(h).trim()).filter(h => h);
          
          // Convert data rows to objects
          dataRows = jsonData.slice(1).map(row => {
            const obj: CSVRow = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? row[index] : '';
            });
            return obj;
          }).filter(row => {
            return Object.values(row).some(value => value !== '' && value !== null && value !== undefined);
          });
        } else {
          console.log("📋 Excel file has NO headers - generating column names");
          // No proper headers, generate column names based on data analysis
          const numColumns = Math.max(...jsonData.map(row => row.length));
          headers = [];
          const usedNames = new Set<string>();
          
          for (let i = 0; i < numColumns; i++) {
            // Try to detect column type based on data
            const columnData = jsonData.slice(0, 5).map(row => row[i]).filter(cell => cell !== undefined && cell !== '');
            
            let headerName = `Column_${i + 1}`;
            
            if (columnData.length > 0) {
              const firstCell = columnData[0];
              const allCells = columnData.slice(0, 3); // Look at first 3 cells for pattern
              
              // Check if it looks like a date column (Excel serial dates)
              if (typeof firstCell === 'number' && firstCell > 40000 && firstCell < 60000) {
                headerName = usedNames.has('Date') ? `Date_${i + 1}` : 'Date';
                console.log(`📅 Column ${i}: Detected as Date (Excel serial: ${firstCell})`);
              }
              // Check if it looks like transaction amounts (small numbers, can be negative, usually < 10000)
              else if (typeof firstCell === 'number' && Math.abs(firstCell) <= 20000 && 
                       allCells.some(cell => typeof cell === 'number' && cell < 0)) {
                headerName = usedNames.has('Amount') ? `Amount_${i + 1}` : 'Amount';
                console.log(`💰 Column ${i}: Detected as Amount (transaction values with negatives)`);
              }
              // Check if it looks like a description (string)
              else if (typeof firstCell === 'string' && firstCell.length > 10) {
                headerName = usedNames.has('Description') ? `Description_${i + 1}` : 'Description';
                console.log(`📝 Column ${i}: Detected as Description (long text)`);
              }
              // Check if it looks like balance (large positive numbers, usually > 1000)
              else if (typeof firstCell === 'number' && firstCell > 1000 && 
                       allCells.every(cell => typeof cell === 'number' && cell > 0)) {
                headerName = usedNames.has('Balance') ? `Balance_${i + 1}` : 'Balance';
                console.log(`🏦 Column ${i}: Detected as Balance (large positive numbers)`);
              }
              else {
                console.log(`❓ Column ${i}: Unknown type, using generic name`);
              }
            }
            
            usedNames.add(headerName);
            headers.push(headerName);
          }
          
          // Convert all rows to objects (no header row to skip)
          dataRows = jsonData.map(row => {
            const obj: CSVRow = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? row[index] : '';
            });
            return obj;
          }).filter(row => {
            return Object.values(row).some(value => value !== '' && value !== null && value !== undefined);
          });
        }

        if (dataRows.length === 0) {
          toast({
            title: "Error parsing Excel",
            description: "No data rows found in the Excel file.",
            variant: "destructive",
          });
          setIsMappingHeaders(false);
          return;
        }

        console.log(`📊 Excel parsed: ${headers.length} headers, ${dataRows.length} data rows`);
        setPreviewData(dataRows.slice(0, 5));
        setCsvHeaders(headers);

      } catch (error) {
        console.error("Excel parsing error:", error);
        toast({
          title: "Error parsing Excel",
          description: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setIsMappingHeaders(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const parseFile = (file: File) => {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'csv') {
      console.log("📄 Parsing as CSV file");
      parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      console.log("📊 Parsing as Excel file");
      parseExcel(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload a CSV or Excel (.xlsx/.xls) file.",
        variant: "destructive",
      });
      setIsMappingHeaders(false);
    }
  };

  const autoDetectHeaders = (headers: string[]): { [key: string]: string } => {
    const mappings: { [key: string]: string } = {
      date: '',
      description: '',
      amount: '',
      currency: '',
    };

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();
      
      // Direct header matching (for auto-detected headers)
      if (lowerHeader === 'date') {
        mappings.date = header;
      } else if (lowerHeader === 'description') {
        mappings.description = header;
      } else if (lowerHeader === 'amount') {
        mappings.amount = header;
      } else if (lowerHeader === 'currency') {
        mappings.currency = header;
      }
      // Standard header detection (for proper CSV headers)
      else if (lowerHeader.includes('date') || (lowerHeader.includes('transaction') && lowerHeader.includes('date'))) {
        mappings.date = header;
      } else if (lowerHeader.includes('description') || lowerHeader.includes('memo') || lowerHeader.includes('detail')) {
        mappings.description = header;
      } else if (lowerHeader.includes('amount') || lowerHeader.includes('value') || lowerHeader.includes('debit') || lowerHeader.includes('credit')) {
        mappings.amount = header;
      } else if (lowerHeader.includes('currency') || lowerHeader.includes('ccy')) {
        mappings.currency = header;
      }
    });

    // Fallback: if no mappings found, try to find any reasonable columns
    if (!mappings.date || !mappings.description || !mappings.amount) {
      console.log("🔍 Fallback: Looking for any suitable columns");
      
      if (!mappings.date) {
        const dateCol = headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('column_1'));
        if (dateCol) {
          mappings.date = dateCol;
          console.log(`📅 Fallback date mapping: ${dateCol}`);
        }
      }
      
      if (!mappings.amount) {
        const amountCol = headers.find(h => h.toLowerCase().includes('amount') || h.toLowerCase().includes('column_2'));
        if (amountCol) {
          mappings.amount = amountCol;
          console.log(`💰 Fallback amount mapping: ${amountCol}`);
        }
      }
      
      if (!mappings.description) {
        const descCol = headers.find(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('column_3'));
        if (descCol) {
          mappings.description = descCol;
          console.log(`📝 Fallback description mapping: ${descCol}`);
        }
      }
    }

    console.log("🗂️ Auto-detected mappings:", mappings);
    return mappings;
  };

  const handleHeaderMappingChange = (header: string, field: string) => {
    setHeaderMappings(prev => ({ ...prev, [field]: header }));
  };

  const validateMappings = () => {
    const requiredFields = ['date', 'description', 'amount'];
    return requiredFields.every(field => headerMappings[field] !== '');
  };

  const handleUpload = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to upload transactions",
        variant: "destructive",
      });
      return;
    }

    if (!validateMappings()) {
      toast({
        title: "Mapping Error",
        description: "Please map all required headers (Date, Description, Amount)",
        variant: "destructive",
      });
      return;
    }

    if (!csvFile) {
      toast({
        title: "File Error",
        description: "No CSV file selected",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    const fileExtension = csvFile.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'csv') {
      // Handle CSV files
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvText = e.target?.result as string;
        if (!csvText) {
          toast({
            title: "Error",
            description: "Could not read file content",
            variant: "destructive",
          });
          setUploading(false);
          return;
        }

        readString(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            if (!results.data || results.data.length === 0) {
              toast({
                title: "Parse Error",
                description: "No data found in the CSV file.",
                variant: "destructive",
              });
              setUploading(false);
              return;
            }

            const transactions = results.data.map((row: any) => ({
              date: formatDateForSupabase(row[headerMappings.date]),
              description: row[headerMappings.description],
              amount: parseFloat(row[headerMappings.amount]),
              currency: row[headerMappings.currency] || 'AUD',
            })).filter(t => t.date && t.description && !isNaN(t.amount));

            if (transactions.length === 0) {
              toast({
                title: "Data Error",
                description: "No valid transactions found in the file.",
                variant: "destructive",
              });
              setUploading(false);
              return;
            }

            await handleTransactionsUploaded(transactions);
            setUploading(false);
          },
          error: (error) => {
            toast({
              title: "Error parsing CSV",
              description: error.message,
              variant: "destructive",
            });
            setUploading(false);
          },
        });
      };
      reader.readAsText(csvFile);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // Handle Excel files
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            toast({
              title: "Error",
              description: "Could not read Excel file content",
              variant: "destructive",
            });
            setUploading(false);
            return;
          }

          const workbook = XLSX.read(data, { type: 'array', cellDates: false });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: true,
            defval: ''
          }) as any[][];

          if (jsonData.length < 2) {
            toast({
              title: "Parse Error",
              description: "Excel file must have at least a header row and one data row.",
              variant: "destructive",
            });
            setUploading(false);
            return;
          }

          const headers = jsonData[0].map(h => String(h).trim()).filter(h => h);
          const dataRows = jsonData.slice(1).map(row => {
            const obj: CSVRow = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? row[index] : '';
            });
            return obj;
          }).filter(row => {
            return Object.values(row).some(value => value !== '' && value !== null && value !== undefined);
          });

          const transactions = dataRows.map((row: any) => ({
            date: formatDateForSupabase(row[headerMappings.date]),
            description: row[headerMappings.description],
            amount: parseFloat(row[headerMappings.amount]),
            currency: row[headerMappings.currency] || 'AUD',
          })).filter(t => t.date && t.description && !isNaN(t.amount));

          if (transactions.length === 0) {
            toast({
              title: "Data Error",
              description: "No valid transactions found in the Excel file.",
              variant: "destructive",
            });
            setUploading(false);
            return;
          }

          await handleTransactionsUploaded(transactions);
          setUploading(false);
        } catch (error) {
          console.error("Excel upload error:", error);
          toast({
            title: "Error parsing Excel",
            description: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive",
          });
          setUploading(false);
        }
      };
      reader.readAsArrayBuffer(csvFile);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload a CSV or Excel (.xlsx/.xls) file.",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  const handleTransactionsUploaded = async (transactions: any[]) => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please log in to upload transactions",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`Processing ${transactions.length} uploaded transactions`);

      const descriptions = transactions.map(t => t.description);
      console.log("Starting batch categorization for uploaded transactions");
      
      const categories = await categorizeTransactionsBatch(descriptions, session.user.id);
      console.log("Batch categorization completed");

      const transactionsWithCategories = transactions.map((transaction, index) => ({
        ...transaction,
        category: categories[index],
        user_id: session.user.id,
        account_id: null, 
      }));

      console.log(`Processing transactions with duplicate checking: ${transactionsWithCategories.length}`);

      let result;
      if (duplicateCheckEnabled) {
        const { insertTransactionsWithDuplicateCheck } = await import('@/components/transaction-forms/csv-upload/helpers/transactionInsertion');
        result = await insertTransactionsWithDuplicateCheck(transactionsWithCategories);
      } else {
        const { error: insertError } = await supabase
          .from('transactions')
          .insert(transactionsWithCategories);

        if (insertError) {
          throw insertError;
        }

        result = { inserted: transactionsWithCategories.length, duplicates: 0 };
      }

      console.log(`Successfully processed transactions: ${result.inserted} new, ${result.duplicates} duplicates skipped`);

      if (result.inserted > 0) {
        toast({
          title: "Success",
          description: `Successfully uploaded ${result.inserted} transactions${result.duplicates > 0 ? ` (${result.duplicates} skipped)` : ''}`,
        });
      } else if (result.duplicates > 0) {
        toast({
          title: "Info",
          description: `All ${result.duplicates} transactions were duplicates and skipped`,
        });
      } else {
        toast({
          title: "Error",
          description: "No transactions were uploaded",
          variant: "destructive",
        });
      }

      console.log("Calling onSuccess callback to close dialog");
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error uploading transactions:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload transactions",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className="border-2 border-dashed rounded-md p-6 cursor-pointer bg-muted hover:bg-accent transition-colors">
        <input {...getInputProps()} />
        <div className="text-center">
          <p className="text-muted-foreground">
            Drag 'n' drop a CSV or Excel file here, or click to select files
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Supports CSV, Excel (.xlsx/.xls) files. Date formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, and Excel serial dates.
          </p>
        </div>
      </div>

      {isMappingHeaders && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Map File Headers</h3>
            <p className="text-sm text-muted-foreground">
              Please map the columns from your file to the corresponding fields. Date formats supported: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, and Excel serial dates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'date')} value={headerMappings.date}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'description')} value={headerMappings.description}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Select onValueChange={(value) => handleHeaderMappingChange(value, 'amount')} value={headerMappings.amount}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select header" />
                </SelectTrigger>
                <SelectContent>
                  {csvHeaders.map((header) => (
                    <SelectItem key={header} value={header}>{header}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="duplicateCheck"
              checked={duplicateCheckEnabled}
              onChange={(e) => setDuplicateCheckEnabled(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="duplicateCheck">Enable intelligent duplicate detection</Label>
          </div>

          {duplicateCheckEnabled && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Duplicate detection is enabled. Transactions with the same description, amount, and date will be automatically skipped.
                Similar transactions (80%+ similarity) will also be detected and skipped.
              </AlertDescription>
            </Alert>
          )}

          {previewData.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Preview (first 5 rows)</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-border rounded-md">
                  <thead>
                    <tr className="border-b bg-muted">
                      {csvHeaders.map((header) => (
                        <th key={header} className="text-left p-2 text-sm font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b">
                        {csvHeaders.map((header) => (
                          <td key={header} className="p-2 text-sm">
                            {String(row[header])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsMappingHeaders(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !validateMappings()}
            >
              {uploading ? "Uploading..." : "Upload Transactions"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportTransactions;
