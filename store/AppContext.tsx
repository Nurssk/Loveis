import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';

import { auth } from '@/lib/firebase';
import * as ordersRepo from '@/lib/ordersRepo';
import * as teamsRepo from '@/lib/teamsRepo';
import { awardCoupon, createOrInitUser, subscribeToUser, updateUser } from '@/lib/usersRepo';
import { CartItem, CartKind, CartState, Coupon, CouponType, Order, ShoppingTeam, TeamMember, UserProfile } from '@/types';
import { orderNumber, uid } from '@/utils/ids';

const DEMO_MEMBER_NAMES = ['Алия', 'Нуржан', 'Данияр', 'Аружан', 'Ербол', 'Сабина'];

const TEAM_MAX_MEMBERS = 6;
const LOCAL_STORAGE_KEY = 'birge.local.v1';

// ─── State ──────────────────────────────────────────────────────────────────

type LocalState = {
  team: ShoppingTeam | null;
  cart: CartState;
  recentlyViewed: string[];
  lastOrder: Order | null;
  savedProducts: string[];
};

type State = LocalState & {
  uid: string | null;
  pendingPhone: string;
  profile: UserProfile | null;
  coupons: Coupon[];
  teamOrders: Order[];   // Firestore-driven via subscribeToOrders
  hydrated: boolean;
};

const emptyCart: CartState = { individualItems: [], teamItems: [] };

const initialState: State = {
  uid: null,
  pendingPhone: '',
  profile: null,
  coupons: [],
  teamOrders: [],
  team: null,
  cart: emptyCart,
  recentlyViewed: [],
  lastOrder: null,
  savedProducts: [],
  hydrated: false,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'HYDRATE_LOCAL'; payload: LocalState }
  | { type: 'SET_AUTH'; uid: string | null }
  | { type: 'SET_PROFILE'; profile: UserProfile | null; coupons: Coupon[] }
  | { type: 'SET_HYDRATED' }
  | { type: 'SET_PENDING_PHONE'; phone: string }
  | { type: 'SET'; payload: Partial<State> }
  | { type: 'RESET_LOCAL' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE_LOCAL':
      return { ...state, ...action.payload, hydrated: true };
    case 'SET_AUTH':
      if (action.uid === null) {
        return { ...initialState, hydrated: true };
      }
      return { ...state, uid: action.uid };
    case 'SET_PROFILE':
      return { ...state, profile: action.profile, coupons: action.coupons };
    case 'SET_HYDRATED':
      return state.hydrated ? state : { ...state, hydrated: true };
    case 'SET_PENDING_PHONE':
      return { ...state, pendingPhone: action.phone };
    case 'SET':
      return { ...state, ...action.payload };
    case 'RESET_LOCAL':
      return { ...state, team: null, cart: emptyCart, recentlyViewed: [], lastOrder: null, teamOrders: [], savedProducts: [], uid: null, pendingPhone: '', profile: null, coupons: [] };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

type JoinResult = { ok: true } | { ok: false; error: string };

type AppContextValue = {
  state: State;
  // auth
  login: (phone: string) => void;
  verify: (uid: string) => void;
  setInterests: (ids: string[]) => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  logout: () => void;
  resetAll: () => void;
  // team
  createTeam: () => void;
  joinTeam: (code: string) => Promise<JoinResult>;
  leaveTeam: () => void;
  addDemoMember: () => void;
  // coupons & team orders
  awardCoupon: (type: CouponType) => void;
  placeTeamOrder: (total: number, items: { productId: string; quantity: number; unitPrice: number }[]) => Order | null;
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

  // ── 1. Hydrate local slice from AsyncStorage on mount ─────────────────────
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed: Partial<LocalState> = raw ? JSON.parse(raw) : {};
        if (!active) return;
        dispatch({
          type: 'HYDRATE_LOCAL',
          payload: {
            team: parsed.team ?? null,
            cart: parsed.cart ?? emptyCart,
            recentlyViewed: Array.isArray(parsed.recentlyViewed) ? parsed.recentlyViewed : [],
            lastOrder: parsed.lastOrder ?? null,
            savedProducts: Array.isArray(parsed.savedProducts) ? parsed.savedProducts : [],
          },
        });
      } catch {
        if (active) dispatch({ type: 'SET_HYDRATED' });
      }
    })();
    return () => { active = false; };
  }, []);

  // ── 2. Firebase Auth listener + user-doc subscription ────────────────────
  useEffect(() => {
    if (!auth) {
      dispatch({ type: 'SET_HYDRATED' });
      return;
    }

    let userDocUnsub: (() => void) | null = null;
    let ordersUnsub: (() => void) | null = null;
    let profileLoaded = false;

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      userDocUnsub?.();
      userDocUnsub = null;
      ordersUnsub?.();
      ordersUnsub = null;
      profileLoaded = false;

      if (firebaseUser) {
        dispatch({ type: 'SET_AUTH', uid: firebaseUser.uid });

        userDocUnsub = subscribeToUser(firebaseUser.uid, (profile, coupons) => {
          dispatch({ type: 'SET_PROFILE', profile, coupons });
          if (!profileLoaded) {
            profileLoaded = true;
            dispatch({ type: 'SET_HYDRATED' });
          }
        });

        ordersUnsub = ordersRepo.subscribeToOrders(firebaseUser.uid, (orders) => {
          const teamOrders = orders.filter((o) => o.kind === 'team');
          dispatch({ type: 'SET', payload: { teamOrders } });
        });
      } else {
        dispatch({ type: 'SET_AUTH', uid: null });
      }
    });

    return () => {
      authUnsub();
      userDocUnsub?.();
      ordersUnsub?.();
    };
  }, []);

  // ── 3. Team subscription — triggered by currentTeamId on user profile ────
  useEffect(() => {
    const teamId = state.profile?.currentTeamId;
    if (!teamId) {
      dispatch({ type: 'SET', payload: { team: null } });
      return;
    }

    let teamBase: Omit<ShoppingTeam, 'members'> | null = null;
    let teamMembers: TeamMember[] = [];

    const merge = () => {
      if (teamBase) {
        dispatch({ type: 'SET', payload: { team: { ...teamBase, members: teamMembers } } });
      }
    };

    const teamUnsub = teamsRepo.subscribeToTeam(teamId, (t) => {
      if (!t) { dispatch({ type: 'SET', payload: { team: null } }); return; }
      teamBase = t;
      merge();
    });

    const membersUnsub = teamsRepo.subscribeToMembers(teamId, state.uid, (members) => {
      teamMembers = members;
      merge();
    });

    return () => { teamUnsub(); membersUnsub(); };
  }, [state.profile?.currentTeamId, state.uid]);

  // ── 4. Auto-confirm team orders when member threshold is reached ─────────
  useEffect(() => {
    const memberCount = state.team?.members.length ?? 0;
    if (memberCount === 0 || state.teamOrders.length === 0) return;
    const updated = state.teamOrders.map((o) =>
      o.status === 'pending_participants' && memberCount >= (o.membersNeeded ?? TEAM_MAX_MEMBERS)
        ? { ...o, status: 'confirmed' as const }
        : o,
    );
    const changed = updated.some((o, i) => o.status !== state.teamOrders[i].status);
    if (changed) dispatch({ type: 'SET', payload: { teamOrders: updated } });
  }, [state.team?.members.length, state.teamOrders]);

  // ── 5. Persist local slice whenever it changes ────────────────────────────
  useEffect(() => {
    if (!state.hydrated) return;
    const local: LocalState = {
      team: state.team,
      cart: state.cart,
      recentlyViewed: state.recentlyViewed,
      lastOrder: state.lastOrder,
      savedProducts: state.savedProducts,
    };
    AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local)).catch(() => {});
  }, [state.team, state.cart, state.recentlyViewed, state.lastOrder, state.savedProducts, state.hydrated]);

  const value = useMemo<AppContextValue>(() => {
    const setCart = (cart: CartState) => dispatch({ type: 'SET', payload: { cart } });

    const earnedTypes = () => new Set(state.coupons.map((c) => c.type));

    const doAwardCoupon = (type: CouponType) => {
      if (!state.uid) return;
      awardCoupon(state.uid, type, earnedTypes()).catch(() => {});
    };

    return {
      state,

      login: (phone) => {
        dispatch({ type: 'SET_PENDING_PHONE', phone });
      },

      verify: (firebaseUid) => {
        createOrInitUser(firebaseUid, state.pendingPhone).catch(() => {});
      },

      setInterests: (ids) => {
        if (!state.uid) return;
        updateUser(state.uid, { interests: ids }).catch(() => {});
      },

      updateProfile: (patch) => {
        if (!state.uid) return;
        updateUser(state.uid, patch).catch(() => {});
      },

      logout: () => {
        if (auth) signOut(auth).catch(() => {});
        dispatch({ type: 'RESET_LOCAL' });
      },

      resetAll: () => {
        if (auth) signOut(auth).catch(() => {});
        dispatch({ type: 'RESET_LOCAL' });
      },

      createTeam: () => {
        if (!state.uid) return;
        teamsRepo.createTeam(state.uid, 'Моя команда').then(({ teamId }) => {
          updateUser(state.uid!, { currentTeamId: teamId }).catch(() => {});
          doAwardCoupon('newcomer');
        }).catch(() => {});
      },

      joinTeam: async (code) => {
        if (!state.uid) return { ok: false as const, error: 'Не авторизован.' };
        const memberName = state.profile?.name ?? 'Вы';
        const result = await teamsRepo.joinTeamByCode(state.uid, code, memberName);
        if (!result.ok) return result;
        await updateUser(state.uid, { currentTeamId: result.teamId }).catch(() => {});
        doAwardCoupon('newcomer');
        return { ok: true as const };
      },

      leaveTeam: () => {
        const teamId = state.team?.id ?? state.profile?.currentTeamId;
        if (state.uid && teamId) {
          teamsRepo.leaveTeam(state.uid, teamId).catch(() => {});
          updateUser(state.uid, { currentTeamId: undefined }).catch(() => {});
        }
        dispatch({ type: 'SET', payload: { cart: { ...state.cart, teamItems: [] }, teamOrders: [] } });
      },

      addDemoMember: () => {
        const teamId = state.team?.id;
        if (!teamId) return;
        const used = state.team?.members.map((m) => m.name) ?? [];
        const next = DEMO_MEMBER_NAMES.find((n) => !used.includes(n)) ?? `Гость ${state.team?.members.length ?? 0}`;
        teamsRepo.addSyntheticMember(teamId, next).catch(() => {});
        // coupon and order status re-check will happen when members snapshot fires
      },

      awardCoupon: (type) => { doAwardCoupon(type); },

      placeTeamOrder: (total, items) => {
        if (!state.team || state.cart.teamItems.length === 0) return null;
        const memberCount = state.team.members.length;
        const status: Order['status'] = memberCount >= TEAM_MAX_MEMBERS ? 'confirmed' : 'pending_participants';
        const oid = orderNumber();
        const order: Order = {
          id: oid,
          kind: 'team',
          status,
          total,
          city: state.profile?.city ?? '',
          address: '',
          deliveryMethod: 'pickup',
          paymentMethod: 'card',
          itemCount: items.reduce((s, i) => s + i.quantity, 0),
          createdAt: new Date().toISOString(),
          teamId: state.team.id,
          membersNeeded: TEAM_MAX_MEMBERS,
          membersAtOrder: memberCount,
        };
        if (state.uid) {
          ordersRepo.createOrder(state.uid, oid, { kind: order.kind, status: order.status, total: order.total, city: order.city, address: order.address, deliveryMethod: order.deliveryMethod, paymentMethod: order.paymentMethod, itemCount: order.itemCount, teamId: order.teamId, membersNeeded: order.membersNeeded, membersAtOrder: order.membersAtOrder }).catch(() => {});
        }
        dispatch({ type: 'SET', payload: { cart: { ...state.cart, teamItems: [] } } });
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
        if (kind === 'team' && items.length === 0) doAwardCoupon('first_purchase');
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
        const oid = orderNumber();
        const order: Order = { ...draft, id: oid, status: draft.status ?? 'confirmed', createdAt: new Date().toISOString() };
        if (state.uid) {
          const { id: _id, createdAt: _ca, ...rest } = order;
          ordersRepo.createOrder(state.uid, oid, rest).catch(() => {});
        }
        const key = draft.kind === 'team' ? 'teamItems' : 'individualItems';
        dispatch({ type: 'SET', payload: { lastOrder: order, cart: { ...state.cart, [key]: [] } } });
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
