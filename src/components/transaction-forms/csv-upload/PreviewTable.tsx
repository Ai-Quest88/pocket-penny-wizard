import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PreviewTableProps {
  data: any[];
  mappings: {
    description: string;
    amount: string;
    date: string;
    currency: string;
  };
  defaultSettings: {
    description: string;
    currency: string;
    category: string;
  };
  selectedAccount?: {
    id: string;
    name: string;
    type: string;
    accountType: 'asset' | 'liability';
  } | null;
}

export const PreviewTable = ({ data, mappings, defaultSettings, selectedAccount }: PreviewTableProps) => {
  const previewData = data.slice(0, 5);

  // Debug what's in the data
  console.log('Preview data - full first row:', previewData[0]);
  console.log('Preview data - all keys in first row:', previewData[0] ? Object.keys(previewData[0]) : 'no data');
  console.log('Mappings:', mappings);
  console.log('Date mapping value:', mappings.date);
  console.log('Date field in first row:', previewData[0] ? previewData[0][mappings.date] : 'no date field');

  const getValue = (row: any, mapping: string, defaultValue: string) => {
    const value = row[mapping] || defaultValue || 'Not set';
    console.log(`Getting value for mapping "${mapping}": ${value}`);
    return value;
  };

  // Special formatter for dates to preserve exact format from source
  const getDateValue = (row: any, dateMapping: string) => {
    console.log('getDateValue called with:', { dateMapping, rowKeys: Object.keys(row) });
    
    if (!dateMapping || !row[dateMapping]) {
      console.log('No date mapping or value, using current date');
      return new Date().toLocaleDateString();
    }
    
    // Get the raw date value directly from the row without formatting
    const rawDateValue = row[dateMapping];
    console.log('Raw date value from row:', rawDateValue, 'type:', typeof rawDateValue);
    
    // If it's already a string, it's likely been pre-formatted correctly
    if (typeof rawDateValue === 'string') {
      console.log('Date is string, returning as-is:', rawDateValue);
      return rawDateValue;
    }
    
    // Fallback to simple display
    const result = String(rawDateValue);
    console.log('Date converted to string:', result);
    return result;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview (first 5 rows)</h3>
        {selectedAccount && (
          <div className="text-sm text-muted-foreground">
            Will be linked to: <span className="font-medium">{selectedAccount.name}</span>
          </div>
        )}
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Account</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{getValue(row, mappings.description, defaultSettings.description)}</TableCell>
                <TableCell>{getValue(row, mappings.amount, '0')}</TableCell>
                <TableCell>{getDateValue(row, mappings.date)}</TableCell>
                <TableCell>{getValue(row, mappings.currency, defaultSettings.currency)}</TableCell>
                <TableCell>
                  {selectedAccount ? (
                    <span className="text-sm text-muted-foreground">
                      {selectedAccount.name}
                    </span>
                  ) : (
                    <span className="text-sm text-red-500">No account</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {data.length > 5 && (
        <p className="text-sm text-muted-foreground">
          ... and {data.length - 5} more transactions
        </p>
      )}
    </div>
  );
};