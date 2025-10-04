// Feature flag configuration for Smart Categorization System
// This allows gradual rollout and rollback capability

export interface FeatureFlags {
  useSmartCategorization: boolean;
  smartCategorizationRolloutPercentage: number;
  enableUserHistoryLearning: boolean;
  enableSystemKeywords: boolean;
  enableAIFallback: boolean;
}

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: FeatureFlags;

  private constructor() {
    // Default configuration - can be overridden by environment variables
    // Check if we're in browser environment
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // In browser, use defaults (no process.env available)
      this.flags = {
        useSmartCategorization: true,
        smartCategorizationRolloutPercentage: 100,
        enableUserHistoryLearning: true,
        enableSystemKeywords: true,
        enableAIFallback: true
      };
    } else {
      // In Node.js environment, use process.env
      this.flags = {
        useSmartCategorization: process.env.NEXT_PUBLIC_USE_SMART_CATEGORIZATION === 'true',
        smartCategorizationRolloutPercentage: parseInt(process.env.NEXT_PUBLIC_SMART_CATEGORIZATION_ROLLOUT_PERCENTAGE || '100'),
        enableUserHistoryLearning: process.env.NEXT_PUBLIC_ENABLE_USER_HISTORY_LEARNING !== 'false',
        enableSystemKeywords: process.env.NEXT_PUBLIC_ENABLE_SYSTEM_KEYWORDS !== 'false',
        enableAIFallback: process.env.NEXT_PUBLIC_ENABLE_AI_FALLBACK !== 'false'
      };
    }
  }

  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }

  // Check if user should use smart categorization based on rollout percentage
  shouldUseSmartCategorization(userId: string): boolean {
    if (!this.flags.useSmartCategorization) {
      return false;
    }

    // Simple hash-based rollout (consistent for same user)
    const hash = this.simpleHash(userId);
    const userRolloutValue = hash % 100;
    
    return userRolloutValue < this.flags.smartCategorizationRolloutPercentage;
  }

  // Get current feature flags
  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  // Update feature flags (for admin use)
  updateFlags(newFlags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...newFlags };
    console.log('Feature flags updated:', this.flags);
  }

  // Check if specific feature is enabled
  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature] as boolean;
  }

  // Simple hash function for consistent user assignment
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get rollout status for monitoring
  getRolloutStatus(): {
    enabled: boolean;
    rolloutPercentage: number;
    estimatedUsers: number;
  } {
    return {
      enabled: this.flags.useSmartCategorization,
      rolloutPercentage: this.flags.smartCategorizationRolloutPercentage,
      estimatedUsers: Math.round(this.flags.smartCategorizationRolloutPercentage / 100 * 1000) // Assuming 1000 users
    };
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagManager.getInstance();
