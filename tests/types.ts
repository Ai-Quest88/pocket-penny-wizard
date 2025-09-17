// TypeScript types for MCP test system

export type TestAction = 
  | 'navigate' 
  | 'click' 
  | 'fill' 
  | 'select' 
  | 'verify' 
  | 'wait';

export type VerificationState = 'visible' | 'hidden' | 'enabled' | 'disabled';

export interface TestStep {
  action: TestAction;
  selector?: string;
  value?: string;
  url?: string;
  shouldBe?: VerificationState;
  timeout?: number;
}

export interface TestCase {
  name: string;
  description: string;
  steps: TestStep[];
}

export interface TestResult {
  testCase: string;
  step: number;
  status: 'pass' | 'fail';
  error?: string;
}

export interface ElementLibrary {
  [category: string]: {
    [element: string]: string;
  };
}

export interface ActionLibrary {
  [actionName: string]: (...args: any[]) => TestStep[];
}

export interface BusinessOperations {
  [operationName: string]: (...args: any[]) => TestStep[];
}
