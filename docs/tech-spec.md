# Pocket Penny Wizard - Technical Specification

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema & Data Models](#database-schema--data-models)
3. [API & Integration Layer](#api--integration-layer)
4. [Component Architecture](#component-architecture)
5. [Security Implementation](#security-implementation)
6. [Performance & Scalability](#performance--scalability)
7. [Development Environment](#development-environment)
8. [Deployment Pipeline](#deployment-pipeline)
9. [Code Quality & Standards](#code-quality--standards)

---

## System Architecture

### Frontend Technology Stack
```
React 18.3.1 (Main Framework)
├── TypeScript 5.5.3        (Type safety & developer experience)
├── Vite 5.4.1              (Build tool & development server)
├── TailwindCSS 3.4.11      (Utility-first CSS framework)
├── shadcn/ui                (Modern component library)
├── Radix UI primitives      (Accessible, unstyled components)
├── React Router DOM 6.26.2  (Client-side routing)
├── TanStack React Query 5.56.2 (Server state management)
├── React Hook Form 7.53.0   (Form handling)
├── Zod 3.23.8              (Schema validation)
├── Recharts 2.12.7         (Data visualization)
├── React Dropzone 14.3.8   (File upload handling)
├── Date-fns 3.6.0          (Date manipulation)
└── Lucide React 0.462.0    (Icon library)
```

### Backend Infrastructure
**Supabase (Backend-as-a-Service)**
- **PostgreSQL Database**: Primary data storage with Row Level Security
- **Supabase Auth**: Authentication & session management
- **Edge Functions**: Deno-based serverless compute for AI processing
- **Storage**: File upload & document storage
- **Real-time**: WebSocket connections for live data updates

### External Services Integration
**Google Gemini AI**
- Model: `gemini-1.5-flash` (primary AI model)
- Batch Processing: 100 transactions per request
- Australian Context: Specialized banking prompts
- Fallback System: Rule-based categorization

**Exchange Rates API**
- Provider: `open.er-api.com`
- Base Currency: USD with AUD optimization
- Cache Duration: 24 hours with fallback rates
- Support: 30+ major currencies

---

## Database Schema & Data Models

### Core Table Structure

#### User Management
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    full_name TEXT,
    currency_preference TEXT DEFAULT 'AUD',
    notification_settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Entity Management
```sql
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Individual', 'Family Member', 'Business', 'Trust', 'Super Fund')),
    country_of_residence TEXT NOT NULL DEFAULT 'Australia',
    tax_identifier TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Financial Accounts
```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    entity_id UUID NOT NULL REFERENCES entities(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Cash', 'Investment', 'Property', 'Vehicle', 'Other')),
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    opening_balance_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE liabilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    entity_id UUID NOT NULL REFERENCES entities(id),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Credit Card', 'Personal Loan', 'Mortgage', 'Business Loan', 'Other')),
    amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    opening_balance_date DATE NOT NULL DEFAULT CURRENT_DATE
);
```

#### Transaction Data
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AUD',
    date DATE NOT NULL,
    category TEXT NOT NULL,
    asset_account_id UUID REFERENCES assets(id),
    liability_account_id UUID REFERENCES liabilities(id),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT transactions_single_account_check 
    CHECK (
        (asset_account_id IS NOT NULL AND liability_account_id IS NULL) OR
        (asset_account_id IS NULL AND liability_account_id IS NOT NULL) OR
        (asset_account_id IS NULL AND liability_account_id IS NULL)
    )
);
```

### TypeScript Data Models
```typescript
// Core entity types
export type EntityType = 'Individual' | 'Family Member' | 'Business' | 'Trust' | 'Super Fund';
export type AssetCategory = 'Cash' | 'Investment' | 'Property' | 'Vehicle' | 'Other';
export type LiabilityCategory = 'Credit Card' | 'Personal Loan' | 'Mortgage' | 'Business Loan' | 'Other';

// Transaction interface
export interface Transaction {
  id: string
  description: string
  amount: number
  currency: string
  date: string
  category: string
  asset_account_id?: string
  liability_account_id?: string
  comment?: string
  user_id: string
}

// Transaction categories (42 predefined categories)
export const categories = [
  'Groceries', 'Restaurants', 'Gas & Fuel', 'Shopping', 'Entertainment',
  'Healthcare', 'Insurance', 'Utilities', 'Transportation', 'Education',
  'Travel', 'Gifts & Donations', 'Personal Care', 'Professional Services',
  'Home & Garden', 'Electronics', 'Clothing', 'Books', 'Subscriptions',
  'Banking', 'Investment', 'Taxes', 'Legal', 'Uncategorized', 'Transfer In', 
  'Transfer Out', 'Internal Transfer', 'Income', 'Salary', 'Business', 
  'Freelance', 'Interest', 'Dividends', 'Other Income', 'Rental Income', 
  'Government Benefits', 'Pension', 'Child Support', 'Alimony', 
  'Gifts Received', 'Refunds', 'Cryptocurrency', 'Fast Food', 
  'Public Transport', 'Tolls', 'Food Delivery'
];
```

### Database Performance Optimization
```sql
-- Critical indexes for query performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_entities_user_id ON entities(user_id);
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_liabilities_user_id ON liabilities(user_id);
```

---

## API & Integration Layer

### Supabase Client Configuration
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### AI Categorization Edge Function
```typescript
// supabase/functions/categorize-transaction/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface CategoryRequest {
  description: string;
  descriptions?: string[];
  userId: string;
  batchMode?: boolean;
}

const geminiApiKey = Deno.env.get('VITE_GEMINI_API_KEY');
const BATCH_SIZE = 100; // Optimal for accuracy

serve(async (req) => {
  try {
    const body: CategoryRequest = await req.json();
    
    if (body.batchMode && body.descriptions) {
      // Process in chunks for optimal performance
      const chunks = chunkArray(body.descriptions, BATCH_SIZE);
      const allCategories: string[] = [];
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkCategories = await processBatch(chunks[i], body.userId);
        allCategories.push(...chunkCategories);
        
        // Rate limiting between chunks
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return new Response(JSON.stringify({ 
        categories: allCategories,
        source: 'gemini_ai_batch_chunked' 
      }));
    }

    // Single transaction processing
    const category = await processSingleTransaction(body.description);
    return new Response(JSON.stringify({ category, source: 'gemini_ai' }));

  } catch (error) {
    return new Response(JSON.stringify({ 
      category: 'Uncategorized', 
      source: 'error' 
    }), { status: 500 });
  }
});
```

### React Query Data Layer
```typescript
// Custom hooks for data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useTransactions = (userId: string, filters?: TransactionFilters) => {
  return useQuery({
    queryKey: ['transactions', userId, filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
      if (filters?.dateTo) query = query.lte('date', filters.dateTo);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
    },
  });
};
```

---

## Component Architecture

### Application Structure
```
src/
├── App.tsx                    # Root component with routing
├── main.tsx                   # Application entry point
├── components/                # Shared components
│   ├── ui/                   # shadcn/ui base components
│   ├── forms/                # Form-specific components
│   ├── charts/               # Chart components
│   └── layout/               # Layout components
├── pages/                    # Route components
├── contexts/                 # React Context providers
├── hooks/                    # Custom React hooks
├── utils/                    # Utility functions
├── types/                    # TypeScript type definitions
└── integrations/            # External service integrations
```

### Key Component Patterns

#### Protected Route Pattern
```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};
```

#### Form Component with Validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const transactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
});

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit }) => {
  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: { currency: 'AUD' }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
};
```

#### Context Providers
```typescript
// Authentication Context
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, session }}>{children}</AuthContext.Provider>;
};
```

---

## Security Implementation

### Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Example policy for transactions
CREATE POLICY "Users can view their own transactions" 
  ON transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
  ON transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

### Input Validation & Sanitization
```typescript
// Comprehensive validation schemas
export const transactionValidationSchema = z.object({
  description: z.string()
    .min(1, 'Description is required')
    .max(255, 'Description too long')
    .regex(/^[a-zA-Z0-9\s\-\.\,\(\)]+$/, 'Invalid characters'),
  amount: z.number()
    .min(0.01, 'Amount must be positive')
    .max(999999999.99, 'Amount too large'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  category: z.enum(categories),
  currency: z.string().length(3, 'Currency must be 3 characters'),
});
```

### Environment Variable Management
```typescript
interface EnvironmentVariables {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_GEMINI_API_KEY: string;
}

const validateEnvironment = (): EnvironmentVariables => {
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY,
  };

  for (const [key, value] of Object.entries(env)) {
    if (!value) throw new Error(`Missing required environment variable: ${key}`);
  }

  return env as EnvironmentVariables;
};
```

---

## Performance & Scalability

### Frontend Optimization

#### Code Splitting & Lazy Loading
```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));

const AppRoutes = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
    </Routes>
  </Suspense>
);
```

#### React Query Caching Strategy
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});
```

### Backend Performance

#### Database Query Optimization
```sql
-- Optimized transaction query with pagination
CREATE OR REPLACE FUNCTION get_user_transactions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  description TEXT,
  amount DECIMAL,
  currency TEXT,
  date DATE,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.description, t.amount, t.currency, t.date, t.category
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND (p_category IS NULL OR t.category = p_category)
  ORDER BY t.date DESC, t.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
```

#### AI Batch Processing
```typescript
// Optimized batch processing with controlled concurrency
const CONCURRENT_BATCHES = 3;
const BATCH_SIZE = 100;

export const processCategorization = async (
  descriptions: string[],
  userId: string,
  onProgress?: (completed: number, total: number) => void
) => {
  const batches = chunkArray(descriptions, BATCH_SIZE);
  const results: string[] = new Array(descriptions.length);
  
  for (let i = 0; i < batches.length; i += CONCURRENT_BATCHES) {
    const batchPromises = batches
      .slice(i, i + CONCURRENT_BATCHES)
      .map(async (batch, batchIndex) => {
        const actualIndex = i + batchIndex;
        const startIndex = actualIndex * BATCH_SIZE;
        
        try {
          const categories = await categorizeTransactionsBatch(batch, userId);
          categories.forEach((category, categoryIndex) => {
            results[startIndex + categoryIndex] = category;
          });
          
          onProgress?.(startIndex + batch.length, descriptions.length);
        } catch (error) {
          batch.forEach((_, categoryIndex) => {
            results[startIndex + categoryIndex] = 'Uncategorized';
          });
        }
      });
    
    await Promise.all(batchPromises);
    
    if (i + CONCURRENT_BATCHES < batches.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
};
```

---

## Development Environment

### Local Development Setup
```bash
# Environment setup
node --version  # Requires Node.js 18+
npm --version   # npm 9+

# Project initialization
git clone <repository-url>
cd pocket-penny-wizard
npm install

# Environment configuration
cp .env.example .env.local
# Edit .env.local with API keys

# Development server
npm run dev  # Starts on http://localhost:5173
```

### Development Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "preview": "vite preview",
    "supabase:gen-types": "supabase gen types typescript --local > src/integrations/supabase/types.ts"
  }
}
```

### Configuration Files

#### TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

#### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'chart-vendor': ['recharts'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
})
```

---

## Deployment Pipeline

### Vercel Deployment Configuration
```json
// vercel.json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "VITE_GEMINI_API_KEY": "@gemini-api-key"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### CI/CD Pipeline (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Type check
      run: npm run type-check
    
    - name: Lint
      run: npm run lint
    
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
    
    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-args: '--prod'
```

### Supabase Edge Functions Deployment
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy categorize-transaction

# Set environment variables
supabase secrets set VITE_GEMINI_API_KEY=your_api_key_here

# View function logs
supabase functions logs categorize-transaction
```

---

## Code Quality & Standards

### Code Style Guide
```typescript
// Naming conventions
interface ComponentProps {  // PascalCase for interfaces
  userName: string;         // camelCase for properties
  isActive: boolean;
  onUserClick: () => void;  // Event handlers prefixed with 'on'
}

const API_ENDPOINTS = {     // SCREAMING_SNAKE_CASE for constants
  TRANSACTIONS: '/api/transactions',
  USERS: '/api/users',
} as const;

// File naming conventions
// Components: PascalCase (UserProfile.tsx)
// Hooks: camelCase starting with 'use' (useUserData.ts)
// Utils: camelCase (currencyUtils.ts)
```

### Error Handling Patterns
```typescript
// Custom error classes
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Error boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>{this.state.error?.message}</details>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Performance Monitoring
```typescript
// Performance measurement utilities
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  
  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: name,
      value: Math.round(end - start),
    });
  }
  
  return result;
};
```

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Target Audience**: Developers, Architects, DevOps Engineers  
**Next Review**: March 2025 