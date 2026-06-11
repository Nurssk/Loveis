import { Product } from '@/types';
import { uid } from '@/utils/ids';

/**
 * Default photography per category for seller-created products that don't
 * provide their own image URL. If a URL fails, ProductImage degrades to a
 * category icon, so these are best-effort, not load-bearing.
 */
const CATEGORY_IMAGE: Record<string, string> = {
  smartphones: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80',
  laptops: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
  appliances: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  cosmetics: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
  clothing: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&q=80',
  home: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600&q=80',
  sport: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
  kids: 'https://images.unsplash.com/photo-1558877385-8c1b8e6e0b9b?w=600&q=80',
  auto: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80',
};

export function categoryImage(categoryId: string): string {
  return (
    CATEGORY_IMAGE[categoryId] ??
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80'
  );
}

/**
 * Sample catalog seeded the first time a user opens a store, so the seller
 * dashboard, group-buy progress and orders feel alive in a demo.
 */
export function makeSampleSellerProducts(sellerId: string, storeName: string, city: string): Product[] {
  const base = {
    sellerId,
    marketplace: storeName,
    rating: 5.0,
    city,
    popularity: 70,
  };
  return [
    {
      ...base,
      id: uid('sp'),
      title: 'Фитнес-браслет SmartBand 8',
      description:
        'Пульсометр, мониторинг сна и более 100 спортивных режимов. AMOLED-экран и до 14 дней автономной работы. Выгоднее всего брать группой.',
      category: 'sport',
      image: categoryImage('sport'),
      regularPrice: 24990,
      tags: ['новинка', 'хит'],
      activeBuyers: 9,
      minBatch: 15,
      groupPrice: 18990,
    },
    {
      ...base,
      id: uid('sp'),
      title: 'Портативная колонка BoomBox Mini',
      description:
        'Глубокий бас, защита от воды IPX7 и до 20 часов музыки. Беспроводное соединение двух колонок в стерео. Идеальна для коллективной закупки.',
      category: 'appliances',
      image: categoryImage('appliances'),
      regularPrice: 34990,
      tags: ['новинка'],
      activeBuyers: 5,
      minBatch: 12,
      groupPrice: 26990,
    },
  ];
}
