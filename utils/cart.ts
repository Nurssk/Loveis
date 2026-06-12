import { CartItem, Product } from '@/types';
import { applyDiscount, teamDiscountPercent } from '@/utils/discount';

export type CartLine = { product: Product; quantity: number };

export function resolveLines(items: CartItem[], getProduct: (id: string) => Product | undefined): CartLine[] {
  return items
    .map((i) => {
      const product = getProduct(i.productId);
      return product ? { product, quantity: i.quantity } : null;
    })
    .filter((l): l is CartLine => l !== null);
}

export function lineCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

export function subtotalOf(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.product.regularPrice * l.quantity, 0);
}

export type CartSummary = {
  lines: CartLine[];
  itemCount: number;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  finalTotal: number;
};

export function summarize(items: CartItem[], getProduct: (id: string) => Product | undefined, teamMemberCount = 0): CartSummary {
  const lines = resolveLines(items, getProduct);
  const subtotal = subtotalOf(lines);
  const discountPercent = teamMemberCount > 0 ? teamDiscountPercent(teamMemberCount) : 0;
  const { discountAmount, finalTotal } = applyDiscount(subtotal, discountPercent);
  return {
    lines,
    itemCount: lineCount(items),
    subtotal,
    discountPercent,
    discountAmount,
    finalTotal,
  };
}
