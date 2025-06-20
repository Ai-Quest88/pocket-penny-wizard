import { useState } from "react";
import { FileUploadSection } from "./csv-upload/FileUploadSection";
import { ColumnMappingSection } from "./csv-upload/ColumnMappingSection";
import { DefaultSettingsSection } from "./csv-upload/DefaultSettingsSection";
import { PreviewTable } from "./csv-upload/PreviewTable";
import { AutoMappingAlert } from "./csv-upload/AutoMappingAlert";
import { AccountSelectionSection } from "./csv-upload/AccountSelectionSection";
import { insertTransactionsWithDuplicateCheck } from "./csv-upload/helpers/transactionInsertion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAccounts } from "@/hooks/useAccounts";

interface CSVRow {
  [key: string]: string | number | boolean;
}

interface Mappings {
  description: string;
  amount: string;
  date: string;
  currency: string;
  category: string;
}

interface DefaultSettings {
  description: string;
  currency: string;
  category: string;
}

interface UnifiedCsvUploadProps {
  onComplete?: () => void;
}

const initialMappings: Mappings = {
  description: '',
  amount: '',
  date: '',
  currency: '',
  category: '',
};

const initialSettings: DefaultSettings = {
  description: '',
  currency: 'AUD',
  category: 'Other',
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

const formatDateForSupabase = (dateString: string): string => {
  try {
    if (!isValidDate(dateString)) {
      console.warn(`Invalid date format: ${dateString}. Using current date.`);
      return new Date().toISOString().split('T')[0];
    }

    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error("Error formatting date:", error);
    return new Date().toISOString().split('T')[0];
  }
};

export const UnifiedCsvUpload = ({ onComplete }: UnifiedCsvUploadProps) => {
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Mappings>(initialMappings);
  const [defaultSettings, setDefaultSettings] = useState<DefaultSettings>(initialSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoMappedColumns, setAutoMappedColumns] = useState<{ [key: string]: string }>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const { accounts } = useAccounts();
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const handleFileUpload = (data: CSVRow[], fileHeaders: string[]) => {
    setParsedData(data);
    setHeaders(fileHeaders);
    setAutoMapColumns(data, fileHeaders);
  };

  const setAutoMapColumns = (data: CSVRow[], fileHeaders: string[]) => {
    if (!data.length) return;

    const firstRow = data[0];
    const autoMappings: { [key: string]: string } = {};

    fileHeaders.forEach(header => {
      const lowerHeader = header.toLowerCase();

      if (lowerHeader.includes("description") || lowerHeader.includes("narration")) {
        autoMappings.description = header;
      } else if (lowerHeader.includes("amount")) {
        autoMappings.amount = header;
      } else if (lowerHeader.includes("date")) {
        autoMappings.date = header;
      } else if (lowerHeader.includes("currency")) {
        autoMappings.currency = header;
      } else if (lowerHeader.includes("category")) {
        autoMappings.category = header;
      }
    });

    setAutoMappedColumns(autoMappings);
  };

  const handleMappingChange = (field: keyof Mappings, header: string) => {
    setMappings(prev => ({ ...prev, [field]: header }));
  };

  const handleDefaultSettingsChange = (field: keyof DefaultSettings, value: string) => {
    setDefaultSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAcceptAutoMapping = () => {
    setMappings(prev => ({
      ...prev,
      description: autoMappedColumns.description || prev.description,
      amount: autoMappedColumns.amount || prev.amount,
      date: autoMappedColumns.date || prev.date,
      currency: autoMappedColumns.currency || prev.currency,
      category: autoMappedColumns.category || prev.category,
    }));
  };

  const isValidConfiguration = (): boolean => {
    if (!mappings.description || !mappings.amount || !mappings.date || !mappings.currency || !mappings.category) {
      return false;
    }
    return true;
  };

  const processTransactions = async () => {
    if (!session?.user || !parsedData.length) return;

    try {
      setIsProcessing(true);
      console.log(`Processing ${parsedData.length} transactions`);

      const transactionsToInsert = parsedData.map((row) => {
        const selectedAccount = selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null;
        
        return {
          user_id: session.user.id,
          description: String(row[mappings.description] || defaultSettings.description || 'Unknown transaction'),
          amount: Number(row[mappings.amount] || 0),
          date: formatDateForSupabase(String(row[mappings.date] || new Date().toISOString().split('T')[0])),
          currency: String(row[mappings.currency] || defaultSettings.currency || 'AUD'),
          category: String(row[mappings.category] || defaultSettings.category || 'Other'),
          asset_account_id: selectedAccount?.accountType === 'asset' ? selectedAccountId : null,
          liability_account_id: selectedAccount?.accountType === 'liability' ? selectedAccountId : null,
        };
      });

      const result = await insertTransactionsWithDuplicateCheck(transactionsToInsert);
      
      toast({
        title: "Upload completed",
        description: `${result.inserted} transactions inserted, ${result.duplicates} duplicates skipped`,
      });

      console.log('Upload completed:', result.inserted, 'inserted,', result.duplicates, 'duplicates skipped');
      
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['liabilities'] });
      queryClient.invalidateQueries({ queryKey: ['netWorth'] });
      
      onComplete?.();
    } catch (error) {
      console.error('Error processing transactions:', error);
      toast({
        title: "Error",
        description: "Failed to process transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <FileUploadSection 
        onFileUpload={handleFileUpload}
        isProcessing={isProcessing}
      />
      
      {parsedData.length > 0 && (
        <>
          <AutoMappingAlert 
            autoMappedColumns={autoMappedColumns}
            onAcceptMapping={handleAcceptAutoMapping}
          />
          
          <ColumnMappingSection
            headers={headers}
            mappings={mappings}
            onMappingChange={handleMappingChange}
          />
          
          <DefaultSettingsSection
            defaultSettings={defaultSettings}
            onSettingsChange={handleDefaultSettingsChange}
          />

          <AccountSelectionSection
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
          />
          
          <PreviewTable
            data={parsedData}
            mappings={mappings}
            defaultSettings={defaultSettings}
            selectedAccount={selectedAccountId ? accounts.find(acc => acc.id === selectedAccountId) : null}
          />
          
          <div className="flex justify-end">
            <Button 
              onClick={processTransactions}
              disabled={isProcessing || !isValidConfiguration()}
              size="lg"
            >
              {isProcessing ? 'Processing...' : `Upload ${parsedData.length} Transactions`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
