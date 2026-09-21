export const CHECKOUT_PROVIDERS = ["credit_card", "google_pay", "apple_pay"] as const;

export type CheckoutProvider = (typeof CHECKOUT_PROVIDERS)[number];

export type CheckoutSession = never;

export function isCheckoutEnabled(): boolean {
  return false;
}
