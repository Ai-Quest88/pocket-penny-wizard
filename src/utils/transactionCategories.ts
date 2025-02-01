type CategoryRule = {
  keywords: string[];
  category: string;
};

const categoryRules: CategoryRule[] = [
  {
    keywords: ['grocery', 'food', 'restaurant', 'cafe', 'coffee', 'market', 'supermarket'],
    category: 'Food'
  },
  {
    keywords: ['uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'transport'],
    category: 'Transportation'
  },
  {
    keywords: ['netflix', 'spotify', 'hbo', 'cinema', 'movie', 'theatre', 'concert'],
    category: 'Entertainment'
  },
  {
    keywords: ['amazon', 'walmart', 'target', 'shop', 'store', 'mall'],
    category: 'Shopping'
  },
  {
    keywords: ['rent', 'electricity', 'water', 'gas', 'internet', 'phone', 'utility'],
    category: 'Bills'
  },
  {
    keywords: ['salary', 'deposit', 'dividend', 'interest'],
    category: 'Income'
  }
];

export const categorizeTransaction = (description: string): string => {
  description = description.toLowerCase();
  
  for (const rule of categoryRules) {
    if (rule.keywords.some(keyword => description.includes(keyword))) {
      return rule.category;
    }
  }
  
  return 'Other';
};