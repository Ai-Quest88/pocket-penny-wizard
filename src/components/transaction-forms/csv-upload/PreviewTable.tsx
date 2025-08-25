import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategoryHierarchy } from "@/hooks/useCategoryHierarchy";
import { useCategories } from "@/hooks/useCategories";

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
  const { predictCategoryHierarchy } = useCategoryHierarchy();
  const { categoryData } = useCategories();

  // Helper to get category hierarchy from actual categorized data
  const getCategoryHierarchy = (description: string) => {
    if (!categoryData) return predictCategoryHierarchy(description);
    
    // Search through all categories to find matching merchant patterns (2-tier)
    for (const groupArray of Object.values(categoryData)) {
      for (const group of groupArray) {
        for (const category of group.categories || []) {
          if (category.merchant_patterns) {
            for (const pattern of category.merchant_patterns) {
              if (description.toLowerCase().includes(pattern.toLowerCase()) || 
                  pattern.toLowerCase().includes(description.toLowerCase())) {
                return `${group.name} → ${category.name}`;
              }
            }
          }
        }
      }
    }
    
    return predictCategoryHierarchy(description);
  };

  // Debug information
  console.log('PreviewTable RECEIVED DATA:', { 
    dataLength: previewData.length,
    firstRowKeys: previewData.length > 0 ? Object.keys(previewData[0]) : [],
    mappings
  });
  
  console.log('PreviewTable SELECTED ACCOUNT:', selectedAccount);
  
  if (previewData.length > 0 && mappings.date) {
    console.log('DATE VALUES IN PREVIEW:');
    previewData.forEach((row, idx) => {
      console.log(`Row ${idx} date:`, row[mappings.date]);
    });
  }

  // Helper function to safely get a value with fallback
  const getValue = (row: any, field: string, defaultValue: string = 'Not set') => {
    // If no mapping, return default
    if (!field) return defaultValue;
    
    // Check if field exists in row
    const value = row[field];
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    
    return value;
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Description</TableHead>
                <TableHead className="min-w-[80px]">Amount</TableHead>
                <TableHead className="min-w-[100px]">Date</TableHead>
                <TableHead className="min-w-[80px]">Currency</TableHead>
                <TableHead className="min-w-[200px]">Predicted Category</TableHead>
                <TableHead className="min-w-[120px]">Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewData.map((row, index) => {
                const description = getValue(row, mappings.description, defaultSettings.description);
                const categoryHierarchy = getCategoryHierarchy(description);
                
                return (
                  <TableRow key={index}>
                    <TableCell className="max-w-[200px] truncate" title={description}>
                      {description}
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate text-right">
                      {getValue(row, mappings.amount, '0')}
                    </TableCell>
                    <TableCell className="font-mono max-w-[120px] truncate">
                      {getValue(row, mappings.date, '')}
                    </TableCell>
                    <TableCell className="max-w-[80px] truncate">
                      {getValue(row, mappings.currency, defaultSettings.currency)}
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate" title={categoryHierarchy}>
                      <span className="text-sm text-muted-foreground italic">
                        {categoryHierarchy}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {selectedAccount ? (
                        <span className="text-sm text-muted-foreground" title={selectedAccount.name}>
                          {selectedAccount.name}
                        </span>
                      ) : (
                        <span className="text-sm text-red-500">No account</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {data.length > 5 && (
        <p className="text-sm text-muted-foreground">
          ... and {data.length - 5} more transactions
        </p>
      )}
    </div>
  );
};