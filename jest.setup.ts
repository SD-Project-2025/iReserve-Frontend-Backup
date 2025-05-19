// Import Jest's expect explicitly
import { expect } from '@jest/globals';
// Then import the DOM matchers
import '@testing-library/jest-dom';

// Make sure global types are available
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      // Add other matchers as needed
    }
  }
}