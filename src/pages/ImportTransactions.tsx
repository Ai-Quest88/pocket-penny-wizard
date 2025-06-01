
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
    setFormValues(transaction);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Import Transactions</h2>
        <p className="text-muted-foreground">
          Upload a CSV file or manually add transactions. Currency will be automatically detected from your CSV file.
        </p>
      </div>
      
      <CsvUploadForm onTransactionParsed={handleTransactionParsed} />
      <ManualTransactionForm 
        onSuccess={onSuccess} 
        initialValues={formValues}
      />
    </div>
  );
}
