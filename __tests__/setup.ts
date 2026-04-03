import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver for jsdom (needs to be a constructor)
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(_callback: IntersectionObserverCallback) {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
})
