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

// Clear localStorage before each test to prevent state pollution
import { beforeEach } from 'vitest'

beforeEach(() => {
  localStorage.clear()
})
