# Finsight

**Australia's Premier Personal Finance Management Platform**

An intelligent personal finance application built specifically for Australian users, featuring AI-powered transaction categorization, multi-entity financial management, and comprehensive analytics.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Development Setup

```bash
# Clone the repository
git clone <YOUR_GIT_URL>
cd finsight

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see GEMINI_SETUP.md)

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the application.

## 🛠️ Technology Stack

**Frontend**
- **React 18** - Modern UI framework
- **TypeScript** - Type safety and developer experience
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library built on Radix UI
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Recharts** - Data visualization

**Backend & Services**
- **Supabase** - Backend as a Service (PostgreSQL, Auth, RLS)
- **Google Gemini AI** - Transaction categorization
- **Vercel** - Deployment and hosting

## 📚 Documentation

For comprehensive documentation, visit the [`docs/`](./docs/) folder:

- **[`docs/DOCUMENTATION.md`](./docs/DOCUMENTATION.md)** - Documentation guide and overview
- **[`docs/requirements.md`](./docs/requirements.md)** - Technical requirements specification
- **[`docs/tech-spec.md`](./docs/tech-spec.md)** - System architecture and implementation
- **[`docs/business-plan.md`](./docs/business-plan.md)** - Business strategy and financial projections
- **[`docs/marketing-plan.md`](./docs/marketing-plan.md)** - Marketing strategy and customer acquisition
- **[`docs/sprc.md`](./docs/sprc.md)** - Master specification document

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run preview      # Preview production build
```

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Important**: The development server runs on port 3000 by default. Make sure your Google Cloud OAuth configuration includes:
- `https://pocket-penny-wizard.lovable.app/auth/callback` (for production)

See [`GEMINI_SETUP.md`](./GEMINI_SETUP.md) for detailed AI setup instructions.

## 🏗️ Project Structure

```
finsight/
├── docs/                    # Comprehensive documentation
├── src/
│   ├── components/         # React components
│   │   ├── categories/    # Category management components
│   │   ├── entities/      # Entity management components
│   │   ├── transactions/  # Transaction components
│   │   └── ui/           # Shared UI components
│   ├── utils/             # Utility functions
│   │   └── financialYearUtils.ts  # Financial year calculations
│   └── types/             # TypeScript type definitions
```

## 🌍 Multi-Country Financial Year System

The application supports multi-country financial management with computed financial years:

### **Key Features:**
- **Entity-Level Financial Years**: Each entity has a primary country that determines its financial year
- **Account-Level Countries**: Individual accounts can be in different countries with different currencies
- **Computed Financial Years**: No stored financial year data - calculated dynamically based on country rules
- **Country-Specific Rules**: Support for 40+ countries with their specific financial year start dates

### **Supported Countries:**
- **Australia (AU)**: July 1 - June 30
- **India (IN)**: April 1 - March 31  
- **United States (US)**: January 1 - December 31
- **United Kingdom (UK)**: April 6 - April 5
- **Canada (CA)**: January 1 - December 31
- **European Union**: January 1 - December 31
- And 35+ more countries...

### **Financial Year Calculation:**
```typescript
// Get current financial year for an entity
const currentFY = getCurrentFinancialYear(entity.primaryCountry);

// Get financial year for a specific date
const fyForDate = getFinancialYearForDate(countryCode, date);

// Check if date falls within financial year
const isInFY = isDateInFinancialYear(date, financialYear);
```

### **Reporting Structure:**
- **Entity Level**: Uses primary country's financial year for entity-wide reporting
- **Account Level**: Account-specific country/currency for detailed analysis
- **Household Level**: Aggregated view across all entities and countries
│   ├── pages/             # Route components
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript type definitions
│   └── integrations/      # External service integrations
├── supabase/              # Database migrations and functions
└── public/                # Static assets
```

## 🌟 Key Features

- **🤖 AI-Powered Categorization** - 95%+ accurate transaction categorization using Google Gemini
- **🏢 Multi-Entity Management** - Support for personal, business, family, and trust finances
- **🇦🇺 Australian-First Design** - Built specifically for Australian banking and tax systems
- **📊 Advanced Analytics** - Comprehensive reporting and financial insights
- **💱 Multi-Currency Support** - Real-time exchange rates for 30+ currencies
- **📱 Mobile-Responsive** - Optimized for all devices
- **🔒 Bank-Level Security** - Row-level security and data encryption
- **📂 Hierarchical Categories** - Groups → Buckets → Categories organization system

## 📂 Category Management System

The application features a sophisticated hierarchical category management system:

### **Structure:**
- **Groups**: High-level financial categories (Income, Expenses, Assets, Liabilities, Transfers, Adjustments)
- **Buckets**: Logical groupings within each group (e.g., Entertainment, Food & Dining within Expenses)
- **Categories**: Specific transaction types within each bucket

### **Features:**
- **Collapsible Interface**: Expand/collapse groups and buckets for better organization
- **Drag & Drop**: Move categories between buckets with visual feedback
- **Industry Standards**: Pre-populated with common financial categories
- **Custom Management**: Add new buckets and categories with custom icons
- **Visual Hierarchy**: Parent-child layout with connection lines

### **Example Structure:**
```
💰 Income
├── 💼 Primary Income
│   ├── Salary
│   ├── Wages
│   └── Bonuses
└── 🏢 Business Income
    ├── Freelance
    └── Consulting

💸 Expenses
├── 🏠 Housing
│   ├── Rent
│   ├── Mortgage
│   └── Utilities
├── 🍽️ Food & Dining
│   ├── Groceries
│   ├── Restaurants
│   └── Coffee Shops
└── 🎬 Entertainment
    ├── Movies
    ├── Concerts
    └── Streaming Services
```

## 🚀 Deployment

### Vercel (Recommended)

The application is configured for one-click deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on every push to main branch

### Manual Deployment

```bash
# Build for production
npm run build

# Deploy the dist/ folder to your hosting provider
```

## 🤝 Contributing

1. Read the documentation in [`docs/`](./docs/) to understand the project
2. Check [`docs/requirements.md`](./docs/requirements.md) for technical specifications
3. Follow the development setup above
4. Create feature branches and submit pull requests

## 📄 License

This project is proprietary software. All rights reserved.

## 🔗 Links

- **Development**: https://lovable.dev/projects/ea5a8953-f452-4559-8101-648db6e66270
- **Documentation**: [`docs/DOCUMENTATION.md`](./docs/DOCUMENTATION.md)
- **Setup Guide**: [`GEMINI_SETUP.md`](./GEMINI_SETUP.md)

---

**Built with ❤️ for the Australian financial community**
