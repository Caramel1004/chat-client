import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

// jsdom has no dialog lifecycle. Model only open/close; keyboard focus trapping
// and Escape dismissal are verified in the real browser.
Object.defineProperties(HTMLDialogElement.prototype, {
  showModal: { configurable: true, value() { this.setAttribute('open', '') } },
  close: { configurable: true, value() {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  } },
})
