// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect'

// Mock the environment variables for tests
if (!import.meta.env?.VITE_API_URL) {
  import.meta.env.VITE_API_URL = 'http://localhost:5000/api'
};

// Mock the fetch API globally
// This is needed because we're testing code that uses fetch
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
});

// Suppress act() warnings
// This is needed because React 18 has stricter requirements for act()
const originalError = console.error;
console.error = (...args) => {
  if (/Warning.*not wrapped in act/.test(args[0])) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock the matchMedia API which is used by some React components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Vite's import.meta.env
window.process = {
  ...window.process,
};

Object.defineProperty(window, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:5000/api',
        MODE: 'test',
        DEV: true
      }
    }
  }
}); 