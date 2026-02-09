# Finsight - Requirements Specification Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Current Feature Requirements](#current-feature-requirements)
3. [User Requirements & Use Cases](#user-requirements--use-cases)
4. [Functional Requirements](#functional-requirements)
5. [Non-Functional Requirements](#non-functional-requirements)
6. [Technical Requirements](#technical-requirements)
7. [Future Requirements & Roadmap](#future-requirements--roadmap)
8. [Acceptance Criteria](#acceptance-criteria)

---

## Project Overview

### Application Purpose
**Finsight** is a comprehensive personal finance management platform designed specifically for Australian users. The application provides intelligent AI-powered transaction categorization, multi-entity financial management, an AI CFO advisor, household grouping, and advanced analytics through a modern web interface.

### Core Technical Objectives
- **Automated Processing**: AI-powered transaction categorization using a multi-tier system (User History → System Keywords → Google Gemini AI → Fallback) targeting 95%+ accuracy
- **Multi-Entity Support**: Native support for personal, business, family, trust, and super fund finances
- **Australian Optimization**: Purpose-built for Australian banking formats, merchants, and financial structures
- **AI CFO**: Personal financial advisor with chat, goal tracking, alerts, and knowledge compilation
- **Real-Time Analytics**: Comprehensive reporting and financial insights with interactive visualizations
- **Scalable Architecture**: Cloud-native design using Supabase (PostgreSQL + Edge Functions) and Vercel

### Key System Capabilities
- Transaction management with bulk CSV/Excel import and multi-tier AI categorization
- Three-level dynamic category hierarchy (Groups → Buckets → Categories) with AI discovery
- Asset and liability tracking with historical valuation and opening balances
- Account management with calculated balances from transactions
- Multi-currency support with real-time exchange rates (30+ currencies)
- Multi-country financial year support (AU, IN, US)
- Advanced budgeting with period-based tracking
- Comprehensive reporting suite (Net Worth, Income/Expense, Cash Flow, Trends, Timeline, Digest)
- AI CFO with personal finance chat, goal tracking, and financial alerts
- Household management for family-level financial grouping
- Notification system for budget alerts and financial events

---

## Current Feature Requirements

### 1. User Management & Authentication

#### Technical Requirements
**Authentication System**: Supabase Auth integration with email/password and Google OAuth
**Session Management**: JWT-based sessions with automatic refresh using PKCE flow
**User Profiles**: Currency preferences, notification settings
**Security**: Row Level Security (RLS) on all tables, protected routes with authentication guards

#### Functional Requirements
- User registration with email/password
- Google OAuth sign-in
- Secure login with session persistence
- Password reset functionality
- Auth callback handling (`/auth/callback`)
- Protected route system (redirects to `/login` when unauthenticated)
- Public route system (redirects to `/dashboard` when authenticated)

#### Implementation
- `AuthContext` provides `isAuthenticated`, `isLoading`, `session`, `logout`
- `CurrencyContext` provides display currency preferences and exchange rate management
- Auth state checked on every route via `ProtectedRoute` and `PublicRoute` wrapper components

### 2. Multi-Entity Financial Management

#### Technical Requirements
**Entity Types**: Individual, Company, Trust, Super Fund (4 types via `entity_type` enum)
**Household Management**: Virtual grouping of entities for family-level reporting
**Data Isolation**: Complete data separation with Row Level Security policies
**Multi-Country**: Support for AU, IN, US with country-specific financial years

#### Functional Requirements
- Create and manage entities with type-specific fields
- Entity-specific financial data (accounts, assets, liabilities, transactions, budgets)
- Household creation and management for family grouping
- Entity profile management with tax identifiers, registration numbers
- Country of residence determines financial year and default currency

#### Database Schema
```sql
CREATE TYPE entity_type AS ENUM ('individual', 'company', 'trust', 'super_fund');

CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    type entity_type NOT NULL,
    country_of_residence TEXT DEFAULT 'Australia',
    tax_identifier TEXT,
    relationship TEXT,
    date_of_birth TEXT,
    household_id UUID REFERENCES households(id),
    registration_number TEXT,
    incorporation_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    primary_contact_id UUID REFERENCES entities(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### UI Components
- `src/pages/Entities.tsx` — Entity list and management page
- `src/components/entities/` — 6 components (EntityList, EntityForm, EntityCard, etc.)
- `src/pages/Households.tsx` — Household management page
- `src/components/households/` — 4 components (HouseholdList, HouseholdForm, etc.)

### 3. Transaction Management System

#### Core Transaction Processing
**Manual Entry**: Quick transaction creation via `ManualTransactionForm` with form validation
**Bulk Import**: CSV/Excel file processing via `SimpleUpload` and `UnifiedCsvUpload`
**AI Categorization**: Multi-tier system (User History → System Keywords → Gemini AI → Fallback)
**Duplicate Detection**: Algorithm-based duplicate identification via `duplicateDetection.ts`
**Search & Filtering**: Transaction list with category, date, and text filters

#### File Import System
**Supported Formats**: CSV, Excel (.xlsx, .xls)
**Header Detection**: Intelligent mapping of Australian bank export formats (CBA, Westpac, ANZ, NAB)
**Preview System**: User review and correction before final import
**Date Handling**: Australian DD/MM/YYYY format preference with Excel serial date conversion
**Processing**: PapaParse for CSV, XLSX library for Excel files

#### Smart Categorization System
The categorization system is implemented across 12+ service files in `src/services/categorization/`:

```
SmartCategorizer.ts          — Main orchestrator
├── UserHistoryMatcher.ts    — Fuzzy matching against past transactions (Tier 1)
├── SystemKeywordMatcher.ts  — Australian merchant keyword matching (Tier 2)
├── AICategorizer.ts         — Google Gemini AI integration (Tier 3)
├── FallbackCategorizer.ts   — Basic fallback rules (Tier 4)
├── LearnedPatternMatcher.ts — Patterns learned from user corrections
├── PatternMatcher.ts        — Pattern matching utilities
├── RulesLoader.ts           — Load categorization rules from DB
├── SystemRulesCategorizer.ts— System-level keyword rules
├── UserRulesCategorizer.ts  — User-defined custom rules
├── CategoryGroupHelper.ts   — Helps with group/bucket assignment
├── CategorizationMonitor.ts — Performance tracking and metrics
├── FeatureFlags.ts          — Feature flag system for categorization
├── TransactionProcessor.ts  — Batch transaction processing
└── AIExtractor.ts           — AI-based data extraction from files
```

**Additional categorization components:**
- `ImprovedHybridCategorizer.ts` — Enhanced hybrid approach
- `ImprovedTransactionCategorizer.ts` — Improved categorization pipeline
- `UserLearningService.ts` — Tracks user corrections for learning

#### Transaction Form Components (13 files in `src/components/transaction-forms/`)
- `ManualTransactionForm.tsx` — Manual single transaction entry
- `SimpleUpload.tsx` — Simple CSV upload flow
- `UnifiedCsvUpload.tsx` — Unified upload with AI categorization
- Column mapping, preview, validation, and import confirmation components

### 4. Category Management System

#### Three-Level Hierarchy
The application implements a dynamic three-level category hierarchy, primarily AI-discovered:

**Level 1: Groups** (`category_groups` table)
- High-level financial categories (Income, Expenses, Assets, Liabilities, Transfers)
- Each group has `category_type`, color, icon
- System and AI-generated groups supported

**Level 2: Buckets** (`category_buckets` table)
- Logical groupings within each group
- Custom icons, descriptions, sort order
- AI-generated buckets from transaction analysis

**Level 3: Categories** (`categories` table)
- Specific transaction types within each bucket
- Merchant patterns array for auto-matching
- `is_transfer` and `is_ai_generated` flags

#### AI Category Discovery
- Edge function `discover-categories` analyzes transactions to find new categories
- Edge function `group-categories` organizes discovered categories into hierarchy
- Edge function `categorize-transaction` handles individual categorization
- Merchant pattern learning from user corrections

#### Database Schema
```sql
CREATE TABLE category_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    category_type TEXT NOT NULL, -- income/expense/asset/liability/transfer
    color TEXT,
    icon TEXT,
    is_system BOOLEAN DEFAULT false,
    is_ai_generated BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE category_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    group_id UUID REFERENCES category_groups(id),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT false
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    bucket_id UUID REFERENCES category_buckets(id),
    name TEXT NOT NULL,
    description TEXT,
    merchant_patterns TEXT[],
    is_transfer BOOLEAN DEFAULT false,
    is_ai_generated BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);
```

#### UI & Hooks
- `src/components/categories/CategoryHierarchyManager.tsx` — Main category management UI
- `src/hooks/useCategories.ts` — Category CRUD operations with React Query
- `src/hooks/useCategoryHierarchy.ts` — Category tree structure
- `src/hooks/useCategoryManagement.ts` — Category management operations

### 5. Account Management

#### Accounts System
**Account Types**: Multiple account types linked to entities
**Balance Calculations**: Calculated from transactions via `useAccountBalances` hook
**Account Linking**: Transactions link to accounts via `asset_account_id` or `liability_account_id`

#### UI & Hooks
- `src/pages/Accounts.tsx` — Account management page
- `src/components/accounts/` — 2 components
- `src/hooks/useAccounts.ts` — Account fetching
- `src/hooks/useAccountBalances.ts` — Balance calculations from transactions

### 6. Asset & Liability Management

#### Asset Management
**Asset Categories**: Cash, Investment, Property, Vehicle, Other
**Value Tracking**: Current value with opening balance and date
**Entity Linkage**: Every asset belongs to an entity
**Account Properties**: Account number, address, institution details

#### Liability Management
**Liability Categories**: Credit Card, Personal Loan, Mortgage, Business Loan, Other
**Balance Tracking**: Outstanding amounts with opening balance
**Financial Details**: Interest rate, term months, monthly payment, credit limit
**Entity Linkage**: Every liability belongs to an entity

#### UI Components
- `src/pages/Assets.tsx` and `src/pages/Liabilities.tsx`
- `src/components/assets-liabilities/` — 8 components (forms, lists, history charts)
- Historical value tracking with time-series charts

### 7. Multi-Currency System

#### Exchange Rate Management
**Rate Provider**: open.er-api.com
**Supported Currencies**: 30+ major currencies with AUD as primary
**Caching**: Rates cached with validity checking, fallback for offline
**Context**: `CurrencyContext` provides app-wide currency preferences

#### Implementation
- `src/utils/currencyUtils.ts` — Conversion functions, rate fetching, currency formatting
- `src/contexts/CurrencyContext.tsx` — Global currency state and preferences
- Tests in `src/utils/currencyUtils.test.ts`

### 8. Multi-Country Financial Year System

#### Supported Countries
- **Australia (AU)**: July 1 - June 30 (Default)
- **India (IN)**: April 1 - March 31
- **United States (US)**: January 1 - December 31

#### Implementation
- `src/utils/financialYearUtils.ts` — Dynamic financial year calculations
- Entity `country_of_residence` determines financial year
- Tests in `src/utils/financialYearUtils.test.ts`

### 9. Budgeting System

#### Budget Structure
**Budget Types**: Category-based budgets with multiple time periods
**Period Support**: Monthly, quarterly, yearly, custom
**Entity Linkage**: Budgets scoped to entities
**Active State**: `is_active` flag for budget lifecycle

#### UI & Hooks
- `src/pages/Budgets.tsx` — Budget management page
- `src/components/budgets/` — 6 components (BudgetForm, BudgetList, BudgetProgress, etc.)
- `src/hooks/useBudgetData.ts` — Budget calculations and data

### 10. Reporting & Analytics System

#### Core Reports (accessible via `/reports` with sub-routes)
1. **Net Worth Report** — Assets minus liabilities with trend analysis
2. **Income & Expense Report** — P&L analysis with breakdowns
3. **Cash Flow Report** — Monthly cash flow patterns
4. **Trends Report** — Long-term financial trend analysis
5. **Timeline Report** — Chronological transaction view
6. **Digest Report** — Executive summary of financial position

#### Dashboard (`/dashboard`)
- Real-time financial position summary
- Key metric cards with trend indicators
- Cash flow chart and category comparison chart
- Smart insights widget

#### Analytics (`/analytics`)
- Interactive category-based analysis
- Spending pattern visualization

#### UI Components
- `src/pages/Reports.tsx`, `src/pages/Dashboard.tsx`, `src/pages/Analytics.tsx`
- `src/components/reports/` — 8 components
- `src/components/insights/` — 2 components (SmartInsights, InsightCard)
- `src/components/CashFlowChart.tsx`, `src/components/CategoryComparisonChart.tsx`
- `src/components/DashboardCard.tsx`, `src/components/PropertyValueEstimate.tsx`

### 11. AI CFO System

#### Overview
The AI CFO is a personal financial advisor powered by Google Gemini, with 5 tabs:

**Dashboard Tab**: Financial health overview with AI-generated insights
**Chat Tab**: Natural language chat with AI about finances (`PersonalCFOChat`)
**Upload Tab**: Transaction file analysis + CSV upload with knowledge compilation
**Goals Tab**: Financial goal tracking and progress (`GoalTracker`)
**Alerts Tab**: AI-generated financial health alerts (`CFOAlerts`)

#### Edge Functions
- `cfo-chat` — Powers the AI chat interface
- `compile-user-knowledge` — Builds user financial profile from transaction history
- `generate-cfo-alerts` — Generates proactive financial alerts

#### Database
```sql
CREATE TABLE user_financial_profile (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    knowledge_document JSONB,
    risk_tolerance TEXT,
    spending_personality TEXT,
    typical_monthly_income DECIMAL,
    typical_monthly_expenses DECIMAL,
    total_transactions_analyzed INTEGER,
    accuracy_score DECIMAL
);
```

#### UI Components
- `src/pages/CFO.tsx` — Main CFO page with 5-tab layout
- `src/components/cfo/` — 7 components:
  - `CFODashboard.tsx`, `PersonalCFOChat.tsx`, `TransactionFileAnalyzer.tsx`
  - `GoalTracker.tsx`, `CFOAlerts.tsx`, `CFOWelcome.tsx`, `FinancialHealthScore.tsx`

### 12. Notification System

#### Features
- Budget threshold alerts
- Financial event notifications
- Notification center page (`/notifications`)

#### UI Components
- `src/pages/Notifications.tsx`
- `src/components/notifications/` — 2 components

### 13. Settings

#### Features
- User profile management
- Currency preferences
- Notification preferences
- Admin panel component

#### UI Components
- `src/pages/Settings.tsx`
- `src/components/admin/AdminPanel.tsx`

---

## User Requirements & Use Cases

### UC-001: Manual Transaction Entry
**Actor**: Authenticated User
**Flow**: Navigate to transactions → Click add → Fill form (description, amount, date, category, account) → Submit → Transaction saved and categorized

### UC-002: Bulk Transaction Import
**Actor**: Authenticated User
**Flow**: Upload CSV/Excel → System detects headers → Review column mapping → AI categorizes → Preview transactions → Confirm import

### UC-003: AI Category Discovery
**Actor**: Authenticated User
**Flow**: Import transactions → System discovers new categories via Gemini → Categories organized into hierarchy → User reviews/adjusts

### UC-004: Budget Creation and Monitoring
**Actor**: Authenticated User
**Flow**: Navigate to budgets → Create budget (category, amount, period) → System tracks spending → Alerts on threshold breach

### UC-005: Entity Management
**Actor**: Authenticated User
**Flow**: Create entity (type, name, country) → Manage entity-specific data → Switch between entities → Generate entity reports

### UC-006: Household Management
**Actor**: Authenticated User
**Flow**: Create household → Add entities as members → View aggregated family finances → Family-level reporting

### UC-007: AI CFO Consultation
**Actor**: Authenticated User
**Flow**: Navigate to CFO → Upload transactions for knowledge building → Chat with AI about finances → Track goals → Review alerts

### UC-008: Financial Reporting
**Actor**: Authenticated User
**Flow**: Navigate to reports → Select report type → Configure date range/filters → View interactive charts → Export data

---

## Functional Requirements

### FR-001: Core Transaction Processing (Critical)
- FR-001a: Manual transaction entry with form validation
- FR-001b: Bulk CSV/Excel import with intelligent column mapping
- FR-001c: Multi-tier AI categorization (User History → Keywords → Gemini → Fallback)
- FR-001d: Duplicate detection and prevention
- FR-001e: Transaction editing and deletion
- FR-001f: Category filtering and search
- FR-001g: Transfer transaction management (`/transactions/transfers`)
- FR-001h: Uncategorized transaction queue (`/transactions/uncategorized`)

### FR-002: Multi-Entity Architecture (Critical)
- FR-002a: Entity creation for 4 types (individual, company, trust, super_fund)
- FR-002b: Complete data isolation with RLS policies
- FR-002c: Household grouping for family management
- FR-002d: Entity-specific financial tracking
- FR-002e: Multi-country support (AU, IN, US)

### FR-003: Category Management (Critical)
- FR-003a: Three-level hierarchy (Groups → Buckets → Categories)
- FR-003b: AI-powered category discovery from transactions
- FR-003c: Merchant pattern learning
- FR-003d: Category CRUD operations
- FR-003e: System and user-generated categories

### FR-004: AI CFO System (High)
- FR-004a: Personal finance chat powered by Gemini
- FR-004b: User financial profile / knowledge compilation
- FR-004c: Financial goal tracking
- FR-004d: AI-generated financial alerts
- FR-004e: Transaction file analysis

### FR-005: Asset & Liability Management (High)
- FR-005a: Asset management with 5 category types
- FR-005b: Liability tracking with financial details
- FR-005c: Opening balance management with effective dates
- FR-005d: Historical value tracking
- FR-005e: Balance calculations from transactions

### FR-006: Budgeting (High)
- FR-006a: Category-based budget creation
- FR-006b: Multiple periods (monthly, quarterly, yearly, custom)
- FR-006c: Budget vs. actual tracking
- FR-006d: Budget alerts and notifications

### FR-007: Multi-Currency Support (Medium)
- FR-007a: 30+ currency support
- FR-007b: Real-time exchange rate integration
- FR-007c: Automatic conversion for reporting
- FR-007d: Cached rates for offline operation

### FR-008: Comprehensive Reporting (High)
- FR-008a: 6 report types (Net Worth, Income/Expense, Cash Flow, Trends, Timeline, Digest)
- FR-008b: Real-time dashboard with key metrics
- FR-008c: Interactive charts using Recharts
- FR-008d: Date range selection and filtering
- FR-008e: Analytics page with spending patterns

### FR-009: Notification System (Medium)
- FR-009a: Budget threshold alerts
- FR-009b: Financial event notifications
- FR-009c: Notification center

---

## Non-Functional Requirements

### NFR-001: Performance
- Dashboard loading: <2 seconds
- Transaction search: <500ms
- Report generation: <5 seconds
- File import: <30 seconds for 1,000 transactions
- AI categorization: <3 seconds per batch of 100

### NFR-002: Security
- Supabase Auth with email/password + Google OAuth
- Row Level Security on ALL tables
- JWT-based sessions with PKCE flow
- TLS encryption in transit
- Database-level encryption at rest

### NFR-003: Usability
- Mobile-responsive design (TailwindCSS)
- WCAG 2.1 AA accessibility target
- Modern UI via shadcn/ui + Radix primitives
- Loading states and error handling throughout

### NFR-004: Reliability
- 99.9% uptime target (Vercel + Supabase)
- ACID compliance for financial transactions
- Automatic session refresh
- Graceful error handling with fallbacks

---

## Technical Requirements

### Frontend Stack
```
React 18.3.1 + TypeScript 5.9.2
Vite 5.4.1 (dev server on port 8080)
TailwindCSS 3.4.11 + shadcn/ui + Radix UI
TanStack React Query 5.56.2
React Hook Form 7.53.0 + Zod 3.23.8
React Router DOM 6.26.2
Recharts 2.12.7
Lucide React 0.462.0
date-fns 3.6.0
PapaParse (CSV), XLSX 0.18.5 (Excel)
```

### Backend Stack
```
Supabase (PostgreSQL + Auth + RLS + Edge Functions + Storage)
11 Edge Functions (Deno):
  - discover-categories
  - categorize-transaction
  - group-categories
  - cfo-chat
  - compile-user-knowledge
  - generate-cfo-alerts
  - chat-assistant
  - analyze-transactions
  - analyze-uploaded-transactions
  - extract-transactions
  - ai-process-file
```

### External APIs
```
Google Gemini AI (gemini-1.5-flash) — categorization, CFO chat, category discovery
Exchange Rate API (open.er-api.com) — real-time currency conversion
```

### Testing Stack
```
Vitest 3.2.4 — Unit/integration tests
Playwright 1.55.0 — E2E tests
@testing-library/react — Component tests
MSW (Mock Service Worker) — API mocking in tests
```

### Deployment
```
Vercel — Frontend hosting with CDN
Supabase Cloud — Backend (PostgreSQL, Auth, Edge Functions)
GitHub Actions — CI/CD pipeline (.github/workflows/tests.yml)
```

### Environment Variables
```
VITE_SUPABASE_URL — Supabase project URL
VITE_SUPABASE_ANON_KEY — Supabase anonymous key
VITE_GEMINI_API_KEY — Google Gemini API key
```

---

## Future Requirements & Roadmap

### Phase 1: Stabilization & Quality (Current Priority)
- Fix all existing bugs and broken features
- Achieve 80%+ test coverage for critical paths
- Ensure all CRUD operations work end-to-end
- Verify AI categorization accuracy
- Complete E2E testing for all user workflows

### Phase 2: Enhanced Features
- Recurring transaction automation
- Split transaction support
- Receipt attachment with OCR
- Advanced budget alerting
- Export functionality (PDF, CSV, Excel)

### Phase 3: Mobile & Integration
- Progressive Web App (PWA)
- Open Banking (CDR) integration
- Xero/QuickBooks integration
- Investment portfolio tracking

---

## Acceptance Criteria

### AC-001: Authentication
- Users can register, login (email + Google OAuth), and logout
- Protected routes redirect unauthenticated users
- Session persists across browser refreshes

### AC-002: Transaction Management
- Manual entry creates transaction with validation
- CSV/Excel import with automatic header detection
- AI categorization produces accurate results
- Duplicate detection warns before creating duplicates

### AC-003: Category System
- Three-level hierarchy displays correctly
- AI discovers new categories from transactions
- Categories persist in database with merchant patterns
- User can create, edit, delete categories

### AC-004: Entity & Household Management
- All 4 entity types can be created and managed
- Households group entities for family reporting
- Entity switching reflects in all data views

### AC-005: Assets & Liabilities
- Full CRUD for assets and liabilities
- Opening balances with dates tracked
- Historical value tracking displays in charts
- Balance calculations from transactions are accurate

### AC-006: Budgets
- Budget creation with category, amount, period
- Real-time tracking against transactions
- Visual progress indicators
- Alert on threshold breach

### AC-007: Reporting
- All 6 report types render with data
- Dashboard shows real-time metrics
- Charts are interactive (date range, filtering)
- Analytics page shows spending patterns

### AC-008: AI CFO
- Chat interface communicates with Gemini
- Knowledge compilation runs after uploads
- Goals can be created and tracked
- Alerts generate based on financial patterns

### AC-009: Testing
- Unit tests cover utility functions (currency, FY, CSV)
- Integration tests cover categorization service
- E2E tests cover critical user workflows
- All tests pass in CI pipeline

---

**Document Version**: 2.0
**Last Updated**: February 2026
**Document Type**: Technical Requirements Specification
**Review Cycle**: Monthly with development team
