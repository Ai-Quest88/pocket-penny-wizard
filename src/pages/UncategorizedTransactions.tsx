
import { useState } from "react"
import { TransactionList } from "@/components/TransactionList"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Brain, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { addUserCategoryRule } from "@/utils/transactionCategories"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { categories } from "@/types/transaction-forms"

const UncategorizedTransactions = () => {
  const { isAuthenticated, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [newCategory, setNewCategory] = useState("");
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [ruleDescription, setRuleDescription] = useState("");

  console.log("UncategorizedTransactions component - isAuthenticated:", isAuthenticated, "session:", !!session);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log("Not authenticated, navigating to login");
    navigate('/login');
    return null;
  }


  const handleCreateRule = async () => {
    if (!ruleDescription.trim() || !newCategory) return;

    setIsCreatingRule(true);

    try {
      // Add the user-defined rule
      addUserCategoryRule(ruleDescription.trim(), newCategory);

      // If a transaction is selected, update it too
      if (selectedTransaction) {
        const { error } = await supabase
          .from('transactions')
          .update({ category: newCategory })
          .eq('id', selectedTransaction.id);

        if (error) throw error;
      }

      toast({
        title: "Rule Created",
        description: `Created a new rule: transactions containing "${ruleDescription.trim()}" will be categorized as "${newCategory}".`,
      });

      // Reset form and close dialog
      setSelectedTransaction(null);
      setNewCategory("");
      setRuleDescription("");
      
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
        <header>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Uncategorized Transactions</h1>
            <p className="text-muted-foreground">Transactions that need to be categorized</p>
          </div>
        </header>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Transactions that need manual categorization. Create rules to automatically categorize similar transactions in the future.
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
                      <Label htmlFor="rule-description">Rule Description</Label>
                      <Input
                        id="rule-description"
                        placeholder="Enter text that transactions should contain (e.g., 'Starbucks', 'Grocery', 'Netflix')"
                        value={ruleDescription}
                        onChange={(e) => setRuleDescription(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Future transactions containing this text will be automatically categorized.
                      </p>
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
                    {selectedTransaction && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Also apply to selected transaction:</p>
                        <p className="text-sm font-medium">{selectedTransaction.description}</p>
                      </div>
                    )}
                    <Button 
                      onClick={handleCreateRule}
                      disabled={!ruleDescription.trim() || !newCategory || isCreatingRule}
                      className="w-full"
                    >
                      {isCreatingRule ? "Creating Rule..." : "Create Rule"}
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

      </div>
    </div>
  )
}

export default UncategorizedTransactions
