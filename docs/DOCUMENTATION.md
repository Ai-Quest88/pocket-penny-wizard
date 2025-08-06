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

### **Category Management System** (January 2025)
The application now features a sophisticated hierarchical category management system:

**Structure:**
- **Groups**: High-level financial categories (Income, Expenses, Assets, Liabilities, Transfers, Adjustments)
- **Buckets**: Logical groupings within each group (e.g., Entertainment, Food & Dining within Expenses)
- **Categories**: Specific transaction types within each bucket

**Key Features:**
- Collapsible interface for better organization
- Drag & drop functionality for category management
- Industry-standard pre-populated categories
- Custom bucket and category creation
- Visual hierarchy with parent-child layout
- Connection lines showing relationships

**Technical Implementation:**
- React components: `CategoryManager.tsx`, `CategoryGroupCard.tsx`, `AddCategoryDialog.tsx`
- Local storage for category persistence
- Real-time updates with React Query
- Responsive design with Tailwind CSS

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