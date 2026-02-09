import { actions } from './actions.js';
import { businessOperations } from './business-operations.js';

const timestamp = Date.now();
const companyName = `Test Company ${timestamp}`;
const updatedCompanyName = `Updated Test Company ${timestamp}`;
const individualName = `John Smith ${timestamp}`;
const myAppName = `My Company ${timestamp}`;
const myBusinessName = `My Business ${timestamp}`;

export const businessTestCases = {
    entityLifecycle: {
        name: "Entity Creation Test",
        description: "Create and verify a company entity",
        steps: [
            ...actions.login(),
            ...actions.navigateTo('entities'),
            ...actions.createCompanyEntity(companyName),
            ...businessOperations.verifyEntityExists(companyName)
        ]
    },
    entityCrud: {
        name: "Complete Entity CRUD",
        description: "Create, edit, and delete a company entity",
        steps: [
            ...actions.login(),
            ...actions.navigateTo('entities'),
            ...actions.createCompanyEntity(companyName),
            ...businessOperations.verifyEntityExists(companyName),
            // Edit entity
            ...actions.editEntity(companyName, updatedCompanyName),
            ...businessOperations.verifyEntityExists(updatedCompanyName),
            // Delete entity
            ...actions.deleteEntity(updatedCompanyName),
            ...businessOperations.verifyEntityDeleted(updatedCompanyName)
        ]
    },
    financialSetup: {
        name: "Financial Setup Workflow",
        description: "Set up entity, asset, and liability",
        steps: [
            ...actions.login(),
            ...actions.navigateTo('entities'),
            ...actions.createCompanyEntity(companyName),
            ...actions.navigateTo('assets'),
            ...actions.createBankAccount('Savings Account', '10000', 'AUD', companyName),
            ...actions.navigateTo('liabilities'),
            ...actions.createMortgage('Home Loan', '300000', 'AUD', companyName),
            ...actions.navigateTo('entities'),
            ...businessOperations.verifyEntityExists(companyName),
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
            ...actions.createCompanyEntity(myBusinessName),
            ...actions.navigateTo('assets'),
            ...actions.createBankAccount('Business Account', '50000', 'AUD', myBusinessName),
            ...actions.navigateTo('liabilities'),
            ...actions.createMortgage('Office Mortgage', '400000', 'AUD', myBusinessName),
            ...actions.navigateTo('transactions'),
            ...actions.createTransaction('Initial Investment', '10000'),
            // Verify onboarding complete
            ...businessOperations.verifyEntityExists(myBusinessName),
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
            ...actions.createCompanyEntity(myAppName),
            ...actions.createIndividualEntity(individualName),
            ...actions.navigateTo('assets'),
            ...actions.createBankAccount('Company Account', '100000', 'AUD', myAppName),
            ...actions.createBankAccount('Personal Account', '50000', 'AUD', individualName),
            ...actions.navigateTo('liabilities'),
            ...actions.createMortgage('Company Mortgage', '500000', 'AUD', myAppName),
            ...actions.createCreditCard('Personal Credit Card', '5000', 'AUD', individualName),
            // Verify multi-entity setup
            ...businessOperations.verifyEntityExists(myAppName),
            ...businessOperations.verifyEntityExists(individualName),
            ...businessOperations.verifyAssetExists('Company Account'),
            ...businessOperations.verifyAssetExists('Personal Account'),
            ...businessOperations.verifyLiabilityExists('Company Mortgage'),
            ...businessOperations.verifyLiabilityExists('Personal Credit Card')
        ]
    }
};
