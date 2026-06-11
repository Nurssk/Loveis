/**
 * Coupons API
 *
 * ─── ЧТО НУЖНО СДЕЛАТЬ (для команда-страницы) ────────────────────────────────
 *
 * TODO 1: Подключить Supabase клиент
 *   → раскомментировать: import { supabase } from '@/lib/supabase'
 *
 * TODO 2: Реализовать getCoupons и заменить локальный derive в team.tsx
 *   Сейчас в team.tsx купоны вычисляются локально через useCoupons(memberCount, hasCartItems).
 *   После реализации — загружать из БД и хранить в стейте:
 *   const [coupons, setCoupons] = useState<DbCoupon[]>([]);
 *   useEffect(() => { getCoupons(userId).then(setCoupons) }, [userId]);
 *
 * TODO 3: Реализовать awardCoupon и вызывать его в team.tsx при нужных событиях
 *   Пока нет DB-триггеров — вызывать вручную:
 *   - При createTeam/joinTeam → awardCoupon(userId, 'newcomer', 3)
 *   - Когда memberCount достигает 3 → awardCoupon(userId, 'team_player', 5)
 *   - Когда первый товар добавлен в командную корзину → awardCoupon(userId, 'first_purchase', 2)
 *
 * TODO 4: (опционально) Добавить DB-триггеры в Supabase для автовыдачи купонов
 *   after INSERT on team_members → 'newcomer', 'team_player'
 *   after INSERT on order_items  → 'first_purchase'
 *   Тогда awardCoupon вручную вызывать не нужно.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// TODO 1: раскомментировать после подключения Supabase
// import { supabase } from '@/lib/supabase';

import type { ApplyCouponParams, CouponType, DbCoupon } from '@/types/api';

/**
 * Получить все купоны пользователя.
 * Заменяет локальный useCoupons hook в team.tsx.
 *
 * TODO 2: реализовать
 * const { data, error } = await supabase
 *   .from('coupons')
 *   .select('*')
 *   .eq('user_id', userId)
 *   .order('earned_at', { ascending: false });
 * if (error) throw error;
 * return data;
 */
export async function getCoupons(_userId: string): Promise<DbCoupon[]> {
  throw new Error('Not implemented');
}

/**
 * Применить купон к заказу (пометить как использованный).
 *
 * const { error } = await supabase
 *   .from('coupons')
 *   .update({ used_at: new Date().toISOString(), order_id: params.orderId })
 *   .eq('id', params.couponId)
 *   .is('used_at', null);
 * if (error) throw error;
 */
export async function applyCoupon(_params: ApplyCouponParams): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * Выдать купон пользователю если такого типа ещё нет (идемпотентно).
 * Вызывать из team.tsx пока не настроены DB-триггеры (TODO 3).
 *
 * Скидки по типу:
 *   newcomer       → −3%
 *   team_player    → −5%
 *   first_purchase → −2%
 *   daily_login    → −1%
 *   invite         → −3%
 *
 * TODO 3: реализовать
 * const { data } = await supabase
 *   .from('coupons')
 *   .insert({ user_id: userId, type, discount_pct: discountPct })
 *   .select().single();
 * return data;
 */
export async function awardCoupon(
  _userId: string,
  _type: CouponType,
  _discountPct: number,
): Promise<DbCoupon | null> {
  throw new Error('Not implemented');
}
