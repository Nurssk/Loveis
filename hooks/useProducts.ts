/**
 * Loads the product catalog for the dashboard and exposes loading / error /
 * pull-to-refresh state. Keeps the data-fetching concern out of the screen.
 *
 * Uses useReducer (like store/AppContext) so the initial load can dispatch from
 * inside the mount effect without tripping the set-state-in-effect lint rule.
 */
import { useCallback, useEffect, useReducer } from 'react';

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

const INITIAL: ProductsState = {
  products: [],
  loading: true,
  refreshing: false,
  error: null,
};

function reducer(state: ProductsState, action: Action): ProductsState {
  switch (action.type) {
    case 'pending':
      return {
        ...state,
        loading: action.mode === 'initial',
        refreshing: action.mode === 'refresh',
        error: null,
      };
    case 'success':
      return { products: action.products, loading: false, refreshing: false, error: null };
    case 'error':
      return { ...state, loading: false, refreshing: false, error: ERROR_MESSAGE };
    default:
      return state;
  }
}

export function useProducts() {
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

  useEffect(() => {
    load('initial');
  }, [load]);

  return {
    ...state,
    refresh: useCallback(() => load('refresh'), [load]),
    retry: useCallback(() => load('initial'), [load]),
  };
}
