# MCP Business Test System - TypeScript

A modern, type-safe business test system for Pocket Penny Wizard using Playwright automation.

## 🎯 What This Is

Instead of brittle E2E tests with hardcoded selectors, this system:
- **Describes business scenarios** in plain language with TypeScript types
- **Uses Playwright** to execute tests automatically
- **Provides visual feedback** with screenshots and detailed logging
- **Tests actual user workflows** end-to-end
- **Type-safe** with full IntelliSense support

## 📁 File Structure

```
tests/
├── types.ts                    # TypeScript type definitions
├── element-library.ts          # Centralized selectors
├── actions.ts                  # Reusable action functions
├── business-operations.ts      # High-level business workflows
├── business-test-cases.ts      # Test case definitions
├── mcp-test-executor.ts        # Test execution engine
└── README.md                   # This file
```

## 🚀 Usage

```bash
# Run all business tests
npm run test:mcp

# Run specific test cases
npm run test:mcp:entity        # Entity lifecycle test
npm run test:mcp:financial     # Financial setup test
npm run test:mcp:transaction   # Transaction management test
npm run test:mcp:business      # Business user workflow
npm run test:mcp:onboarding    # User onboarding
npm run test:mcp:multi-entity  # Multi-entity setup
```

## 📝 TypeScript Benefits

### **1. Type Safety**
```typescript
// ✅ Type-safe test steps
interface TestStep {
  action: 'navigate' | 'click' | 'fill' | 'select' | 'verify' | 'wait';
  selector?: string;
  value?: string;
  url?: string;
  shouldBe?: 'visible' | 'hidden' | 'enabled' | 'disabled';
  timeout?: number;
}

// ✅ Type-safe actions
const actions: ActionLibrary = {
  login: (email: string = 'test@example.com', password: string = 'password123'): TestStep[] => [
    // ... implementation
  ]
};
```

### **2. IntelliSense Support**
```typescript
// ✅ Auto-completion for all properties
const testCase: TestCase = {
  name: "My Test",           // ← IntelliSense suggests 'name'
  description: "Test desc",  // ← IntelliSense suggests 'description'
  steps: [                   // ← IntelliSense suggests 'steps'
    { action: 'navigate' }  // ← IntelliSense suggests action types
  ]
};
```

### **3. Compile-time Error Checking**
```typescript
// ❌ TypeScript will catch this error at compile time
const invalidStep: TestStep = {
  action: 'invalid-action',  // ← Error: Type '"invalid-action"' is not assignable
  selector: 'button'
};
```

## 🏗️ Architecture

### **Element Library** (`element-library.ts`)
Centralized selectors with TypeScript types:
```typescript
export const elements: ElementLibrary = {
  entity: {
    addButton: 'button:has-text("Add Entity")',
    typeSelect: '[role="combobox"]',
    companyOption: '[role="option"]:has-text("Company")',
    // ... more selectors
  }
};
```

### **Actions** (`actions.ts`)
Reusable action functions with proper typing:
```typescript
export const actions: ActionLibrary = {
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
    // ... more steps
  ]
};
```

### **Business Operations** (`business-operations.ts`)
High-level workflows:
```typescript
export const businessOperations: BusinessOperations = {
  setupNewUser: (): TestStep[] => [
    ...actions.login(),
    ...actions.navigateTo('entities'),
    ...actions.createCompanyEntity('My Company'),
    ...actions.navigateTo('assets'),
    ...actions.createBankAccount('Main Account', '10000'),
    // ... more setup
  ]
};
```

### **Test Cases** (`business-test-cases.ts`)
Business-focused test definitions:
```typescript
export const businessTestCases: Record<string, TestCase> = {
  entityLifecycle: {
    name: "Complete Entity Lifecycle",
    description: "Create, edit, and delete a company entity",
    steps: [
      ...actions.login(),
      ...actions.navigateTo('entities'),
      ...actions.createCompanyEntity('Test Company'),
      ...businessOperations.verifyEntityExists('Test Company'),
      // ... more steps
    ]
  }
};
```

## 🔧 Development Workflow

### **1. Adding New Elements**
```typescript
// Add to element-library.ts
export const elements: ElementLibrary = {
  newFeature: {
    newButton: 'button:has-text("New Feature")',
    newInput: 'input[placeholder*="New Input"]'
  }
};
```

### **2. Adding New Actions**
```typescript
// Add to actions.ts
export const actions: ActionLibrary = {
  performNewAction: (value: string): TestStep[] => [
    { action: 'click', selector: elements.newFeature.newButton },
    { action: 'fill', selector: elements.newFeature.newInput, value },
    { action: 'click', selector: elements.newFeature.submitButton }
  ]
};
```

### **3. Adding New Test Cases**
```typescript
// Add to business-test-cases.ts
export const businessTestCases: Record<string, TestCase> = {
  newTest: {
    name: "New Feature Test",
    description: "Test the new feature",
    steps: [
      ...actions.login(),
      ...actions.performNewAction('test value'),
      ...businessOperations.verifyNewFeatureExists('test value')
    ]
  }
};
```

### **4. Compiling TypeScript**
```bash
# Compile TypeScript to JavaScript
npx tsc tests/*.ts --outDir tests --target es2020 --module esnext --moduleResolution node

# Run tests
npm run test:mcp:newTest
```

## 🎮 Available Test Cases

| Test Case | Description | Command |
|-----------|-------------|---------|
| `entityLifecycle` | Complete entity CRUD operations | `npm run test:mcp:entity` |
| `financialSetup` | Set up entity, asset, and liability | `npm run test:mcp:financial` |
| `transactionManagement` | Add and manage transactions | `npm run test:mcp:transaction` |
| `businessUserWorkflow` | Complete business financial setup | `npm run test:mcp:business` |
| `userOnboarding` | New user onboarding flow | `npm run test:mcp:onboarding` |
| `multiEntitySetup` | Multiple entities with different types | `npm run test:mcp:multi-entity` |

## 🔍 Debugging

### **Visual Debugging**
When tests fail, screenshots are automatically saved:
```bash
📸 Screenshot saved: ./tmp/playwright-screenshots/error-step-17-2025-09-17T20-23-05-110Z.png
```

### **Step-by-Step Logging**
```bash
📍 Step 17/25: click div:has(h3:has-text("Test Company")) button[variant="ghost"] >> nth=0
❌ Step 17 failed: locator.click: Timeout 30000ms exceeded
```

### **Test Summary**
```bash
📊 Test Summary:
   Total Steps: 25
   Passed: 16
   Failed: 1
```

## ✅ Benefits

- **Type Safety** - Compile-time error checking
- **IntelliSense** - Auto-completion and documentation
- **Maintainable** - Single source of truth for selectors
- **Business-Focused** - Tests actual user workflows
- **Visual Debugging** - Screenshots when tests fail
- **Flexible** - Easy to compose new test scenarios
- **DRY** - No code duplication
- **Fast** - Direct Playwright automation

## 🚀 Future Enhancements

- **Parallel Execution** - Run multiple test cases simultaneously
- **Test Data Management** - External test data files
- **Reporting** - HTML test reports with screenshots
- **CI/CD Integration** - GitHub Actions workflow
- **Performance Testing** - Measure page load times
- **Accessibility Testing** - Automated a11y checks

---

**Built with TypeScript + Playwright for reliable, maintainable business testing** 🎉