
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
  { key: 'currency', label: 'Currency' },
  { key: 'category', label: 'Category' },
];

export const ColumnMappingSection = ({ 
  headers, 
  mappings, 
  onMappingChange 
}: ColumnMappingSectionProps) => {
  // Filter out any invalid headers
  const validHeaders = headers.filter(header => 
    header && 
    typeof header === 'string' && 
    header.trim() !== "" &&
    header !== null &&
    header !== undefined &&
    header.length > 0
  );

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
                <SelectItem value="">None</SelectItem>
                {validHeaders.map(header => {
                  // Final safety check - absolutely no empty values allowed
                  if (!header || header.trim() === "" || header === null || header === undefined || header.length === 0) {
                    console.error("Skipping invalid header:", header);
                    return null;
                  }
                  return (
                    <SelectItem key={header} value={header}>
                      {header}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
};
