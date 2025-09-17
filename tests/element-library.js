export const elements = {
    // Authentication
    login: {
        emailInput: 'input[type="email"]',
        passwordInput: 'input[type="password"]',
        submitButton: 'button[type="submit"]'
    },
    // Entity Management
    entity: {
        addButton: 'button:has-text("Add Entity")',
        typeSelect: '[role="combobox"]',
        companyOption: '[role="option"]:has-text("Company")',
        individualOption: '[role="option"]:has-text("Individual")',
        trustOption: '[role="option"]:has-text("Trust")',
        superFundOption: '[role="option"]:has-text("Super Fund")',
        nameInput: 'input[placeholder*="Entity Name"]',
        countryInput: 'input[placeholder*="Country"]',
        registrationInput: 'input[placeholder*="Registration/License Number"]',
        dateInput: 'input[type="date"]',
        submitButton: 'button.w-full:has-text("Add Entity")',
        updateButton: 'button:has-text("Update Entity")',
        deleteButton: 'button:has-text("Delete")',
        editButton: 'button[variant="ghost"]:has-text("") >> nth=0',
        deleteActionButton: 'button[variant="ghost"]:has-text("") >> nth=1'
    },
    // Asset Management
    asset: {
        addButton: 'button:has-text("Add Asset")',
        entitySelect: '[role="combobox"]:has-text("Select entity")',
        typeSelect: '[role="combobox"] >> nth=1',
        cashOption: '[role="option"]:has-text("Cash")',
        investmentOption: '[role="option"]:has-text("Investment")',
        propertyOption: '[role="option"]:has-text("Property")',
        vehicleOption: '[role="option"]:has-text("Vehicle")',
        otherOption: '[role="option"]:has-text("Other")',
        nameInput: 'input[placeholder*="Savings Account"]',
        balanceInput: 'input[id="asset-value"]',
        currencySelect: '[role="combobox"]:has-text("AUD")',
        audOption: '[role="option"]:has-text("AUD")',
        usdOption: '[role="option"]:has-text("USD")',
        eurOption: '[role="option"]:has-text("EUR")',
        submitButton: 'button.w-full:has-text("Add Asset")'
    },
    // Liability Management
    liability: {
        addButton: 'button:has-text("Add Liability")',
        entitySelect: '[role="combobox"]:has-text("Select entity")',
        typeSelect: '[role="combobox"] >> nth=1',
        mortgageOption: '[role="option"]:has-text("Mortgage")',
        creditCardOption: '[role="option"]:has-text("Credit Card")',
        personalLoanOption: '[role="option"]:has-text("Personal Loan")',
        businessLoanOption: '[role="option"]:has-text("Business Loan")',
        studentLoanOption: '[role="option"]:has-text("Student Loan")',
        nameInput: 'input[id="liability-name"]',
        balanceInput: 'input[id="current-balance"]',
        currencySelect: '[role="combobox"]:has-text("AUD")',
        audOption: '[role="option"]:has-text("AUD")',
        usdOption: '[role="option"]:has-text("USD")',
        eurOption: '[role="option"]:has-text("EUR")',
        submitButton: 'button.w-full:has-text("Add Liability")'
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
