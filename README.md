# Finsight

**Australia's Premier Personal Finance Management Platform**

An intelligent personal finance application built specifically for Australian users, featuring **AI-powered category discovery**, multi-entity financial management, and comprehensive analytics.

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
- **Google Gemini AI** - Transaction categorization & category discovery
- **Vercel** - Deployment and hosting

## 🧠 AI-Powered Category System

### **Smart Category Discovery**
- **Zero Setup Required** - AI automatically discovers categories from your transactions
- **Pattern Learning** - Learns merchant patterns and spending habits
- **Intelligent Grouping** - Organizes categories into logical buckets automatically
- **Australian Context** - Understands local merchants (Coles, Woolworths, Linkt, etc.)

### **How It Works**
1. **Upload Transactions** - CSV or manual entry
2. **AI Analysis** - Gemini AI analyzes spending patterns
3. **Category Discovery** - Creates personalized categories automatically
4. **Smart Organization** - Groups similar categories into logical buckets
5. **Continuous Learning** - Categories evolve as you add more transactions

### **Example AI Discovery**
```
AI discovers from your transactions:
├── Groceries
│   ├── Supermarket (Coles, Woolworths, IGA)
│   ├── Fresh Food (Butcher, Bakery, Markets)
│   └── Specialty (Health Food, Organic)
├── Transport
│   ├── Fuel (Shell, BP, Caltex)
│   ├── Public Transport (Opal, Myki)
│   └── Tolls (Linkt, CityLink, EastLink)
└── Entertainment
    ├── Streaming (Netflix, Spotify, Disney+)
    └── Dining (Restaurants, Cafes, Fast Food)
```

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

**Important**: The development server runs on port 5173 by default. Make sure your Google Cloud OAuth configuration includes:
- `http://localhost:5173/auth/callback` (for local development)
- `https://pocket-penny-wizard.lovable.app/auth/callback` (for production)

See [`GEMINI_SETUP.md`](./GEMINI_SETUP.md) for detailed AI setup instructions.

## 🏗️ Project Structure

```
finsight/
├── docs/                    # Comprehensive documentation
├── src/
│   ├── components/         # React components
│   │   ├── categories/    # AI-driven category management
│   │   ├── entities/      # Entity management components
│   │   ├── transactions/  # Transaction components
│   │   └── ui/           # Shared UI components
│   ├── utils/             # Utility functions
│   │   └── financialYearUtils.ts  # Financial year calculations
│   └── types/             # TypeScript type definitions
├── supabase/              # Database migrations and AI edge functions
│   ├── functions/
│   │   ├── discover-categories/    # AI category discovery
│   │   ├── group-categories/       # AI category organization
│   │   └── categorize-transaction/ # Transaction categorization
│   └── migrations/        # Database schema
└── public/                # Static assets
```

## 🌍 Multi-Country Financial Year System

The application supports multi-country financial management with computed financial years:

### **Key Features:**
- **Entity-Level Financial Years**: Each entity has a primary country that determines its financial year
- **Account-Level Countries**: Individual accounts can be in different countries with different currencies
- **Computed Financial Years**: No stored financial year data - calculated dynamically based on country rules
- **Country-Specific Rules**: Support for Australia, India, and US with their specific financial year start dates

### **Supported Countries:**
- **Australia (AU)**: July 1 - June 30 (Default)
- **India (IN)**: April 1 - March 31  
- **United States (US)**: January 1 - December 31

### **Financial Year Calculation:**
```typescript
// Get current financial year for an entity
const currentFY = getCurrentFinancialYear(entity.countryOfResidence);

// Get financial year for a specific date
const fyForDate = getFinancialYearForDate(countryCode, date);

// Check if date falls within financial year
const isInFY = isDateInFinancialYear(date, financialYear);
```

### **Reporting Structure:**
- **Entity Level**: Uses primary country's financial year for entity-wide reporting
- **Account Level**: Account-specific country/currency for detailed analysis
- **Household Level**: Aggregated view across all entities and countries

## 🌟 Key Features

- **🧠 AI-Powered Category Discovery** - Zero setup, AI learns your spending patterns
- **🏢 Multi-Entity Management** - Support for personal, business, family, and trust finances
- **🇦🇺 Australian-First Design** - Built specifically for Australian banking and tax systems
- **📊 Advanced Analytics** - Comprehensive reporting and financial insights
- **💱 Multi-Currency Support** - Real-time exchange rates for 30+ currencies
- **📱 Mobile-Responsive** - Optimized for all devices
- **🔒 Bank-Level Security** - Row-level security and data encryption
- **📈 Continuous Learning** - Categories evolve and improve over time

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

## 🧪 Testing

This project uses a modern MCP-based testing approach for business scenarios:

### Business Test Cases
```bash
# Run all business tests
npm run test:mcp

# Run specific test cases
npm run test:mcp:entity        # Entity lifecycle test
npm run test:mcp:financial     # Financial setup test
npm run test:mcp:transaction   # Transaction management test
```

### Unit & Integration Tests
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run component tests
npm run test:component

# Run all tests
npm run test:all
```

### Test Philosophy
- **Business-focused E2E** - Tests actual user workflows using Playwright MCP
- **API testing** - Tests business logic via Supabase APIs
- **Component testing** - Tests UI interactions in isolation
- **No brittle selectors** - Uses MCP for reliable browser interaction

See [`tests/README.md`](./tests/README.md) for detailed testing documentation.

### Task Master MCP Setup

1. The `.cursor/mcp.json` file is already configured in this repo with Task Master MCP using Cursor's built-in Claude Code models (no API keys required).
2. In Cursor, open **Settings → MCP**, enable `task-master-ai`, and reload the AI pane so the server starts.
3. In the Cursor chat pane, configure the models: "Change the main model to claude-code/sonnet; change research to claude-code/sonnet; change fallback to claude-code/sonnet."
4. Initialize Task Master: "Initialize taskmaster-ai in my project"
5. Test with a quick prompt (e.g. "Taskmaster, list open issues in this repo") to confirm it's working.

**Note**: This setup uses Cursor's Claude Code models which don't require your own API keys. If you want to use other providers (OpenAI, Anthropic, etc.), you can add their API keys to the `env` section in `.cursor/mcp.json`.

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

**Built with ❤️ and AI for the Australian financial community**
