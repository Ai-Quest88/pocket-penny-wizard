# Quick Start Implementation Guide
## Unified Categorization System: User Rules → System Rules → AI → Uncategorized

### 🚀 Get Started in 5 Steps

This guide provides a quick path to implement the unified categorization system. Follow these steps to get the basic system working, then expand with advanced features.

## Step 1: Create Database Schema (30 minutes)

### 1.1 Create Migration

```bash
supabase migration new unified_categorization_schema
```

### 1.2 Add Schema to Migration

```sql
-- System categorization rules
CREATE TABLE system_categorization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.9,
    country VARCHAR(2) DEFAULT 'AU',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User categorization rules
CREATE TABLE user_categorization_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.95,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE system_categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_categorization_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read system rules" 
ON system_categorization_rules FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own rules" 
ON user_categorization_rules FOR ALL 
USING (auth.uid() = user_id);

-- Insert initial system rules
INSERT INTO system_categorization_rules (pattern, category, confidence) VALUES
('Coles', 'Supermarket', 0.95),
('Woolworths', 'Supermarket', 0.95),
('Uber', 'Transport', 0.95),
('Shell', 'Transport', 0.95),
('Netflix', 'Entertainment', 0.95);
```

### 1.3 Apply Migration

```bash
supabase db push
```

## Step 2: Create Unified Categorization Function (45 minutes)

### 2.1 Create Function

```bash
supabase functions new unified-categorization
```

### 2.2 Implement Function

```typescript
// supabase/functions/unified-categorization/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { description, amount, userId } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const startTime = Date.now();

    // Step 1: Check User Rules (highest priority)
    const { data: userRule } = await supabase
      .from('user_categorization_rules')
      .select('*')
      .eq('user_id', userId)
      .ilike('pattern', `%${description}%`)
      .single();

    if (userRule) {
      return new Response(JSON.stringify({
        success: true,
        category: userRule.category,
        confidence: userRule.confidence,
        source: 'user_rule',
        ruleId: userRule.id,
        processingTimeMs: Date.now() - startTime,
        message: 'Categorized using user rule'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 2: Check System Rules
    const { data: systemRule } = await supabase
      .from('system_categorization_rules')
      .select('*')
      .ilike('pattern', `%${description}%`)
      .eq('is_active', true)
      .single();

    if (systemRule) {
      return new Response(JSON.stringify({
        success: true,
        category: systemRule.category,
        confidence: systemRule.confidence,
        source: 'system_rule',
        ruleId: systemRule.id,
        processingTimeMs: Date.now() - startTime,
        message: 'Categorized using system rule'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 3: AI Categorization (simplified for quick start)
    const aiCategory = await getAICategorization(description, amount);
    if (aiCategory) {
      return new Response(JSON.stringify({
        success: true,
        category: aiCategory,
        confidence: 0.8,
        source: 'ai',
        processingTimeMs: Date.now() - startTime,
        message: 'Categorized using AI'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Step 4: Fallback to Uncategorized
    return new Response(JSON.stringify({
      success: true,
      category: 'Uncategorized',
      confidence: 0.5,
      source: 'uncategorized',
      processingTimeMs: Date.now() - startTime,
      message: 'No categorization found'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function getAICategorization(description: string, amount: number): Promise<string | null> {
  // Simplified AI categorization for quick start
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('netflix') || lowerDesc.includes('spotify')) return 'Entertainment';
  if (lowerDesc.includes('mcdonald') || lowerDesc.includes('kfc')) return 'Fast Food';
  if (lowerDesc.includes('starbucks') || lowerDesc.includes('coffee')) return 'Coffee';
  
  return null;
}
```

### 2.3 Deploy Function

```bash
supabase functions deploy unified-categorization
```

## Step 3: Update Frontend (30 minutes)

### 3.1 Update CSV Upload Helper

```typescript
// src/components/transaction-forms/csv-upload/helpers/transactionInsertion.ts
// Replace the discoverCategories method

async discoverCategories(transactions: TransactionData[]): Promise<CategoryDiscoveryResult[]> {
  const results = [];
  
  for (const transaction of transactions) {
    try {
      const { data, error } = await this.supabase.functions.invoke('unified-categorization', {
        body: {
          description: transaction.description,
          amount: transaction.amount,
          userId: this.userId
        },
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (error) throw error;

      results.push({
        category: data.category,
        confidence: data.confidence,
        is_new_category: data.source === 'ai',
        source: data.source
      });
    } catch (error) {
      // Fallback to existing logic
      const category = this.getFallbackCategory(transaction.description);
      results.push({
        category,
        confidence: 0.8,
        is_new_category: false,
        source: 'fallback'
      });
    }
  }
  
  return results;
}
```

### 3.2 Update Category Confirmation Dialog

```typescript
// src/components/CategoryConfirmationDialog.tsx
// Add automatic learning from corrections

const autoLearnFromCorrections = async () => {
  const corrections = modifiedSuggestions.filter(s => 
    s.userCategory && s.userCategory !== s.suggestedCategory
  );

  for (const correction of corrections) {
    try {
      await supabase.functions.invoke('rule-learning', {
        body: {
          action: 'create_from_correction',
          userId: session.user.id,
          correction: {
            description: correction.description,
            originalCategory: correction.suggestedCategory,
            correctedCategory: correction.userCategory
          }
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error('Error learning from correction:', error);
    }
  }
};

// Add to handleConfirm
const handleConfirm = async () => {
  if (session?.user) {
    await autoLearnFromCorrections();
  }
  onConfirm(modifiedSuggestions);
};
```

## Step 4: Create Rule Learning Function (30 minutes)

### 4.1 Create Function

```bash
supabase functions new rule-learning
```

### 4.2 Implement Function

```typescript
// supabase/functions/rule-learning/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, userId, correction } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (action === 'create_from_correction' && correction) {
      const { description, correctedCategory } = correction;
      
      // Extract pattern from description
      const pattern = extractPattern(description);
      
      // Create or update user rule
      const { data, error } = await supabase
        .from('user_categorization_rules')
        .upsert({
          user_id: userId,
          pattern,
          category: correctedCategory,
          confidence: 0.95
        }, {
          onConflict: 'user_id,pattern'
        });

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        message: 'Rule created successfully'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid action'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function extractPattern(description: string): string {
  // Simple pattern extraction - can be enhanced later
  return description.toLowerCase().trim();
}
```

### 4.3 Deploy Function

```bash
supabase functions deploy rule-learning
```

## Step 5: Test the System (15 minutes)

### 5.1 Test with Curl

```bash
# Test unified categorization
curl -X POST "https://your-project.supabase.co/functions/v1/unified-categorization" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"description": "Coles Supermarket", "amount": -45.67, "userId": "test-user"}'

# Expected response:
# {"success":true,"category":"Supermarket","confidence":0.95,"source":"system_rule","message":"Categorized using system rule"}
```

### 5.2 Test CSV Upload

1. Upload a CSV with transactions
2. Check that categorization works
3. Override a category
4. Verify that the correction creates a user rule

## 🎉 Quick Start Complete!

You now have a working unified categorization system with:
- ✅ Priority-based categorization (User Rules → System Rules → AI → Uncategorized)
- ✅ Database-driven system rules
- ✅ Automatic learning from user corrections
- ✅ Invisible operation (no manual rule management)

## Next Steps

### Immediate Enhancements (Week 1)
1. **Add more system rules** to the database
2. **Improve AI categorization** with Google Gemini integration
3. **Add pattern matching** with fuzzy search
4. **Implement rule statistics** tracking

### Advanced Features (Week 2-3)
1. **Rule management API** for admin functions
2. **Categorization analytics** dashboard
3. **Performance optimization** with caching
4. **Advanced pattern recognition** with ML

### Production Readiness (Week 4-5)
1. **Comprehensive testing** suite
2. **Monitoring and logging** setup
3. **Performance benchmarking**
4. **Security audit** and hardening

## Troubleshooting

### Common Issues

**Function not found:**
```bash
# Check if function is deployed
supabase functions list

# Redeploy if needed
supabase functions deploy unified-categorization
```

**Database connection errors:**
```bash
# Check environment variables
supabase status

# Reset database if needed
supabase db reset --linked
```

**CORS errors:**
- Ensure CORS headers are set in functions
- Check that frontend is calling from allowed origins

### Debug Mode

Add debug logging to functions:
```typescript
console.log('Processing request:', { description, amount, userId });
console.log('User rule found:', userRule);
console.log('System rule found:', systemRule);
```

## Success Metrics

After implementation, you should see:
- **Categorization accuracy**: >90% for known patterns
- **Processing speed**: <2 seconds per transaction
- **User satisfaction**: Reduced manual categorization
- **Learning effectiveness**: Rules created from corrections

This quick start guide gets you 80% of the way to a production-ready unified categorization system. The remaining 20% involves optimization, testing, and advanced features.
