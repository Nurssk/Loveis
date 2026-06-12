/**
 * Firestore seeding script for the BirGe dashboard.
 *
 * Pulls a real product catalog from the public dummyjson API, maps it onto the
 * marketplace schema understood by `lib/productsRepo.ts` (name, retailPrice,
 * imageUrl, category, currentGroupSize, ...) and writes it into the `products`
 * collection.
 *
 * Run with:  node seed.js
 *
 * Reads the same EXPO_PUBLIC_FIREBASE_* keys the app uses, from `.env.local`.
 *
 * NOTE ON CATEGORIES: the dashboard's filter chips (app/(tabs)/home.tsx) match
 * on the category *id* (`p.category === c.id`, e.g. "smartphones"), while the
 * Russian text ("Смартфоны") is only the display label resolved by
 * categoryLabel(). So we store the canonical English id in `category` and use
 * the Russian map purely for human-readable logging — storing Russian here would
 * silently break filtering.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env.local') });

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  doc,
  setDoc,
  initializeFirestore,
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    '❌ Firebase config not found. Make sure .env.local has the EXPO_PUBLIC_FIREBASE_* keys.',
  );
  process.exit(1);
}

// --- Category mapping ------------------------------------------------------
// dummyjson slug  ->  our canonical category id (must match data/categories.ts)
const CATEGORY_MAP = {
  smartphones: 'smartphones',
  'mobile-accessories': 'smartphones',
  tablets: 'laptops',
  laptops: 'laptops',
  'kitchen-accessories': 'appliances',
  'home-decoration': 'home',
  furniture: 'home',
  groceries: 'home',
  beauty: 'cosmetics',
  fragrances: 'cosmetics',
  'skin-care': 'cosmetics',
  'mens-shirts': 'clothing',
  'mens-shoes': 'clothing',
  'mens-watches': 'clothing',
  'womens-dresses': 'clothing',
  'womens-shoes': 'clothing',
  'womens-bags': 'clothing',
  'womens-jewellery': 'clothing',
  'womens-watches': 'clothing',
  tops: 'clothing',
  sunglasses: 'clothing',
  'sports-accessories': 'sport',
  motorcycle: 'auto',
  vehicle: 'auto',
};

// Canonical id -> Russian label (only used for logging; the app resolves this
// itself via data/categories.ts -> categoryLabel()).
const CATEGORY_RU = {
  smartphones: 'Смартфоны',
  laptops: 'Ноутбуки',
  appliances: 'Бытовая техника',
  cosmetics: 'Косметика',
  clothing: 'Одежда',
  home: 'Товары для дома',
  sport: 'Спорт',
  kids: 'Детские товары',
  auto: 'Автотовары',
};

/** Map a dummyjson category slug onto our canonical category id. */
function mapCategory(slug) {
  return CATEGORY_MAP[slug] || 'home';
}

const MARKETPLACES = [
  'Kaspi Магазин',
  'Technodom',
  'Mechta',
  'Sulpak',
  'Wildberries',
];
const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда'];
const KZT_RATE = 450; // rough USD -> KZT conversion

function pick(arr, i) {
  return arr[i % arr.length];
}

/** Map a raw dummyjson product onto our Firestore document shape. */
function toDoc(p, i) {
  const category = mapCategory(p.category);
  return {
    name: p.title,
    description: p.description || '',
    category, // canonical English id — matches the dashboard filter chips
    imageUrl: p.thumbnail || (p.images && p.images[0]) || '',
    retailPrice: Math.round((p.price || 0) * KZT_RATE),
    rating: p.rating || 0,
    currentGroupSize: 2 + Math.floor(Math.random() * 58), // active buyers, 2–59
    tags: Array.isArray(p.tags) ? p.tags : [],
    marketplace: pick(MARKETPLACES, i),
    city: pick(CITIES, i),
    popularity: Math.round((p.rating || 0) * 20),
  };
}

async function main() {
  console.log(`🌱 Seeding Firestore project "${firebaseConfig.projectId}"...`);

  // 1. Fetch a real catalog. limit=0 returns the full set so every dashboard
  //    chip (smartphones, laptops, sport, auto, ...) actually has products.
  console.log('📡 Fetching catalog from dummyjson...');
  const res = await fetch('https://dummyjson.com/products?limit=0');
  if (!res.ok) {
    throw new Error(`dummyjson request failed: ${res.status} ${res.statusText}`);
  }
  const { products } = await res.json();
  console.log(`   → got ${products.length} products`);

  // 2. Init Firebase (same long-polling setup the app uses).
  const app = initializeApp(firebaseConfig);
  let db;
  try {
    db = initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    db = getFirestore(app);
  }

  // 3. Write each product with a deterministic id so re-running overwrites
  //    instead of creating duplicates.
  const counts = {};
  let ok = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const data = toDoc(p, i);
    try {
      await setDoc(doc(db, 'products', `dummy-${p.id}`), data);
      counts[data.category] = (counts[data.category] || 0) + 1;
      ok++;
      process.stdout.write(
        `\r   ✓ ${ok}/${products.length} written (${data.name.slice(0, 30)})`.padEnd(
          70,
          ' ',
        ),
      );
    } catch (err) {
      console.error(`\n   ✗ Failed on "${p.title}": ${err.message}`);
      if (String(err.code).includes('permission-denied')) {
        console.error(
          '\n🔒 Firestore denied the write. Open the Firebase console → Firestore' +
            ' → Rules and allow writes temporarily, e.g.:\n' +
            '   match /products/{id} { allow read, write: if true; }\n' +
            'then re-run `node seed.js`.',
        );
        process.exit(1);
      }
    }
  }

  console.log('\n\n✅ Done. Products per dashboard category:');
  for (const [id, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${(CATEGORY_RU[id] || id).padEnd(18)} ${n}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Seeding failed:', err);
  process.exit(1);
});
