/**
 * Product data access for the dashboard.
 *
 * Reads the `products` collection from Firestore and maps each document onto the
 * app's shared `Product` type. The mapper is deliberately tolerant: it accepts
 * both the field names used by the local skeleton catalog (`title`,
 * `regularPrice`, `image`, `activeBuyers`) and the alternate names from the
 * shared Firestore schema (`name`, `retailPrice`, `imageUrl`, `currentGroupSize`),
 * so whatever shape the teammate seeds will render correctly.
 *
 * When Firebase isn't configured yet, it falls back to the bundled mock catalog
 * so the dashboard is fully demoable today.
 */
import { collection, getDocs } from 'firebase/firestore';

import { PRODUCTS } from '@/data/products';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { Product } from '@/types';

type RawProduct = Record<string, unknown>;

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : fallback;
}

/** Map a raw Firestore document into the app's `Product` shape. */
export function toProduct(id: string, raw: RawProduct): Product {
  return {
    id,
    title: str(raw.title) || str(raw.name, 'Без названия'),
    description: str(raw.description),
    category: str(raw.category, 'home'),
    marketplace: str(raw.marketplace),
    image: str(raw.image) || str(raw.imageUrl),
    regularPrice: num(raw.regularPrice ?? raw.retailPrice),
    rating: num(raw.rating),
    city: str(raw.city),
    tags: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    popularity: num(raw.popularity),
    activeBuyers: num(raw.activeBuyers ?? raw.currentGroupSize),
  };
}

/**
 * Fetch the product catalog. Pulls from Firestore when configured, otherwise
 * returns the bundled catalog so the screen still works offline / pre-Firebase.
 */
export async function fetchProducts(): Promise<Product[]> {
  if (!isFirebaseConfigured || !db) {
    return PRODUCTS;
  }

  const snapshot = await getDocs(collection(db, 'products'));
  const products = snapshot.docs.map((doc) => toProduct(doc.id, doc.data() as RawProduct));

  // If the collection is empty (e.g. not seeded yet), don't show a blank screen.
  return products.length > 0 ? products : PRODUCTS;
}
