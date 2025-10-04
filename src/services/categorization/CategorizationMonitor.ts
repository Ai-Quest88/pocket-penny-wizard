// Monitoring service for Smart Categorization System
// Tracks performance metrics and categorization accuracy

export interface CategorizationMetrics {
  userId: string;
  timestamp: Date;
  totalTransactions: number;
  userHistoryHits: number;
  systemKeywordHits: number;
  aiFallbacks: number;
  uncategorized: number;
  averageConfidence: number;
  averageProcessingTime: number;
  userCorrections: number;
}

export interface PerformanceMetrics {
  userHistoryLookupTime: number;
  systemKeywordLookupTime: number;
  aiCategorizationTime: number;
  totalProcessingTime: number;
}

export class CategorizationMonitor {
  private static instance: CategorizationMonitor;
  private metrics: CategorizationMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];

  private constructor() {}

  static getInstance(): CategorizationMonitor {
    if (!CategorizationMonitor.instance) {
      CategorizationMonitor.instance = new CategorizationMonitor();
    }
    return CategorizationMonitor.instance;
  }

  // Record categorization session metrics
  recordCategorizationSession(
    userId: string,
    results: Array<{ source: string; confidence: number }>,
    processingTime: number,
    userCorrections: number = 0
  ): void {
    const totalTransactions = results.length;
    const userHistoryHits = results.filter(r => r.source === 'user_history').length;
    const systemKeywordHits = results.filter(r => r.source === 'system_keywords').length;
    const aiFallbacks = results.filter(r => r.source === 'ai').length;
    const uncategorized = results.filter(r => r.source === 'uncategorized').length;
    
    const averageConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalTransactions;

    const metrics: CategorizationMetrics = {
      userId,
      timestamp: new Date(),
      totalTransactions,
      userHistoryHits,
      systemKeywordHits,
      aiFallbacks,
      uncategorized,
      averageConfidence,
      averageProcessingTime: processingTime / totalTransactions,
      userCorrections
    };

    this.metrics.push(metrics);
    
    // Keep only last 1000 records to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    console.log('📊 Categorization metrics recorded:', metrics);
  }

  // Record performance metrics
  recordPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);
    
    // Keep only last 1000 records
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }

    console.log('⚡ Performance metrics recorded:', metrics);
  }

  // Get aggregated metrics for a user
  getUserMetrics(userId: string, days: number = 30): CategorizationMetrics | null {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const userMetrics = this.metrics.filter(
      m => m.userId === userId && m.timestamp >= cutoffDate
    );

    if (userMetrics.length === 0) return null;

    // Aggregate metrics
    const totalSessions = userMetrics.length;
    const totalTransactions = userMetrics.reduce((sum, m) => sum + m.totalTransactions, 0);
    const totalUserHistoryHits = userMetrics.reduce((sum, m) => sum + m.userHistoryHits, 0);
    const totalSystemKeywordHits = userMetrics.reduce((sum, m) => sum + m.systemKeywordHits, 0);
    const totalAiFallbacks = userMetrics.reduce((sum, m) => sum + m.aiFallbacks, 0);
    const totalUncategorized = userMetrics.reduce((sum, m) => sum + m.uncategorized, 0);
    const totalUserCorrections = userMetrics.reduce((sum, m) => sum + m.userCorrections, 0);
    
    const averageConfidence = userMetrics.reduce((sum, m) => sum + m.averageConfidence, 0) / totalSessions;
    const averageProcessingTime = userMetrics.reduce((sum, m) => sum + m.averageProcessingTime, 0) / totalSessions;

    return {
      userId,
      timestamp: new Date(),
      totalTransactions,
      userHistoryHits: totalUserHistoryHits,
      systemKeywordHits: totalSystemKeywordHits,
      aiFallbacks: totalAiFallbacks,
      uncategorized: totalUncategorized,
      averageConfidence,
      averageProcessingTime,
      userCorrections: totalUserCorrections
    };
  }

  // Get system-wide performance metrics
  getSystemPerformanceMetrics(days: number = 7): {
    averageUserHistoryTime: number;
    averageSystemKeywordTime: number;
    averageAiTime: number;
    averageTotalTime: number;
    totalSessions: number;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentMetrics = this.performanceMetrics.filter(m => m.userHistoryLookupTime > 0); // Filter out invalid metrics

    if (recentMetrics.length === 0) {
      return {
        averageUserHistoryTime: 0,
        averageSystemKeywordTime: 0,
        averageAiTime: 0,
        averageTotalTime: 0,
        totalSessions: 0
      };
    }

    const totalSessions = recentMetrics.length;
    const averageUserHistoryTime = recentMetrics.reduce((sum, m) => sum + m.userHistoryLookupTime, 0) / totalSessions;
    const averageSystemKeywordTime = recentMetrics.reduce((sum, m) => sum + m.systemKeywordLookupTime, 0) / totalSessions;
    const averageAiTime = recentMetrics.reduce((sum, m) => sum + m.aiCategorizationTime, 0) / totalSessions;
    const averageTotalTime = recentMetrics.reduce((sum, m) => sum + m.totalProcessingTime, 0) / totalSessions;

    return {
      averageUserHistoryTime,
      averageSystemKeywordTime,
      averageAiTime,
      averageTotalTime,
      totalSessions
    };
  }

  // Get system-wide categorization accuracy
  getSystemAccuracyMetrics(days: number = 7): {
    userHistoryHitRate: number;
    systemKeywordHitRate: number;
    aiFallbackRate: number;
    uncategorizedRate: number;
    averageConfidence: number;
    userCorrectionRate: number;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffDate);

    if (recentMetrics.length === 0) {
      return {
        userHistoryHitRate: 0,
        systemKeywordHitRate: 0,
        aiFallbackRate: 0,
        uncategorizedRate: 0,
        averageConfidence: 0,
        userCorrectionRate: 0
      };
    }

    const totalTransactions = recentMetrics.reduce((sum, m) => sum + m.totalTransactions, 0);
    const totalUserHistoryHits = recentMetrics.reduce((sum, m) => sum + m.userHistoryHits, 0);
    const totalSystemKeywordHits = recentMetrics.reduce((sum, m) => sum + m.systemKeywordHits, 0);
    const totalAiFallbacks = recentMetrics.reduce((sum, m) => sum + m.aiFallbacks, 0);
    const totalUncategorized = recentMetrics.reduce((sum, m) => sum + m.uncategorized, 0);
    const totalUserCorrections = recentMetrics.reduce((sum, m) => sum + m.userCorrections, 0);

    return {
      userHistoryHitRate: totalTransactions > 0 ? (totalUserHistoryHits / totalTransactions) * 100 : 0,
      systemKeywordHitRate: totalTransactions > 0 ? (totalSystemKeywordHits / totalTransactions) * 100 : 0,
      aiFallbackRate: totalTransactions > 0 ? (totalAiFallbacks / totalTransactions) * 100 : 0,
      uncategorizedRate: totalTransactions > 0 ? (totalUncategorized / totalTransactions) * 100 : 0,
      averageConfidence: recentMetrics.reduce((sum, m) => sum + m.averageConfidence, 0) / recentMetrics.length,
      userCorrectionRate: totalTransactions > 0 ? (totalUserCorrections / totalTransactions) * 100 : 0
    };
  }

  // Clear old metrics (for maintenance)
  clearOldMetrics(days: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffDate);
    this.performanceMetrics = this.performanceMetrics.filter(m => true); // Keep all performance metrics for now
  }
}

// Export singleton instance
export const categorizationMonitor = CategorizationMonitor.getInstance();
