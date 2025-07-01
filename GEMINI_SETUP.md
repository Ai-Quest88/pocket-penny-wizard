# Google Gemini API Setup for Transaction Categorization

## Getting Your Google Gemini API Key

1. **Go to Google AI Studio**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account

2. **Create an API Key**
   - Click "Create API Key"
   - Choose "Create API key in new project" or select an existing project
   - Copy the generated API key

3. **Set Environment Variable**
   
   **For Local Development:**
   Add to your `.env.local` file:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

   **For Supabase Edge Functions:**
   Add the environment variable to your Supabase project:
   ```bash
   supabase secrets set VITE_GEMINI_API_KEY=your_api_key_here
   ```

   Or add it through the Supabase dashboard:
   - Go to Project Settings → API
   - Add `VITE_GEMINI_API_KEY` in the Environment Variables section

4. **Deploy the Updated Edge Function**
   ```bash
   supabase functions deploy categorize-transaction
   ```

## How It Works

The system now uses Google Gemini instead of Groq for AI-powered transaction categorization:

- **Models Used**: `gemini-1.5-flash` and `gemini-1.5-pro` (alternating for load balancing)
- **Batch Processing**: Processes 15 transactions per batch for optimal accuracy
- **Australian-Specific Rules**: Enhanced prompts with Australian banking/retail patterns
- **Fallback System**: Comprehensive rule-based categorization if AI fails

## Benefits of Gemini

- **Better Context Understanding**: Superior understanding of transaction descriptions
- **More Accurate Categorization**: Improved Australian-specific categorization
- **Reliable API**: More stable than some alternatives
- **Cost Effective**: Competitive pricing for the quality

## Testing

The system will automatically test the Gemini connection when processing transactions. Check your browser console for logs like:

```
Google Gemini AI classifier ready (using edge function with model alternation)
Processing batch of 15 transactions with Gemini model: gemini-1.5-flash
```

## Troubleshooting

If you see categorization failing:

1. **Check API Key**: Ensure `VITE_GEMINI_API_KEY` is set correctly
2. **Check Quotas**: Visit the Google Cloud Console to check API usage limits
3. **Check Logs**: Look in the Supabase Edge Function logs for detailed error messages
4. **Fallback Mode**: The system will use comprehensive rules if AI fails

The system maintains high reliability with multiple fallback layers:
1. Google Gemini AI
2. Comprehensive Australian transaction rules
3. Basic categorization rules
4. "Miscellaneous" as final fallback 