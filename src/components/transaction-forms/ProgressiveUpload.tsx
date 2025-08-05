
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

    return Math.min(100, Object.values(completedPhases).reduce((sum, weight) => sum + weight, 0) + currentPhaseProgress);
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

  const progressPercentage = getProgressPercentage();

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {getPhaseIcon()}
              <CardTitle className="text-lg sm:text-xl">
                {progress.phase === 'complete' ? 'Upload Complete!' : 'Processing Transactions'}
              </CardTitle>
            </div>
            {progress.phase !== 'complete' && onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel} className="self-start sm:self-auto">
                <X className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
            )}
          </div>
          <CardDescription className="text-sm sm:text-base">
            {progress.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm sm:text-base">
              <span>Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2 sm:h-3" />
          </div>
          
          {progress.totalSteps > 0 && progress.phase !== 'complete' && (
            <div className="text-xs sm:text-sm text-muted-foreground">
              Step {progress.currentStep} of {progress.totalSteps}
            </div>
          )}

          {progress.phase === 'complete' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm sm:text-base">
                Successfully processed {progress.processedTransactions.length} transactions! 
                The form will reset automatically in a moment.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {progress.processedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">
              Processed Transactions ({progress.processedTransactions.length})
              {progress.phase === 'categorizing' && (
                <span className="block sm:inline sm:ml-2 text-xs sm:text-sm font-normal text-muted-foreground">
                  • Processing in real-time
                </span>
              )}
            </CardTitle>
            <CardDescription className="text-sm">
              {progress.phase === 'complete' 
                ? "All transactions have been successfully saved to your account"
                : "Transactions are being categorized and will be saved to your account"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 sm:max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {progress.processedTransactions.slice(-10).map((transaction, index) => (
                  <div 
                    key={transaction.id || index} 
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/50 rounded-lg border gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <div className="font-medium text-sm truncate">
                          {transaction.description}
                        </div>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary w-fit">
                          {transaction.category}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(transaction.date).toLocaleDateString()} • {transaction.currency}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className={`font-medium text-sm ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                {progress.processedTransactions.length > 10 && (
                  <div className="text-center text-xs sm:text-sm text-muted-foreground py-2">
                    Showing last 10 transactions • {progress.processedTransactions.length - 10} more processed
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
