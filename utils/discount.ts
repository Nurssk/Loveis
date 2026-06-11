/** Centralized team-discount logic. Do not duplicate this elsewhere. */

export const DISCOUNT_PER_MEMBER = 5;
export const MAX_DISCOUNT = 30;

/** 5% per member, capped at 30%. */
export function teamDiscountPercent(memberCount: number): number {
  if (memberCount <= 0) return 0;
  return Math.min(memberCount * DISCOUNT_PER_MEMBER, MAX_DISCOUNT);
}

/** Next discount level the team can reach, or null if already at the cap. */
export function nextDiscountThreshold(
  memberCount: number,
): { membersNeeded: number; percent: number } | null {
  const current = teamDiscountPercent(memberCount);
  if (current >= MAX_DISCOUNT) return null;
  return { membersNeeded: 1, percent: current + DISCOUNT_PER_MEMBER };
}

export function applyDiscount(
  subtotal: number,
  percent: number,
): { discountAmount: number; finalTotal: number } {
  const discountAmount = Math.round((subtotal * percent) / 100);
  return { discountAmount, finalTotal: subtotal - discountAmount };
}

/** Team price for a single product given current team size. */
export function teamPrice(regularPrice: number, memberCount: number): number {
  const percent = teamDiscountPercent(memberCount);
  return applyDiscount(regularPrice, percent).finalTotal;
}
