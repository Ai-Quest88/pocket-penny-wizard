
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
  // Income
  {
    keywords: ['salary', 'wage', 'pay', 'deposit', 'dividend', 'interest', 'refund', 'cashback', 'income', 'bonus'],
    category: 'Income'
  },
  // Banking and Credit Cards
  {
    keywords: ['citibank', 'creditcards', 'credit card', 'bpay', 'visa', 'mastercard', 'amex', 'transfer to', 'transfer from', 'netbank', 'commbank app', 'savings', 'cheque', 'atm', 'withdrawal', 'fee', 'charge', 'service fee', 'monthly fee', 'account fee'],
    category: 'Banking'
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
