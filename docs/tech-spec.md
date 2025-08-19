# Technical Specification

## Overview
Finsight is a personal finance management platform built with modern web technologies, featuring AI-powered category discovery and intelligent financial insights.

## Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context + React Query
- **Routing**: React Router DOM

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Edge Functions**: Deno-based serverless functions
- **Real-time**: Supabase real-time subscriptions

### AI Integration
- **Category Discovery**: Google Gemini AI for intelligent transaction categorization
- **On-device Processing**: WebGPU-powered local inference (future)
- **Pattern Recognition**: Merchant pattern matching and learning

## Database Schema

### Core Tables
- `user_profiles`: User account information
- `entities`: Financial entities (individuals, companies, trusts)
- `households`: Group financial management
- `transactions`: Financial transactions
- `assets`: Financial assets and accounts
- `liabilities`: Debts and loans
- `budgets`: Budget planning and tracking

### AI-Driven Category System
- `category_groups`: High-level category groupings (Income, Expenses, Assets, Liabilities)
- `category_buckets`: Logical subdivisions within groups
- `categories`: Individual categories with merchant patterns
- `merchants`: Merchant information and categorization
- `category_discovery_sessions`: AI discovery session tracking

## AI Category Discovery Flow

### 1. Transaction Upload
- User uploads CSV with transaction data
- System extracts unique merchant descriptions
- AI analyzes patterns and context

### 2. Category Discovery
- Gemini AI processes merchant descriptions
- Generates appropriate category names
- Assigns confidence scores
- Suggests logical groupings

### 3. Category Organization
- AI groups related categories into buckets
- Creates hierarchical structure
- Assigns colors and icons
- Maintains user-specific organization

### 4. Continuous Learning
- Tracks categorization accuracy
- Learns from user corrections
- Improves merchant pattern matching
- Adapts to user's financial behavior

## Security Features

### Data Protection
- Row Level Security (RLS) on all tables
- User isolation and data segregation
- Encrypted data transmission
- Secure API key management

### Authentication
- Supabase Auth integration
- JWT token management
- Session persistence
- Secure password handling

## Performance Optimizations

### Database
- Indexed queries for common operations
- Efficient joins and relationships
- Query optimization
- Connection pooling

### Frontend
- Lazy loading of components
- Optimized bundle splitting
- Efficient state updates
- Memoized calculations

## API Endpoints

### Edge Functions
- `/functions/v1/discover-categories`: AI category discovery
- `/functions/v1/group-categories`: Category organization
- `/functions/v1/categorize-transaction`: Individual transaction categorization

### REST API
- `/api/discover-categories`: Category discovery wrapper
- `/api/group-categories`: Category grouping wrapper

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase CLI
- Google AI Studio account

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_GEMINI_API_KEY=your_gemini_key
GEMINI_API_KEY=your_gemini_key
```

### Local Development
```bash
npm install
npm run dev
```

## Deployment

### Supabase
- Database migrations
- Edge function deployment
- Environment configuration
- Production database setup

### Frontend
- Vite build optimization
- Environment variable injection
- CDN deployment
- Performance monitoring

## Future Enhancements

### AI Improvements
- On-device LLM inference
- Advanced pattern recognition
- Predictive categorization
- Natural language queries

### Open Banking
- Direct bank connections
- Real-time transaction sync
- Payment initiation
- Account aggregation

### Mobile
- React Native app
- Offline capabilities
- Push notifications
- Biometric authentication 