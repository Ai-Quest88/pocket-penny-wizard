// Reusable Actions - TypeScript with proper typing
import { TestStep, ActionLibrary } from './types.js';
import { elements } from './element-library.js';

export const actions: ActionLibrary = {
  // Login workflow
  login: (email: string = 'test@example.com', password: string = 'password123'): TestStep[] => [
    { action: 'navigate', url: 'http://localhost:8081/login' },
    { action: 'fill', selector: elements.login.emailInput, value: email },
    { action: 'fill', selector: elements.login.passwordInput, value: password },
    { action: 'click', selector: elements.login.submitButton },
    { action: 'wait', timeout: 2000 }
  ],
  
  // Navigate to page
  navigateTo: (page: string): TestStep[] => [
    { action: 'navigate', url: `http://localhost:8081/${page}` }
  ],
  
  // Create company entity
  createCompanyEntity: (
    name: string, 
    country: string = 'Australia', 
    registration: string = '123456789', 
    date: string = '2024-01-01'
  ): TestStep[] => [
    { action: 'click', selector: elements.entity.addButton },
    { action: 'click', selector: elements.entity.typeSelect },
    { action: 'click', selector: elements.entity.companyOption },
    { action: 'fill', selector: elements.entity.nameInput, value: name },
    { action: 'fill', selector: elements.entity.countryInput, value: country },
    { action: 'fill', selector: elements.entity.registrationInput, value: registration },
    { action: 'fill', selector: elements.entity.dateInput, value: date },
    { action: 'click', selector: elements.entity.submitButton },
    { action: 'wait', timeout: 2000 }
  ],
  
  // Create individual entity
  createIndividualEntity: (name: string, country: string = 'Australia'): TestStep[] => [
    { action: 'click', selector: elements.entity.addButton },
    { action: 'click', selector: elements.entity.typeSelect },
    { action: 'click', selector: elements.entity.individualOption },
    { action: 'fill', selector: elements.entity.nameInput, value: name },
    { action: 'fill', selector: elements.entity.countryInput, value: country },
    { action: 'click', selector: elements.entity.submitButton },
    { action: 'wait', timeout: 2000 }
  ],
  
  // Create bank account asset
  createBankAccount: (name: string, balance: string = '10000', currency: string = 'AUD', entityName: string = 'Test Company'): TestStep[] => [
    { action: 'click', selector: elements.asset.addButton },
    { action: 'click', selector: elements.asset.entitySelect },
    { action: 'click', selector: `[role="option"]:has-text("${entityName}")` },
    { action: 'click', selector: elements.asset.typeSelect },
    { action: 'click', selector: elements.asset.cashOption },
    { action: 'fill', selector: elements.asset.nameInput, value: name },
    { action: 'fill', selector: elements.asset.balanceInput, value: balance },
    { action: 'click', selector: elements.asset.currencySelect },
    { action: 'click', selector: currency === 'AUD' ? elements.asset.audOption : elements.asset.usdOption },
    { action: 'click', selector: elements.asset.submitButton },
    { action: 'wait', timeout: 1000 }
  ],
  
  // Create investment asset
  createInvestment: (name: string, balance: string = '50000', currency: string = 'AUD', entityName: string = 'Test Company'): TestStep[] => [
    { action: 'click', selector: elements.asset.addButton },
    { action: 'click', selector: elements.asset.entitySelect },
    { action: 'click', selector: `[role="option"]:has-text("${entityName}")` },
    { action: 'click', selector: elements.asset.typeSelect },
    { action: 'click', selector: elements.asset.investmentOption },
    { action: 'fill', selector: elements.asset.nameInput, value: name },
    { action: 'fill', selector: elements.asset.balanceInput, value: balance },
    { action: 'click', selector: elements.asset.currencySelect },
    { action: 'click', selector: currency === 'AUD' ? elements.asset.audOption : elements.asset.usdOption },
    { action: 'click', selector: elements.asset.submitButton },
    { action: 'wait', timeout: 1000 }
  ],
  
  // Create mortgage liability
  createMortgage: (name: string, balance: string = '300000', currency: string = 'AUD', entityName: string = 'Test Company'): TestStep[] => [
    { action: 'click', selector: elements.liability.addButton },
    { action: 'click', selector: elements.liability.entitySelect },
    { action: 'click', selector: `[role="option"]:has-text("${entityName}")` },
    { action: 'click', selector: elements.liability.typeSelect },
    { action: 'click', selector: elements.liability.mortgageOption },
    { action: 'fill', selector: elements.liability.nameInput, value: name },
    { action: 'fill', selector: elements.liability.balanceInput, value: balance },
    { action: 'click', selector: elements.liability.currencySelect },
    { action: 'click', selector: currency === 'AUD' ? elements.liability.audOption : elements.liability.usdOption },
    { action: 'click', selector: elements.liability.submitButton },
    { action: 'wait', timeout: 1000 }
  ],
  
  // Create credit card liability
  createCreditCard: (name: string, balance: string = '5000', currency: string = 'AUD', entityName: string = 'Test Company'): TestStep[] => [
    { action: 'click', selector: elements.liability.addButton },
    { action: 'click', selector: elements.liability.entitySelect },
    { action: 'click', selector: `[role="option"]:has-text("${entityName}")` },
    { action: 'click', selector: elements.liability.typeSelect },
    { action: 'click', selector: elements.liability.creditCardOption },
    { action: 'fill', selector: elements.liability.nameInput, value: name },
    { action: 'fill', selector: elements.liability.balanceInput, value: balance },
    { action: 'click', selector: elements.liability.currencySelect },
    { action: 'click', selector: currency === 'AUD' ? elements.liability.audOption : elements.liability.usdOption },
    { action: 'click', selector: elements.liability.submitButton },
    { action: 'wait', timeout: 1000 }
  ],
  
  // Create transaction
  createTransaction: (
    description: string, 
    amount: string, 
    currency: string = 'AUD', 
    date: string = '2024-07-25', 
    category: string = 'Groceries'
  ): TestStep[] => [
    { action: 'click', selector: elements.transaction.addManualButton },
    { action: 'fill', selector: elements.transaction.descriptionInput, value: description },
    { action: 'fill', selector: elements.transaction.amountInput, value: amount },
    { action: 'click', selector: elements.transaction.dateInput },
    { action: 'wait', timeout: 1000 }, // Wait for date picker to open
    { action: 'click', selector: elements.transaction.currencySelect },
    { action: 'click', selector: currency === 'AUD' ? elements.transaction.audOption : elements.transaction.usdOption },
    { action: 'click', selector: elements.transaction.categorySelect },
    { action: 'wait', timeout: 2000 }, // Wait for categories to load
    { action: 'click', selector: category === 'Groceries' ? elements.transaction.groceriesOption : elements.transaction.utilitiesOption },
    { action: 'click', selector: elements.transaction.submitButton },
    { action: 'wait', timeout: 1000 }
  ],
  
  // Edit entity
  editEntity: (oldName: string, newName: string): TestStep[] => [
    { action: 'click', selector: `div:has(h3:has-text("${oldName}")) button[variant="ghost"] >> nth=0` },
    { action: 'fill', selector: elements.entity.nameInput, value: newName },
    { action: 'click', selector: elements.entity.updateButton },
    { action: 'wait', timeout: 2000 }
  ],
  
  // Delete entity
  deleteEntity: (name: string): TestStep[] => [
    { action: 'click', selector: `div:has(h3:has-text("${name}")) button[variant="ghost"] >> nth=1` },
    { action: 'click', selector: elements.entity.deleteButton },
    { action: 'wait', timeout: 2000 }
  ]
};
