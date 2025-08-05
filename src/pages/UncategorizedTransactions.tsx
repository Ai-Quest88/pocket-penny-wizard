
import { useState } from "react"
import { TransactionList } from "@/components/TransactionList"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Sparkles, Brain, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { categorizeTransactionsBatch } from "@/utils/aiCategorization"
import { addUserCategoryRule } from "@/utils/transactionCategories"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categories } from "@/types/transaction-forms"
import { CategoryConfirmationDialog } from "@/components/CategoryConfirmationDialog"

const UncategorizedTransactions = () => {
  const { isAuthenticated, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryProgress, setRetryProgress] = useState({ processed: 0, total: 0 });
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [newCategory, setNewCategory] = useState("");
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [categorySuggestions, setCategorySuggestions] = useState<any[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isApplyingChanges, setIsApplyingChanges] = useState(false);

  console.log("UncategorizedTransactions component - isAuthenticated:", isAuthenticated, "session:", !!session);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, navigating to login");
    navigate('/login');
    return null;
  }

  const handleRetryAICategorization = async () => {
    if (!session?.user?.id) return;

    setIsRetrying(true);
    setRetryProgress({ processed: 0, total: 0 });

    try {
      console.log("🔍 Fetching uncategorized transactions...");
      
      // Fetch all uncategorized transactions
      const { data: uncategorizedTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('category', 'Uncategorized')
        .order('date', { ascending: false });

      if (error) {
        console.error("❌ Error fetching transactions:", error);
        throw error;
      }

      if (!uncategorizedTransactions || uncategorizedTransactions.length === 0) {
        console.log("ℹ️ No uncategorized transactions found");
        toast({
          title: "No Uncategorized Transactions",
          description: "All transactions are already categorized!",
        });
        setIsRetrying(false);
        return;
      }

      console.log(`📊 Found ${uncategorizedTransactions.length} uncategorized transactions`);
      setRetryProgress({ processed: 0, total: uncategorizedTransactions.length });

      // Extract descriptions and amounts for batch processing
      const descriptions = uncategorizedTransactions.map(t => t.description);
      const amounts = uncategorizedTransactions.map(t => t.amount);

      console.log("🤖 Starting AI categorization...");
      
      // Use AI batch categorization with progress callback
      const categories = await categorizeTransactionsBatch(
        descriptions,
        session.user.id,
        amounts,
        (processed, total) => {
          console.log(`📈 Progress update: ${processed}/${total}`);
          setRetryProgress({ processed, total });
        }
      );

      console.log(`✅ AI categorization completed. Got ${categories.length} categories`);

      // Create suggestions for confirmation dialog
      const suggestions = uncategorizedTransactions.map((transaction, index) => ({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        originalCategory: transaction.category,
        suggestedCategory: categories[index] || 'Uncategorized'
      }));

      console.log(`📋 Created ${suggestions.length} suggestions for review`);
      
      // Show dialog even if AI couldn't categorize transactions
      // This allows users to manually categorize what AI couldn't handle
      setCategorySuggestions(suggestions);
      setShowConfirmDialog(true);

    } catch (error) {
      console.error('❌ Error during AI retry:', error);
      toast({
        title: "Categorization Failed",
        description: `There was an error during AI categorization: ${error.message}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
      setRetryProgress({ processed: 0, total: 0 });
    }
  };

  const handleConfirmCategories = async (confirmedSuggestions: any[]) => {
    setIsApplyingChanges(true);

    try {
      let updatedCount = 0;
      const updatePromises = confirmedSuggestions.map(async (suggestion) => {
        const finalCategory = suggestion.userCategory || suggestion.suggestedCategory;
        if (finalCategory && finalCategory !== 'Uncategorized') {
          const { error } = await supabase
            .from('transactions')
            .update({ category: finalCategory })
            .eq('id', suggestion.id);

          if (!error) {
            updatedCount++;
            console.log(`✅ Updated transaction "${suggestion.description}" -> ${finalCategory}`);
          } else {
            console.error(`❌ Failed to update transaction "${suggestion.description}":`, error);
          }
        }
      });

      await Promise.all(updatePromises);

      toast({
        title: "AI Categorization Complete",
        description: `Successfully categorized ${updatedCount} out of ${confirmedSuggestions.length} transactions.`,
      });

      setShowConfirmDialog(false);
      setCategorySuggestions([]);
      
      // Refresh the page to show updated transactions
      window.location.reload();

    } catch (error) {
      console.error('Error applying categories:', error);
      toast({
        title: "Failed to Apply Changes",
        description: "There was an error applying the category changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingChanges(false);
    }
  };

  const handleCreateRule = async () => {
    if (!selectedTransaction || !newCategory) return;

    setIsCreatingRule(true);

    try {
      // Add the user-defined rule
      addUserCategoryRule(selectedTransaction.description, newCategory);

      // Update this specific transaction
      const { error } = await supabase
        .from('transactions')
        .update({ category: newCategory })
        .eq('id', selectedTransaction.id);

      if (error) throw error;

      toast({
        title: "Rule Created",
        description: `Created a new rule: transactions containing "${selectedTransaction.description}" will be categorized as "${newCategory}".`,
      });

      // Reset form and close dialog
      setSelectedTransaction(null);
      setNewCategory("");
      
      // Refresh the page to show updated transactions
      window.location.reload();

    } catch (error) {
      console.error('Error creating rule:', error);
      toast({
        title: "Failed to Create Rule",
        description: "There was an error creating the categorization rule.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingRule(false);
    }
  };

  console.log("Rendering UncategorizedTransactions component");

  return (
    <div className="p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Uncategorized Transactions</h1>
            <p className="text-muted-foreground">Transactions that need to be categorized</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleRetryAICategorization}
              disabled={isRetrying}
              className="flex items-center gap-2"
              variant="default"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Categorizing... {retryProgress.processed}/{retryProgress.total}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Retry AI Categorization
                </>
              )}
            </Button>
          </div>
        </header>

        {isRetrying && (
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Categorization Progress</span>
                <Badge variant="secondary">
                  {retryProgress.processed}/{retryProgress.total}
                </Badge>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${retryProgress.total > 0 ? (retryProgress.processed / retryProgress.total) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Transactions categorized as "Uncategorized". Use the retry button to attempt AI categorization again.
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Create Categorization Rule
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transaction-select">Select Transaction</Label>
                      <Input
                        id="transaction-select"
                        placeholder="Click on a transaction below to select it"
                        value={selectedTransaction?.description || ""}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category-select">Category</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(cat => cat !== 'Uncategorized').map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleCreateRule}
                      disabled={!selectedTransaction || !newCategory || isCreatingRule}
                      className="w-full"
                    >
                      {isCreatingRule ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Creating Rule...
                        </>
                      ) : (
                        "Create Rule"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <TransactionList 
              filterCategory="Uncategorized" 
              onTransactionSelect={setSelectedTransaction}
            />
          </div>
        </Card>

        <CategoryConfirmationDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
          suggestions={categorySuggestions}
          onConfirm={handleConfirmCategories}
          isApplying={isApplyingChanges}
        />
      </div>
    </div>
  )
}

export default UncategorizedTransactions
