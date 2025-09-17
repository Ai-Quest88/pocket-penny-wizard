export const testTransactions = [
  {
    date: '2024-01-15',
    description: 'Woolworths Supermarket',
    amount: -85.50,
    category: 'Food & Dining',
    type: 'expense'
  },
  {
    date: '2024-01-14',
    description: 'Salary Payment',
    amount: 5000.00,
    category: 'Salary',
    type: 'income'
  },
  {
    date: '2024-01-13',
    description: 'Shell Petrol Station',
    amount: -65.00,
    category: 'Transportation',
    type: 'expense'
  },
  {
    date: '2024-01-12',
    description: 'Netflix Subscription',
    amount: -14.99,
    category: 'Entertainment',
    type: 'expense'
  },
  {
    date: '2024-01-11',
    description: 'Commonwealth Bank ATM',
    amount: -200.00,
    category: 'Cash Withdrawal',
    type: 'expense'
  }
];

export const testBudgets = [
  {
    name: 'Monthly Food Budget',
    amount: 800,
    period: 'monthly',
    category: 'Food & Dining'
  },
  {
    name: 'Transportation Budget',
    amount: 400,
    period: 'monthly',
    category: 'Transportation'
  }
];

export const testAssets = [
  {
    name: 'Primary Residence',
    type: 'Property',
    value: 850000,
    category: 'Real Estate',
    location: 'Sydney, NSW'
  },
  {
    name: 'Investment Portfolio',
    type: 'Investment',
    value: 125000,
    category: 'Stocks & Shares'
  }
];

export const testLiabilities = [
  {
    name: 'Home Mortgage',
    type: 'Mortgage',
    amount: 650000,
    interestRate: 6.5,
    monthlyPayment: 3200
  },
  {
    name: 'Credit Card',
    type: 'Credit Card',
    amount: 2500,
    creditLimit: 10000
  }
];

export const testEntities = [
  {
    name: 'John Smith',
    type: 'individual',
    email: 'john.smith@example.com',
    phone: '+61 412 345 678'
  },
  {
    name: 'Smith Family Trust',
    type: 'trust',
    registrationNumber: 'TR123456789'
  }
];

export const csvTestData = `Date,Description,Amount,Category
2024-01-15,Woolworths Supermarket,-85.50,Food & Dining
2024-01-14,Salary Payment,5000.00,Salary
2024-01-13,Shell Petrol Station,-65.00,Transportation
2024-01-12,Netflix Subscription,-14.99,Entertainment
2024-01-11,Commonwealth Bank ATM,-200.00,Cash Withdrawal`;