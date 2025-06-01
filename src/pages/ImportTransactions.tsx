
import { useState } from "react";
import { CsvUploadForm } from "@/components/transaction-forms/CsvUploadForm";
import { ManualTransactionForm } from "@/components/transaction-forms/ManualTransactionForm";
import { TransactionFormData } from "@/types/transaction-forms";

interface ImportTransactionsProps {
  onSuccess?: () => void;
}

export default function ImportTransactions({ onSuccess }: ImportTransactionsProps) {
  const [formValues, setFormValues] = useState<Partial<TransactionFormData>>({});

  const handleTransactionParsed = (transaction: TransactionFormData) => {
    console.log("Transaction parsed:", transaction);
    setFormValues(transaction);
  };

  console.log("ImportTransactions component rendering");

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Import Transactions</h2>
        <p className="text-muted-foreground">
          Upload a CSV file or manually add transactions. Currency will be automatically detected from your CSV file.
        </p>
      </div>
      
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-4">Upload CSV File</h3>
          <CsvUploadForm onTransactionParsed={handleTransactionParsed} />
        </div>
        
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Manual Entry</h3>
          <ManualTransactionForm 
            onSuccess={onSuccess} 
            initialValues={formValues}
          />
        </div>
      </div>
    </div>
  );
}
