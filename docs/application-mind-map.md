# 🧠 Pocket Penny Wizard - Text-Based Mind Map

```
                    ┌─────────────────────────────────────┐
                    │        POCKET PENNY WIZARD          │
                    │     Personal Finance Platform        │
                    └─────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │  FRONTEND   │  │   BACKEND   │  │   FEATURES  │
            └─────────────┘  └─────────────┘  └─────────────┘
                    │                 │                 │
        ┌───────────┼───────────┐     │     ┌───────────┼───────────┐
        │           │           │     │     │           │           │
        ▼           ▼           ▼     │     ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ │ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │  React  │ │ TypeScript│ │TailwindCSS│ │Supabase │ │PostgreSQL│ │AI Functions│
   │   18    │ │   5.5.3  │ │  3.4.11  │ │ 2.48.1  │ │ Database │ │  Gemini  │
   └─────────┘ └─────────┘ └─────────┘ │ └─────────┘ └─────────┘ └─────────┘
        │           │           │     │     │           │           │
        └───────────┼───────────┘     │     └───────────┼───────────┘
                    │                 │                 │
                    ▼                 ▼                 ▼
            ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
            │  COMPONENTS │  │   SERVICES  │  │ CORE FEATURES│
            └─────────────┘  └─────────────┘  └─────────────┘
                    │                 │                 │
        ┌───────────┼───────────┐     │     ┌───────────┼───────────┐
        │           │           │     │     │           │           │
        ▼           ▼           ▼     │     ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ │ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Dashboard│ │Transactions│ │Entities│ │Auth     │ │Currency │ │Reports  │
   │Pages    │ │Forms     │ │Households│ │Service  │ │Service  │ │Analytics│
   └─────────┘ └─────────┘ └─────────┘ │ └─────────┘ └─────────┘ └─────────┘
```

## 🎯 Core Application Structure

### 🏗️ **FRONTEND LAYER**
```
React 18.3.1 + TypeScript 5.5.3
├── 📱 Pages & Components
│   ├── Dashboard (Main Overview)
│   ├── Transactions (Management)
│   ├── Entities (Multi-Entity Support)
│   ├── Assets & Liabilities
│   ├── Budgets & Reports
│   └── Settings & Analytics
├── 🎨 UI Framework
│   ├── TailwindCSS 3.4.11 (Styling)
│   ├── shadcn/ui (Components)
│   └── Radix UI (Accessibility)
└── 📊 Data Visualization
    ├── Recharts 2.12.7
    └── Interactive Charts
```

### 🔧 **BACKEND LAYER**
```
Supabase Platform
├── 🗄️ PostgreSQL Database
│   ├── user_profiles
│   ├── entities
│   ├── transactions
│   ├── assets & liabilities
│   └── budgets
├── 🔐 Authentication
│   ├── Supabase Auth
│   ├── JWT Tokens
│   └── Row Level Security (RLS)
├── ⚡ Edge Functions
│   ├── categorize-transaction
│   ├── discover-categories
│   └── group-categories
└── 🔄 Real-time Features
    ├── WebSocket Connections
    └── Live Updates
```

### 🤖 **AI INTEGRATION**
```
Google Gemini AI
├── 🧠 Transaction Analysis
├── 🏷️ Category Discovery
├── 🔍 Pattern Recognition
└── 📈 Learning System
```

## 🔄 **CATEGORIZATION PRIORITY SYSTEM**

```
Transaction Description
        │
        ▼
┌─────────────────┐
│ Priority 1:     │ ──► 95% Confidence
│ User Rules      │
└─────────────────┘
        │ (No Match)
        ▼
┌─────────────────┐
│ Priority 2:     │ ──► 90% Confidence
│ Database Lookup │
└─────────────────┘
        │ (No Match)
        ▼
┌─────────────────┐
│ Priority 3:     │ ──► 85% Confidence
│ System Rules    │
│ (Australian)    │
└─────────────────┘
        │ (No Match)
        ▼
┌─────────────────┐
│ Priority 4:     │ ──► 80% Confidence
│ AI Analysis     │
│ (Google Gemini) │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Priority 5:     │ ──► 70% Confidence
│ Fallback Rules  │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Manual Review   │
│ Required        │
└─────────────────┘
```

## 🎯 **KEY FEATURES**

### 💳 **Transaction Management**
- **Manual Entry**: Quick transaction creation
- **CSV Import**: Bulk transaction processing
- **AI Categorization**: Intelligent category assignment
- **Duplicate Detection**: Automatic duplicate prevention
- **Search & Filter**: Advanced query capabilities

### 🏢 **Multi-Entity Support**
- **Individual**: Personal finances
- **Company**: Business entity tracking
- **Trust**: Trust structure management
- **Super Fund**: Superannuation tracking
- **Household**: Family-level grouping

### 💰 **Asset & Liability Management**
- **Real-time Values**: Live balance calculations
- **Historical Tracking**: Value history over time
- **Multi-Currency**: 30+ supported currencies
- **Net Worth**: Automatic net worth calculation

### 📊 **Budget & Analytics**
- **Category Budgets**: Spending limits by category
- **Real-time Tracking**: Live budget monitoring
- **Alert System**: Budget threshold notifications
- **Interactive Reports**: Comprehensive analytics

## 🔒 **Security & Compliance**

```
Security Architecture
├── 🔐 Authentication
│   ├── Supabase Auth
│   ├── JWT Sessions
│   └── Multi-device Support
├── 🛡️ Data Protection
│   ├── Row Level Security (RLS)
│   ├── Encryption (TLS 1.3)
│   └── Audit Logging
└── 📋 Compliance
    ├── Australian Privacy Act
    ├── Data Residency
    └── Right to be Forgotten
```

## 🧪 **Testing Framework**

```
Testing Strategy
├── 🎭 E2E Testing
│   ├── Playwright MCP
│   ├── Business Test Cases
│   └── Visual Debugging
├── 🔬 Unit Testing
│   ├── Vitest Framework
│   ├── Component Tests
│   └── Utility Tests
└── 🔗 Integration Testing
    ├── API Testing
    └── Service Integration
```

## 🚀 **Future Roadmap**

### **Phase 1 (Q1 2025)**
- 🔐 Two-Factor Authentication
- 📱 Mobile Application
- 🔄 Recurring Transactions
- 📄 Receipt OCR

### **Phase 2 (Q2-Q3 2025)**
- 🧠 Advanced AI Features
- 🏦 Open Banking Integration
- 📈 Predictive Analytics
- 🗣️ Natural Language Queries

### **Phase 3 (Q4 2025+)**
- 📈 Investment Portfolio Management
- 🏢 Business Intelligence Platform
- 🌐 Multi-tenant Architecture
- 🎨 White-label Solutions

---

## 📈 **Performance Targets**

| Metric | Target | Status |
|--------|--------|--------|
| Page Load | <2 seconds | ✅ |
| Search Response | <500ms | ✅ |
| Report Generation | <5 seconds | ✅ |
| File Import | <30 seconds (1000 txns) | ✅ |
| AI Categorization | <3 seconds (100 txns) | ✅ |
| Entity Switching | <1 second | ✅ |

---

**Pocket Penny Wizard** is a sophisticated, AI-powered personal finance management platform designed specifically for Australian users, featuring comprehensive multi-entity support, intelligent transaction categorization, and real-time financial analytics.
