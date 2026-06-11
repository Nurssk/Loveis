# Firebase Migration Plan — BirGe

**Goal:** Make Firebase the single backend. Products, auth/profile, teams (realtime), and
orders all live in Firestore. Delete all hardcoded mock data and the dead Supabase stubs.
Keep the app demoable on web (Firebase phone auth is web-only here).

**Decision (confirmed):** Full Firebase backend — teams + team members (realtime via
`onSnapshot`), orders, and profile at `users/{uid}`.

---

## Architecture split

**Firestore (account data, keyed by Firebase Auth `uid`):**
- `users/{uid}` — profile: `phone, name, city, budget, interests[], coupons[], createdAt, isVerified`
- `teams/{teamId}` — `name, code, createdBy, createdAt`
- `teams/{teamId}/members/{memberId}` — `name, isCreator, uid, joinedAt` (subcollection → realtime)
- `orders/{orderId}` — `userId, teamId|null, kind, status, total, items[], city, address, deliveryMethod, paymentMethod, itemCount, membersNeeded?, membersAtOrder?, orderNumber, createdAt`
- `products/{id}` — already seeded by `seed.js` (read-only from app)

**Local AsyncStorage (device UX state only):**
- `cart` (individualItems, teamItems)
- `recentlyViewed`
- `savedProducts` (list of product IDs; resolved against the Firestore catalog)

Rationale: carts and recently-viewed are ephemeral, device-local UX. Everything tied to the
account goes to Firestore. Saved-products is just an ID list; it works correctly once product
resolution reads the Firestore catalog (the P0 fix), so it can stay local without bugs.

---

## P0 root cause being fixed

Today two product sources coexist: home loads Firestore (`dummy-*` ids) but
cart/detail/saved/team-cart read the static `data/products.ts` (`p1..` ids) via `getProduct()`.
Deleting the static catalog and resolving everything from the Firestore-loaded catalog removes
the mismatch entirely. **No `seed.js` id change needed** — the app uses whatever ids exist in
Firestore.

---

## New files

### `store/ProductsContext.tsx`
Loads the catalog once at app root and exposes it reactively.
- State via `useReducer` (mirror existing `hooks/useProducts.ts` reducer): `{ products, loading, refreshing, error }`.
- On mount: `fetchProducts()`.
- Build `byId = useMemo(Map)`; expose stable `getProduct = useCallback((id) => byId.get(id), [byId])`.
- Expose `{ products, getProduct, loading, refreshing, error, refresh, retry }`.
- `useProductsCtx()` hook with the standard null-context guard.
- Mount inside `app/_layout.tsx` (inside `AppProvider`, around `ToastProvider`).

### `lib/usersRepo.ts`
- `subscribeToUser(uid, cb): () => void` — `onSnapshot(doc(db,'users',uid))`.
- `createOrInitUser(uid, { phone }): Promise<void>` — `setDoc(..., { merge: true })` with defaults
  (`name:'Вы', city:'Алматы', budget:300000, interests:[], coupons:[], isVerified:true, createdAt`).
- `updateUser(uid, patch): Promise<void>` — `updateDoc`.
- `awardCoupon(uid, coupon): Promise<void>` — `updateDoc(..., { coupons: arrayUnion(coupon) })`
  (read current coupons first to dedupe by `type`, or dedupe in the caller).

### `lib/teamsRepo.ts`
- `createTeam(uid, name): Promise<{ teamId, code }>` — `addDoc(collection(db,'teams'), {...})`
  with `code = randomTeamCode()`, then add creator to members subcollection.
- `joinTeamByCode(uid, code, memberName): Promise<{ ok:true, teamId } | { ok:false, error }>` —
  query `teams` where `code == code`; if none → error; else add member doc (id = uid) to
  `teams/{id}/members`.
- `leaveTeam(uid, teamId): Promise<void>` — delete `teams/{id}/members/{uid}`; if members empty,
  delete the team doc.
- `addSyntheticMember(teamId, name): Promise<void>` — demo control: add a member doc with a
  generated id (keeps the discount-ladder demo working with real teams).
- `subscribeToTeam(teamId, cb): () => void` — `onSnapshot(doc team)`.
- `subscribeToMembers(teamId, cb): () => void` — `onSnapshot(collection members)` → array.

### `lib/ordersRepo.ts`
- `createOrder(order): Promise<string>` — `addDoc(collection(db,'orders'), {...})`, returns id.
- `subscribeToOrders(uid, cb): () => void` — `onSnapshot(query(orders, where('userId','==',uid)))`.
- `updateOrderStatus(orderId, status): Promise<void>` — `updateDoc`.

### `firestore.rules` (new) + register in `firebase.json`
Authenticated access. Recommended starting ruleset (review before prod):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{id} { allow read: if true; allow write: if false; }
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /teams/{teamId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
      match /members/{memberId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
    match /orders/{orderId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null;
    }
  }
}
```
Add to `firebase.json`: `"firestore": { "rules": "firestore.rules" }`. Deploy with
`firebase deploy --only firestore:rules` (note in plan; user runs it).

---

## Rewrite: `store/AppContext.tsx`

This is the biggest change. Auth + profile + teams + orders become Firestore-driven via
listeners; cart/recentlyViewed/savedProducts stay local.

**Auth source of truth:** `onAuthStateChanged(auth, ...)` from Firebase. Drives `uid`.

**State shape:**
```
{
  uid: string | null,
  profile: UserProfile | null,   // from users/{uid} snapshot
  team: ShoppingTeam | null,     // assembled from team doc + members snapshot
  teamOrders: Order[],           // from orders snapshot (kind==='team')
  coupons: Coupon[],             // from users/{uid}.coupons
  cart: CartState,               // LOCAL
  recentlyViewed: string[],      // LOCAL
  savedProducts: string[],       // LOCAL
  lastOrder: Order | null,       // LOCAL (for success screen)
  hydrated: boolean,             // auth resolved AND (if logged in) user doc first-loaded
}
```

**Effects:**
1. Mount: subscribe `onAuthStateChanged`. On user → set `uid`; on null → clear account state, `hydrated:true`.
2. When `uid` set: `subscribeToUser` → profile+coupons; `subscribeToOrders` → teamOrders; if profile
   has a `currentTeamId`, `subscribeToTeam` + `subscribeToMembers`. Track the active team id on the
   user doc (`currentTeamId`) so it persists across reloads. Clean up all listeners on uid change/unmount.
3. Mount: load local slice (cart, recentlyViewed, savedProducts) from AsyncStorage (key
   `birge.local.v1`). Persist on change.

**Action remap (all async now where they hit Firestore):**
- `login(phone)` — keep: stash phone locally for the verify step (Firebase user not created until OTP confirm). Can keep a transient local field or pass phone through navigation; simplest: keep a local `pendingPhone` in state, no Firestore write.
- `verify(uid)` — `createOrInitUser(uid, { phone: pendingPhone })`; listeners take over.
- `setInterests(ids)` — `updateUser(uid, { interests: ids })`.
- `updateProfile(patch)` — `updateUser(uid, patch)`.
- `logout()` — `signOut(auth)`; clear local slice.
- `createTeam()` — `teamsRepo.createTeam(uid, 'Моя команда')` → set `currentTeamId` on user; award `newcomer`.
- `joinTeam(code)` — `teamsRepo.joinTeamByCode(...)`; on ok set `currentTeamId`, award `newcomer`,
  and `team_player` if members ≥ 3. Returns `{ok}|{ok:false,error}` (same shape as today).
- `leaveTeam()` — `teamsRepo.leaveTeam(uid, teamId)`; clear `currentTeamId`; clear team cart locally.
- `addDemoMember()` — `teamsRepo.addSyntheticMember(teamId, nextName)`; award `team_player` if ≥3.
- `awardCoupon(type)` — `usersRepo.awardCoupon(uid, coupon)` (dedupe by type).
- `placeTeamOrder()` — **FIX total:** compute from team cart via the products catalog +
  `applyDiscount` (use the same logic as `summarize`). Write order to Firestore with real `total`,
  `items[]`, `membersAtOrder`, `membersNeeded = TEAM_MAX_MEMBERS`. Returns the created `Order`.
- `placeOrder(draft)` — write to Firestore via `ordersRepo.createOrder`; set `lastOrder` locally;
  clear the relevant local cart.
- cart actions, `markViewed`, `saveProduct`, `unsaveProduct` — unchanged (local).
- Team-order status recompute: in the members-snapshot handler, if `memberCount >= membersNeeded`
  for any `pending_participants` team order, call `ordersRepo.updateOrderStatus(id,'confirmed')`.

**Note:** AppContext needs the products catalog to compute `placeTeamOrder` total. Either import
the module cache getter or accept that `placeTeamOrder` reads catalog via a passed resolver. Simplest:
have `ProductsContext` expose nothing to AppContext; instead compute team-order total inside the
team screen where the catalog is available and pass `total` + `items` into `placeTeamOrder(total, items)`.
**Chosen:** change `placeTeamOrder` signature to `placeTeamOrder(total: number, items: {productId,quantity,unitPrice}[])` and have `team.tsx` compute these from `resolveLines` + discount (it already has `cartTotal`). This keeps AppContext free of the products catalog dependency.

---

## Refactor: product resolution (P0 fix)

### `utils/cart.ts`
Change signatures to take a resolver:
- `resolveLines(items, getProduct)`
- `summarize(items, getProduct, teamMemberCount = 0)`
- `subtotalOf`, `lineCount` unchanged (`lineCount` needs no products).

Update all callers to pass `getProduct` from `useProductsCtx()`, inside `useMemo` with
`[items, getProduct]` deps so it recomputes when the catalog loads:
- `app/(tabs)/cart.tsx`
- `app/checkout/index.tsx`
- `app/(tabs)/team.tsx`
- `app/(tabs)/home.tsx` (only uses `lineCount` → no change beyond import path if needed)

### `app/product/[id].tsx`
- `const { getProduct, loading } = useProductsCtx()`.
- `const product = id ? getProduct(id) : undefined;`
- While `loading && !product` → show spinner (don't flash "Товар недоступен").
- Show "не найден" only after `!loading && !product`.

### `app/(tabs)/profile.tsx`
- Use `getProduct` from context for saved-products rendering.
- Replace hardcoded `DEMO_INDIVIDUAL = ['p1','p7']` / `DEMO_TEAM = ['p2','p5','p13']` with the first
  few ids from `products` (context): e.g. `products.slice(0,2)` and `products.slice(2,5)`.

### `app/(tabs)/home.tsx`
- Replace `useProducts()` with `useProductsCtx()` (same fields). Remove `hooks/useProducts.ts` import.

---

## Deletions (dead / mock)

- `lib/api/auth.ts`, `lib/api/teams.ts`, `lib/api/orders.ts`, `lib/api/coupons.ts`, `lib/api/index.ts`
  — Supabase stubs that throw `Not implemented`, imported nowhere.
- `lib/supabase.ts` — exports `null as never`, imported nowhere.
- `types/api.ts` — Supabase DB row types; only used by the deleted stubs. **Verify no other imports**
  (`grep -rn "types/api"`), then delete. If anything references it, keep only the used types.
- `data/products.ts` — static mock catalog + `getProduct`/`PRODUCT_BY_ID`. Delete after all callers
  move to context resolver. **Verify** `grep -rn "data/products"` is empty first.
- `data/teams.ts` — `DEMO_TEAMS`, `VALID_DEMO_CODES`, `joinDemoTeam`. Delete after `team.tsx` and
  `AppContext` stop importing it. Keep a tiny inline name pool for `addSyntheticMember` (move
  `DEMO_MEMBER_NAMES` + `makeMember` into `teamsRepo.ts` or inline — they are demo UX filler, not
  catalog mock).
- `hooks/useProducts.ts` — folded into `ProductsContext`. Delete after `home.tsx` switches.

### `lib/productsRepo.ts`
- Remove the `PRODUCTS` mock fallback. If `!isFirebaseConfigured || !db` → return `[]` (and the UI
  shows the existing empty/error state). If the Firestore collection is empty → return `[]` (do not
  fall back to mock). `.env.local` is already configured, so this is the real path.

---

## Cleanups for the other review findings

- **Team order `total: 0`** → fixed by the new `placeTeamOrder(total, items)` (see AppContext).
- **`handlePostLink` ghost reference** → remove the mention from the `services/paymentService.ts`
  header comment (the method doesn't exist and the webhook can't reach a mobile client; the comment
  is misleading). No behavior change.
- **`team.tsx`** — remove `import { VALID_DEMO_CODES } from '@/data/teams'` and the
  "Демо-коды: ..." line. The join-by-code input stays (now resolves real Firestore codes).
- **Login password field** (informational) — leave as-is (cosmetic gate). Optionally add a one-line
  note. Not required.

---

## Execution order (phased — test between phases)

**Phase 1 — Products on Firestore (fixes P0, lowest risk):**
1. `lib/productsRepo.ts`: remove mock fallback.
2. Create `store/ProductsContext.tsx`; mount in `_layout.tsx`.
3. Refactor `utils/cart.ts` to resolver signatures.
4. Update `cart.tsx`, `checkout/index.tsx`, `team.tsx`, `product/[id].tsx`, `profile.tsx`,
   `home.tsx` to use the context resolver.
5. Delete `hooks/useProducts.ts`, `data/products.ts`.
6. **Test:** home loads from Firestore; open a product → detail renders; add to cart → appears in
   cart + checkout; save a product → shows in profile. No "Товар недоступен" for real products.

**Phase 2 — Auth/profile on Firestore:**
7. `lib/usersRepo.ts`.
8. AppContext: `onAuthStateChanged`, user-doc subscription, `verify/setInterests/updateProfile/logout`
   write to Firestore; split local slice persistence; `hydrated` logic.
9. `app/index.tsx` routing works off Firestore-backed profile (same conditions).
10. **Test:** login → OTP → user doc created; interests persist; reload keeps you signed in;
    logout returns to login.

**Phase 3 — Teams realtime:**
11. `lib/teamsRepo.ts`.
12. AppContext: `createTeam/joinTeam/leaveTeam/addDemoMember` + team/members subscriptions +
    `currentTeamId` on user doc.
13. `team.tsx`: remove demo-codes import/line; team renders from realtime members.
14. **Test:** create team (two browsers/uids) → join by code → member appears live in both;
    discount ladder updates; leave team works; add-synthetic-member updates discount.

**Phase 4 — Orders on Firestore:**
15. `lib/ordersRepo.ts`.
16. AppContext: `placeOrder` + `placeTeamOrder(total, items)` write to Firestore; orders
    subscription; status recompute on member change.
17. `team.tsx` computes and passes `total`+`items` to `placeTeamOrder`.
18. `checkout/index.tsx`, `success.tsx` verified against Firestore-backed order.
19. **Test:** individual checkout (demo payment) → order in Firestore + success screen shows real
    total; team order has correct (non-zero) total; pending→confirmed when members reach threshold.

**Phase 5 — Cleanup + rules:**
20. Delete `lib/api/*`, `lib/supabase.ts`, `types/api.ts` (after grep), `data/teams.ts`.
21. Remove `handlePostLink` comment in `paymentService.ts`.
22. Add `firestore.rules` + register in `firebase.json`; user deploys rules.
23. **Test:** full smoke run; `npx tsc --noEmit` (or project typecheck) clean; no dangling imports.

---

## Verification commands
- `grep -rn "data/products" app/ store/ utils/ hooks/` → empty before deleting `data/products.ts`.
- `grep -rn "data/teams" app/ store/` → empty before deleting `data/teams.ts`.
- `grep -rn "lib/api\|lib/supabase\|types/api" app/ store/ lib/ services/` → empty before deletes.
- Typecheck: `npx tsc --noEmit` (check `package.json` for the exact script).

## Risks / notes
- Firebase phone auth is **web-only** here; test in the web build.
- Realtime team writes have no transactional member-count guard (acceptable for demo; note it).
- Team code uniqueness is best-effort (`randomTeamCode`); collision risk is low for a demo.
- Firestore rules above are a starting point — tighten before any real launch.
