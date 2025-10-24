import '@testing-library/jest-dom/vitest'

// Mock ResizeObserver for Recharts components
global.ResizeObserver = class ResizeObserver {
  observe() {
    // do nothing
  }
  unobserve() {
    // do nothing
  }
  disconnect() {
    // do nothing
  }
}
