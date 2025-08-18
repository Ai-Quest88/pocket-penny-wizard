import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ColumnMappingSectionProps {
  headers: string[];
  mappings: Record<string, string>;
  onMappingChange: (field: string, header: string) => void;
}

const requiredFields = [
  { key: 'description', label: 'Description *' },
  { key: 'amount', label: 'Amount *' },
  { key: 'date', label: 'Date *' },
];

export const ColumnMappingSection = ({ 
  headers, 
  mappings, 
  onMappingChange 
}: ColumnMappingSectionProps) => {
  // Enhanced filtering to ensure absolutely no empty values and remove duplicates
  const validHeaders = headers
    .filter(header => {
      const isValid = header && 
        typeof header === 'string' && 
        header.trim().length > 0 &&
        header !== null &&
        header !== undefined;
      
      if (!isValid) {
        console.warn("Filtering out invalid header:", header);
      }
      
      return isValid;
    })
    .map(header => header.trim()) // Ensure no whitespace issues
    .filter(header => header.length > 0) // Final check after trimming
    .reduce((unique: string[], header: string, index: number) => {
      // Create unique headers by appending index if duplicate
      const baseHeader = header;
      let uniqueHeader = baseHeader;
      let counter = 1;
      
      while (unique.includes(uniqueHeader)) {
        uniqueHeader = `${baseHeader} ${counter}`;
        counter++;
      }
      
      unique.push(uniqueHeader);
      return unique;
    }, []);

  console.log("ColumnMappingSection - validHeaders:", validHeaders);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Map CSV Columns</h3>
        <p className="text-sm text-muted-foreground">
          Map your CSV columns to the transaction fields. Fields marked with * are required.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requiredFields.map(field => (
          <div key={field.key} className="space-y-2">
            <Label>{field.label}</Label>
            <Select 
              value={mappings[field.key] || ""} 
              onValueChange={(value) => onMappingChange(field.key, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {validHeaders.map((header, index) => (
                  <SelectItem key={`${header}-${index}`} value={header}>
                    {header}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
};
