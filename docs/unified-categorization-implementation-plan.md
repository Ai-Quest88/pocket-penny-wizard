# Unified Categorization Implementation Plan
## Priority System: User Rules → System Rules → AI → Uncategorized

### Executive Summary

This plan outlines the implementation of a unified categorization system that follows a priority-based approach: **User Rules** (highest priority) → **System Rules** → **AI Categorization** → **Uncategorized** (fallback). The system will be invisible to users, automatically learning from their corrections without requiring manual rule management.

### Current State Analysis

**What We Have:**
- Basic AI categorization using Google Gemini
- Hardcoded rule-based fallback (50+ Australian merchant patterns)
- CSV upload with manual review
- Hierarchical category structure

**What We Need to Build:**
- Database-driven system rules
- User-defined categorization rules
- Automatic learning from corrections
- Priority-based categorization logic
- Invisible operation (no manual rule management UI)

### Implementation Phases

## Phase 1: Database Schema & Backend Foundation (Week 1)

### 1.1 Database Schema Creation

**New Tables:**
```sql
-- System categorization rules (built-in patterns)
CREATE TABLE system_categorization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.9,
    conditions JSONB DEFAULT '{}',
    mcc_codes VARCHAR(10)[], -- Merchant Category Codes
    country VARCHAR(2) DEFAULT 'AU',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User categorization rules (learned from corrections)
CREATE TABLE user_categorization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.95,
    conditions JSONB DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rule change history for audit
CREATE TABLE rule_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL,
    rule_type VARCHAR(20) NOT NULL, -- 'user' or 'system'
    action VARCHAR(20) NOT NULL, -- 'created', 'updated', 'deleted'
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categorization logs for analysis
CREATE TABLE categorization_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    original_category VARCHAR(100),
    final_category VARCHAR(100),
    categorization_source VARCHAR(20) NOT NULL, -- 'user_rule', 'system_rule', 'ai', 'uncategorized'
    rule_id UUID,
    confidence DECIMAL(3,2),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 1.2 Initial System Rules Data

**Seed Data:**
```sql
INSERT INTO system_categorization_rules (pattern, category, confidence, country) VALUES
-- Supermarkets
('Coles', 'Supermarket', 0.95, 'AU'),
('Woolworths', 'Supermarket', 0.95, 'AU'),
('IGA', 'Supermarket', 0.95, 'AU'),

-- Transport
('Uber', 'Transport', 0.95, 'AU'),
('Shell', 'Transport', 0.95, 'AU'),
('BP', 'Transport', 0.95, 'AU'),
('Opal', 'Transport', 0.95, 'AU'),

-- Entertainment
('Netflix', 'Entertainment', 0.95, 'AU'),
('Spotify', 'Entertainment', 0.95, 'AU'),

-- Fast Food
('McDonald', 'Fast Food', 0.95, 'AU'),
('KFC', 'Fast Food', 0.95, 'AU'),

-- Coffee
('Starbucks', 'Coffee', 0.9, 'AU'),
('Gloria Jeans', 'Coffee', 0.9, 'AU');
```

### 1.3 Row Level Security Policies

```sql
-- System rules: Read-only for all authenticated users
CREATE POLICY "Allow authenticated users to read system rules" 
ON system_categorization_rules FOR SELECT 
USING (auth.role() = 'authenticated');

-- User rules: Full CRUD for own rules
CREATE POLICY "Users can manage their own rules" 
ON user_categorization_rules FOR ALL 
USING (auth.uid() = user_id);

-- Logs: Users can read their own logs
CREATE POLICY "Users can read their own categorization logs" 
ON categorization_logs FOR SELECT 
USING (auth.uid() = user_id);
```

## Phase 2: Edge Functions Implementation (Week 2)

### 2.1 Unified Categorization Function

**File:** `supabase/functions/unified-categorization/index.ts`

**Core Logic:**
```typescript
interface CategorizationRequest {
  description: string;
  amount: number;
  userId: string;
  date?: string;
}

interface CategorizationResponse {
  success: boolean;
  category: string;
  confidence: number;
  source: 'user_rule' | 'system_rule' | 'ai' | 'uncategorized';
  ruleId?: string;
  processingTimeMs: number;
  message: string;
}

async function categorizeTransaction(request: CategorizationRequest): Promise<CategorizationResponse> {
  const startTime = Date.now();
  
  try {
    // Step 1: Check User Rules (highest priority)
    const userRule = await getUserRule(request.description, request.userId);
    if (userRule) {
      return {
        success: true,
        category: userRule.category,
        confidence: userRule.confidence,
        source: 'user_rule',
        ruleId: userRule.id,
        processingTimeMs: Date.now() - startTime,
        message: 'Categorized using user rule'
      };
    }
    
    // Step 2: Check System Rules
    const systemRule = await getSystemRule(request.description);
    if (systemRule) {
      return {
        success: true,
        category: systemRule.category,
        confidence: systemRule.confidence,
        source: 'system_rule',
        ruleId: systemRule.id,
        processingTimeMs: Date.now() - startTime,
        message: 'Categorized using system rule'
      };
    }
    
    // Step 3: AI Categorization
    const aiResult = await getAICategorization(request.description, request.amount);
    if (aiResult.success && aiResult.confidence > 0.7) {
      return {
        success: true,
        category: aiResult.category,
        confidence: aiResult.confidence,
        source: 'ai',
        processingTimeMs: Date.now() - startTime,
        message: 'Categorized using AI'
      };
    }
    
    // Step 4: Fallback to Uncategorized
    return {
      success: true,
      category: 'Uncategorized',
      confidence: 0.5,
      source: 'uncategorized',
      processingTimeMs: Date.now() - startTime,
      message: 'No categorization found'
    };
    
  } catch (error) {
    return {
      success: false,
      category: 'Uncategorized',
      confidence: 0.0,
      source: 'uncategorized',
      processingTimeMs: Date.now() - startTime,
      message: `Error: ${error.message}`
    };
  }
}
```

### 2.2 Rule Learning Function

**File:** `supabase/functions/rule-learning/index.ts`

**Core Logic:**
```typescript
interface RuleLearningRequest {
  action: 'create_from_correction' | 'update_rule_stats';
  userId: string;
  correction?: {
    transactionId: string;
    description: string;
    amount: number;
    originalCategory: string;
    correctedCategory: string;
    reason: string;
  };
  ruleId?: string;
  success?: boolean;
}

async function learnFromCorrection(request: RuleLearningRequest) {
  if (request.action === 'create_from_correction' && request.correction) {
    const { description, correctedCategory, userId } = request.correction;
    
    // Extract pattern from description
    const pattern = extractPattern(description);
    
    // Create or update user rule
    await createOrUpdateUserRule({
      userId,
      pattern,
      category: correctedCategory,
      confidence: 0.95
    });
    
    // Log the learning event
    await logRuleLearning({
      userId,
      pattern,
      originalCategory: request.correction.originalCategory,
      correctedCategory,
      reason: request.correction.reason
    });
  }
}
```

### 2.3 Rule Management Function

**File:** `supabase/functions/manage-rules/index.ts`

**Core Logic:**
```typescript
interface RuleManagementRequest {
  action: 'get_user_rules' | 'create_rule' | 'update_rule' | 'delete_rule';
  userId: string;
  rule?: {
    pattern: string;
    category: string;
    confidence: number;
    conditions?: any;
  };
  ruleId?: string;
}

async function manageUserRules(request: RuleManagementRequest) {
  switch (request.action) {
    case 'get_user_rules':
      return await getUserRules(request.userId);
    case 'create_rule':
      return await createUserRule(request.userId, request.rule);
    case 'update_rule':
      return await updateUserRule(request.ruleId, request.rule);
    case 'delete_rule':
      return await deleteUserRule(request.ruleId);
  }
}
```

## Phase 3: Frontend Integration (Week 3)

### 3.1 Update CSV Upload Flow

**File:** `src/components/transaction-forms/UnifiedCsvUpload.tsx`

**Changes:**
```typescript
// Replace AI discovery with unified categorization
const categorizeTransactions = async (transactions: TransactionData[]) => {
  const results = [];
  
  for (const transaction of transactions) {
    const result = await supabase.functions.invoke('unified-categorization', {
      body: {
        description: transaction.description,
        amount: transaction.amount,
        userId: session.user.id,
        date: transaction.date
      },
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    results.push({
      ...transaction,
      category: result.data.category,
      confidence: result.data.confidence,
      source: result.data.source
    });
  }
  
  return results;
};
```

### 3.2 Update Category Confirmation Dialog

**File:** `src/components/CategoryConfirmationDialog.tsx`

**Changes:**
```typescript
// Add automatic learning from corrections
const handleConfirm = async () => {
  // Auto-learn from user corrections
  if (session?.user) {
    await autoLearnFromCorrections();
  }
  
  onConfirm(modifiedSuggestions);
};

const autoLearnFromCorrections = async () => {
  const corrections = modifiedSuggestions.filter(s => 
    s.userCategory && s.userCategory !== s.suggestedCategory
  );

  for (const correction of corrections) {
    await supabase.functions.invoke('rule-learning', {
      body: {
        action: 'create_from_correction',
        userId: session.user.id,
        correction: {
          transactionId: correction.id,
          description: correction.description,
          amount: correction.amount,
          originalCategory: correction.suggestedCategory,
          correctedCategory: correction.userCategory,
          reason: 'User correction during categorization review'
        }
      },
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
  }
};
```

### 3.3 Remove Manual Rule Management UI

**Files to Update:**
- Remove `src/components/categorization/RuleManager.tsx` (if exists)
- Update `src/pages/Settings.tsx` to remove rule management section
- Update any references to manual rule management

## Phase 4: Testing & Validation (Week 4)

### 4.1 Unit Tests

**Test Files:**
- `tests/unit/unified-categorization.test.ts`
- `tests/unit/rule-learning.test.ts`
- `tests/unit/priority-system.test.ts`

### 4.2 Integration Tests

**Test Files:**
- `tests/integration/csv-upload-categorization.test.ts`
- `tests/integration/rule-learning-flow.test.ts`

### 4.3 End-to-End Tests

**Test Files:**
- `tests/e2e/unified-categorization-flow.spec.ts`
- `tests/e2e/automatic-learning.spec.ts`

### 4.4 Performance Testing

- Test categorization speed with large CSV files
- Test AI API rate limiting and fallback
- Test database query performance

## Phase 5: Deployment & Monitoring (Week 5)

### 5.1 Database Migration

```bash
# Apply new schema
supabase db push

# Seed initial system rules
supabase db reset --linked
```

### 5.2 Edge Function Deployment

```bash
# Deploy new functions
supabase functions deploy unified-categorization
supabase functions deploy rule-learning
supabase functions deploy manage-rules
```

### 5.3 Monitoring Setup

- Add logging for categorization decisions
- Monitor AI API usage and costs
- Track rule learning effectiveness
- Monitor system performance

## Success Metrics

### Technical Metrics
- **Categorization Accuracy**: >90% for known patterns
- **Processing Speed**: <2 seconds per transaction
- **AI Fallback Rate**: <20% of transactions
- **Rule Learning Success**: >80% of corrections create effective rules

### User Experience Metrics
- **User Satisfaction**: >4.5/5 rating for categorization
- **Manual Override Rate**: <10% of transactions
- **Time to Categorize**: <30 seconds for 100 transactions

## Risk Mitigation

### Technical Risks
1. **AI API Failures**: Comprehensive fallback to rule-based system
2. **Database Performance**: Proper indexing and query optimization
3. **Rule Conflicts**: Priority system with clear resolution rules

### User Experience Risks
1. **Learning Curve**: Invisible operation, no manual rule management
2. **Incorrect Learning**: Confidence scoring and manual override options
3. **Performance Issues**: Progressive loading and caching

## Timeline Summary

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Database & Backend | Schema, system rules, RLS policies |
| 2 | Edge Functions | unified-categorization, rule-learning, manage-rules |
| 3 | Frontend Integration | Updated CSV upload, category confirmation, UI cleanup |
| 4 | Testing | Unit, integration, and E2E tests |
| 5 | Deployment | Migration, deployment, monitoring |

## Conclusion

This implementation plan provides a comprehensive roadmap for building a sophisticated, invisible categorization system that automatically learns from user behavior while maintaining high accuracy and performance. The priority-based approach ensures that user preferences are always respected while providing intelligent fallbacks for unknown patterns.
