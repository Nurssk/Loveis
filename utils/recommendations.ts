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

export function scoreProducts(products: Product[], profile: UserProfile | null): ScoredProduct[] {
  const interests = new Set(profile?.interests ?? []);
  const city = profile?.city;
  const budget = profile?.budget ?? Infinity;

  return products.map((product) => {
    let score = product.popularity / 10;
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

export function recommendedProducts(products: Product[], profile: UserProfile | null, limit = 8): ScoredProduct[] {
  return scoreProducts(products, profile).slice(0, limit);
}
