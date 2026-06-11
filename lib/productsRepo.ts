/**
 * Product data access for the dashboard.
 *
 * Reads the `products` collection from Firestore and maps each document onto the
 * app's shared `Product` type. The mapper is deliberately tolerant: it accepts
 * both the field names used by the local skeleton catalog (`title`,
 * `regularPrice`, `image`, `activeBuyers`) and the alternate names from the
 * shared Firestore schema (`name`, `retailPrice`, `imageUrl`, `currentGroupSize`),
 * so whatever shape the teammate seeds will render correctly.
 */
import { collection, getDocs } from 'firebase/firestore';

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

/** Fetch the product catalog from Firestore. Returns [] if not configured or collection is empty. */
export async function fetchProducts(): Promise<Product[]> {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  const snapshot = await getDocs(collection(db, 'products'));
  return snapshot.docs.map((doc) => toProduct(doc.id, doc.data() as RawProduct));
}
