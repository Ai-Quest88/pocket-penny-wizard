# Finsight - Documentation

This directory contains comprehensive documentation for the Finsight project, organized by audience and purpose.

## Document Overview

### 📋 **requirements.md** - Technical Requirements Specification
**Audience**: Developers, Architects, QA Engineers  
**Purpose**: Complete technical and functional requirements for system implementation  
**Contents**:
- Current feature requirements with technical details
- User requirements & use cases with performance criteria
- Functional requirements with acceptance criteria
- Non-functional requirements (performance, security, reliability)
- Technical stack specifications and database schema
- Future technical roadmap and acceptance criteria

### 🏗️ **tech-spec.md** - Technical Specification Document
**Audience**: Developers, Architects, DevOps Engineers  
**Purpose**: Detailed system architecture and implementation guidelines  
**Contents**:
- Complete system architecture with technology stack
- Database schema with SQL definitions and TypeScript models
- API integration layer with code examples
- Component architecture patterns and best practices
- Security implementation with RLS policies
- Performance optimization strategies
- Development environment setup and deployment pipeline

### 💼 **business-plan.md** - Strategic Business Plan
**Audience**: Investors, Executives, Business Stakeholders  
**Purpose**: Business strategy, financial projections, and investment roadmap  
**Contents**:
- Executive summary with vision and market opportunity
- Market analysis (10.7M Australian households, competitive landscape)
- Business model evolution from freemium to enterprise
- Financial projections with 3-year revenue and cost forecasts
- Strategic roadmap with 3-phase growth plan
- Risk analysis and mitigation strategies
- Investment requirements ($2.5M funding breakdown)
- Success metrics and KPIs

### 📈 **marketing-plan.md** - Comprehensive Marketing Strategy
**Audience**: Marketing Team, Growth Managers, Partnership Teams  
**Purpose**: Customer acquisition, brand positioning, and marketing campaigns  
**Contents**:
- Target market analysis (primary, secondary, tertiary segments)
- Customer personas (4 detailed user profiles)
- Competitive positioning strategy
- Go-to-market strategy with 3-phase approach
- Customer acquisition channels (digital, partnerships, referrals)
- Campaign planning with quarterly budgets and metrics
- Marketing budget allocation ($420K Year 1)
- Success metrics (CAC, LTV, conversion rates, brand awareness)

### 📊 **sprc.md** - Master Application Specification & Requirements
**Audience**: All Stakeholders  
**Purpose**: Comprehensive overview combining business and technical aspects  
**Contents**:
- Complete project overview with all system components
- Combined business requirements and technical specifications
- Comprehensive feature descriptions
- Database schema and API documentation
- Security and performance requirements
- OAuth authentication setup and configuration
- Development and deployment guidelines
- Master reference document for entire project

## 🆕 Recent Updates

### **Multi-Country Financial Year System** (January 2025)
The application now supports multi-country financial management with computed financial years:

**Key Features:**
- **Entity-Level Financial Years**: Each entity has a primary country that determines its financial year
- **Account-Level Countries**: Individual accounts can be in different countries with different currencies
- **Computed Financial Years**: No stored financial year data - calculated dynamically based on country rules
- **Country-Specific Rules**: Support for Australia, India, and US with their specific financial year start dates

**Supported Countries:**
- Australia (AU): July 1 - June 30 (Default)
- India (IN): April 1 - March 31
- United States (US): January 1 - December 31

**Technical Implementation:**
- Database schema: Updated entities, assets, and liabilities tables
- Utility functions: `financialYearUtils.ts` for calculations
- React components: `FinancialYearDisplay.tsx`, enhanced `EntityManager.tsx`
- TypeScript types: Updated `Entity`, `Asset`, `Liability` interfaces

### **Category Management System** (January 2025)
The application features a hierarchical category management system with AI-powered discovery:

**Structure:**
- **Groups**: High-level financial categories (Income, Expenses, Assets, Liabilities, Transfers, Adjustments)
- **Buckets**: Logical groupings within each group (e.g., Entertainment, Food & Dining within Expenses)
- **Categories**: Specific transaction types within each bucket

**Current Categorization Flow:**
1. **CSV Upload**: Users upload transaction files with automatic column mapping
2. **AI Discovery**: Optional AI analysis of transaction patterns using Google Gemini
3. **Rule-Based Fallback**: Comprehensive hardcoded rules for Australian merchants
4. **Manual Review**: Users can override AI suggestions before saving
5. **Category Assignment**: Transactions saved with assigned categories

**Key Features:**
- AI-powered category discovery using Google Gemini API
- Comprehensive rule-based fallback system (50+ merchant patterns)
- Hierarchical category structure with groups and buckets
- Real-time categorization preview during CSV upload
- Manual category override and review system
- Support for Australian financial institutions and merchants

**Technical Implementation:**
- **Frontend**: `AICategoryDiscovery.tsx`, `CategoryConfirmationDialog.tsx`, `UnifiedCsvUpload.tsx`
- **Backend**: Supabase Edge Functions (`categorize-transaction`, `discover-categories`, `group-categories`)
- **Database**: Hierarchical category tables (`category_groups`, `category_buckets`, `categories`)
- **AI Integration**: Google Gemini API for transaction analysis
- **Fallback Rules**: Hardcoded merchant patterns in `transactionInsertion.ts`

**Supported Merchant Patterns:**
- **Supermarkets**: Coles, Woolworths, IGA
- **Transport**: Uber, Shell, BP, Ampol, Caltex, Opal
- **Entertainment**: Netflix, Spotify, streaming services
- **Food**: McDonald's, KFC, Starbucks, cafes
- **Utilities**: Telstra, Optus, Vodafone, telecommunications
- **Government**: ATO, council payments, tax, revenue
- **Health**: CBHS, Medicare, health funds, insurance
- **Home**: Bunnings, warehouse stores, garden centers

### **System Status & Recommendations** (January 2025)

**Current State:**
The categorization system is functional with a solid foundation but lacks the advanced features that were previously implemented. The system currently uses:

1. **AI Discovery**: Google Gemini-powered transaction analysis
2. **Rule-Based Fallback**: 50+ hardcoded Australian merchant patterns
3. **Manual Review**: User override capabilities during CSV upload
4. **Hierarchical Categories**: Groups, buckets, and categories structure

**Missing Advanced Features:**
- **Unified Categorization**: Priority-based system (User Rules → System Rules → AI → Uncategorized)
- **Automatic Learning**: Rule creation from user corrections
- **Database-Driven Rules**: System categorization rules stored in database
- **Smart Pattern Matching**: Advanced merchant pattern recognition
- **Rule Management**: User-defined categorization rules

**Recommendations for Enhancement:**
1. **Re-implement Unified System**: Restore the smart categorization priority system
2. **Add Rule Learning**: Implement automatic learning from user corrections
3. **Database Rules**: Move system rules from hardcoded to database-driven
4. **Enhanced AI**: Improve AI categorization with better context understanding
5. **User Rules**: Allow users to create custom categorization rules

**Technical Debt:**
- Fallback rules are hardcoded in `transactionInsertion.ts` (should be database-driven)
- No automatic learning from user corrections
- Limited AI context understanding
- No user-defined rule management system

## Document Usage Guide

### For Different Teams:

**🧑‍💻 Development Team**:
- Primary: `requirements.md` and `tech-spec.md`
- Reference: `sprc.md` for complete context

**💰 Investors/Board Members**:
- Primary: `business-plan.md`
- Reference: `sprc.md` for technical understanding

**📊 Marketing Team**:
- Primary: `marketing-plan.md`
- Reference: `business-plan.md` for market strategy alignment

**🏗️ Architects/DevOps**:
- Primary: `tech-spec.md`
- Reference: `requirements.md` for functional context

**👥 Product Managers**:
- Primary: `requirements.md` and `business-plan.md`
- Reference: All documents for complete understanding

### Document Maintenance

- **Review Cycle**: All documents reviewed monthly with respective teams
- **Version Control**: All changes tracked through Git with meaningful commit messages
- **Updates**: Documents updated as project evolves and requirements change
- **Approval Process**: Technical changes require developer approval, business changes require stakeholder approval

## Quick Reference

### 🔐 OAuth Authentication Setup

**Production OAuth Configuration:**
- **Google Cloud Console**: Configure OAuth 2.0 Client ID with redirect URI
  ```
  https://pocket-penny-wizard.lovable.app/auth/callback
  ```
- **Supabase Dashboard**: Set Site URL to production domain
  ```
  https://pocket-penny-wizard.lovable.app
  ```
- **Environment Variables**: Ensure all required variables are set in production

**Authentication Flow:**
1. User clicks "Continue with Google" on login page
2. Redirected to Google OAuth consent screen
3. User authorizes application
4. Google redirects to Supabase auth callback
5. Supabase processes OAuth response and creates session
6. User redirected to dashboard with authenticated session

**Security Features:**
- PKCE (Proof Key for Code Exchange) flow for enhanced security
- Automatic token refresh
- Session persistence across browser sessions
- Row-level security policies in database

| Document | Size | Last Updated | Primary Focus |
|----------|------|--------------|---------------|
| requirements.md | ~40KB | Latest | Technical Requirements |
| tech-spec.md | ~24KB | Latest | System Architecture |
| business-plan.md | ~30KB | Latest | Business Strategy |
| marketing-plan.md | ~29KB | Latest | Marketing Strategy |
| sprc.md | ~23KB | Latest | Master Overview |

---

**Documentation Suite Version**: 1.1  
**Last Updated**: January 2025  
**Maintained By**: Product and Engineering Teams  
**Next Review**: February 2025 