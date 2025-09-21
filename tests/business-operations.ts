// Business Operations - High-level workflows with TypeScript
import { TestStep, BusinessOperations } from './types.js';
import { actions } from './actions.js';

export const businessOperations: BusinessOperations = {
  // High-level business workflows
  setupNewUser: (): TestStep[] => [
    ...actions.login(),
    ...actions.navigateTo('entities'),
    ...actions.createCompanyEntity('My Company'),
    ...actions.navigateTo('assets'),
    ...actions.createBankAccount('Main Account', '10000'),
    ...actions.navigateTo('liabilities'),
    ...actions.createMortgage('Home Loan', '300000')
  ],
  
  setupBusinessUser: (): TestStep[] => [
    ...actions.login(),
    ...actions.navigateTo('entities'),
    ...actions.createCompanyEntity('My Business'),
    ...actions.navigateTo('assets'),
    ...actions.createBankAccount('Business Account', '50000'),
    ...actions.createInvestment('Investment Portfolio', '100000'),
    ...actions.navigateTo('liabilities'),
    ...actions.createMortgage('Office Mortgage', '400000'),
    ...actions.createCreditCard('Business Credit Card', '10000')
  ],
  
  addMonthlyExpenses: (): TestStep[] => [
    ...actions.navigateTo('transactions'),
    ...actions.createTransaction('Rent', '2000', 'AUD', '2024-07-01', 'Rent'),
    ...actions.createTransaction('Groceries', '500', 'AUD', '2024-07-02', 'Groceries'),
    ...actions.createTransaction('Utilities', '300', 'AUD', '2024-07-03', 'Utilities'),
    ...actions.createTransaction('Insurance', '200', 'AUD', '2024-07-04', 'Insurance')
  ],
  
  addIncome: (): TestStep[] => [
    ...actions.navigateTo('transactions'),
    ...actions.createTransaction('Salary', '5000', 'AUD', '2024-07-01', 'Salary'),
    ...actions.createTransaction('Freelance', '1500', 'AUD', '2024-07-15', 'Freelance'),
    ...actions.createTransaction('Investment Returns', '300', 'AUD', '2024-07-20', 'Investment')
  ],
  
  addBusinessTransactions: (): TestStep[] => [
    ...actions.navigateTo('transactions'),
    ...actions.createTransaction('Client Payment', '10000', 'AUD', '2024-07-01', 'Income'),
    ...actions.createTransaction('Office Rent', '2000', 'AUD', '2024-07-01', 'Rent'),
    ...actions.createTransaction('Equipment Purchase', '5000', 'AUD', '2024-07-02', 'Equipment'),
    ...actions.createTransaction('Marketing Expenses', '1000', 'AUD', '2024-07-03', 'Marketing')
  ],
  
  // Verification helpers
  verifyEntityExists: (name: string): TestStep[] => [
    { action: 'verify', selector: `text="${name}"`, shouldBe: 'visible' }
  ],
  
  verifyAssetExists: (name: string): TestStep[] => [
    { action: 'verify', selector: `text="${name}"`, shouldBe: 'visible' }
  ],
  
  verifyLiabilityExists: (name: string): TestStep[] => [
    { action: 'verify', selector: `text="${name}"`, shouldBe: 'visible' }
  ],
  
  verifyTransactionExists: (description: string): TestStep[] => [
    { action: 'verify', selector: `text="${description}"`, shouldBe: 'visible' }
  ],
  
  verifyEntityDeleted: (name: string): TestStep[] => [
    { action: 'verify', selector: `text="${name}"`, shouldBe: 'hidden' }
  ],

  verifyAssetDeleted: (name: string): TestStep[] => [
    { action: 'verify', selector: `text="${name}"`, shouldBe: 'hidden' }
  ],

  verifyLiabilityDeleted: (name: string): TestStep[] => [
    { action: 'verify', selector: `text="${name}"`, shouldBe: 'hidden' }
  ]
};
