import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit2, Save, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EditablePreviewTableProps {
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
  onDataChange: (updatedData: any[]) => void;
}

interface EditingState {
  rowIndex: number;
  field: string;
  value: string;
}

export const EditablePreviewTable = ({ 
  data, 
  mappings, 
  defaultSettings, 
  selectedAccount, 
  onDataChange 
}: EditablePreviewTableProps) => {
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [localData, setLocalData] = useState(data);

  // Helper function to safely get a value with fallback
  const getValue = (row: any, field: string, defaultValue: string = 'Not set') => {
    if (!field) return defaultValue;
    const value = row[field];
    if (value === undefined || value === null || value === '') {
      return defaultValue;
    }
    return value;
  };

  const startEdit = (rowIndex: number, field: string) => {
    const currentValue = getValue(localData[rowIndex], mappings[field as keyof typeof mappings] || field, '');
    setEditingState({ rowIndex, field, value: String(currentValue) });
  };

  const saveEdit = () => {
    if (!editingState) return;
    
    const updatedData = [...localData];
    const fieldMapping = mappings[editingState.field as keyof typeof mappings];
    
    if (fieldMapping) {
      updatedData[editingState.rowIndex] = {
        ...updatedData[editingState.rowIndex],
        [fieldMapping]: editingState.value
      };
    }
    
    setLocalData(updatedData);
    onDataChange(updatedData);
    setEditingState(null);
  };

  const cancelEdit = () => {
    setEditingState(null);
  };

  const renderEditableCell = (row: any, rowIndex: number, field: string, value: string) => {
    const isEditing = editingState?.rowIndex === rowIndex && editingState?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingState.value}
            onChange={(e) => setEditingState({ ...editingState, value: e.target.value })}
            className="h-8 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
          />
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={saveEdit} className="h-6 w-6 p-0">
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between group">
        <span className="truncate">{value}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => startEdit(rowIndex, field)}
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    );
  };

  const currencyOptions = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Preview & Edit Transactions</h3>
        {selectedAccount && (
          <div className="text-sm text-muted-foreground">
            Will be linked to: <span className="font-medium">{selectedAccount.name}</span>
          </div>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground">
        <Badge variant="outline" className="mr-2">
          <Edit2 className="h-3 w-3 mr-1" />
          Tip
        </Badge>
        Hover over any cell to edit it before uploading
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
            {localData.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="max-w-xs">
                  {renderEditableCell(
                    row, 
                    index, 
                    'description', 
                    getValue(row, mappings.description, defaultSettings.description)
                  )}
                </TableCell>
                <TableCell>
                  {renderEditableCell(
                    row, 
                    index, 
                    'amount', 
                    getValue(row, mappings.amount, '0')
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {renderEditableCell(
                    row, 
                    index, 
                    'date', 
                    getValue(row, mappings.date, '')
                  )}
                </TableCell>
                <TableCell>
                  {renderEditableCell(
                    row, 
                    index, 
                    'currency', 
                    getValue(row, mappings.currency, defaultSettings.currency)
                  )}
                </TableCell>
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
      
      {data.length > localData.length && (
        <p className="text-sm text-muted-foreground">
          Showing {localData.length} of {data.length} transactions. All transactions will be processed with your edits.
        </p>
      )}
    </div>
  );
};