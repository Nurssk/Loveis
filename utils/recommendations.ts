import { getAllProducts } from '@/data/products';
import { Product, UserProfile } from '@/types';

export type RecoReason =
  | 'Подобрано по вашим интересам'
  | 'Подходит под ваш бюджет'
  | 'Популярно в вашем городе'
  | 'Высокая экономия';

export type ScoredProduct = {
  product: Product;
  score: number;
  reason: RecoReason;
};

/**
 * Lightweight mock scoring (NOT real AI). Ranks products by how well they
 * match the user's interests, budget, city and overall popularity.
 */
export function scoreProducts(profile: UserProfile | null): ScoredProduct[] {
  const interests = new Set(profile?.interests ?? []);
  const city = profile?.city;
  const budget = profile?.budget ?? Infinity;

  return getAllProducts().map((product) => {
    let score = product.popularity / 10; // 0..10 baseline
    let reason: RecoReason = 'Высокая экономия';

    if (interests.has(product.category)) {
      score += 40;
      reason = 'Подобрано по вашим интересам';
    }
    if (product.regularPrice <= budget) {
      score += 15;
      if (reason !== 'Подобрано по вашим интересам') reason = 'Подходит под ваш бюджет';
    }
    if (city && product.city === city) {
      score += 12;
      if (!interests.has(product.category)) reason = 'Популярно в вашем городе';
    }
    score += product.activeBuyers / 5;

    return { product, score, reason };
  }).sort((a, b) => b.score - a.score);
}

export function recommendedProducts(profile: UserProfile | null, limit = 8): ScoredProduct[] {
  return scoreProducts(profile).slice(0, limit);
}

export function popularTeamPurchases(limit = 6): Product[] {
  return [...getAllProducts()].sort((a, b) => b.activeBuyers - a.activeBuyers).slice(0, limit);
}

export function bestSavings(limit = 6): Product[] {
  // Bigger ticket items deliver the largest absolute team savings.
  return [...getAllProducts()]
    .filter((p) => p.tags.includes('высокая экономия') || p.tags.includes('выгодно') || p.regularPrice > 100000)
    .sort((a, b) => b.regularPrice - a.regularPrice)
    .slice(0, limit);
}

/** Text search across title, category label and marketplace. */
export function searchProducts(query: string, categoryLabelOf: (id: string) => string): Product[] {
  const q = query.trim().toLowerCase();
  const all = getAllProducts();
  if (!q) return all;
  return all.filter((p) => {
    return (
      p.title.toLowerCase().includes(q) ||
      categoryLabelOf(p.category).toLowerCase().includes(q) ||
      p.marketplace.toLowerCase().includes(q)
    );
  });
}
