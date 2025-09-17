// Business Test Cases - TypeScript with proper typing
import { TestCase } from './types.js';
import { actions } from './actions.js';
import { businessOperations } from './business-operations.js';

export const businessTestCases: Record<string, TestCase> = {
  entityLifecycle: {
    name: "Entity Creation Test",
    description: "Create and verify a company entity",
    steps: [
      ...actions.login(),
      ...actions.navigateTo('entities'),
      ...actions.createCompanyEntity('Test Company'),
      ...businessOperations.verifyEntityExists('Test Company')
    ]
  },
  
  entityCrud: {
    name: "Complete Entity CRUD",
    description: "Create, edit, and delete a company entity",
    steps: [
      ...actions.login(),
      ...actions.navigateTo('entities'),
      ...actions.createCompanyEntity('Test Company'),
      ...businessOperations.verifyEntityExists('Test Company'),
      
      // Edit entity
      ...actions.editEntity('Test Company', 'Updated Test Company'),
      ...businessOperations.verifyEntityExists('Updated Test Company'),
      
      // Delete entity
      ...actions.deleteEntity('Updated Test Company'),
      ...businessOperations.verifyEntityDeleted('Updated Test Company')
    ]
  },
  
  financialSetup: {
    name: "Financial Setup Workflow",
    description: "Set up entity, asset, and liability",
    steps: [
      ...actions.login(),
      ...actions.navigateTo('entities'),
      ...actions.createCompanyEntity('Test Company'),
      ...actions.navigateTo('assets'),
      ...actions.createBankAccount('Savings Account', '10000'),
      ...actions.navigateTo('liabilities'),
      ...actions.createMortgage('Home Loan', '300000'),
      ...actions.navigateTo('entities'),
      ...businessOperations.verifyEntityExists('Test Company'),
      ...actions.navigateTo('assets'),
      ...businessOperations.verifyAssetExists('Savings Account'),
      ...actions.navigateTo('liabilities'),
      ...businessOperations.verifyLiabilityExists('Home Loan')
    ]
  },
  
  transactionManagement: {
    name: "Transaction Management",
    description: "Add and manage transactions",
    steps: [
      ...actions.login(),
      ...actions.navigateTo('transactions'),
      ...actions.createTransaction('Grocery Shopping', '120.50'),
      ...businessOperations.verifyTransactionExists('Grocery Shopping'),
      { action: 'verify', selector: 'text="A$120.50"', shouldBe: 'visible' }
    ]
  },
  
  completeFinancialWorkflow: {
    name: "Complete Financial Workflow",
    description: "End-to-end financial management",
    steps: [
      ...businessOperations.setupNewUser(),
      ...businessOperations.addMonthlyExpenses(),
      ...businessOperations.addIncome(),
      
      // Verify everything
      ...businessOperations.verifyEntityExists('My Company'),
      ...businessOperations.verifyAssetExists('Main Account'),
      ...businessOperations.verifyLiabilityExists('Home Loan'),
      ...businessOperations.verifyTransactionExists('Salary'),
      ...businessOperations.verifyTransactionExists('Rent')
    ]
  },
  
  businessUserWorkflow: {
    name: "Business User Workflow",
    description: "Complete business financial setup and management",
    steps: [
      ...businessOperations.setupBusinessUser(),
      ...businessOperations.addBusinessTransactions(),
      
      // Verify business setup
      ...businessOperations.verifyEntityExists('My Business'),
      ...businessOperations.verifyAssetExists('Business Account'),
      ...businessOperations.verifyAssetExists('Investment Portfolio'),
      ...businessOperations.verifyLiabilityExists('Office Mortgage'),
      ...businessOperations.verifyLiabilityExists('Business Credit Card'),
      ...businessOperations.verifyTransactionExists('Client Payment'),
      ...businessOperations.verifyTransactionExists('Office Rent')
    ]
  },
  
  userOnboarding: {
    name: "User Onboarding",
    description: "New user sets up their financial profile",
    steps: [
      ...actions.login(),
      ...actions.navigateTo('entities'),
      ...actions.createCompanyEntity('My Business'),
      ...actions.navigateTo('assets'),
      ...actions.createBankAccount('Business Account', '50000'),
      ...actions.navigateTo('liabilities'),
      ...actions.createMortgage('Office Mortgage', '400000'),
      ...actions.navigateTo('transactions'),
      ...actions.createTransaction('Initial Investment', '10000'),
      
      // Verify onboarding complete
      ...businessOperations.verifyEntityExists('My Business'),
      ...businessOperations.verifyAssetExists('Business Account'),
      ...businessOperations.verifyLiabilityExists('Office Mortgage'),
      ...businessOperations.verifyTransactionExists('Initial Investment')
    ]
  },
  
  multiEntitySetup: {
    name: "Multi-Entity Setup",
    description: "Set up multiple entities with different types",
    steps: [
      ...actions.login(),
      ...actions.navigateTo('entities'),
      ...actions.createCompanyEntity('My Company'),
      ...actions.createIndividualEntity('John Smith'),
      ...actions.navigateTo('assets'),
      ...actions.createBankAccount('Company Account', '100000'),
      ...actions.createBankAccount('Personal Account', '50000'),
      ...actions.navigateTo('liabilities'),
      ...actions.createMortgage('Company Mortgage', '500000'),
      ...actions.createCreditCard('Personal Credit Card', '5000'),
      
      // Verify multi-entity setup
      ...businessOperations.verifyEntityExists('My Company'),
      ...businessOperations.verifyEntityExists('John Smith'),
      ...businessOperations.verifyAssetExists('Company Account'),
      ...businessOperations.verifyAssetExists('Personal Account'),
      ...businessOperations.verifyLiabilityExists('Company Mortgage'),
      ...businessOperations.verifyLiabilityExists('Personal Credit Card')
    ]
  }
};