# Pocket Penny Wizard - User Stories & Implementation Tasks

## 🎯 **Epic 1: Core Utility Functions**

### **Story 1.1: Currency Conversion System**
**As a** user managing multi-currency transactions  
**I want** to convert amounts between different currencies  
**So that** I can track my finances accurately across countries

**Acceptance Criteria:**
- [ ] Convert amounts between 30+ major currencies
- [ ] Use real-time exchange rates from open.er-api.com
- [ ] Format currency amounts with proper symbols
- [ ] Handle currency conversion with 4 decimal place accuracy
- [ ] Support offline operation with cached rates

**Tasks:**
- [ ] Create `src/utils/currencyUtils.ts` with conversion functions
- [ ] Implement `convertAmount()` function
- [ ] Implement `formatCurrency()` function  
- [ ] Implement `getExchangeRates()` function
- [ ] Define `CURRENCIES` constant with 30+ currencies
- [ ] Run tests to verify implementation

---

### **Story 1.2: Financial Year Management**
**As a** user managing entities in different countries  
**I want** to calculate financial years based on country rules  
**So that** I can organize my finances according to local tax requirements

**Acceptance Criteria:**
- [ ] Support Australia (July 1 - June 30)
- [ ] Support India (April 1 - March 31)  
- [ ] Support United States (January 1 - December 31)
- [ ] Calculate current financial year for any country
- [ ] Get financial year for specific dates
- [ ] Generate proper financial year names (FY25, etc.)

**Tasks:**
- [ ] Create `src/utils/financialYearUtils.ts` with FY functions
- [ ] Implement `getCurrentFinancialYear()` function
- [ ] Implement `getFinancialYearForDate()` function
- [ ] Implement `getFinancialYearName()` function
- [ ] Define `SUPPORTED_COUNTRIES` constant
- [ ] Run tests to verify implementation

---

### **Story 1.3: CSV Import System**
**As a** user importing bank statements  
**I want** to parse CSV files with Australian banking formats  
**So that** I can quickly import my transaction history

**Acceptance Criteria:**
- [ ] Parse CSV files with various formats
- [ ] Detect Australian bank headers automatically
- [ ] Map columns to transaction fields
- [ ] Validate transaction data
- [ ] Handle date formats (DD/MM/YYYY preference)
- [ ] Detect and prevent duplicates

**Tasks:**
- [ ] Create `src/utils/csvParser.ts` with parsing functions
- [ ] Implement `parseCSV()` function
- [ ] Implement `detectHeaders()` function
- [ ] Implement `mapHeaders()` function
- [ ] Implement `validateTransactionData()` function
- [ ] Run tests to verify implementation

---

## 🧠 **Epic 2: AI-Powered Transaction Categorization**

### **Story 2.1: Transaction Categorization Service**
**As a** user importing transactions  
**I want** automatic categorization with 95%+ accuracy  
**So that** I can organize my finances without manual work

**Acceptance Criteria:**
- [ ] Prioritize user-defined rules over system rules
- [ ] Fall back to system rules when user rules fail
- [ ] Use AI (Google Gemini) when system rules fail
- [ ] Provide final fallback to basic categorization
- [ ] Handle batch processing efficiently (100+ transactions)
- [ ] Achieve 95%+ accuracy target
- [ ] Process batches within 5 seconds

**Tasks:**
- [ ] Create `src/services/categorization/TransactionCategorizer.ts`
- [ ] Implement `categorizeTransaction()` method
- [ ] Implement `categorizeBatch()` method
- [ ] Create user rules system
- [ ] Create system rules system
- [ ] Integrate Google Gemini AI
- [ ] Create fallback categorization
- [ ] Run tests to verify implementation

---

### **Story 2.2: Category Management System**
**As a** user managing my transaction categories  
**I want** to create, update, and organize categories  
**So that** I can customize my financial organization

**Acceptance Criteria:**
- [ ] Fetch categories from Supabase
- [ ] Create new categories
- [ ] Update existing categories
- [ ] Delete categories with confirmation
- [ ] Handle loading and error states
- [ ] Cache categories for performance

**Tasks:**
- [ ] Create `src/hooks/useCategories.ts` hook
- [ ] Implement category CRUD operations
- [ ] Add error handling and loading states
- [ ] Implement React Query caching
- [ ] Run tests to verify implementation

---

## 🧩 **Epic 3: UI Components**

### **Story 3.1: Dashboard Card Component**
**As a** user viewing my dashboard  
**I want** to see key financial metrics in cards  
**So that** I can quickly understand my financial position

**Acceptance Criteria:**
- [ ] Display metric title and value
- [ ] Show trend indicators (up/down)
- [ ] Handle loading states
- [ ] Display error states gracefully
- [ ] Support different metric types
- [ ] Be responsive across devices

**Tasks:**
- [ ] Create `src/components/DashboardCard.tsx`
- [ ] Implement metric display
- [ ] Add trend indicators
- [ ] Handle loading/error states
- [ ] Make responsive
- [ ] Run tests to verify implementation

---

## 🚀 **Implementation Order**

1. **Currency Utils** (Story 1.1) - Foundation for multi-currency
2. **Financial Year Utils** (Story 1.2) - Foundation for reporting
3. **CSV Parser** (Story 1.3) - Foundation for data import
4. **Transaction Categorizer** (Story 2.1) - Core AI functionality
5. **Category Management** (Story 2.2) - Category system
6. **Dashboard Card** (Story 3.1) - UI component

---

## 📊 **Test Coverage Goals**

- **Unit Tests**: 90%+ coverage for utility functions
- **Integration Tests**: 80%+ coverage for services
- **Component Tests**: 70%+ coverage for UI components
- **E2E Tests**: Critical user journeys covered

---

## ✅ **Definition of Done**

Each story is complete when:
- [ ] All acceptance criteria met
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Performance requirements met
- [ ] Error handling implemented
- [ ] Accessibility requirements met
