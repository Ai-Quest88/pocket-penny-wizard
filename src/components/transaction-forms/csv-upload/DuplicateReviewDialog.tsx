import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TransactionData {
  description: string;
  amount: number;
  date: string;
  currency: string;
  category: string;
  asset_account_id?: string | null;
  liability_account_id?: string | null;
  user_id: string;
  originalIndex: number;
}

interface DuplicateGroup {
  transactions: TransactionData[];
  key: string;
}

interface DuplicateReviewDialogProps {
  isOpen: boolean;
  duplicateGroups: DuplicateGroup[];
  onResolve: (approvedIndices: number[]) => void;
  onCancel: () => void;
}

export const DuplicateReviewDialog = ({
  isOpen,
  duplicateGroups,
  onResolve,
  onCancel,
}: DuplicateReviewDialogProps) => {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());

  const handleTransactionToggle = (originalIndex: number, checked: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(originalIndex);
    } else {
      newSelected.delete(originalIndex);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = (group: DuplicateGroup) => {
    const newSelected = new Set(selectedTransactions);
    group.transactions.forEach(txn => {
      newSelected.add(txn.originalIndex);
    });
    setSelectedTransactions(newSelected);
  };

  const handleSelectFirst = (group: DuplicateGroup) => {
    const newSelected = new Set(selectedTransactions);
    // Remove all from this group first
    group.transactions.forEach(txn => {
      newSelected.delete(txn.originalIndex);
    });
    // Then add only the first one
    if (group.transactions.length > 0) {
      newSelected.add(group.transactions[0].originalIndex);
    }
    setSelectedTransactions(newSelected);
  };

  const handleResolve = () => {
    onResolve(Array.from(selectedTransactions));
  };

  const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.transactions.length, 0);
  const selectedCount = selectedTransactions.size;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Potential Duplicates</DialogTitle>
          <DialogDescription>
            We found {duplicateGroups.length} groups of potential duplicate transactions. 
            Please review and select which transactions you want to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {selectedCount} of {totalDuplicates} transactions selected for import
          </div>

          {duplicateGroups.map((group, groupIndex) => (
            <Card key={groupIndex} className="border-orange-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Duplicate Group {groupIndex + 1} ({group.transactions.length} transactions)
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectFirst(group)}
                    >
                      Keep First Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll(group)}
                    >
                      Keep All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {group.transactions.map((transaction, txnIndex) => (
                  <div
                    key={transaction.originalIndex}
                    className="flex items-start space-x-3 p-3 border rounded-lg bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedTransactions.has(transaction.originalIndex)}
                      onCheckedChange={(checked) =>
                        handleTransactionToggle(transaction.originalIndex, checked as boolean)
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Line {transaction.originalIndex + 1}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {transaction.date}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {transaction.description}
                      </div>
                      <div className="text-sm font-medium">
                        {transaction.amount > 0 ? '+' : ''}${transaction.amount.toFixed(2)} {transaction.currency}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel Upload
          </Button>
          <Button onClick={handleResolve}>
            Continue with {selectedCount} transactions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 