
type CategoryRule = {
  keywords: string[];
  category: string;
};

const categoryRules: CategoryRule[] = [
  // Banking and Credit Cards
  {
    keywords: ['citibank', 'creditcards', 'credit card', 'bpay', 'visa', 'mastercard', 'amex'],
    category: 'Credit Card Payment'
  },
  // Transfers
  {
    keywords: ['transfer to', 'transfer from', 'netbank', 'commbank app', 'savings', 'cheque'],
    category: 'Transfer'
  },
  // Salary and Income
  {
    keywords: ['salary', 'wage', 'pay', 'deposit', 'dividend', 'interest', 'refund', 'cashback'],
    category: 'Income'
  },
  // Food and Dining
  {
    keywords: ['grocery', 'food', 'restaurant', 'cafe', 'coffee', 'market', 'supermarket', 'woolworths', 'coles', 'aldi', 'iga', 'takeaway', 'mcdonald', 'kfc', 'subway', 'pizza'],
    category: 'Food & Dining'
  },
  // Transportation
  {
    keywords: ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'transport', 'opal', 'myki', 'fuel', 'petrol', 'shell', 'bp', 'caltex', 'parking'],
    category: 'Transportation'
  },
  // Entertainment
  {
    keywords: ['netflix', 'spotify', 'hbo', 'cinema', 'movie', 'theatre', 'concert', 'entertainment', 'disney', 'youtube', 'apple music', 'amazon prime'],
    category: 'Entertainment'
  },
  // Shopping
  {
    keywords: ['amazon', 'walmart', 'target', 'shop', 'store', 'mall', 'kmart', 'big w', 'harvey norman', 'jb hi-fi', 'bunnings', 'officeworks'],
    category: 'Shopping'
  },
  // Bills and Utilities
  {
    keywords: ['rent', 'electricity', 'water', 'gas', 'internet', 'phone', 'utility', 'telstra', 'optus', 'vodafone', 'agl', 'origin', 'council', 'rates'],
    category: 'Bills & Utilities'
  },
  // Healthcare
  {
    keywords: ['medical', 'doctor', 'dentist', 'pharmacy', 'chemist', 'hospital', 'medicare', 'health', 'physio'],
    category: 'Healthcare'
  },
  // ATM and Banking Fees
  {
    keywords: ['atm', 'withdrawal', 'fee', 'charge', 'service fee', 'monthly fee', 'account fee'],
    category: 'Banking Fees'
  },
  // Investment and Savings
  {
    keywords: ['investment', 'shares', 'stock', 'bond', 'mutual fund', 'etf', 'superannuation', 'super'],
    category: 'Investment'
  },
  // Insurance
  {
    keywords: ['insurance', 'premium', 'cover', 'policy'],
    category: 'Insurance'
  }
];

export const categorizeTransaction = (description: string): string => {
  const lowerDescription = description.toLowerCase();
  
  for (const rule of categoryRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      return rule.category;
    }
  }
  
  return 'Other';
};
