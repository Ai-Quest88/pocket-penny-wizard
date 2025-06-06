
type CategoryRule = {
  keywords: string[];
  category: string;
};

const categoryRules: CategoryRule[] = [
  // Food - matches the category breakdown chart
  {
    keywords: ['grocery', 'food', 'restaurant', 'cafe', 'coffee', 'market', 'supermarket', 'woolworths', 'coles', 'aldi', 'iga', 'takeaway', 'mcdonald', 'kfc', 'subway', 'pizza', 'dining', 'meal'],
    category: 'Food'
  },
  // Transport - matches the category breakdown chart
  {
    keywords: ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'transport', 'opal', 'myki', 'fuel', 'petrol', 'shell', 'bp', 'caltex', 'parking', 'linkt', 'toll', 'etag', 'roam', 'transurban'],
    category: 'Transport'
  },
  // Shopping - matches the category breakdown chart
  {
    keywords: ['amazon', 'walmart', 'target', 'shop', 'store', 'mall', 'kmart', 'big w', 'harvey norman', 'jb hi-fi', 'bunnings', 'officeworks', 'shopping', 'purchase', 'buy'],
    category: 'Shopping'
  },
  // Bills - matches the category breakdown chart
  {
    keywords: ['rent', 'electricity', 'water', 'gas', 'internet', 'phone', 'utility', 'telstra', 'optus', 'vodafone', 'agl', 'origin', 'council', 'rates', 'bill', 'insurance', 'premium'],
    category: 'Bills'
  },
  // Entertainment - matches the category breakdown chart
  {
    keywords: ['netflix', 'spotify', 'hbo', 'cinema', 'movie', 'theatre', 'concert', 'entertainment', 'disney', 'youtube', 'apple music', 'amazon prime', 'gaming', 'music'],
    category: 'Entertainment'
  },
  // Health
  {
    keywords: ['doctor', 'dentist', 'pharmacy', 'medical', 'health', 'hospital', 'clinic', 'physiotherapy', 'gym', 'fitness'],
    category: 'Health'
  },
  // Travel
  {
    keywords: ['hotel', 'flight', 'airline', 'booking', 'airbnb', 'travel', 'vacation', 'holiday', 'accommodation'],
    category: 'Travel'
  },
  // Education
  {
    keywords: ['school', 'university', 'course', 'education', 'tuition', 'books', 'learning', 'training'],
    category: 'Education'
  },
  // Income
  {
    keywords: ['salary', 'wage', 'pay', 'deposit', 'dividend', 'interest', 'refund', 'cashback', 'income', 'bonus'],
    category: 'Income'
  },
  // Investment
  {
    keywords: ['investment', 'stock', 'share', 'etf', 'fund', 'crypto', 'bitcoin', 'trading'],
    category: 'Investment'
  },
  // Insurance
  {
    keywords: ['insurance', 'premium', 'policy', 'cover', 'life insurance', 'car insurance', 'home insurance'],
    category: 'Insurance'
  },
  // Gifts
  {
    keywords: ['gift', 'present', 'birthday', 'wedding', 'anniversary', 'donation'],
    category: 'Gifts'
  },
  // Charity
  {
    keywords: ['charity', 'donation', 'fundraising', 'sponsor', 'support'],
    category: 'Charity'
  },
  // Banking and Credit Cards
  {
    keywords: ['citibank', 'creditcards', 'credit card', 'bpay', 'visa', 'mastercard', 'amex', 'transfer to', 'transfer from', 'netbank', 'commbank app', 'savings', 'cheque', 'atm', 'withdrawal', 'fee', 'charge', 'service fee', 'monthly fee', 'account fee'],
    category: 'Banking'
  }
];

// Export the categories array
export const categories = categoryRules.map(rule => rule.category);

export const categorizeTransaction = (description: string): string => {
  const lowerDescription = description.toLowerCase();
  
  for (const rule of categoryRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      return rule.category;
    }
  }
  
  return 'Other';
};
