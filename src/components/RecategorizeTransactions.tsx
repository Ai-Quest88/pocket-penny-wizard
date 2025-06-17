
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RecategorizeResult {
  transaction: string;
  category: string;
  source: string;
}

export const RecategorizeTransactions = () => {
  const [isRecategorizing, setIsRecategorizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<RecategorizeResult[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState("");
  const { session } = useAuth();
  const { toast } = useToast();

  const recategorizeAllTransactions = async () => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "Please log in to recategorize transactions",
        variant: "destructive",
      });
      return;
    }

    setIsRecategorizing(true);
    setProgress(0);
    setResults([]);
    setCurrentTransaction("");

    try {
      // Fetch all transactions
      const { data: transactions, error: fetchError } = await supabase
        .from('transactions')
        .select('id, description, category')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (!transactions || transactions.length === 0) {
        toast({
          title: "No Transactions",
          description: "No transactions found to recategorize",
        });
        setIsRecategorizing(false);
        return;
      }

      console.log(`Starting recategorization of ${transactions.length} transactions`);

      // Prepare transaction descriptions for batch processing
      const descriptions = transactions.map(t => t.description);

      // Send to edge function for batch processing
      const response = await fetch('https://nqqbvlvuzyctmysablzw.supabase.co/functions/v1/categorize-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcWJ2bHZ1enljdG15c2FibHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzODY0NTIsImV4cCI6MjA1Mzk2MjQ1Mn0.2Z6_5YBxzfsJga8n2vOiTTE3nxPjPpiUcRZe7dpA1V4`
        },
        body: JSON.stringify({
          batchMode: true,
          batchDescriptions: descriptions,
          userId: session.user.id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const batchResults = data.results || [];

      console.log(`Received ${batchResults.length} categorization results`);
      setResults(batchResults);

      // Update transactions in database
      let updatedCount = 0;
      const totalTransactions = transactions.length;

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        const result = batchResults.find(r => r.transaction === transaction.description);
        
        if (result && result.category !== transaction.category) {
          setCurrentTransaction(transaction.description);
          setProgress(((i + 1) / totalTransactions) * 100);

          console.log(`Updating "${transaction.description}": ${transaction.category} → ${result.category}`);

          const { error: updateError } = await supabase
            .from('transactions')
            .update({ category: result.category })
            .eq('id', transaction.id);

          if (updateError) {
            console.error('Error updating transaction:', updateError);
          } else {
            updatedCount++;
          }
        } else {
          setProgress(((i + 1) / totalTransactions) * 100);
        }
      }

      toast({
        title: "Recategorization Complete",
        description: `Updated ${updatedCount} out of ${totalTransactions} transactions`,
      });

      console.log(`Recategorization completed: ${updatedCount} transactions updated`);

    } catch (error) {
      console.error('Error during recategorization:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to recategorize transactions",
        variant: "destructive",
      });
    } finally {
      setIsRecategorizing(false);
      setCurrentTransaction("");
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Recategorize All Transactions</h3>
            <p className="text-sm text-muted-foreground">
              Re-run categorization on all transactions with improved AI prompt
            </p>
          </div>
          <Button
            onClick={recategorizeAllTransactions}
            disabled={isRecategorizing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecategorizing ? 'animate-spin' : ''}`} />
            {isRecategorizing ? 'Recategorizing...' : 'Recategorize All'}
          </Button>
        </div>

        {isRecategorizing && (
          <div className="space-y-3">
            <Progress value={progress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              Progress: {Math.round(progress)}%
            </div>
            {currentTransaction && (
              <div className="text-sm text-muted-foreground">
                Processing: {currentTransaction}
              </div>
            )}
          </div>
        )}

        {results.length > 0 && !isRecategorizing && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Categorization Results</h4>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                  {result.source === 'ai' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : result.source === 'enhanced-rules' ? (
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{result.transaction}</div>
                    <div className="text-muted-foreground">
                      Category: {result.category} ({result.source})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
