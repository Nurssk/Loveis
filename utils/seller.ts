/** Seller-side derivations: group-buy batch progress, mock orders, store stats. */
import { Product } from '@/types';
import { teamPrice } from '@/utils/discount';

const DEFAULT_BATCH = 10;

export type BatchProgress = {
  current: number;
  target: number;
  percent: number; // 0..100
  reached: boolean;
  remaining: number;
};

/** Progress of a product's group-buy toward its minimum batch. */
export function batchProgress(p: Product): BatchProgress {
  const target = p.minBatch && p.minBatch > 0 ? p.minBatch : DEFAULT_BATCH;
  const current = p.activeBuyers;
  const percent = Math.min(100, Math.round((current / target) * 100));
  return {
    current,
    target,
    percent,
    reached: current >= target,
    remaining: Math.max(0, target - current),
  };
}

export type SellerOrderStatus = 'new' | 'collecting' | 'ready' | 'shipped';

export type SellerOrder = {
  id: string;
  productId: string;
  productTitle: string;
  buyerName: string;
  quantity: number;
  total: number;
  status: SellerOrderStatus;
  when: string;
};

const BUYERS = [
  'Айгерим', 'Тимур', 'Бекзат', 'Дана', 'Аскар', 'Жанна', 'Олжас', 'Камила',
  'Нуржан', 'Аружан', 'Ербол', 'Сабина', 'Мадина', 'Данияр',
];
const WHEN = ['Сегодня', 'Сегодня', 'Вчера', 'Вчера', '2 дня назад', '3 дня назад'];
const STATUS_POOL: SellerOrderStatus[] = ['new', 'collecting', 'collecting', 'ready', 'shipped'];

/** Stable string hash so generated orders don't churn between renders. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Deterministic mock orders derived from the seller's catalog. No randomness,
 * so the list is stable across renders and re-creatable without persistence.
 */
export function generateSellerOrders(products: Product[]): SellerOrder[] {
  const orders: SellerOrder[] = [];
  products.forEach((p) => {
    const count = 1 + (hash(p.id) % 3); // 1..3 orders per product
    for (let i = 0; i < count; i++) {
      const seed = hash(p.id + ':' + i);
      const quantity = 1 + (seed % 2);
      const teamSize = 3 + (seed % 4); // 3..6 → realistic team discount
      const unit = teamPrice(p.regularPrice, teamSize);
      orders.push({
        id: `ord-${p.id}-${i}`,
        productId: p.id,
        productTitle: p.title,
        buyerName: BUYERS[seed % BUYERS.length],
        quantity,
        total: unit * quantity,
        status: STATUS_POOL[seed % STATUS_POOL.length],
        when: WHEN[seed % WHEN.length],
      });
    }
  });
  return orders;
}

export type SellerStats = {
  productCount: number;
  totalParticipants: number;
  groupsReached: number;
  revenue: number;
};

export function sellerStats(products: Product[], orders: SellerOrder[]): SellerStats {
  return {
    productCount: products.length,
    totalParticipants: products.reduce((s, p) => s + p.activeBuyers, 0),
    groupsReached: products.filter((p) => batchProgress(p).reached).length,
    revenue: orders.reduce((s, o) => s + o.total, 0),
  };
}

export const STATUS_META: Record<SellerOrderStatus, { label: string; tone: 'info' | 'warning' | 'success' }> = {
  new: { label: 'Новый', tone: 'info' },
  collecting: { label: 'Набирается группа', tone: 'warning' },
  ready: { label: 'Группа собрана', tone: 'success' },
  shipped: { label: 'Отгружен', tone: 'success' },
};
