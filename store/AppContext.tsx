import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import { joinDemoTeam, makeMember, DEMO_MEMBER_NAMES } from '@/data/teams';
import { CartKind, CartState, Coupon, CouponType, Order, ShoppingTeam, UserProfile } from '@/types';
import { orderNumber, randomDeviceId, randomTeamCode, uid } from '@/utils/ids';

const TEAM_MAX_MEMBERS = 6;

const COUPON_CATALOG: Record<CouponType, Omit<Coupon, 'id' | 'earnedAt' | 'usedAt'>> = {
  newcomer:       { type: 'newcomer',       title: 'Новичок',         description: 'За вступление в команду',            discount: 3 },
  team_player:    { type: 'team_player',    title: 'Командный игрок', description: 'Команда 3+ участника',               discount: 5 },
  first_purchase: { type: 'first_purchase', title: 'Первая покупка',  description: 'Первый товар в командной корзине',   discount: 2 },
};

const STORAGE_KEY = 'birge.state.v1';

type PersistedState = {
  profile: UserProfile | null;
  team: ShoppingTeam | null;
  cart: CartState;
  recentlyViewed: string[];
  lastOrder: Order | null;
  coupons: Coupon[];
  teamOrders: Order[];
  savedProducts: string[];
};

type State = PersistedState & { hydrated: boolean };

const emptyCart: CartState = { individualItems: [], teamItems: [] };

const initialState: State = {
  profile: null,
  team: null,
  cart: emptyCart,
  recentlyViewed: [],
  lastOrder: null,
  coupons: [],
  teamOrders: [],
  savedProducts: [],
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
  verify: (uid?: string) => void;
  setInterests: (ids: string[]) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  logout: () => void;
  resetAll: () => void;
  // team
  createTeam: () => void;
  joinTeam: (code: string) => JoinResult;
  leaveTeam: () => void;
  addDemoMember: () => void;
  // coupons & team orders
  awardCoupon: (type: CouponType) => void;
  placeTeamOrder: () => Order | null;
  // cart
  addToCart: (kind: CartKind, productId: string, qty?: number) => void;
  removeFromCart: (kind: CartKind, productId: string) => void;
  setQuantity: (kind: CartKind, productId: string, qty: number) => void;
  clearCart: (kind: CartKind) => void;
  // saved products
  saveProduct: (id: string) => void;
  unsaveProduct: (id: string) => void;
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
            coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
            teamOrders: Array.isArray(parsed.teamOrders) ? parsed.teamOrders : [],
            savedProducts: Array.isArray(parsed.savedProducts) ? parsed.savedProducts : [],
          },
        });
      } catch {
        // Corrupt/malformed persisted data — start clean rather than crash.
        if (active) dispatch({ type: 'HYDRATE', payload: { profile: null, team: null, cart: emptyCart, recentlyViewed: [], lastOrder: null, coupons: [], teamOrders: [], savedProducts: [] } });
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
      coupons: state.coupons,
      teamOrders: state.teamOrders,
      savedProducts: state.savedProducts,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist)).catch(() => {});
  }, [state]);

  const value = useMemo<AppContextValue>(() => {
    const setCart = (cart: CartState) => dispatch({ type: 'SET', payload: { cart } });

    const awardCouponInternal = (type: CouponType): Coupon[] => {
      if (state.coupons.some((c) => c.type === type)) return state.coupons;
      const tpl = COUPON_CATALOG[type];
      const coupon: Coupon = { ...tpl, id: uid('coup'), earnedAt: new Date().toISOString() };
      const next = [...state.coupons, coupon];
      dispatch({ type: 'SET', payload: { coupons: next } });
      return next;
    };

    const recomputeTeamOrderStatuses = (memberCount: number) => {
      if (state.teamOrders.length === 0) return;
      const updated = state.teamOrders.map((o) =>
        o.status === 'pending_participants' && memberCount >= (o.membersNeeded ?? TEAM_MAX_MEMBERS)
          ? { ...o, status: 'confirmed' as const }
          : o,
      );
      dispatch({ type: 'SET', payload: { teamOrders: updated } });
    };

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

      verify: (uid) => {
        if (!state.profile) return;
        dispatch({
          type: 'SET',
          payload: { profile: { ...state.profile, isVerified: true, deviceId: uid || state.profile.deviceId || randomDeviceId() } },
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
        awardCouponInternal('newcomer');
      },

      joinTeam: (code) => {
        const team = joinDemoTeam(code);
        if (!team) {
          return { ok: false, error: 'Команда с таким кодом не найдена. Проверьте код и попробуйте снова.' };
        }
        dispatch({ type: 'SET', payload: { team } });
        awardCouponInternal('newcomer');
        if (team.members.length >= 3) awardCouponInternal('team_player');
        return { ok: true };
      },

      leaveTeam: () => dispatch({
        type: 'SET',
        payload: { team: null, cart: { ...state.cart, teamItems: [] }, teamOrders: [] },
      }),

      addDemoMember: () => {
        if (!state.team) return;
        const used = state.team.members.map((m) => m.name);
        const next = DEMO_MEMBER_NAMES.find((n) => !used.includes(n)) ?? `Гость ${state.team.members.length}`;
        const team: ShoppingTeam = { ...state.team, members: [...state.team.members, makeMember(next)] };
        dispatch({ type: 'SET', payload: { team } });
        const newCount = team.members.length;
        if (newCount >= 3) awardCouponInternal('team_player');
        recomputeTeamOrderStatuses(newCount);
      },

      awardCoupon: (type) => { awardCouponInternal(type); },

      placeTeamOrder: () => {
        if (!state.team || state.cart.teamItems.length === 0) return null;
        const lines = state.cart.teamItems
          .map((i) => ({ ...i, /* keep stub */ }));
        const memberCount = state.team.members.length;
        const status: Order['status'] = memberCount >= TEAM_MAX_MEMBERS ? 'confirmed' : 'pending_participants';
        const order: Order = {
          id: orderNumber(),
          kind: 'team',
          status,
          total: 0,
          city: state.profile?.city ?? '',
          address: '',
          deliveryMethod: 'pickup',
          paymentMethod: 'card',
          itemCount: lines.reduce((s, l) => s + l.quantity, 0),
          createdAt: new Date().toISOString(),
          teamId: state.team.id,
          membersNeeded: TEAM_MAX_MEMBERS,
          membersAtOrder: memberCount,
        };
        dispatch({ type: 'SET', payload: { teamOrders: [...state.teamOrders, order] } });
        return order;
      },

      addToCart: (kind, productId, qty = 1) => {
        const key = kind === 'team' ? 'teamItems' : 'individualItems';
        const items = state.cart[key];
        const existing = items.find((i) => i.productId === productId);
        const nextItems = existing
          ? items.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + qty } : i))
          : [...items, { productId, quantity: qty }];
        setCart({ ...state.cart, [key]: nextItems });
        if (kind === 'team' && items.length === 0) awardCouponInternal('first_purchase');
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

      saveProduct: (id) => {
        if (state.savedProducts.includes(id)) return;
        dispatch({ type: 'SET', payload: { savedProducts: [...state.savedProducts, id] } });
      },

      unsaveProduct: (id) => {
        dispatch({ type: 'SET', payload: { savedProducts: state.savedProducts.filter((s) => s !== id) } });
      },

      markViewed: (productId) => {
        const next = [productId, ...state.recentlyViewed.filter((id) => id !== productId)].slice(0, 8);
        dispatch({ type: 'SET', payload: { recentlyViewed: next } });
      },

      placeOrder: (draft) => {
        const order: Order = { ...draft, id: orderNumber(), status: draft.status ?? 'confirmed', createdAt: new Date().toISOString() };
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
