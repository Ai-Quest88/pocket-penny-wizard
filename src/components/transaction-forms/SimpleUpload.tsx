import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/hooks/useAccounts";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AIExtractor, LearnedPatternMatcher, TransactionCategorizer } from "@/services/categorization";
import type { ExtractedTransaction, ExtractionProgress } from "@/services/categorization";
import { AccountSelectionSection } from "./csv-upload/AccountSelectionSection";
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Brain,
  RefreshCw
} from "lucide-react";

interface ProcessedTransaction extends ExtractedTransaction {
  category: string;
  confidence: number;
  userCategory?: string;
  applyToSimilar?: boolean;
}

type UploadPhase = 'idle' | 'extracting' | 'categorizing' | 'review' | 'saving' | 'complete';

interface SimpleUploadProps {
  onComplete?: () => void;
}

export const SimpleUpload = ({ onComplete }: SimpleUploadProps) => {
  const [phase, setPhase] = useState<UploadPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [fileName, setFileName] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const [categorizedCount, setCategorizedCount] = useState(0);
  
  const { session } = useAuth();
  const { accounts } = useAccounts();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle file selection and AI extraction
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) return;

    setFileName(file.name);
    setPhase('extracting');
    setProgress(0);
    setProgressMessage('Reading file...');

    try {
      // Step 1: AI Extraction
      const extractor = new AIExtractor((extractProgress: ExtractionProgress) => {
        if (extractProgress.phase === 'extracting') {
          setProgress(30);
          setProgressMessage(`Extracting transactions from ${extractProgress.totalChunks} chunks...`);
        }
      });

      const extractResult = await extractor.extractFromFile(file);
      
      if (!extractResult.success || extractResult.transactions.length === 0) {
        throw new Error(extractResult.error || 'No transactions found in file');
      }

      setProgress(50);
      setProgressMessage(`Extracted ${extractResult.transactions.length} transactions. Categorizing...`);
      setPhase('categorizing');

      // Step 2: AI Categorization with learned patterns
      const categorizer = new TransactionCategorizer(session.user.id);
      const transactionsForCategorization = extractResult.transactions.map(tx => ({
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
      }));

      const categoryResults = await categorizer.categorizeTransactions(transactionsForCategorization);

      // Merge extraction + categorization results
      const processed: ProcessedTransaction[] = extractResult.transactions.map((tx, idx) => ({
        ...tx,
        category: categoryResults[idx]?.category || 'Uncategorized',
        confidence: categoryResults[idx]?.confidence || 0.5,
        userCategory: undefined,
        applyToSimilar: false,
      }));

      setTransactions(processed);
      setProgress(100);
      setProgressMessage('Ready for review');
      setPhase('review');

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
      setPhase('idle');
    }

    // Reset file input
    event.target.value = '';
  }, [session?.user?.id, toast]);

  // Handle category change
  const handleCategoryChange = (index: number, category: string) => {
    setTransactions(prev => prev.map((tx, i) => 
      i === index ? { ...tx, userCategory: category, applyToSimilar: true } : tx
    ));
  };

  // Handle "apply to similar" toggle
  const handleApplyToggle = (index: number, apply: boolean) => {
    setTransactions(prev => prev.map((tx, i) => 
      i === index ? { ...tx, applyToSimilar: apply } : tx
    ));
  };

  // Confirm and save transactions
  const handleConfirm = async () => {
    if (!session?.user?.id || !selectedAccountId) {
      toast({
        title: "Missing Information",
        description: "Please select an account before uploading.",
        variant: "destructive",
      });
      return;
    }

    setPhase('saving');
    setProgress(0);
    setProgressMessage('Saving transactions...');

    try {
      const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
      const patternMatcher = new LearnedPatternMatcher(session.user.id);
      const corrections: Array<{ description: string; categoryName: string; categoryId?: string }> = [];

      // Prepare transactions for database
      const transactionsToSave = [];
      
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const finalCategory = tx.userCategory || tx.category;
        
        // Track corrections for learning
        if (tx.userCategory && tx.userCategory !== tx.category && tx.applyToSimilar) {
          corrections.push({
            description: tx.description,
            categoryName: tx.userCategory,
          });
        }

        // Find category ID
        let categoryId = null;
        if (finalCategory && finalCategory !== 'Uncategorized') {
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('name', finalCategory)
            .maybeSingle();
          if (!catError && catData) {
            categoryId = catData.id;
          }
        }

        transactionsToSave.push({
          user_id: session.user.id,
          description: tx.description,
          amount: tx.amount,
          date: tx.date,
          currency: selectedAccount?.currency || 'AUD',
          category_id: categoryId,
          category_name: finalCategory,
          asset_account_id: selectedAccount?.accountType === 'asset' ? selectedAccountId : null,
          liability_account_id: selectedAccount?.accountType === 'liability' ? selectedAccountId : null,
          type: tx.type,
        });

        setProgress(Math.round((i / transactions.length) * 70));
      }

      setProgressMessage('Inserting into database...');

      // Batch insert
      const { data: inserted, error: insertError } = await supabase
        .from('transactions')
        .insert(transactionsToSave)
        .select();

      if (insertError) {
        throw insertError;
      }

      setProgress(85);
      setProgressMessage('Learning from corrections...');

      // Save learned patterns from corrections
      if (corrections.length > 0) {
        await patternMatcher.savePatterns(corrections);
        console.log(`Saved ${corrections.length} learned patterns`);
      }

      setProgress(100);
      setProgressMessage('Complete!');
      setPhase('complete');

      const count = inserted?.length ?? transactions.length;
      const categorized = transactions.filter((t) => t.category && t.category !== "Uncategorized").length;
      setSavedCount(count);
      setCategorizedCount(categorized);
      toast({
        title: "Done",
        description: categorized < count
          ? `${count} transactions added. ${categorized} categorized. View list.`
          : `${count} transactions added. View list.`,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['sidebar-transaction-count'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-count'] });

      // Auto-reset after delay
      setTimeout(() => {
        setPhase('idle');
        setTransactions([]);
        setFileName('');
        setSelectedAccountId(null);
        onComplete?.();
      }, 4000);

    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
      setPhase('review');
    }
  };

  // Reset to start over
  const handleReset = () => {
    setPhase('idle');
    setTransactions([]);
    setFileName('');
    setProgress(0);
  };

  // Stats for review
  const lowConfidenceCount = transactions.filter(tx => tx.confidence < 0.7).length;
  const uncategorizedCount = transactions.filter(tx => 
    (tx.userCategory || tx.category) === 'Uncategorized'
  ).length;
  const correctedCount = transactions.filter(tx => tx.userCategory && tx.userCategory !== tx.category).length;

  // Render based on phase
  if (phase === 'idle') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Powered Upload
          </CardTitle>
          <CardDescription>
            Just upload your bank CSV — AI handles the rest. No column mapping needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccountSelectionSection
            selectedAccountId={selectedAccountId}
            onAccountChange={setSelectedAccountId}
          />

          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
            <Input
              id="csv-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              disabled={!selectedAccountId}
            />
            <Label 
              htmlFor="csv-upload" 
              className={`cursor-pointer flex flex-col items-center gap-4 ${!selectedAccountId ? 'opacity-50' : ''}`}
            >
              <div className="p-4 bg-purple-100 rounded-full">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-lg">Drop your CSV here or click to browse</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports any bank format • CSV, Excel
                </p>
              </div>
            </Label>
          </div>

          {!selectedAccountId && (
            <p className="text-center text-sm text-amber-600">
              ⚠️ Please select an account first
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (phase === 'extracting' || phase === 'categorizing') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-blue-100 rounded-full animate-pulse">
              <Brain className="h-10 w-10 text-blue-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {phase === 'extracting' ? 'AI is reading your file...' : 'AI is categorizing transactions...'}
              </h3>
              <p className="text-sm text-muted-foreground">{progressMessage}</p>
            </div>
            <Progress value={progress} className="w-80" />
            <p className="text-xs text-muted-foreground">{fileName}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'review') {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Review & Confirm
              </CardTitle>
              <CardDescription>
                {transactions.length} transactions extracted from {fileName}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Over
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary badges */}
          <div className="flex gap-2 flex-wrap">
            <Badge variant="default" className="bg-green-600">
              {transactions.length - uncategorizedCount} Categorized
            </Badge>
            {lowConfidenceCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {lowConfidenceCount} Low Confidence
              </Badge>
            )}
            {uncategorizedCount > 0 && (
              <Badge variant="outline" className="text-muted-foreground">
                {uncategorizedCount} Uncategorized
              </Badge>
            )}
            {correctedCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {correctedCount} Corrected (will learn)
              </Badge>
            )}
          </div>

          {/* Transaction table */}
          <div className="border rounded-md">
            <ScrollArea className="h-[50vh]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-center">Confidence</TableHead>
                    <TableHead className="text-center">Learn</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx, index) => {
                    const finalCategory = tx.userCategory || tx.category;
                    const isLowConfidence = tx.confidence < 0.7;
                    const wasChanged = tx.userCategory && tx.userCategory !== tx.category;

                    return (
                      <TableRow 
                        key={index}
                        className={isLowConfidence ? 'bg-amber-50' : wasChanged ? 'bg-blue-50' : ''}
                      >
                        <TableCell className="text-sm">{tx.date}</TableCell>
                        <TableCell>
                          <span className="font-medium">{tx.description}</span>
                          {wasChanged && (
                            <span className="text-xs text-blue-600 block">
                              Changed from: {tx.category}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${tx.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={finalCategory}
                            onValueChange={(value) => handleCategoryChange(index, value)}
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                              <SelectItem value="Food & Dining">Food & Dining</SelectItem>
                              <SelectItem value="Groceries">Groceries</SelectItem>
                              <SelectItem value="Transportation">Transportation</SelectItem>
                              <SelectItem value="Fuel">Fuel</SelectItem>
                              <SelectItem value="Shopping">Shopping</SelectItem>
                              <SelectItem value="Entertainment">Entertainment</SelectItem>
                              <SelectItem value="Bills & Utilities">Bills & Utilities</SelectItem>
                              <SelectItem value="Healthcare">Healthcare</SelectItem>
                              <SelectItem value="Income">Income</SelectItem>
                              <SelectItem value="Transfer">Transfer</SelectItem>
                              <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={tx.confidence >= 0.8 ? 'default' : tx.confidence >= 0.6 ? 'secondary' : 'outline'}
                            className={tx.confidence < 0.6 ? 'text-amber-600' : ''}
                          >
                            {Math.round(tx.confidence * 100)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {wasChanged && (
                            <Checkbox
                              checked={tx.applyToSimilar || false}
                              onCheckedChange={(checked) => handleApplyToggle(index, !!checked)}
                              title="Apply to similar transactions"
                            />
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
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {correctedCount > 0 && (
                <span className="text-blue-600">
                  ✨ {correctedCount} correction{correctedCount !== 1 ? 's' : ''} will be learned for future uploads
                </span>
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} className="min-w-32">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === 'saving' || phase === 'complete') {
    const needsReview = savedCount - categorizedCount;
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-6">
            {phase === 'saving' ? (
              <>
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Saving transactions...</h3>
                  <p className="text-sm text-muted-foreground">{progressMessage}</p>
                </div>
                <Progress value={progress} className="w-80" />
              </>
            ) : (
              <>
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold">
                    {savedCount} transactions imported!
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Your spending is already being analyzed. Head to your dashboard to see the breakdown.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {categorizedCount > 0 && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {categorizedCount} categorized
                    </Badge>
                  )}
                  {needsReview > 0 && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {needsReview} need review
                    </Badge>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};



