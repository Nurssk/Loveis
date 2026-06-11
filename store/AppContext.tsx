import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import { setSellerProducts } from '@/data/products';
import { categoryImage, makeSampleSellerProducts } from '@/data/sellerSamples';
import { joinDemoTeam, makeMember, DEMO_MEMBER_NAMES } from '@/data/teams';
import { CartKind, CartState, Order, Product, SellerProductInput, ShoppingTeam, UserProfile } from '@/types';
import { orderNumber, randomDeviceId, randomTeamCode, uid } from '@/utils/ids';

const STORAGE_KEY = 'birge.state.v1';

type PersistedState = {
  profile: UserProfile | null;
  team: ShoppingTeam | null;
  cart: CartState;
  recentlyViewed: string[];
  lastOrder: Order | null;
  sellerProducts: Product[];
};

type State = PersistedState & { hydrated: boolean };

const emptyCart: CartState = { individualItems: [], teamItems: [] };

const initialState: State = {
  profile: null,
  team: null,
  cart: emptyCart,
  recentlyViewed: [],
  lastOrder: null,
  sellerProducts: [],
  hydrated: false,
};

type Action =
  | { type: 'HYDRATE'; payload: PersistedState }
  | { type: 'SET'; payload: Partial<PersistedState> }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, hydrated: true };
    case 'SET':
      return { ...state, ...action.payload };
    case 'RESET':
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}

type JoinResult = { ok: true } | { ok: false; error: string };

type AppContextValue = {
  state: State;
  // auth
  login: (phone: string) => void;
  verify: () => void;
  setInterests: (ids: string[]) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  logout: () => void;
  resetAll: () => void;
  // team
  createTeam: () => void;
  joinTeam: (code: string) => JoinResult;
  leaveTeam: () => void;
  addDemoMember: () => void;
  // cart
  addToCart: (kind: CartKind, productId: string, qty?: number) => void;
  removeFromCart: (kind: CartKind, productId: string) => void;
  setQuantity: (kind: CartKind, productId: string, qty: number) => void;
  clearCart: (kind: CartKind) => void;
  // seller
  becomeSeller: (storeName: string) => void;
  addSellerProduct: (input: SellerProductInput) => Product | null;
  updateSellerProduct: (id: string, patch: SellerProductInput) => void;
  deleteSellerProduct: (id: string) => void;
  // misc
  markViewed: (productId: string) => void;
  placeOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Order;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate once on mount.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: Partial<PersistedState> = raw ? JSON.parse(raw) : {};
        if (!active) return;
        dispatch({
          type: 'HYDRATE',
          payload: {
            profile: parsed.profile ?? null,
            team: parsed.team ?? null,
            cart: parsed.cart ?? emptyCart,
            recentlyViewed: Array.isArray(parsed.recentlyViewed) ? parsed.recentlyViewed : [],
            lastOrder: parsed.lastOrder ?? null,
            sellerProducts: Array.isArray(parsed.sellerProducts) ? parsed.sellerProducts : [],
          },
        });
      } catch {
        // Corrupt/malformed persisted data — start clean rather than crash.
        if (active) dispatch({ type: 'HYDRATE', payload: { profile: null, team: null, cart: emptyCart, recentlyViewed: [], lastOrder: null, sellerProducts: [] } });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persist relevant slices whenever they change (after hydration).
  useEffect(() => {
    if (!state.hydrated) return;
    const toPersist: PersistedState = {
      profile: state.profile,
      team: state.team,
      cart: state.cart,
      recentlyViewed: state.recentlyViewed,
      lastOrder: state.lastOrder,
      sellerProducts: state.sellerProducts,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist)).catch(() => {});
  }, [state]);

  // Keep the runtime product registry in sync with the persisted seller catalog,
  // so seller products surface in the buyer feed/search/detail via getProduct().
  useEffect(() => {
    setSellerProducts(state.sellerProducts);
  }, [state.sellerProducts]);

  const value = useMemo<AppContextValue>(() => {
    const setCart = (cart: CartState) => dispatch({ type: 'SET', payload: { cart } });

    return {
      state,

      login: (phone) => {
        const profile: UserProfile = {
          id: uid('user'),
          phone,
          name: 'Вы',
          city: 'Алматы',
          budget: 300000,
          interests: [],
          isVerified: false,
          deviceId: '',
        };
        dispatch({ type: 'SET', payload: { profile } });
      },

      verify: () => {
        if (!state.profile) return;
        dispatch({
          type: 'SET',
          payload: { profile: { ...state.profile, isVerified: true, deviceId: state.profile.deviceId || randomDeviceId() } },
        });
      },

      setInterests: (ids) => {
        if (!state.profile) return;
        dispatch({ type: 'SET', payload: { profile: { ...state.profile, interests: ids } } });
      },

      updateProfile: (patch) => {
        if (!state.profile) return;
        dispatch({ type: 'SET', payload: { profile: { ...state.profile, ...patch } } });
      },

      logout: () => {
        // Keep nothing sensitive; return to login but wipe session state.
        dispatch({ type: 'RESET' });
      },

      resetAll: () => dispatch({ type: 'RESET' }),

      createTeam: () => {
        const team: ShoppingTeam = {
          id: uid('team'),
          name: 'Моя команда',
          code: randomTeamCode(),
          createdAt: new Date().toISOString(),
          members: [makeMember('Вы', true)],
        };
        dispatch({ type: 'SET', payload: { team } });
      },

      joinTeam: (code) => {
        const team = joinDemoTeam(code);
        if (!team) {
          return { ok: false, error: 'Команда с таким кодом не найдена. Проверьте код и попробуйте снова.' };
        }
        dispatch({ type: 'SET', payload: { team } });
        return { ok: true };
      },

      leaveTeam: () => dispatch({ type: 'SET', payload: { team: null, cart: { ...state.cart, teamItems: [] } } }),

      addDemoMember: () => {
        if (!state.team) return;
        const used = state.team.members.map((m) => m.name);
        const next = DEMO_MEMBER_NAMES.find((n) => !used.includes(n)) ?? `Гость ${state.team.members.length}`;
        const team: ShoppingTeam = { ...state.team, members: [...state.team.members, makeMember(next)] };
        dispatch({ type: 'SET', payload: { team } });
      },

      addToCart: (kind, productId, qty = 1) => {
        const key = kind === 'team' ? 'teamItems' : 'individualItems';
        const items = state.cart[key];
        const existing = items.find((i) => i.productId === productId);
        const nextItems = existing
          ? items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + qty } : i))
          : [...items, { productId, quantity: qty }];
        setCart({ ...state.cart, [key]: nextItems });
      },

      removeFromCart: (kind, productId) => {
        const key = kind === 'team' ? 'teamItems' : 'individualItems';
        setCart({ ...state.cart, [key]: state.cart[key].filter((i) => i.productId !== productId) });
      },

      setQuantity: (kind, productId, qty) => {
        const key = kind === 'team' ? 'teamItems' : 'individualItems';
        if (qty <= 0) {
          setCart({ ...state.cart, [key]: state.cart[key].filter((i) => i.productId !== productId) });
          return;
        }
        setCart({
          ...state.cart,
          [key]: state.cart[key].map((i) => (i.productId === productId ? { ...i, quantity: qty } : i)),
        });
      },

      clearCart: (kind) => {
        const key = kind === 'team' ? 'teamItems' : 'individualItems';
        setCart({ ...state.cart, [key]: [] });
      },

      becomeSeller: (storeName) => {
        if (!state.profile) return;
        const name = storeName.trim() || 'Мой магазин';
        const profile: UserProfile = { ...state.profile, isSeller: true, storeName: name };
        // Seed a small sample catalog the first time, so the cabinet feels alive.
        const sellerProducts =
          state.sellerProducts.length === 0
            ? makeSampleSellerProducts(state.profile.id, name, state.profile.city)
            : state.sellerProducts;
        dispatch({ type: 'SET', payload: { profile, sellerProducts } });
      },

      addSellerProduct: (input) => {
        if (!state.profile) return null;
        const product: Product = {
          id: uid('sp'),
          sellerId: state.profile.id,
          title: input.title.trim(),
          description: input.description.trim(),
          category: input.category,
          marketplace: state.profile.storeName ?? 'Мой магазин',
          image: input.image?.trim() || categoryImage(input.category),
          regularPrice: input.regularPrice,
          rating: 5.0,
          city: state.profile.city,
          tags: ['новинка'],
          popularity: 60,
          activeBuyers: 1 + Math.floor(Math.random() * 4),
          minBatch: input.minBatch,
          groupPrice: input.groupPrice,
        };
        dispatch({ type: 'SET', payload: { sellerProducts: [product, ...state.sellerProducts] } });
        return product;
      },

      updateSellerProduct: (id, patch) => {
        const sellerProducts = state.sellerProducts.map((p) =>
          p.id === id
            ? {
                ...p,
                title: patch.title.trim(),
                description: patch.description.trim(),
                category: patch.category,
                marketplace: state.profile?.storeName ?? p.marketplace,
                image: patch.image?.trim() || categoryImage(patch.category),
                regularPrice: patch.regularPrice,
                minBatch: patch.minBatch,
                groupPrice: patch.groupPrice,
              }
            : p,
        );
        dispatch({ type: 'SET', payload: { sellerProducts } });
      },

      deleteSellerProduct: (id) => {
        dispatch({ type: 'SET', payload: { sellerProducts: state.sellerProducts.filter((p) => p.id !== id) } });
      },

      markViewed: (productId) => {
        const next = [productId, ...state.recentlyViewed.filter((id) => id !== productId)].slice(0, 8);
        dispatch({ type: 'SET', payload: { recentlyViewed: next } });
      },

      placeOrder: (draft) => {
        const order: Order = { ...draft, id: orderNumber(), createdAt: new Date().toISOString() };
        const key = draft.kind === 'team' ? 'teamItems' : 'individualItems';
        dispatch({
          type: 'SET',
          payload: { lastOrder: order, cart: { ...state.cart, [key]: [] } },
        });
        return order;
      },
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
