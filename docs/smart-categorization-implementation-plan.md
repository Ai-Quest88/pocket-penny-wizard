# Smart Categorization System Implementation Plan

## Overview

This document outlines the step-by-step implementation plan for the Smart Categorization System, transitioning from the current hard-coded keyword approach to a learning-first, database-driven system.

## Current State Analysis

### **What We Have**
- ✅ Basic categorization working with hard-coded keywords
- ✅ AI categorization via Google Gemini
- ✅ CSV upload and processing pipeline
- ✅ Category review dialog
- ✅ Database schema for transactions and categories

### **What We Need to Build**
- 🔄 User history lookup system
- 🔄 Database-driven system keyword rules
- 🔄 Enhanced AI categorization with user context
- 🔄 Fuzzy string matching for transaction similarity
- 🔄 Confidence scoring and source tracking

## Implementation Phases

## Phase 1: Database Foundation (Days 1-2)

### **Day 1: Schema Setup**

#### **1.1 Create System Keyword Rules Table**
```sql
-- File: supabase/migrations/20250117000004_create_system_keyword_rules.sql
CREATE TABLE system_keyword_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keywords TEXT[] NOT NULL,
  category_name TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.8,
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast keyword lookups
CREATE INDEX idx_system_keyword_rules_keywords ON system_keyword_rules 
USING GIN (keywords);

-- Index for active rules
CREATE INDEX idx_system_keyword_rules_active ON system_keyword_rules 
(is_active, priority) WHERE is_active = true;
```

#### **1.2 Enhance Transactions Table**
```sql
-- File: supabase/migrations/20250117000005_enhance_transactions_categorization.sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS 
  categorization_source VARCHAR(50) DEFAULT 'ai',
  categorization_confidence DECIMAL(3,2) DEFAULT 0.5,
  categorization_reasoning TEXT;

-- Index for user history lookups
CREATE INDEX idx_transactions_user_history ON transactions 
(user_id, date DESC) WHERE category_id IS NOT NULL;
```

#### **1.3 User Preferences (Derived from Transactions)**
```sql
-- Note: User preferences are derived directly from transactions table
-- No separate user_categorization_preferences table needed!
-- User history and preferences are calculated on-demand from existing transaction data
```

#### **1.4 Populate System Keyword Rules**
```sql
-- File: supabase/migrations/20250117000007_populate_system_keyword_rules.sql
INSERT INTO system_keyword_rules (keywords, category_name, confidence, priority) VALUES
  -- Food & Dining (High Priority)
  (ARRAY['uber eats', 'ubereats'], 'Food & Dining', 0.95, 10),
  (ARRAY['woolworths', 'coles', 'aldi', 'iga'], 'Food & Dining', 0.9, 20),
  (ARRAY['mcdonalds', 'kfc', 'subway', 'pizza'], 'Food & Dining', 0.85, 30),
  (ARRAY['restaurant', 'cafe', 'coffee', 'bar'], 'Food & Dining', 0.8, 40),
  
  -- Transportation (High Priority)
  (ARRAY['linkt', 'eastlink', 'citylink'], 'Transportation', 0.9, 10),
  (ARRAY['uber', 'taxi', 'lyft'], 'Transportation', 0.8, 20),
  (ARRAY['public transport', 'metro', 'bus'], 'Transportation', 0.85, 30),
  
  -- Salary & Income (High Priority)
  (ARRAY['salary', 'payroll', 'wage'], 'Salary', 0.9, 10),
  (ARRAY['novel aquatech'], 'Salary', 0.95, 15),
  (ARRAY['direct credit'], 'Salary', 0.75, 20),
  
  -- Housing & Utilities (Medium Priority)
  (ARRAY['electricity', 'water', 'gas'], 'Housing', 0.85, 50),
  (ARRAY['rent', 'mortgage'], 'Housing', 0.9, 60),
  (ARRAY['council rates'], 'Housing', 0.8, 70),
  
  -- Healthcare (Medium Priority)
  (ARRAY['cbhs', 'medicare', 'pharmacy'], 'Healthcare', 0.9, 50),
  (ARRAY['hospital', 'doctor', 'medical'], 'Healthcare', 0.85, 60),
  
  -- Account Transfer & Banking (Medium Priority)
  (ARRAY['bpay', 'bill payment'], 'Account Transfer', 0.8, 50),
  (ARRAY['commbank', 'nab', 'anz', 'westpac'], 'Account Transfer', 0.75, 60),
  (ARRAY['atm', 'withdrawal'], 'Account Transfer', 0.8, 70),
  (ARRAY['citibank'], 'Account Transfer', 0.75, 80),
  
  -- Entertainment (Low Priority)
  (ARRAY['netflix', 'spotify', 'youtube'], 'Entertainment', 0.85, 100),
  (ARRAY['cinema', 'movie', 'theater'], 'Entertainment', 0.8, 110),
  
  -- Telecommunications (Medium Priority)
  (ARRAY['more telecom', 'telstra', 'optus', 'vodafone'], 'Telecommunications', 0.9, 50),
  (ARRAY['mobile', 'phone', 'internet'], 'Telecommunications', 0.8, 60),
  
  -- Childcare/Education (Medium Priority)
  (ARRAY['numero', 'numero pro', 'kidsof'], 'Other Expenses', 0.85, 50),
  
  -- Shopping (Low Priority)
  (ARRAY['amazon', 'ebay', 'shopping'], 'Shopping', 0.8, 100),
  (ARRAY['clothing', 'fashion', 'apparel'], 'Shopping', 0.8, 110),
  
  -- Investment & Finance (Low Priority)
  (ARRAY['investment', 'dividend', 'interest'], 'Investment Income', 0.8, 100),
  (ARRAY['bank interest', 'term deposit'], 'Investment Income', 0.75, 110);
```

### **Day 2: RLS Policies and Testing**

#### **2.1 Add RLS Policies**
```sql
-- File: supabase/migrations/20250117000008_add_rls_policies_smart_categorization.sql
-- Enable RLS on system_keyword_rules table
ALTER TABLE system_keyword_rules ENABLE ROW LEVEL SECURITY;

-- System keyword rules: Public read access to active rules
CREATE POLICY "Allow public read access to active system keyword rules"
ON system_keyword_rules
FOR SELECT
USING (is_active = TRUE);

-- Note: No RLS policies needed for user preferences since they're derived from transactions table
-- which already has proper user-based RLS policies
```

#### **2.2 Test Database Setup**
```bash
# Test the new schema
npm run test:db:schema
```

## Phase 2: Core Implementation (Days 3-5)

### **Day 3: User History Matcher**

#### **3.1 Create UserHistoryMatcher Class**
```typescript
// File: src/services/categorization/UserHistoryMatcher.ts
export class UserHistoryMatcher {
  constructor(private userId: string) {}

  async findSimilarTransaction(transaction: TransactionData): Promise<CategoryDiscoveryResult | null> {
    // Implementation with fuzzy matching
  }

  private calculateSimilarity(desc1: string, desc2: string): number {
    // Levenshtein distance + merchant name extraction
  }

  private extractMerchantName(description: string): string {
    // Extract merchant names from transaction descriptions
  }
}
```

#### **3.2 Create System Keyword Matcher**
```typescript
// File: src/services/categorization/SystemKeywordMatcher.ts
export class SystemKeywordMatcher {
  async findKeywordMatch(transaction: TransactionData): Promise<CategoryDiscoveryResult | null> {
    // Database-driven keyword matching
  }

  private async loadSystemRules(): Promise<SystemKeywordRule[]> {
    // Load active system rules from database
  }
}
```

### **Day 4: Smart Categorizer Integration**

#### **4.1 Create SmartCategorizer**
```typescript
// File: src/services/categorization/SmartCategorizer.ts
export class SmartCategorizer {
  private userHistoryMatcher: UserHistoryMatcher;
  private systemKeywordMatcher: SystemKeywordMatcher;
  private aiCategorizer: AICategorizer;

  async categorizeTransaction(transaction: TransactionData): Promise<CategoryDiscoveryResult> {
    // 1. Try user history first
    // 2. Try system keywords second
    // 3. Use AI as fallback
  }
}
```

#### **4.2 Update TransactionCategorizer**
```typescript
// File: src/services/categorization/TransactionCategorizer.ts
export class TransactionCategorizer {
  private smartCategorizer: SmartCategorizer;

  async categorizeTransactions(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
    // Delegate to SmartCategorizer
  }
}
```

### **Day 5: Enhanced AI Categorizer**

#### **5.1 Update AICategorizer with User Context**
```typescript
// File: src/services/categorization/AICategorizer.ts
export class AICategorizer {
  async categorize(transactions: TransactionData[], userId: string): Promise<AICategoryResult[]> {
    // Enhanced prompts with user context and preferences
  }

  private async getUserCategoryPreferences(userId: string): Promise<string[]> {
    // Get user's most used categories from transactions table
    const { data } = await supabase
      .from('transactions')
      .select('category_id, categories(name)')
      .eq('user_id', userId)
      .not('category_id', 'is', null);
    
    // Count usage and return most used categories
    return this.analyzeCategoryUsage(data);
  }

  private buildEnhancedPrompt(transaction: TransactionData, userPreferences: string[]): string {
    // Build context-aware AI prompts
  }
}
```

## Phase 3: Integration and Testing (Days 6-8)

### **Day 6: Integration with CSV Upload**

#### **6.1 Update UnifiedCsvUpload Component**
```typescript
// File: src/components/transaction-forms/UnifiedCsvUpload.tsx
// Update processTransactions to use SmartCategorizer
const processTransactions = async () => {
  // Use new SmartCategorizer instead of current approach
  const categorizer = new SmartCategorizer(session.user.id);
  const results = await categorizer.categorizeTransactions(formattedTransactions);
};
```

#### **6.2 Update Category Review Dialog**
```typescript
// File: src/components/transaction-forms/CategoryReviewDialog.tsx
// Show categorization source and confidence
const CategoryItem = ({ transaction, onCategoryChange }) => {
  const sourceIcon = getSourceIcon(transaction.categorization_source);
  const confidenceColor = getConfidenceColor(transaction.categorization_confidence);
  
  return (
    <div className="category-item">
      <div className="source-indicator">
        {sourceIcon} {transaction.categorization_source} ({transaction.categorization_confidence * 100}%)
      </div>
      {/* Rest of component */}
    </div>
  );
};
```

### **Day 7: Testing and Validation**

#### **7.1 Create Comprehensive Tests**
```typescript
// File: tests/smart-categorization.test.ts
describe('Smart Categorization System', () => {
  test('User history matching works correctly', async () => {
    // Test user history lookup
  });

  test('System keyword matching works correctly', async () => {
    // Test database-driven keyword matching
  });

  test('AI fallback works when no matches found', async () => {
    // Test AI categorization fallback
  });

  test('Confidence scoring is accurate', async () => {
    // Test confidence calculation
  });
});
```

#### **7.2 End-to-End Testing**
```bash
# Test with real CSV data
npm run test:e2e:csv-upload
npm run test:e2e:categorization-accuracy
```

### **Day 8: Performance Optimization**

#### **8.1 Add Caching Layer**
```typescript
// File: src/services/categorization/CategorizationCache.ts
export class CategorizationCache {
  private cache = new Map<string, CategoryDiscoveryResult>();

  async get(transaction: TransactionData): Promise<CategoryDiscoveryResult | null> {
    // Check cache for similar transactions
  }

  set(transaction: TransactionData, result: CategoryDiscoveryResult): void {
    // Cache categorization results
  }
}
```

#### **8.2 Optimize Database Queries**
```sql
-- Add additional indexes for performance
CREATE INDEX idx_transactions_description_similarity ON transactions 
USING GIN (to_tsvector('english', description));

CREATE INDEX idx_system_keyword_rules_category_priority ON system_keyword_rules 
(category_name, priority) WHERE is_active = true;
```

## Phase 4: UI/UX Enhancements (Days 9-10)

### **Day 9: Enhanced User Interface**

#### **9.1 Categorization Source Indicators**
```typescript
// File: src/components/ui/CategorizationSourceBadge.tsx
export const CategorizationSourceBadge = ({ source, confidence }: Props) => {
  const variants = {
    user_history: { icon: '🧠', color: 'bg-green-100 text-green-800' },
    system_keywords: { icon: '🔑', color: 'bg-blue-100 text-blue-800' },
    ai: { icon: '🤖', color: 'bg-purple-100 text-purple-800' }
  };

  return (
    <Badge className={variants[source].color}>
      {variants[source].icon} {source} ({Math.round(confidence * 100)}%)
    </Badge>
  );
};
```

#### **9.2 Categorization Analytics Dashboard**
```typescript
// File: src/components/analytics/CategorizationAnalytics.tsx
export const CategorizationAnalytics = () => {
  // Show categorization accuracy metrics
  // Display learning progress
  // Show most common categorization sources
};
```

### **Day 10: Documentation and Polish**

#### **10.1 Update Documentation**
- Update `README.md` with new categorization features
- Create user guide for categorization system
- Document API changes and new endpoints

#### **10.2 Final Testing and Deployment**
```bash
# Run full test suite
npm run test:all

# Deploy to staging
npm run deploy:staging

# User acceptance testing
npm run test:uat
```

## Migration Strategy

### **Rollout Plan**

#### **Week 1: Foundation**
- Deploy database changes
- Implement core components
- Internal testing

#### **Week 2: Integration**
- Deploy to staging environment
- Integration testing
- Performance testing

#### **Week 3: Production Rollout**
- Deploy to production with feature flag
- Gradual rollout to 10% of users
- Monitor metrics and performance

#### **Week 4: Full Deployment**
- Roll out to 100% of users
- Remove feature flag
- Monitor and optimize

### **Rollback Plan**
- Keep current categorization system as fallback
- Feature flag to switch between old and new systems
- Database rollback scripts ready
- Monitoring alerts for accuracy degradation

## Success Metrics

### **Technical Metrics**
- **Categorization Speed**: < 100ms per transaction
- **User History Hit Rate**: > 60% within 3 months
- **System Keyword Hit Rate**: > 25% consistently
- **AI Fallback Rate**: < 15% after 6 months
- **Database Query Performance**: < 50ms for history lookups

### **User Experience Metrics**
- **User Correction Rate**: < 10% after 3 months
- **Time to Categorize**: 50% reduction in manual categorization
- **User Satisfaction**: > 4.5/5 rating for categorization accuracy
- **Learning Curve**: 80% accuracy within first 50 transactions

### **Business Metrics**
- **Reduced Support Tickets**: 50% reduction in categorization-related issues
- **User Retention**: 20% improvement in monthly active users
- **Feature Adoption**: 90% of users using CSV upload feature

## Risk Mitigation

### **Technical Risks**
- **Database Performance**: Implement proper indexing and query optimization
- **AI API Reliability**: Implement circuit breakers and fallback mechanisms
- **Migration Complexity**: Use feature flags and gradual rollout

### **User Experience Risks**
- **Accuracy Concerns**: Transparent confidence scoring and easy corrections
- **Learning Period**: Clear communication about system improvement over time
- **Privacy Concerns**: Clear data usage policies and opt-out options

## Conclusion

This implementation plan provides a structured approach to building the Smart Categorization System. By following this plan, we can deliver a sophisticated, learning-based categorization system that provides personalized accuracy while maintaining reliability and performance.

The key to success is the incremental approach, allowing for testing and validation at each phase while maintaining the ability to rollback if issues arise. The focus on user history as the primary intelligence source ensures that the system becomes more valuable over time, creating a true competitive advantage.
