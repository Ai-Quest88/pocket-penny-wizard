# Finsight - Application Specification & Requirements (SPRC)

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Core Features & Functionality](#core-features--functionality)
4. [Database Schema](#database-schema)
5. [API & Integration Layer](#api--integration-layer)
6. [User Interface & Experience](#user-interface--experience)
7. [Security & Authentication](#security--authentication)
8. [Performance & Scalability](#performance--scalability)
9. [Development & Deployment](#development--deployment)
10. [Future Requirements & Enhancements](#future-requirements--enhancements)

## Project Overview

### Application Summary
**Finsight** is a comprehensive personal finance management application designed specifically for Australian users. It provides advanced multi-entity financial tracking with AI-powered transaction categorization, multi-currency support, and sophisticated reporting capabilities.

### Key Value Propositions
- **Multi-Entity Management**: Track finances across personal, business, family, and trust entities
- **AI-Powered Categorization**: Google Gemini AI integration for automatic transaction categorization
- **Australian Banking Focus**: Optimized for Australian banking formats and financial patterns
- **Real-time Currency Conversion**: Multi-currency support with live exchange rates
- **Advanced Analytics**: Comprehensive reporting and financial insights
- **Intelligent Import System**: Smart CSV/Excel parsing with duplicate detection

### Target Users
- **Primary**: Australian individuals and families managing personal finances
- **Secondary**: Small business owners requiring entity-specific financial tracking
- **Tertiary**: Financial advisors managing multiple client portfolios

## System Architecture

### Frontend Stack
```
React 18.3.1
├── TypeScript 5.5.3 (Type safety & development experience)
├── Vite 5.4.1 (Build tool & dev server)
├── TailwindCSS 3.4.11 (Utility-first styling)
├── shadcn/ui (Modern component library)
├── Radix UI primitives (Accessible UI components)
├── React Router DOM 6.26.2 (Client-side routing)
├── TanStack React Query 5.56.2 (Server state management)
├── React Hook Form 7.53.0 + Zod 3.23.8 (Form handling & validation)
└── Recharts 2.12.7 (Data visualization)
```

### Backend Infrastructure
```
Supabase PostgreSQL
├── Database: PostgreSQL with Row Level Security (RLS)
├── Authentication: Supabase Auth with session management
├── Storage: File uploads and document storage
├── Edge Functions: Deno-based serverless functions
└── Real-time: WebSocket connections for live data
```

### AI & External Services
```
Google Gemini API
├── Models: gemini-1.5-flash (primary)
├── Batch Processing: 100 transactions per batch
├── Australian Context: Specialized prompts for AU banking
└── Fallback System: Rule-based categorization
```

### Development Tools
```
Build & Quality
├── ESLint 9.9.0 (Code linting)
├── TypeScript ESLint 8.0.1 (TS-specific linting)
├── Prettier (Code formatting)
├── PostCSS 8.4.47 (CSS processing)
└── Lovable Tagger (Component tagging)
```

## Core Features & Functionality

### 1. User Authentication & Profiles
**Current Implementation:**
- Supabase Auth integration with email/password
- User profiles with currency preferences
- Session management with automatic logout
- Protected routes with authentication guards

**Data Model:**
```typescript
interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  currency_preference?: string
  notification_settings?: Json
  created_at: string
}
```

### 2. Multi-Entity Management
**Current Implementation:**
- Support for individuals, businesses, families, trusts
- Entity-specific financial tracking
- Cross-entity reporting and analysis
- Entity-based data filtering

**Entity Types:**
```typescript
type EntityType = 
  | 'Individual' 
  | 'Family Member' 
  | 'Business' 
  | 'Trust' 
  | 'Super Fund'

interface Entity {
  id: string
  name: string
  type: EntityType
  country_of_residence: string
  date_of_birth?: string
  incorporation_date?: string
  tax_identifier?: string
  registration_number?: string
  relationship?: string
  description?: string
  user_id: string
}
```

### 3. Transaction Management
**Current Implementation:**
- Manual transaction entry with form validation
- Bulk CSV/Excel import with intelligent header mapping
- Real-time duplicate detection and prevention
- Multi-currency transaction support
- AI-powered categorization with fallback rules
- Transaction comments and metadata

**Transaction Categories:**
```typescript
const categories = [
  // Living Expenses
  'Groceries', 'Restaurants', 'Gas & Fuel', 'Utilities', 
  'Healthcare', 'Insurance', 'Transportation', 'Public Transport', 
  'Tolls', 'Fast Food', 'Food Delivery',
  
  // Lifestyle
  'Shopping', 'Entertainment', 'Travel', 'Personal Care', 
  'Electronics', 'Clothing', 'Books', 'Subscriptions',
  
  // Financial
  'Banking', 'Investment', 'Taxes', 'Legal', 'Transfer In', 
  'Transfer Out', 'Internal Transfer', 'Income', 'Salary', 
  'Business', 'Freelance', 'Interest', 'Dividends',
  
  // Other
  'Education', 'Gifts & Donations', 'Professional Services', 
  'Home & Garden', 'Uncategorized'
];
```

**AI Categorization Priority:**
1. **User-defined rules** (highest priority)
2. **Database lookup** (similar past transactions)
3. **Enhanced built-in rules** (Australian banking patterns)
4. **Google Gemini AI** (batch processing)
5. **Uncategorized** (fallback)

### 4. Assets & Liabilities Management
**Current Implementation:**
- Comprehensive asset tracking (real estate, investments, cash accounts)
- Liability management (loans, credit cards, mortgages)
- Historical value tracking with charts
- Opening balance management with date tracking
- Account linking to transactions

**Asset Categories:**
```typescript
type AssetCategory = 
  | 'Cash' | 'Investment' | 'Property' 
  | 'Vehicle' | 'Other'

interface Asset {
  id: string
  name: string
  type: string
  category: AssetCategory
  value: number
  opening_balance: number
  opening_balance_date: string
  account_number?: string
  address?: string
  entity_id: string
  user_id: string
}
```

**Liability Categories:**
```typescript
type LiabilityCategory = 
  | 'Credit Card' | 'Personal Loan' | 'Mortgage' 
  | 'Business Loan' | 'Other'

interface Liability {
  id: string
  name: string
  type: string
  category: LiabilityCategory
  amount: number
  opening_balance: number
  opening_balance_date: string
  interest_rate?: number
  monthly_payment?: number
  credit_limit?: number
  term_months?: number
  account_number?: string
  entity_id: string
  user_id: string
}
```

### 5. Multi-Currency System
**Current Implementation:**
- Real-time exchange rate fetching via open.er-api.com
- Cached rates with validity checking
- Automatic currency conversion for reporting
- User preference-based display currency
- Fallback rates for offline usage

**Supported Currencies:**
```typescript
const currencies = [
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  // ... additional 25+ currencies
];
```

### 6. Budget Management
**Current Implementation:**
- Category-based budget creation
- Monthly and custom period budgets
- Budget vs. actual spending analysis
- Visual progress indicators
- Budget performance tracking

**Budget Model:**
```typescript
interface Budget {
  id: string
  category: string
  amount: number
  period: 'monthly' | 'quarterly' | 'yearly' | 'custom'
  start_date: string
  end_date?: string
  entity_id?: string
  is_active: boolean
  user_id: string
}
```

### 7. Advanced Analytics & Reporting
**Current Implementation:**
- Real-time dashboard with key metrics
- Cash flow analysis with monthly breakdowns
- Category spending analysis with pie charts
- Net worth tracking with historical trends
- Income vs expense comparisons
- Spending trend analysis over time

**Available Reports:**
- **Net Worth Report**: Assets vs liabilities with historical trends
- **Income & Expense Report**: Detailed P&L analysis
- **Cash Flow Report**: Monthly cash flow patterns
- **Trends Report**: Long-term financial trend analysis
- **Timeline Report**: Chronological transaction view
- **Digest Report**: Executive summary of financial position

### 8. File Import System
**Current Implementation:**
- CSV and Excel file support (.csv, .xlsx, .xls)
- Intelligent header detection and mapping
- Australian banking format optimization
- Date format handling (DD/MM/YYYY preference)
- Excel serial date conversion
- Duplicate transaction detection
- Preview before import with validation

**Supported Bank Formats:**
- Commonwealth Bank of Australia (CBA)
- Westpac Banking Corporation
- Australia and New Zealand Banking Group (ANZ)
- National Australia Bank (NAB)
- Generic CSV formats with custom mapping

## Database Schema

### Core Tables Structure
```sql
-- User management
user_profiles (id, email, full_name, currency_preference, ...)

-- Entity management
entities (id, name, type, country_of_residence, tax_identifier, ...)

-- Financial accounts
assets (id, name, type, category, value, opening_balance, entity_id, ...)
liabilities (id, name, type, category, amount, opening_balance, entity_id, ...)

-- Transaction data
transactions (
  id, description, amount, currency, date, category, 
  asset_account_id, liability_account_id, comment, user_id
)

-- Budget management
budgets (id, category, amount, period, start_date, entity_id, user_id, ...)

-- Historical tracking
historical_values (id, date, value, asset_id, liability_id, user_id)
```

### Row Level Security (RLS)
All tables implement comprehensive RLS policies:
- **SELECT**: Users can only view their own data
- **INSERT**: Users can only create records with their user_id
- **UPDATE**: Users can only modify their own records
- **DELETE**: Users can only delete their own records

### Database Relationships
```
users (1) ──→ (many) entities
entities (1) ──→ (many) assets
entities (1) ──→ (many) liabilities
users (1) ──→ (many) transactions
users (1) ──→ (many) budgets
assets (1) ──→ (many) transactions (via asset_account_id)
liabilities (1) ──→ (many) transactions (via liability_account_id)
assets/liabilities (1) ──→ (many) historical_values
```

## API & Integration Layer

### Supabase Edge Functions
**Current Implementation:**
```typescript
// /functions/categorize-transaction/index.ts
// Google Gemini AI integration for transaction categorization
export const categorizeTransaction = async (request: {
  description: string;
  descriptions?: string[];
  userId: string;
  batchMode?: boolean;
  testMode?: boolean;
}) => Promise<{
  category: string;
  categories?: string[];
  source: 'gemini_ai' | 'fallback' | 'error';
  model?: string;
}>
```

**Features:**
- Batch processing (100 transactions per batch)
- Model rotation (gemini-1.5-flash)
- Australian-specific prompts
- Error handling with fallbacks
- Rate limiting and retry logic

### External API Integrations
**Exchange Rates API:**
```typescript
// Real-time currency conversion
const fetchExchangeRates = async (baseCurrency: string = "USD") => {
  const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
  return response.json();
};
```

**Google Gemini AI:**
```typescript
// AI-powered transaction categorization
const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
```

## User Interface & Experience

### Design System
**Color Palette:**
```css
:root {
  --background: #FAFAFA;
  --background-muted: #F1F0FB;
  --primary: #9b87f5;
  --secondary: #1A1F2C;
  --accent: #F97316;
  --text: #1A1F2C;
  --text-muted: #8A898C;
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
}
```

**Component Library:**
- shadcn/ui components with Radix UI primitives
- Consistent spacing and typography scale
- Responsive design with mobile-first approach
- Accessible components with keyboard navigation
- Dark mode support (planned)

### Navigation Structure
```
Dashboard (/)
├── Entities (/entities)
├── Assets (/assets)
├── Liabilities (/liabilities)
├── Transactions (/transactions)
│   ├── All Transactions
│   ├── Uncategorized (/transactions/uncategorized)
│   ├── Transfers (/transactions/transfers)
│   └── Import (/transactions/import)
├── Analytics (/analytics)
├── Accounts (/accounts)
├── Budgets (/budgets)
├── Reports (/reports)
│   ├── Net Worth
│   ├── Income & Expense
│   ├── Cash Flow
│   ├── Trends
│   ├── Timeline
│   └── Digest
├── Notifications (/notifications)
└── Settings (/settings)
```

### Key UI Components
- **Responsive Sidebar**: Collapsible navigation with icons
- **Dashboard Cards**: Metric cards with trend indicators
- **Interactive Charts**: Recharts-based visualizations
- **Data Tables**: Sortable and filterable transaction lists
- **Form Components**: Validated forms with error handling
- **Dialog Modals**: Add/edit forms in modal overlays
- **File Upload**: Drag-and-drop CSV/Excel import
- **Currency Selector**: Multi-currency dropdown with flags

## Security & Authentication

### Authentication Flow
```
Public Route (Login) → Supabase Auth → Session Creation → Protected Routes
```

### Security Measures
- **Supabase Auth**: Industry-standard authentication
- **Session Management**: Automatic token refresh
- **Row Level Security**: Database-level access control
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Content sanitization
- **CORS Policies**: Restricted cross-origin requests

### Data Protection
- **Encryption in Transit**: HTTPS/TLS for all communications
- **Encryption at Rest**: Supabase PostgreSQL encryption
- **API Key Security**: Environment variable management
- **User Data Isolation**: RLS policies prevent data leakage

## Performance & Scalability

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **React Query**: Efficient data caching and synchronization
- **Memoization**: React.memo for expensive components
- **Bundle Optimization**: Vite-based tree shaking
- **Image Optimization**: WebP format with fallbacks

### Backend Performance
- **Database Indexing**: Optimized queries on frequent lookups
- **Caching Strategy**: Exchange rates and user preferences
- **Batch Processing**: AI categorization in chunks
- **Connection Pooling**: Supabase managed connections

### Scalability Considerations
- **Serverless Architecture**: Auto-scaling edge functions
- **CDN Distribution**: Static asset optimization
- **Database Sharding**: User-based data partitioning (planned)
- **Microservices**: Modular service architecture (planned)

## Development & Deployment

### Development Workflow
```bash
# Local Development
npm install
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code linting
npm run preview      # Preview production build

# Database Management
supabase start       # Local Supabase
supabase db push     # Deploy migrations
supabase functions deploy categorize-transaction
```

### Environment Configuration
```env
# Required Environment Variables
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Deployment Pipeline
1. **Development**: Local Vite dev server with hot reload
2. **Staging**: Vercel preview deployments for testing
3. **Production**: Vercel production deployment with CDN
4. **Database**: Supabase hosted PostgreSQL with backups

### Code Quality & Standards
- **TypeScript**: Strict mode with comprehensive type checking
- **ESLint**: Airbnb-based configuration with custom rules
- **Prettier**: Consistent code formatting
- **Git Hooks**: Pre-commit linting and testing
- **Component Documentation**: Props and usage examples

## Future Requirements & Enhancements

### Immediate Priorities (Q1 2025)

#### 1. Enhanced Security & Compliance
- **Two-Factor Authentication (2FA)**
  - TOTP support via authenticator apps
  - SMS backup options
  - Recovery codes generation

- **Data Export & Portability**
  - Complete data export in JSON/CSV formats
  - GDPR compliance with data deletion
  - Account closure workflow

- **Audit Logging**
  - User activity tracking
  - Data modification history
  - Security event monitoring

#### 2. Advanced Transaction Features
- **Recurring Transactions**
  - Automatic transaction creation
  - Template-based recurring entries
  - Smart frequency detection

- **Split Transactions**
  - Multi-category transaction splitting
  - Percentage and fixed amount splits
  - Business meal deduction tracking

- **Transaction Attachments**
  - Receipt image uploads
  - Document storage with transactions
  - OCR for automatic data extraction

#### 3. Enhanced Budgeting & Forecasting
- **Advanced Budget Types**
  - Envelope budgeting system
  - Zero-based budgeting
  - Rolling budget periods

- **Budget Alerts & Notifications**
  - Real-time overspend alerts
  - Budget milestone notifications
  - Monthly budget summaries

- **Financial Forecasting**
  - Cash flow projections
  - Net worth forecasting
  - Scenario planning tools

### Medium-term Goals (Q2-Q3 2025)

#### 4. Mobile Application
- **React Native Implementation**
  - iOS and Android native apps
  - Offline transaction capture
  - Push notifications

- **Mobile-Specific Features**
  - Camera receipt scanning
  - GPS-based transaction tagging
  - Voice transaction entry

#### 5. Advanced Analytics & AI
- **Spending Insights**
  - Anomaly detection in spending patterns
  - Personalized financial advice
  - Goal-based savings recommendations

- **Predictive Analytics**
  - Income prediction based on historical data
  - Expense forecasting
  - Investment performance analysis

- **Smart Categorization**
  - Continuous learning from user corrections
  - Merchant recognition and auto-categorization
  - Context-aware category suggestions

#### 6. Bank Integration & Open Banking
- **Australian Open Banking Support**
  - CDR (Consumer Data Right) compliance
  - Direct bank account connection
  - Real-time transaction synchronization

- **Bank Account Reconciliation**
  - Automatic transaction matching
  - Discrepancy identification
  - Balance reconciliation tools

### Long-term Vision (Q4 2025 & Beyond)

#### 7. Multi-tenant Architecture
- **Financial Advisor Platform**
  - Client portfolio management
  - Multi-client dashboard
  - Branded white-label solution

- **Family Financial Management**
  - Shared family budgets
  - Children's allowance tracking
  - Family financial goal setting

#### 8. Investment & Portfolio Management
- **Investment Tracking**
  - Stock portfolio management
  - Cryptocurrency tracking
  - Investment performance analysis

- **Portfolio Optimization**
  - Asset allocation recommendations
  - Rebalancing alerts
  - Tax-loss harvesting

#### 9. Business Financial Management
- **Enhanced Business Features**
  - Profit & Loss statements
  - Tax preparation assistance
  - Expense categorization for deductions

- **Multi-currency Business**
  - Foreign exchange gain/loss tracking
  - Multi-currency invoicing
  - Currency hedging analysis

#### 10. Integration Ecosystem
- **Third-party Integrations**
  - Xero/QuickBooks synchronization
  - Tax software integration
  - Investment platform connections

- **API Development**
  - Public API for developers
  - Webhook notifications
  - Partner integrations

### Technical Debt & Infrastructure

#### Code Quality & Modernization
- **Performance Optimization**
  - React 19 upgrade with concurrent features
  - Server-side rendering (SSR) implementation
  - Progressive Web App (PWA) capabilities

- **Testing Strategy**
  - Comprehensive unit test coverage (>90%)
  - Integration testing with Cypress
  - Performance testing and monitoring

- **Architecture Improvements**
  - Micro-frontend architecture
  - Service worker implementation
  - Edge computing optimization

#### Database & Data Management
- **Data Architecture**
  - Time-series data optimization
  - Data archiving strategy
  - Real-time analytics infrastructure

- **Backup & Disaster Recovery**
  - Automated backup scheduling
  - Cross-region replication
  - Disaster recovery procedures

### Success Metrics & KPIs

#### User Engagement
- **Daily Active Users (DAU)**: Target 1,000+ by Q4 2025
- **Transaction Volume**: 10,000+ transactions processed monthly
- **User Retention**: 80%+ monthly retention rate

#### Feature Adoption
- **AI Categorization Accuracy**: 95%+ accuracy rate
- **Import Success Rate**: 98%+ successful file imports
- **Budget Creation**: 70%+ of users create budgets

#### Performance Metrics
- **Page Load Time**: <2 seconds for dashboard
- **API Response Time**: <500ms for all queries
- **Uptime**: 99.9% availability

### Resource Requirements

#### Development Team
- **Frontend Developers**: 2-3 React/TypeScript specialists
- **Backend Developers**: 1-2 Node.js/PostgreSQL experts
- **Mobile Developers**: 1-2 React Native developers
- **DevOps Engineer**: 1 infrastructure specialist
- **UX/UI Designer**: 1 product designer

#### Infrastructure Costs
- **Supabase Pro**: $25/month + usage
- **Vercel Pro**: $20/month + bandwidth
- **Google Gemini API**: Usage-based pricing
- **Exchange Rate API**: $10/month for higher limits

---

## Conclusion

The Finsight application represents a comprehensive personal finance management solution with a strong foundation in modern web technologies and a clear roadmap for growth. The current implementation provides robust core functionality while maintaining flexibility for future enhancements.

The specification outlined above provides a complete picture of the application's current state and future direction, enabling informed development decisions and strategic planning. The modular architecture and well-defined interfaces support the planned feature additions while maintaining code quality and performance standards.

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Next Review**: April 2025 