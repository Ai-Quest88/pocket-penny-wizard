import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { detectDuplicateTransactions, filterDuplicatesByConfidence, DuplicateGroup } from "@/utils/duplicateDetection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Trash2, Search, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/currencyUtils";

interface DuplicateDetectorProps {
  onClose?: () => void;
}

export function DuplicateDetector({ onClose }: DuplicateDetectorProps) {
  const { session } = useAuth();
  const { displayCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [confidenceFilter, setConfidenceFilter] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          assets!asset_account_id(name),
          liabilities!liability_account_id(name)
        `)
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!session?.user,
  });

  // Detect duplicates
  const duplicateResult = useMemo(() => {
    if (!transactions.length) return { duplicateGroups: [], totalDuplicates: 0, potentialSavings: 0 };
    
    const result = detectDuplicateTransactions(transactions);
    return filterDuplicatesByConfidence(result, confidenceFilter);
  }, [transactions, confidenceFilter]);

  const handleGroupSelection = (groupId: string, checked: boolean) => {
    const newSelected = new Set(selectedGroups);
    const group = duplicateResult.duplicateGroups.find(g => g.id === groupId);
    
    if (checked) {
      newSelected.add(groupId);
      // Auto-select all but the first transaction in the group (keep the original)
      if (group) {
        group.transactions.slice(1).forEach(transaction => {
          setSelectedTransactions(prev => new Set(prev.add(transaction.id)));
        });
      }
    } else {
      newSelected.delete(groupId);
      // Deselect all transactions in the group
      if (group) {
        group.transactions.forEach(transaction => {
          setSelectedTransactions(prev => {
            const newSet = new Set(prev);
            newSet.delete(transaction.id);
            return newSet;
          });
        });
      }
    }
    
    setSelectedGroups(newSelected);
  };

  const handleTransactionSelection = (transactionId: string, checked: boolean) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(transactionId);
      } else {
        newSet.delete(transactionId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedTransactions.size === 0) {
      toast.error("Please select transactions to delete");
      return;
    }

    setIsDeleting(true);
    try {
      const transactionIds = Array.from(selectedTransactions);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionIds);

      if (error) throw error;

      toast.success(`Successfully deleted ${transactionIds.length} duplicate transactions`);
      
      // Refresh transactions
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Clear selections
      setSelectedGroups(new Set());
      setSelectedTransactions(new Set());
      
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast.error("Failed to delete transactions");
    } finally {
      setIsDeleting(false);
    }
  };

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Analyzing transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Duplicate Transaction Detector
              </CardTitle>
              <CardDescription>
                Find and manage duplicate transactions in your account
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm">
                <strong>{duplicateResult.duplicateGroups.length}</strong> duplicate groups found
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="text-sm">
                <strong>{duplicateResult.totalDuplicates}</strong> duplicate transactions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm">
                <strong>{formatCurrency(duplicateResult.potentialSavings, displayCurrency)}</strong> potential cleanup
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="confidence-filter" className="text-sm font-medium">
                Confidence Level:
              </label>
              <Select value={confidenceFilter} onValueChange={(value: any) => setConfidenceFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">All</SelectItem>
                  <SelectItem value="medium">Medium+</SelectItem>
                  <SelectItem value="high">High Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedTransactions.size > 0 && (
              <Button 
                variant="destructive" 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="ml-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedTransactions.size} Selected
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Duplicate Groups */}
      {duplicateResult.duplicateGroups.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Duplicates Found!</h3>
            <p className="text-muted-foreground">
              Your transactions look clean. No duplicate transactions were detected at the {confidenceFilter} confidence level.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicateResult.duplicateGroups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedGroups.has(group.id)}
                      onCheckedChange={(checked) => handleGroupSelection(group.id, checked as boolean)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          Duplicate Group - {group.transactions.length} transactions
                        </CardTitle>
                        <Badge variant={getConfidenceBadgeVariant(group.confidence)}>
                          {group.confidence.toUpperCase()}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {group.criteria}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">
                      {formatCurrency(Math.abs(group.transactions[0].amount), displayCurrency)}
                    </div>
                    <div className="text-muted-foreground">
                      {group.transactions[0].date}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.transactions.map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {index === 0 ? (
                          <div className="w-4 h-4 bg-green-500 rounded text-white text-xs flex items-center justify-center">
                            ✓
                          </div>
                        ) : (
                          <Checkbox
                            checked={selectedTransactions.has(transaction.id)}
                            onCheckedChange={(checked) => handleTransactionSelection(transaction.id, checked as boolean)}
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {transaction.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.date} • {transaction.category}
                            {transaction.assets?.name && ` • ${transaction.assets.name}`}
                            {transaction.liabilities?.name && ` • ${transaction.liabilities.name}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(transaction.amount, displayCurrency)}
                        </div>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Keep Original
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
