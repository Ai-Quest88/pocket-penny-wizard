
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Upload, Loader2 } from "lucide-react";
import { TransactionTable } from "@/components/transactions/TransactionTable";

interface UploadProgress {
  phase: 'uploading' | 'categorizing' | 'saving' | 'updating-balances' | 'complete';
  currentStep: number;
  totalSteps: number;
  message: string;
  processedTransactions: any[];
}

interface ProgressiveUploadProps {
  progress: UploadProgress;
  onCancel?: () => void;
}

export const ProgressiveUpload: React.FC<ProgressiveUploadProps> = ({ 
  progress, 
  onCancel 
}) => {
  const getProgressPercentage = () => {
    const phaseWeights = {
      uploading: 10,
      categorizing: 70,
      saving: 15,
      'updating-balances': 5,
      complete: 100
    };

    const completedPhases = {
      uploading: progress.phase !== 'uploading' ? phaseWeights.uploading : 0,
      categorizing: progress.phase === 'saving' || progress.phase === 'updating-balances' || progress.phase === 'complete' ? phaseWeights.categorizing : 0,
      saving: progress.phase === 'updating-balances' || progress.phase === 'complete' ? phaseWeights.saving : 0,
      'updating-balances': progress.phase === 'complete' ? phaseWeights['updating-balances'] : 0,
    };

    const currentPhaseProgress = progress.totalSteps > 0 
      ? (progress.currentStep / progress.totalSteps) * phaseWeights[progress.phase]
      : 0;

    return Object.values(completedPhases).reduce((sum, weight) => sum + weight, 0) + currentPhaseProgress;
  };

  const getPhaseIcon = () => {
    switch (progress.phase) {
      case 'uploading':
        return <Upload className="h-4 w-4" />;
      case 'categorizing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'updating-balances':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getPhaseIcon()}
            Processing Transactions
          </CardTitle>
          <CardDescription>
            {progress.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="w-full" />
          </div>
          
          {progress.totalSteps > 0 && (
            <div className="text-sm text-muted-foreground">
              Step {progress.currentStep} of {progress.totalSteps}
            </div>
          )}
        </CardContent>
      </Card>

      {progress.processedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Transactions ({progress.processedTransactions.length})</CardTitle>
            <CardDescription>
              Transactions that have been categorized and are ready to save
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionTable
              transactions={progress.processedTransactions}
              convertAmount={(amount) => amount}
              displayCurrency="AUD"
              currencySymbols={{ AUD: "$", USD: "$", EUR: "€", GBP: "£" }}
              onTransactionClick={() => {}}
              selectedTransactions={[]}
              onSelectionChange={() => {}}
              onSelectAll={() => {}}
              showBalance={false}
              readOnly={true}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
