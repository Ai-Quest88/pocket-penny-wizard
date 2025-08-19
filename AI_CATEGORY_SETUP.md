# AI Category System Setup Guide

## Overview
This guide explains how to set up and use the new AI-driven category discovery system in Finsight.

## Prerequisites

### 1. Google Gemini API Key
- Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create a new API key
- Set environment variables:
  ```bash
  VITE_GEMINI_API_KEY=your_gemini_api_key
  GEMINI_API_KEY=your_gemini_api_key
  ```

### 2. Supabase Configuration
- Ensure you have Supabase CLI installed
- Set environment variables:
  ```bash
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

## Database Setup

### 1. Run Migrations
```bash
# Navigate to supabase directory
cd supabase

# Apply the new migration
supabase db reset
# OR apply specific migration
supabase migration up
```

### 2. Deploy Edge Functions
```bash
# Deploy all edge functions
supabase functions deploy

# Or deploy specific functions
supabase functions deploy discover-categories
supabase functions deploy group-categories
```

### 3. Set Edge Function Secrets
```bash
supabase secrets set GEMINI_API_KEY=your_gemini_api_key
```

## Frontend Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local` file:
```bash
VITE_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Start Development Server
```bash
npm run dev
```

## How It Works

### 1. User Uploads CSV
- User drags & drops CSV file
- System parses transaction data
- Extracts unique merchant descriptions

### 2. AI Category Discovery
- Gemini AI analyzes merchant descriptions
- Generates appropriate category names
- Assigns confidence scores
- Suggests logical groupings

### 3. Category Organization
- AI groups related categories into buckets
- Creates hierarchical structure
- Assigns colors and icons
- Maintains user-specific organization

### 4. Transaction Processing
- Categories are applied to transactions
- New categories are created automatically
- System learns from user corrections

## API Endpoints

### Discover Categories
```typescript
POST /api/discover-categories
{
  "descriptions": ["Woolworths", "Netflix", "BP Fuel"],
  "user_id": "user-uuid"
}
```

### Group Categories
```typescript
POST /api/group-categories
{
  "categories": [
    {
      "name": "Groceries",
      "confidence": 0.95,
      "is_new_category": true
    }
  ],
  "user_id": "user-uuid"
}
```

## Database Schema

### Core Tables
- `category_groups`: High-level groupings (Income, Expenses, Assets, Liabilities)
- `category_buckets`: Logical subdivisions within groups
- `categories`: Individual categories with merchant patterns
- `merchants`: Merchant information and categorization
- `category_discovery_sessions`: AI discovery session tracking

### Key Features
- **Row Level Security**: Users can only access their own data
- **AI Generated Flags**: Track which categories were AI-created
- **Merchant Patterns**: Store patterns for future categorization
- **Confidence Scores**: Track AI categorization accuracy

## Customization

### 1. Category Colors and Icons
- Edit `category_groups` and `category_buckets` tables
- Use Lucide React icon names
- Customize color schemes

### 2. AI Prompts
- Modify edge functions in `supabase/functions/`
- Adjust Gemini AI prompts for better categorization
- Add domain-specific knowledge

### 3. Fallback Categories
- Edit `getFallbackCategory()` in `transactionInsertion.ts`
- Add more merchant pattern matching
- Improve basic categorization logic

## Troubleshooting

### Common Issues

#### 1. Edge Function Errors
```bash
# Check function logs
supabase functions logs discover-categories
supabase functions logs group-categories
```

#### 2. Database Connection Issues
- Verify environment variables
- Check Supabase project status
- Ensure RLS policies are correct

#### 3. AI Categorization Fails
- Verify Gemini API key
- Check API rate limits
- Review edge function logs

### Debug Mode
Enable debug logging in edge functions:
```typescript
console.log('Processing request:', { descriptions, user_id });
```

## Performance Optimization

### 1. Database Indexes
- All tables have appropriate indexes
- GIN index on merchant_patterns for fast searches
- User-specific indexes for isolation

### 2. Caching
- Consider Redis for merchant pattern caching
- Cache common category mappings
- Implement request deduplication

### 3. Batch Processing
- Process transactions in batches
- Use bulk database operations
- Implement async processing queues

## Security Considerations

### 1. Data Isolation
- Row Level Security (RLS) enabled
- User-specific data access
- No cross-user data leakage

### 2. API Security
- JWT token validation
- Rate limiting on edge functions
- Input validation and sanitization

### 3. AI Privacy
- Merchant data stays within user's account
- No cross-user learning
- Secure API key management

## Future Enhancements

### 1. On-Device AI
- WebGPU-powered local inference
- Offline categorization
- Reduced API costs

### 2. Advanced Learning
- User correction feedback loops
- Pattern recognition improvements
- Predictive categorization

### 3. Open Banking
- Direct bank connections
- Real-time transaction sync
- Automated categorization

## Support

For issues or questions:
1. Check edge function logs
2. Review database migrations
3. Verify environment variables
4. Test API endpoints directly
5. Check Supabase dashboard for errors
