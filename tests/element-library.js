export const elements = {
    // Authentication
    login: {
        emailInput: '[data-testid="login-email-input"]',
        passwordInput: '[data-testid="login-password-input"]',
        submitButton: '[data-testid="login-submit-button"]',
        googleButton: '[data-testid="login-google-button"]',
        toggleSignupButton: '[data-testid="login-toggle-signup-button"]'
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
        descriptionInput: '[data-testid="transaction-description-input"]',
        amountInput: '[data-testid="transaction-amount-input"]',
        dateInput: '[data-testid="transaction-date-picker"]',
        currencySelect: '[data-testid="transaction-currency-select"]',
        categorySelect: '[data-testid="transaction-category-select"]',
        audOption: '[role="option"]:has-text("AUD")',
        usdOption: '[role="option"]:has-text("USD")',
        eurOption: '[role="option"]:has-text("EUR")',
        groceriesOption: '[role="option"]:has-text("Groceries")',
        utilitiesOption: '[role="option"]:has-text("Utilities")',
        rentOption: '[role="option"]:has-text("Rent")',
        salaryOption: '[role="option"]:has-text("Salary")',
        investmentOption: '[role="option"]:has-text("Investment")',
        submitButton: '[data-testid="transaction-submit-button"]',
        findDuplicatesButton: '[data-testid="transactions-find-duplicates-button"]',
        viewTransfersButton: '[data-testid="transactions-view-transfers-button"]',
        addManualButton: '[data-testid="transactions-add-manual-button"]',
        uploadCsvButton: '[data-testid="transactions-upload-csv-button"]'
    },
    // Navigation
    sidebar: {
        dashboardLink: '[data-testid="sidebar-dashboard-link"]',
        entitiesLink: '[data-testid="sidebar-entities-link"]',
        assetsLink: '[data-testid="sidebar-assets-link"]',
        liabilitiesLink: '[data-testid="sidebar-liabilities-link"]',
        transactionsLink: '[data-testid="sidebar-transactions-link"]'
    },
    // Pages
    pages: {
        entitiesTitle: '[data-testid="entities-page-title"]',
        entitiesSubtitle: '[data-testid="entities-page-subtitle"]',
        assetsTitle: '[data-testid="assets-page-title"]',
        assetsSubtitle: '[data-testid="assets-page-subtitle"]',
        assetsTotalCard: '[data-testid="assets-total-card"]',
        liabilitiesTitle: '[data-testid="liabilities-page-title"]',
        liabilitiesSubtitle: '[data-testid="liabilities-page-subtitle"]',
        liabilitiesTotalCard: '[data-testid="liabilities-total-card"]'
    },
    // Dashboard
    dashboard: {
        entityFilter: '[data-testid="dashboard-entity-filter"]',
        tabTransactions: '[data-testid="dashboard-tab-transactions"]',
        tabBudget: '[data-testid="dashboard-tab-budget"]',
        tabCashFlow: '[data-testid="dashboard-tab-cash-flow"]',
        tabCategories: '[data-testid="dashboard-tab-categories"]',
        tabHistorical: '[data-testid="dashboard-tab-historical"]'
    },
    // Transaction List
    transactionList: {
        container: '[data-testid="transaction-list-container"]'
    }
};
