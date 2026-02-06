import { supabase } from '@/integrations/supabase/client';

export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
}

export interface ExtractionProgress {
  phase: 'reading' | 'extracting' | 'complete' | 'error';
  currentChunk: number;
  totalChunks: number;
  extractedCount: number;
  message: string;
}

export interface ExtractionResult {
  transactions: ExtractedTransaction[];
  success: boolean;
  error?: string;
  rawCount?: number;
  extractedCount?: number;
}

/**
 * AIExtractor - Uses Gemini AI to extract transactions from any CSV format
 * Handles any bank format automatically without manual column mapping
 */
export class AIExtractor {
  private onProgress?: (progress: ExtractionProgress) => void;

  constructor(onProgress?: (progress: ExtractionProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Extract transactions from raw CSV text using AI
   */
  async extractFromCsv(csvText: string): Promise<ExtractionResult> {
    try {
      // Report reading phase
      this.reportProgress({
        phase: 'reading',
        currentChunk: 0,
        totalChunks: 1,
        extractedCount: 0,
        message: 'Reading CSV file...'
      });

      // Validate input
      if (!csvText || csvText.trim().length === 0) {
        return {
          transactions: [],
          success: false,
          error: 'Empty CSV file'
        };
      }

      const lines = csvText.trim().split('\n');
      const estimatedRows = lines.length - 1; // Exclude header
      const estimatedChunks = Math.ceil(estimatedRows / 50);

      // Report extracting phase
      this.reportProgress({
        phase: 'extracting',
        currentChunk: 1,
        totalChunks: estimatedChunks,
        extractedCount: 0,
        message: `Extracting transactions from ${estimatedRows} rows...`
      });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('extract-transactions', {
        body: { csvText }
      });

      if (error) {
        console.error('Extraction edge function error:', error);
        this.reportProgress({
          phase: 'error',
          currentChunk: 0,
          totalChunks: estimatedChunks,
          extractedCount: 0,
          message: `Extraction failed: ${error.message}`
        });
        return {
          transactions: [],
          success: false,
          error: error.message
        };
      }

      const result = data as ExtractionResult;

      // Report completion
      this.reportProgress({
        phase: 'complete',
        currentChunk: estimatedChunks,
        totalChunks: estimatedChunks,
        extractedCount: result.extractedCount || result.transactions.length,
        message: `Extracted ${result.transactions.length} transactions`
      });

      return result;
    } catch (error) {
      console.error('AIExtractor error:', error);
      this.reportProgress({
        phase: 'error',
        currentChunk: 0,
        totalChunks: 1,
        extractedCount: 0,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        transactions: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Extract transactions from a File object
   */
  async extractFromFile(file: File): Promise<ExtractionResult> {
    try {
      const csvText = await this.readFileAsText(file);
      return this.extractFromCsv(csvText);
    } catch (error) {
      console.error('File reading error:', error);
      return {
        transactions: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file'
      };
    }
  }

  /**
   * Read file as text with encoding detection
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('File reading failed'));
      reader.readAsText(file);
    });
  }

  /**
   * Report progress to callback
   */
  private reportProgress(progress: ExtractionProgress): void {
    if (this.onProgress) {
      this.onProgress(progress);
    }
  }

  /**
   * Test if the extraction service is available
   */
  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('extract-transactions', {
        body: { testMode: true }
      });
      return !error && data?.success === true;
    } catch {
      return false;
    }
  }
}




