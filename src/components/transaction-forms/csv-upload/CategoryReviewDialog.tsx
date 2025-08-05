import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Brain, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { categories } from "@/types/transaction-forms";
import { addUserCategoryRule } from "@/utils/transactionCategories";

interface Transaction {
  description: string;
  amount: number;
  date: string;
  currency: string;
  category: string;
  user_id: string;
  asset_account_id?: string | null;
  liability_account_id?: string | null;
}

interface TransactionReview extends Transaction {
  originalIndex: number;
  userCategory?: string;
  createRule?: boolean;
}

interface CategoryReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  onConfirm: (reviewedTransactions: Transaction[], shouldCreateRules?: boolean) => void;
  isApplying?: boolean;
}

export const CategoryReviewDialog = ({ 
  open, 
  onOpenChange, 
  transactions, 
  onConfirm, 
  isApplying = false 
}: CategoryReviewDialogProps) => {
  const [reviewedTransactions, setReviewedTransactions] = useState<TransactionReview[]>(() => 
    transactions.map((transaction, index) => ({
      ...transaction,
      originalIndex: index,
      userCategory: transaction.category,
      createRule: transaction.category === 'Uncategorized' // Default to true for uncategorized
    }))
  );

  const handleCategoryChange = (index: number, category: string) => {
    setReviewedTransactions(prev => 
      prev.map((t, i) => 
        i === index 
          ? { 
              ...t, 
              userCategory: category,
              createRule: category !== 'Uncategorized' // Auto-enable rule creation for categorized items
            } 
          : t
      )
    );
  };

  const handleRuleToggle = (index: number, createRule: boolean) => {
    setReviewedTransactions(prev => 
      prev.map((t, i) => 
        i === index ? { ...t, createRule } : t
      )
    );
  };

  const handleConfirm = () => {
    // Convert reviewed transactions to final format
    const finalTransactions = reviewedTransactions.map(transaction => ({
      ...transaction,
      userCategory: transaction.userCategory || transaction.category,
    }));

    // Check if any rules should be created
    const shouldCreateRules = reviewedTransactions.some(t => t.createRule);

    console.log('CategoryReviewDialog confirming:', {
      transactionCount: finalTransactions.length,
      shouldCreateRules,
      changedCategories: reviewedTransactions.filter(t => t.userCategory && t.userCategory !== t.category).length
    });

    onConfirm(finalTransactions, shouldCreateRules);
  };

  const categorizedCount = reviewedTransactions.filter(t => 
    (t.userCategory || t.category) !== 'Uncategorized'
  ).length;
  
  const uncategorizedCount = reviewedTransactions.length - categorizedCount;
  const rulesCount = reviewedTransactions.filter(t => t.createRule).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Review AI Categorization
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Summary */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-medium text-blue-900">Categorization Summary</h3>
                <div className="flex items-center gap-4 text-sm text-blue-700">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    <span>{categorizedCount} categorized</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uncategorizedCount} need review</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Brain className="h-4 w-4" />
                    <span>{rulesCount} rules to create</span>
                  </div>
                </div>
              </div>
              <Badge variant="secondary">
                {transactions.length} transactions
              </Badge>
            </div>
          </Card>

          {/* Transaction Table */}
          <div className="flex-1 border rounded-md">
            <ScrollArea className="h-[50vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-24">Amount</TableHead>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead className="w-20">Currency</TableHead>
                    <TableHead className="w-48">Category</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-24">Auto-Learn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedTransactions.map((transaction, index) => {
                    const isUncategorized = (transaction.userCategory || transaction.category) === 'Uncategorized';
                    const categoryChanged = transaction.userCategory !== transaction.category;
                    
                    return (
                      <TableRow 
                        key={index} 
                        className={isUncategorized ? 'bg-amber-50' : 'bg-green-50'}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{transaction.description}</div>
                            {categoryChanged && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Clock className="h-3 w-3" />
                                <span>Changed from "{transaction.category}"</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${Math.abs(transaction.amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {transaction.currency}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={transaction.userCategory || transaction.category}
                            onValueChange={(value) => handleCategoryChange(index, value)}
                          >
                            <SelectTrigger className="w-full h-8">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-48 overflow-y-auto z-50">
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isUncategorized ? "destructive" : "secondary"} className="text-xs">
                            {isUncategorized ? "Needs Review" : "AI Categorized"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(transaction.userCategory || transaction.category) !== 'Uncategorized' && (
                            <div className="flex items-center justify-center">
                              <Checkbox
                                id={`rule-${index}`}
                                checked={transaction.createRule || false}
                                onCheckedChange={(checked) => handleRuleToggle(index, checked as boolean)}
                                title="Create rule for similar transactions"
                              />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {uncategorizedCount > 0 ? (
                <span className="text-amber-600">
                  {uncategorizedCount} transaction{uncategorizedCount !== 1 ? 's' : ''} still need{uncategorizedCount === 1 ? 's' : ''} categorization
                </span>
              ) : (
                <span className="text-green-600">All transactions are categorized!</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isApplying}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isApplying}
                className="min-w-[120px]"
              >
                {isApplying ? "Processing..." : "Accept & Upload"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};