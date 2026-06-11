import { Category } from '@/types';

/** Product interest categories shown on the onboarding and home screens. */
export const CATEGORIES: Category[] = [
  { id: 'smartphones', label: 'Смартфоны', icon: 'phone-portrait-outline', color: '#2F6FED' },
  { id: 'laptops', label: 'Ноутбуки', icon: 'laptop-outline', color: '#7A5AF8' },
  { id: 'appliances', label: 'Бытовая техника', icon: 'tv-outline', color: '#0EA5A5' },
  { id: 'cosmetics', label: 'Косметика', icon: 'sparkles-outline', color: '#E5489B' },
  { id: 'clothing', label: 'Одежда', icon: 'shirt-outline', color: '#F5781F' },
  { id: 'home', label: 'Товары для дома', icon: 'home-outline', color: '#1FA463' },
  { id: 'sport', label: 'Спорт', icon: 'football-outline', color: '#E5484D' },
  { id: 'kids', label: 'Детские товары', icon: 'happy-outline', color: '#F5A623' },
  { id: 'auto', label: 'Автотовары', icon: 'car-sport-outline', color: '#475569' },
];

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);

export function categoryLabel(id: string): string {
  return CATEGORY_BY_ID[id]?.label ?? id;
}
