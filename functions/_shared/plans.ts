export const PLANS = {
  monthly: { id: 'monthly', name: 'الشهري', price: 49, durationDays: 30, interval: 'month', intervalCount: 1 },
  quarterly: { id: 'quarterly', name: '3 أشهر', price: 129, durationDays: 90, interval: 'month', intervalCount: 3 },
  yearly: { id: 'yearly', name: 'السنوي', price: 399, durationDays: 365, interval: 'year', intervalCount: 1 },
} as const;

export function getPlan(value: unknown) {
  return PLANS[String(value || '') as keyof typeof PLANS] || null;
}
export function afterDays(days: number) {
  return new Date(Date.now() + days * 86400000).toISOString();
}
