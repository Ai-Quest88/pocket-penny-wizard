# PennyWise - Personal Finance Management Application

## Overview

PennyWise is a comprehensive personal finance management application built with React, TypeScript, and Supabase. It provides multi-entity financial tracking with advanced features like multi-currency support, AI-powered transaction categorization, and detailed financial analytics.

## Core Technologies

### Frontend Stack
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library built on Radix UI primitives

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - Authentication and user management
- **Supabase Edge Functions** - Serverless functions for AI categorization

### Key Libraries
- **TanStack React Query** - Server state management and caching
- **React Router DOM** - Client-side routing
- **React Hook Form + Zod** - Form handling and validation
- **Recharts** - Data visualization and charting
- **Hugging Face Transformers** - AI/ML capabilities
- **Google Gemini API** - AI-powered transaction categorization

## Core Features

### 1. Multi-Entity Financial Management
- **Individual Accounts**: Personal finance tracking
- **Business Entities**: Company, trust, and super fund management
- **Family Members**: Track finances for family members
- **Entity Filtering**: View data by specific entities or combined view

### 2. Transaction Management
- **Manual Entry**: Add transactions individually
- **Bulk Import**: CSV and Excel file import with intelligent header mapping
- **Duplicate Detection**: Automatic detection and prevention of duplicate transactions
- **Multi-Currency Support**: Handle transactions in different currencies
- **AI Categorization**: Google Gemini-powered automatic categorization

### 3. Multi-Currency Support
- **Real-time Exchange Rates**: Automatic currency conversion
- **Display Currency**: Set preferred display currency
- **User Preferences**: Persistent currency settings per user
- **Australian Focus**: Optimized for Australian banking formats

### 4. Advanced Analytics & Reporting
- **Dashboard Overview**: Comprehensive financial dashboard
- **Net Worth Tracking**: Real-time net worth calculation
- **Cash Flow Analysis**: Monthly income vs expenses
- **Category Breakdown**: Pie charts and detailed spending analysis
- **Historical Trends**: Net worth and spending trends over time
- **Budget Analysis**: Income vs expense tracking

### 5. Asset & Liability Management
- **Asset Tracking**: Real estate, investments, and other assets
- **Liability Management**: Loans, credit cards, and other debts
- **Historical Values**: Track asset/liability values over time
- **Property Valuation**: Property value estimation features

### 6. AI-Powered Features
- **Transaction Categorization**: Google Gemini AI for smart categorization
- **Australian Banking Patterns**: Specialized rules for Australian transactions
- **Batch Processing**: Efficient processing of multiple transactions
- **Fallback System**: Rule-based categorization when AI is unavailable

## Application Structure

### Authentication Flow
```
Login Page → AuthContext → Protected Routes → Dashboard
```

### Main Application Areas

#### 1. Dashboard (`/dashboard`)
- Net worth widget with real-time calculations
- Recent transactions with currency conversion
- Budget analysis and spending insights
- Cash flow charts and category breakdowns
- Historical net worth tracking

#### 2. Transactions (`/transactions`)
- Complete transaction list with filtering
- Add new transactions via CSV/Excel upload
- Smart header mapping for various bank formats
- Real-time balance calculations
- Multi-currency transaction support

#### 3. Analytics (`/analytics`)
- Advanced financial analytics
- Spending trend analysis
- Category comparison charts
- Income vs expense tracking

#### 4. Accounts (`/accounts`)
- Bank account management
- Account balances and reconciliation
- Multi-currency account support

#### 5. Assets & Liabilities (`/assets`, `/liabilities`)
- Asset and liability tracking
- Historical value charts
- Property valuation tools
- Investment tracking

#### 6. Budgets (`/budgets`)
- Budget creation and management
- Income vs expense analysis
- Budget performance tracking

#### 7. Reports (`/reports`)
- Comprehensive financial reports
- Income/expense statements
- Cash flow reports
- Trend analysis
- Custom report generation

#### 8. Entities (`/entities`)
- Individual and business entity management
- Family member tracking
- Entity-specific financial data

### Key Components

#### Transaction Processing
- **UnifiedCsvUpload**: Handles CSV and Excel imports
- **TransactionList**: Displays and manages transactions
- **AI Categorization**: Google Gemini integration for smart categorization

#### Financial Analytics
- **CashFlowChart**: Monthly cash flow visualization
- **CategoryPieChart**: Spending breakdown by category
- **NetWorthWidget**: Real-time net worth calculation
- **HistoricalValueChart**: Asset/liability trends over time

#### Multi-Currency System
- **CurrencyContext**: Global currency state management
- **Exchange Rate API**: Real-time currency conversion
- **Currency Selector**: User-friendly currency selection

## Data Management

### Database Schema (Supabase)
- **Users**: User authentication and profiles
- **Entities**: Individual and business entities
- **Transactions**: Financial transactions with categorization
- **Accounts**: Bank accounts and financial institutions
- **Assets/Liabilities**: Asset and liability tracking
- **Budgets**: Budget definitions and tracking

### State Management
- **React Query**: Server state caching and synchronization
- **Context API**: Global state for authentication and currency
- **Local Storage**: User preferences and settings

## File Import System

### Supported Formats
- **CSV Files**: Standard comma-separated values
- **Excel Files**: .xlsx and .xls formats
- **Smart Header Detection**: Automatic mapping of bank export formats

### Import Features
- **Intelligent Header Mapping**: Auto-detects date, description, amount columns
- **Multi-Bank Support**: Handles various Australian bank export formats
- **Date Format Handling**: Supports DD/MM/YYYY (Australian) and other formats
- **Excel Serial Dates**: Properly handles Excel date formats
- **Duplicate Prevention**: Checks for existing transactions

## Security & Performance

### Authentication
- **Supabase Auth**: Secure user authentication
- **Protected Routes**: Route-level security
- **Session Management**: Persistent login sessions

### Performance Optimizations
- **React Query Caching**: Efficient data caching
- **Code Splitting**: Optimized bundle sizes
- **Lazy Loading**: On-demand component loading
- **Batch Processing**: Efficient transaction processing

## Development Setup

### Prerequisites
- Node.js & npm
- Supabase account
- Google Gemini API key (for AI features)

### Environment Variables
```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Available Scripts
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - Code linting
- `npm run preview` - Preview production build

## Australian Banking Integration

The application is specifically optimized for Australian banking:
- **Date Formats**: DD/MM/YYYY format support
- **Bank Export Formats**: Common Australian bank CSV formats
- **Currency**: AUD as default currency
- **Transaction Patterns**: Australian-specific transaction categorization rules

## AI Integration

### Google Gemini Integration
- **Models**: Uses gemini-1.5-flash and gemini-1.5-pro
- **Batch Processing**: Processes 15 transactions per batch
- **Australian Context**: Enhanced prompts for Australian banking patterns
- **Fallback System**: Comprehensive rule-based categorization

### Categorization Features
- **Smart Category Detection**: AI-powered transaction categorization
- **Australian Banking Patterns**: Specialized rules for Australian transactions
- **Learning System**: Improves categorization over time
- **Manual Override**: Users can manually adjust categories

## Future Extensibility

The application is designed for future enhancements:
- **Plugin System**: Modular component architecture
- **API Integration**: Ready for additional banking APIs
- **Mobile App**: React Native compatibility
- **Advanced Analytics**: Machine learning insights
- **Multi-tenant**: Support for financial advisors

This comprehensive personal finance application provides everything needed for modern financial management with a focus on Australian users and multi-entity financial tracking.