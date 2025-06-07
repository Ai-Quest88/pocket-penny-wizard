
type CategoryRule = {
  keywords: string[];
  category: string;
};

// Store user-defined categorization rules
let userDefinedRules: CategoryRule[] = [];

const baseCategoryRules: CategoryRule[] = [
  // Food - expanded keywords
  {
    keywords: [
      'grocery', 'food', 'restaurant', 'cafe', 'coffee', 'market', 'supermarket', 
      'woolworths', 'coles', 'aldi', 'iga', 'takeaway', 'mcdonald', 'kfc', 'subway', 
      'pizza', 'dining', 'meal', 'bakery', 'butcher', 'deli', 'fishmonger', 'fruit',
      'vegetable', 'lunch', 'dinner', 'breakfast', 'snack', 'domino', 'hungry jack',
      'red rooster', 'nando', 'grill', 'bistro', 'tavern', 'pub', 'bar', 'eating',
      'donut', 'kebab', 'sushi', 'thai', 'chinese', 'indian', 'italian', 'mexican'
    ],
    category: 'Food'
  },
  // Transport - expanded keywords
  {
    keywords: [
      'uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'transport', 'opal', 'myki', 
      'fuel', 'petrol', 'shell', 'bp', 'caltex', 'parking', 'linkt', 'toll', 'etag', 
      'roam', 'transurban', 'ampol', '7-eleven', 'united', 'mobil', 'freedom',
      'car wash', 'service station', 'rego', 'registration', 'insurance', 'mechanic',
      'tyre', 'battery', 'oil change', 'roadside', 'automotive'
    ],
    category: 'Transport'
  },
  // Shopping - expanded keywords
  {
    keywords: [
      'amazon', 'walmart', 'target', 'shop', 'store', 'mall', 'kmart', 'big w', 
      'harvey norman', 'jb hi-fi', 'bunnings', 'officeworks', 'shopping', 'purchase', 
      'buy', 'retail', 'clothing', 'fashion', 'shoes', 'electronics', 'appliance',
      'furniture', 'homewares', 'gifts', 'toys', 'books', 'stationery', 'hardware',
      'department store', 'chemist', 'pharmacy', 'discount'
    ],
    category: 'Shopping'
  },
  // Bills - expanded keywords
  {
    keywords: [
      'rent', 'electricity', 'water', 'gas', 'internet', 'phone', 'utility', 'telstra', 
      'optus', 'vodafone', 'agl', 'origin', 'council', 'rates', 'bill', 'insurance', 
      'premium', 'energy', 'power', 'heating', 'cooling', 'broadband', 'mobile',
      'landline', 'strata', 'body corporate', 'maintenance', 'repair'
    ],
    category: 'Bills'
  },
  // Entertainment - expanded keywords
  {
    keywords: [
      'netflix', 'spotify', 'hbo', 'cinema', 'movie', 'theatre', 'concert', 
      'entertainment', 'disney', 'youtube', 'apple music', 'amazon prime', 'gaming', 
      'music', 'streaming', 'subscription', 'festival', 'event', 'tickets',
      'amusement', 'theme park', 'sports', 'gym', 'fitness', 'recreation'
    ],
    category: 'Entertainment'
  },
  // Health - expanded keywords
  {
    keywords: [
      'doctor', 'dentist', 'pharmacy', 'medical', 'health', 'hospital', 'clinic', 
      'physiotherapy', 'gym', 'fitness', 'chemist', 'prescription', 'medicine',
      'healthcare', 'specialist', 'optometrist', 'chiropractor', 'massage',
      'wellness', 'therapy', 'counselling', 'psychology'
    ],
    category: 'Health'
  },
  // Travel - expanded keywords
  {
    keywords: [
      'hotel', 'flight', 'airline', 'booking', 'airbnb', 'travel', 'vacation', 
      'holiday', 'accommodation', 'motel', 'resort', 'hostel', 'camping',
      'jetstar', 'qantas', 'virgin', 'tigerair', 'expedia', 'agoda'
    ],
    category: 'Travel'
  },
  // Education - expanded keywords
  {
    keywords: [
      'school', 'university', 'course', 'education', 'tuition', 'books', 'learning', 
      'training', 'college', 'academy', 'institute', 'student', 'fees', 'textbook',
      'scholastic', 'educational', 'workshop', 'seminar', 'certification'
    ],
    category: 'Education'
  },
  // Income - expanded keywords
  {
    keywords: [
      'salary', 'wage', 'pay', 'deposit', 'dividend', 'interest', 'refund', 
      'cashback', 'income', 'bonus', 'commission', 'freelance', 'consulting',
      'payment received', 'transfer in', 'reimbursement', 'rebate'
    ],
    category: 'Income'
  },
  // Investment - expanded keywords
  {
    keywords: [
      'investment', 'stock', 'share', 'etf', 'fund', 'crypto', 'bitcoin', 'trading',
      'broker', 'portfolio', 'dividend', 'capital gains', 'mutual fund',
      'retirement', 'superannuation', 'pension'
    ],
    category: 'Investment'
  },
  // Banking - expanded keywords
  {
    keywords: [
      'citibank', 'creditcards', 'credit card', 'bpay', 'visa', 'mastercard', 
      'amex', 'transfer to', 'transfer from', 'netbank', 'commbank app', 'savings', 
      'cheque', 'atm', 'withdrawal', 'fee', 'charge', 'service fee', 'monthly fee', 
      'account fee', 'bank', 'westpac', 'anz', 'nab', 'commonwealth', 'suncorp',
      'st george', 'bendigo', 'credit union', 'financial', 'loan', 'mortgage'
    ],
    category: 'Banking'
  }
];

// Function to add a user-defined rule
export const addUserCategoryRule = (description: string, category: string) => {
  // Extract meaningful words from the description
  const keywords = description
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2) // Only words longer than 2 characters
    .slice(0, 3); // Take first 3 meaningful words

  console.log(`Adding user rule: "${keywords.join(', ')}" -> ${category}`);
  
  // Check if a similar rule already exists
  const existingRule = userDefinedRules.find(rule => 
    rule.category === category && 
    rule.keywords.some(keyword => keywords.includes(keyword))
  );

  if (existingRule) {
    // Merge keywords with existing rule
    existingRule.keywords = [...new Set([...existingRule.keywords, ...keywords])];
  } else {
    // Add new rule
    userDefinedRules.push({
      keywords,
      category
    });
  }

  // Store in localStorage for persistence
  try {
    localStorage.setItem('userCategoryRules', JSON.stringify(userDefinedRules));
  } catch (error) {
    console.error('Failed to save user category rules:', error);
  }
};

// Load user-defined rules from localStorage
export const loadUserCategoryRules = () => {
  try {
    const stored = localStorage.getItem('userCategoryRules');
    if (stored) {
      userDefinedRules = JSON.parse(stored);
      console.log('Loaded user category rules:', userDefinedRules);
    }
  } catch (error) {
    console.error('Failed to load user category rules:', error);
    userDefinedRules = [];
  }
};

// Export the categories array
export const categories = [...new Set([
  ...baseCategoryRules.map(rule => rule.category),
  'Other', 'Gifts', 'Charity', 'Insurance'
])];

export const categorizeTransaction = (description: string): string => {
  const lowerDescription = description.toLowerCase();
  
  // First check user-defined rules (they take priority)
  for (const rule of userDefinedRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      console.log(`Matched user rule: "${description}" -> ${rule.category}`);
      return rule.category;
    }
  }
  
  // Then check base rules
  for (const rule of baseCategoryRules) {
    if (rule.keywords.some(keyword => lowerDescription.includes(keyword))) {
      console.log(`Matched base rule: "${description}" -> ${rule.category}`);
      return rule.category;
    }
  }
  
  console.log(`No match found for: "${description}" -> Other`);
  return 'Other';
};

// Initialize user rules on module load
loadUserCategoryRules();
