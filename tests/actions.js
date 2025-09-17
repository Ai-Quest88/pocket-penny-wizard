import { elements } from './element-library.js';
export const actions = {
    // Login workflow
    login: (email = 'test@example.com', password = 'password123') => [
        { action: 'navigate', url: 'http://localhost:8081/login' },
        { action: 'fill', selector: elements.login.emailInput, value: email },
        { action: 'fill', selector: elements.login.passwordInput, value: password },
        { action: 'click', selector: elements.login.submitButton },
        { action: 'wait', timeout: 2000 }
    ],
    // Navigate to page
    navigateTo: (page) => [
        { action: 'navigate', url: `http://localhost:8081/${page}` }
    ],
    // Create company entity
    createCompanyEntity: (name, country = 'Australia', registration = '123456789', date = '2024-01-01') => [
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
    createIndividualEntity: (name, country = 'Australia') => [
        { action: 'click', selector: elements.entity.addButton },
        { action: 'click', selector: elements.entity.typeSelect },
        { action: 'click', selector: elements.entity.individualOption },
        { action: 'fill', selector: elements.entity.nameInput, value: name },
        { action: 'fill', selector: elements.entity.countryInput, value: country },
        { action: 'click', selector: elements.entity.submitButton },
        { action: 'wait', timeout: 2000 }
    ],
    // Create bank account asset
    createBankAccount: (name, balance = '10000', currency = 'AUD', entityName = 'Test Company') => [
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
    createInvestment: (name, balance = '50000', currency = 'AUD', entityName = 'Test Company') => [
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
    createMortgage: (name, balance = '300000', currency = 'AUD', entityName = 'Test Company') => [
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
    createCreditCard: (name, balance = '5000', currency = 'AUD', entityName = 'Test Company') => [
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
    createTransaction: (description, amount, currency = 'AUD', date = '2024-07-25', category = 'Groceries') => [
        { action: 'click', selector: elements.transaction.addButton },
        { action: 'fill', selector: elements.transaction.descriptionInput, value: description },
        { action: 'fill', selector: elements.transaction.amountInput, value: amount },
        { action: 'click', selector: elements.transaction.currencySelect },
        { action: 'click', selector: currency === 'AUD' ? elements.transaction.audOption : elements.transaction.usdOption },
        { action: 'fill', selector: elements.transaction.dateInput, value: date },
        { action: 'click', selector: elements.transaction.categorySelect },
        { action: 'click', selector: category === 'Groceries' ? elements.transaction.groceriesOption : elements.transaction.utilitiesOption },
        { action: 'click', selector: elements.transaction.submitButton },
        { action: 'wait', timeout: 1000 }
    ],
    // Edit entity
    editEntity: (oldName, newName) => [
        { action: 'click', selector: `div:has(h3:has-text("${oldName}")) button[variant="ghost"] >> nth=0` },
        { action: 'fill', selector: elements.entity.nameInput, value: newName },
        { action: 'click', selector: elements.entity.updateButton },
        { action: 'wait', timeout: 2000 }
    ],
    // Delete entity
    deleteEntity: (name) => [
        { action: 'click', selector: `div:has(h3:has-text("${name}")) button[variant="ghost"] >> nth=1` },
        { action: 'click', selector: elements.entity.deleteButton },
        { action: 'wait', timeout: 2000 }
    ]
};
