export const elements = {
    // Authentication
    login: {
        emailInput: 'input[type="email"]',
        passwordInput: 'input[type="password"]',
        submitButton: 'button[type="submit"]'
    },
    // Entity Management
    entity: {
        addButton: '[data-testid="add-entity-button"]',
        typeSelect: '[data-testid="entity-type-select"]',
        companyOption: '[role="option"]:has-text("Company")',
        individualOption: '[role="option"]:has-text("Individual")',
        trustOption: '[role="option"]:has-text("Trust")',
        superFundOption: '[role="option"]:has-text("Super Fund")',
        nameInput: '[data-testid="entity-name-input"]',
        countryInput: '[data-testid="entity-country-input"]',
        registrationInput: '[data-testid="entity-registration-input"]',
        dateInput: '[data-testid="entity-incorporation-date-input"]',
        submitButton: '[data-testid="add-entity-submit-button"]',
        updateButton: 'button:has-text("Update Entity")',
        deleteButton: 'button:has-text("Delete")',
        editButton: '[data-testid^="edit-entity-button-"]',
        deleteActionButton: '[data-testid^="delete-entity-button-"]'
    },
    // Asset Management
    asset: {
        addButton: '[data-testid="add-asset-button"]',
        entitySelect: '[data-testid="asset-entity-select"]',
        typeSelect: '[data-testid="asset-type-select"]',
        cashOption: '[role="option"]:has-text("Cash")',
        investmentOption: '[role="option"]:has-text("Investment")',
        propertyOption: '[role="option"]:has-text("Property")',
        vehicleOption: '[role="option"]:has-text("Vehicle")',
        otherOption: '[role="option"]:has-text("Other")',
        nameInput: '[data-testid="asset-name-input"]',
        balanceInput: '[data-testid="asset-value-input"]',
        currencySelect: '[role="combobox"]:has-text("AUD")',
        audOption: '[role="option"]:has-text("AUD")',
        usdOption: '[role="option"]:has-text("USD")',
        eurOption: '[role="option"]:has-text("EUR")',
        submitButton: '[data-testid="add-asset-submit-button"]'
    },
    // Liability Management
    liability: {
        addButton: '[data-testid="add-liability-button"]',
        entitySelect: '[data-testid="liability-entity-select"]',
        typeSelect: '[data-testid="liability-type-select"]',
        mortgageOption: '[role="option"]:has-text("Mortgage")',
        creditCardOption: '[role="option"]:has-text("Credit Card")',
        personalLoanOption: '[role="option"]:has-text("Personal Loan")',
        businessLoanOption: '[role="option"]:has-text("Business Loan")',
        studentLoanOption: '[role="option"]:has-text("Student Loan")',
        nameInput: '[data-testid="liability-name-input"]',
        balanceInput: '[data-testid="liability-balance-input"]',
        currencySelect: '[role="combobox"]:has-text("AUD")',
        audOption: '[role="option"]:has-text("AUD")',
        usdOption: '[role="option"]:has-text("USD")',
        eurOption: '[role="option"]:has-text("EUR")',
        submitButton: '[data-testid="add-liability-submit-button"]'
    },
    // Transaction Management
    transaction: {
        addButton: 'button:has-text("Add Transaction")',
        descriptionInput: 'input[placeholder*="Description"]',
        amountInput: 'input[placeholder*="Amount"]',
        currencySelect: '[role="combobox"]',
        audOption: '[role="option"]:has-text("AUD")',
        usdOption: '[role="option"]:has-text("USD")',
        eurOption: '[role="option"]:has-text("EUR")',
        dateInput: 'input[type="date"]',
        categorySelect: 'select >> nth=1',
        groceriesOption: '[role="option"]:has-text("Groceries")',
        utilitiesOption: '[role="option"]:has-text("Utilities")',
        rentOption: '[role="option"]:has-text("Rent")',
        salaryOption: '[role="option"]:has-text("Salary")',
        investmentOption: '[role="option"]:has-text("Investment")',
        submitButton: 'button:has-text("Add Transaction")'
    }
};
