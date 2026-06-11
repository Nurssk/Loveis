import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

import { fetchProducts } from '@/lib/productsRepo';
import { Product } from '@/types';

const ERROR_MESSAGE = 'Не удалось загрузить товары. Потяните вниз, чтобы повторить.';

type ProductsState = {
  products: Product[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

type Action =
  | { type: 'pending'; mode: 'initial' | 'refresh' }
  | { type: 'success'; products: Product[] }
  | { type: 'error' };

const INITIAL: ProductsState = { products: [], loading: true, refreshing: false, error: null };

function reducer(state: ProductsState, action: Action): ProductsState {
  switch (action.type) {
    case 'pending':
      return { ...state, loading: action.mode === 'initial', refreshing: action.mode === 'refresh', error: null };
    case 'success':
      return { products: action.products, loading: false, refreshing: false, error: null };
    case 'error':
      return { ...state, loading: false, refreshing: false, error: ERROR_MESSAGE };
    default:
      return state;
  }
}

type ProductsContextValue = ProductsState & {
  getProduct: (id: string) => Product | undefined;
  refresh: () => void;
  retry: () => void;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    dispatch({ type: 'pending', mode });
    try {
      const products = await fetchProducts();
      dispatch({ type: 'success', products });
    } catch {
      dispatch({ type: 'error' });
    }
  }, []);

  useEffect(() => { load('initial'); }, [load]);

  const byId = useMemo(() => new Map(state.products.map((p) => [p.id, p])), [state.products]);
  const getProduct = useCallback((id: string) => byId.get(id), [byId]);

  const value = useMemo<ProductsContextValue>(() => ({
    ...state,
    getProduct,
    refresh: () => load('refresh'),
    retry: () => load('initial'),
  }), [state, getProduct, load]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProductsCtx(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProductsCtx must be used within ProductsProvider');
  return ctx;
}
