import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, AlertCircle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const TransactionFileAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [transactionData, setTransactionData] = useState<any[]>([]);
  const { toast } = useToast();

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log('📄 CSV parsed:', results.data.length, 'rows');
          resolve(results.data);
        },
        error: (error) => reject(error)
      });
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setAnalysis(null);
    setIsAnalyzing(true);

    try {
      // Parse CSV file
      const data = await parseCSV(file);
      
      if (data.length === 0) {
        throw new Error('No transactions found in file');
      }

      // Format transactions for analysis
      const transactions = data.map((row: any) => ({
        date: row.Date || row.date || row.DATE || '',
        description: row.Description || row.description || row.DESCRIPTION || '',
        amount: parseFloat(row.Amount || row.amount || row.AMOUNT || '0'),
      }));

      setTransactionData(transactions);

      console.log('🤖 Sending to AI for analysis:', transactions.length, 'transactions');

      // Send to AI for analysis
      const { data: analysisData, error } = await supabase.functions.invoke(
        'analyze-uploaded-transactions',
        {
          body: { transactions }
        }
      );

      if (error) throw error;

      setAnalysis(analysisData.summary);
      
      toast({
        title: "Analysis Complete! 🎯",
        description: `Analyzed ${transactions.length} transactions`,
      });

    } catch (error) {
      console.error('❌ Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze file",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2">AI Transaction Analyzer</h3>
              <p className="text-muted-foreground">
                Upload your transaction file (CSV, Excel, or PDF) and let AI analyze your spending patterns and provide insights.
              </p>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv,.xlsx,.xls,.pdf"
                onChange={handleFileUpload}
                disabled={isAnalyzing}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="p-4 bg-primary/10 rounded-full">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Drop your file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports CSV, Excel (.xlsx, .xls), and PDF files
                  </p>
                </div>
              </label>
            </div>

            {fileName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{fileName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isAnalyzing && (
        <Alert>
          <Sparkles className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            AI is analyzing your transactions... This may take a moment.
          </AlertDescription>
        </Alert>
      )}

      {analysis && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">AI Analysis</h3>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {analysis}
                </p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Want to save these transactions? Use the regular CSV upload below to categorize and import them.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="#upload-section">
                    Go to Upload Section
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isAnalyzing && !analysis && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This analyzer provides insights only. To save transactions to your account, use the CSV Upload section below.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};