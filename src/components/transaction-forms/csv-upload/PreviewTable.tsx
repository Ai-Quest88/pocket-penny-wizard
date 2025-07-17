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

  const getValue = (row: any, mapping: string, defaultValue: string) => {
    return row[mapping] || defaultValue || 'Not set';
  };

  // Special formatter for dates - keep the original format in the preview
  const getDateValue = (row: any, dateMapping: string) => {
    if (!dateMapping || !row[dateMapping]) {
      return new Date().toLocaleDateString();
    }
    
    // Return the original date value as is for preview (don't convert format)
    return row[dateMapping];
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
