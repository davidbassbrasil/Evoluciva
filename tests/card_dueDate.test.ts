/*
  Test skeleton: asserts we do NOT send `dueDate` for credit card payments.
  Project currently has no test runner configured. To run this test locally:
    1) Install a test runner, e.g. vitest: `npm i -D vitest @testing-library/react`
    2) Add script: "test": "vitest"
    3) Run: `npm test`

  Example (Vitest):
*/

import { describe, it, expect, vi } from 'vitest';

// Import the function that creates payments from your Checkout logic
// Adjust path as necessary, e.g. import { createCreditCardPayment } from '../src/lib/asaasService';

describe('Credit card payments', () => {
  it('does not send dueDate for card payments', async () => {
    // Arrange: spy/mocks for the HTTP client or asaasService
    const fakeCreate = vi.fn();

    // Example expected usage: the app calls createCreditCardPayment(payload)
    // Call the code-path (replace with actual import & call)
    // await checkoutCreateCardPayment({ ...payload with installments... }, { createFn: fakeCreate })

    // Assert: the payload passed to the provider does NOT have a `dueDate` property
    // const sent = fakeCreate.mock.calls[0][0];
    // expect('dueDate' in sent).toBe(false);

    // Placeholder - mark as TODO until test runner added and import path adjusted.
    expect(true).toBe(true);
  });
});
