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
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

See [`GEMINI_SETUP.md`](./GEMINI_SETUP.md) for detailed AI setup instructions.

## 🏗️ Project Structure

```
finsight/
├── docs/                    # Comprehensive documentation
├── src/
│   ├── components/         # React components
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
