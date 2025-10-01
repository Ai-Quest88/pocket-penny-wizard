# Smart Categorization System Design

## Executive Summary

The Smart Categorization System is a **learning-first approach** that prioritizes user behavior patterns over hard-coded rules. It uses a three-tier strategy: User History → System Keywords → AI Fallback, creating a personalized categorization system that improves over time.

## Core Philosophy

> **"The best categorization is the one that learns from what users actually do, not what we think they should do."**

## System Architecture

### **Three-Tier Categorization Flow**

```
Transaction Input
       ↓
1. User History Lookup (Personal Patterns)
       ↓ (if no match)
2. System Keyword Rules (Common Patterns)
       ↓ (if no match)
3. AI Categorization (Fallback)
       ↓
Final Category Assignment
```

## Detailed Component Design

### **1. User History Lookup (Primary Intelligence)**

**Purpose**: Learn from user's actual categorization behavior
**Confidence**: 90-95% (highest priority)

```typescript
class UserHistoryMatcher {
  async findSimilarTransaction(transaction: TransactionData, userId: string) {
    const { data } = await supabase
      .from('transactions')
      .select(`
        description,
        category_id,
        categories(name),
        amount,
        date
      `)
      .eq('user_id', userId)
      .not('category_id', 'is', null)
      .order('date', { ascending: false })
      .limit(100);
    
    // Find similar descriptions using fuzzy matching
    for (const historicalTx of data) {
      const similarity = this.calculateSimilarity(
        transaction.description, 
        historicalTx.description
      );
      
      if (similarity > 0.7) {
        return {
          category: historicalTx.categories.name,
          confidence: similarity,
          source: 'user_history',
          reasoning: `Similar to previous transaction: "${historicalTx.description}"`
        };
      }
    }
    
    return null;
  }
  
  private calculateSimilarity(desc1: string, desc2: string): number {
    // Implement fuzzy string matching
    // Consider merchant names, amounts, patterns
    // Return similarity score 0-1
  }
}
```

**Key Features**:
- **Fuzzy matching** for similar transaction descriptions
- **Amount context** (similar amounts for same merchant)
- **Time decay** (recent transactions weighted higher)
- **Pattern recognition** (merchant name extraction)

### **2. System Keyword Rules (Common Patterns)**

**Purpose**: Handle universal patterns that apply to all users
**Confidence**: 80-85% (medium priority)

```sql
-- System-wide keyword rules table
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

-- Example system rules
INSERT INTO system_keyword_rules (keywords, category_name, confidence, priority) VALUES
  (ARRAY['uber eats', 'ubereats'], 'Food & Dining', 0.95, 10),
  (ARRAY['woolworths', 'coles', 'aldi'], 'Food & Dining', 0.9, 20),
  (ARRAY['linkt', 'eastlink', 'citylink'], 'Transportation', 0.9, 20),
  (ARRAY['salary', 'payroll', 'wage'], 'Salary', 0.85, 30),
  (ARRAY['bpay', 'bill payment'], 'Account Transfer', 0.8, 40);
```

**Key Features**:
- **Priority-based matching** (specific rules before general ones)
- **Multi-keyword support** (arrays of related keywords)
- **Confidence scoring** (how certain we are about the match)
- **Easy maintenance** (database-driven, no code changes)

### **3. AI Categorization (Intelligent Fallback)**

**Purpose**: Handle completely new patterns and edge cases
**Confidence**: 70-80% (lowest priority)

```typescript
class AICategorizer {
  async categorize(transaction: TransactionData, userId: string) {
    // Enhanced AI prompt with user context derived from transactions
    const userContext = await this.getUserContextFromTransactions(userId);
    const prompt = `
      Categorize this Australian transaction for a user with these preferences:
      - Previous categories: ${userContext.mostUsedCategories}
      - Transaction: "${transaction.description}" - $${transaction.amount}
      - Date: ${transaction.date}
      
      Choose from these categories: ${await this.getAvailableCategories()}
      Provide reasoning for your choice.
    `;
    
    const response = await this.callGeminiAPI(prompt);
    return this.parseAIResponse(response);
  }

  private async getUserContextFromTransactions(userId: string) {
    const { data } = await supabase
      .from('transactions')
      .select('category_id, categories(name)')
      .eq('user_id', userId)
      .not('category_id', 'is', null);
    
    // Count usage and return most used categories
    // No separate preferences table needed!
    return this.analyzeCategoryUsage(data);
  }
}
```

**Key Features**:
- **User context awareness** (learns from user's category usage)
- **Enhanced prompts** (includes transaction amount, date, user preferences)
- **Reasoning explanation** (why this category was chosen)
- **Fallback confidence** (lower confidence allows user override)

## Database Schema

### **Core Tables**

```sql
-- Enhanced transactions table (already exists)
-- Add categorization metadata
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS 
  categorization_source VARCHAR(50) DEFAULT 'ai',
  categorization_confidence DECIMAL(3,2) DEFAULT 0.5,
  categorization_reasoning TEXT;

-- System keyword rules (new)
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

-- Note: User preferences are derived directly from transactions table
-- No separate user_categorization_preferences table needed!
```

## Implementation Benefits

### **1. Personalization**
- **Learns individual patterns**: Each user's categorization improves over time
- **Respects user preferences**: Uses actual user behavior, not assumptions
- **Adapts to changes**: Automatically adjusts as user's spending patterns change

### **2. Accuracy**
- **Higher success rate**: User history provides 90-95% accuracy
- **Reduced errors**: System keywords handle common patterns reliably
- **Smart fallbacks**: AI handles edge cases intelligently

### **3. Maintainability**
- **No hard-coded rules**: All rules stored in database
- **Easy updates**: New keywords added without code changes
- **Self-improving**: System gets better with usage
- **Simplified architecture**: Only 2 tables needed (transactions + system_keyword_rules)

### **4. Performance**
- **Fast lookups**: Database indexes for quick keyword matching
- **Reduced AI calls**: Only use AI when necessary
- **Caching potential**: User history can be cached from transactions table

## User Experience Flow

### **First-Time User**
```
1. Upload CSV → AI categorizes everything
2. User reviews and corrects → Corrections become history
3. Next similar transaction → Uses corrected category
4. System learns and improves
```

### **Experienced User**
```
1. Upload CSV → Most transactions categorized from history
2. Few corrections needed → System is already learning
3. New merchants → AI handles intelligently
4. Continuous improvement
```

## Migration Strategy

### **Phase 1: Foundation (Week 1)**
- Create database schema
- Implement UserHistoryMatcher
- Basic system keyword rules

### **Phase 2: Integration (Week 2)**
- Integrate with existing categorization flow
- Update UI to show categorization sources
- Add confidence indicators

### **Phase 3: Enhancement (Week 3)**
- Advanced fuzzy matching
- User preference learning
- Performance optimization

### **Phase 4: Polish (Week 4)**
- UI improvements
- Analytics and insights
- Documentation and testing

## Success Metrics

### **Accuracy Metrics**
- **User History Hit Rate**: % of transactions matched from history
- **System Keyword Hit Rate**: % of transactions matched by keywords
- **AI Fallback Rate**: % of transactions requiring AI
- **User Correction Rate**: % of transactions user needs to correct

### **Performance Metrics**
- **Categorization Speed**: Average time per transaction
- **Database Query Performance**: Lookup times for history/keywords
- **AI API Usage**: Reduction in AI calls over time

### **User Experience Metrics**
- **Time to Categorize**: Reduction in manual categorization time
- **User Satisfaction**: Feedback on categorization accuracy
- **Learning Curve**: How quickly system learns user patterns

## Risk Mitigation

### **Technical Risks**
- **Database Performance**: Proper indexing and query optimization
- **AI API Reliability**: Graceful fallbacks and error handling
- **Migration Complexity**: Incremental rollout with rollback capability

### **User Experience Risks**
- **Learning Period**: Clear communication about system improvement
- **Accuracy Expectations**: Transparent confidence scoring
- **Privacy Concerns**: Clear data usage policies

## Conclusion

The Smart Categorization System represents a fundamental shift from rule-based to behavior-based categorization. By prioritizing user history and learning from actual usage patterns, the system provides personalized, accurate categorization that improves over time while maintaining the reliability of system rules and the intelligence of AI fallbacks.

**Key Success Factors**:
1. **User history as primary intelligence**
2. **Database-driven system rules**
3. **AI as intelligent fallback**
4. **Continuous learning and improvement**
5. **Transparent confidence scoring**

This approach delivers the accuracy and personalization that users expect while maintaining the reliability and performance that developers need.
