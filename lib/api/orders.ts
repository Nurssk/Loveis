/**
 * Orders API
 *
 * ─── ЧТО НУЖНО СДЕЛАТЬ (для команда-страницы) ────────────────────────────────
 *
 * TODO 1: Подключить Supabase клиент
 *   → раскомментировать: import { supabase } from '@/lib/supabase'
 *
 * TODO 2: Реализовать placeOrder
 *   Командные заказы создаются со статусом 'pending_participants'
 *   если команда ещё не полная (memberCount < 6).
 *   Вызывать при нажатии "Перейти в корзину" → оформить заказ в team.tsx.
 *
 * TODO 3: Реализовать subscribeToOrderStatus и подключить в team.tsx
 *   Включить Realtime для orders в Supabase Dashboard:
 *   Database → Replication → supabase_realtime → добавить orders
 *   Подключить в team.tsx:
 *   useEffect(() => {
 *     if (!lastTeamOrder) return;
 *     const unsub = subscribeToOrderStatus(lastTeamOrder.id, (status) => {
 *       if (status === 'confirmed') toast.show('Заказ подтверждён! Команда собрана 🎉');
 *     });
 *     return unsub;
 *   }, [lastTeamOrder?.id]);
 *   Тогда pending banner в team.tsx скроется автоматически при подтверждении.
 *
 * TODO 4: Добавить DB-функцию автоподтверждения заказов (Supabase Edge Function)
 *   Когда team_members.count достигает 6 → UPDATE orders SET status = 'confirmed'
 *   WHERE team_id = $teamId AND status = 'pending_participants'
 *   Тригерить через subscribeToTeamMembers в teams.ts.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// TODO 1: раскомментировать после подключения Supabase
// import { supabase } from '@/lib/supabase';

import type {
  DbOrder,
  GetOrdersResult,
  OrderStatus,
  PlaceOrderParams,
  PlaceOrderResult,
} from '@/types/api';

/**
 * Создать командный заказ.
 * Статус 'pending_participants' если команда не полная, иначе 'confirmed'.
 *
 * TODO 2: реализовать
 * const status = params.kind === 'team' && teamMemberCount < 6
 *   ? 'pending_participants' : 'confirmed';
 * const { data: order } = await supabase
 *   .from('orders')
 *   .insert({ ...params, status, item_count: params.items.length })
 *   .select().single();
 * await supabase.from('order_items')
 *   .insert(params.items.map(i => ({ order_id: order.id, ...i })));
 * return { order };
 */
export async function placeOrder(_params: PlaceOrderParams): Promise<PlaceOrderResult> {
  throw new Error('Not implemented');
}

/**
 * Получить все заказы пользователя.
 *
 * const { data } = await supabase
 *   .from('orders')
 *   .select('*, order_items(*)')
 *   .eq('user_id', userId)
 *   .order('created_at', { ascending: false });
 * return { orders: data ?? [] };
 */
export async function getOrders(_userId: string): Promise<GetOrdersResult> {
  throw new Error('Not implemented');
}

/**
 * Получить один заказ по id.
 *
 * const { data } = await supabase
 *   .from('orders')
 *   .select('*, order_items(*)')
 *   .eq('id', orderId).eq('user_id', userId).single();
 * return data ?? null;
 */
export async function getOrder(_orderId: string, _userId: string): Promise<DbOrder | null> {
  throw new Error('Not implemented');
}

/**
 * Подписаться на изменение статуса заказа в реальном времени.
 * Нужно в team.tsx — скрыть pending banner когда статус стал 'confirmed'.
 * Возвращает функцию отписки — вызвать в useEffect cleanup.
 *
 * TODO 3: реализовать
 * const channel = supabase
 *   .channel(`order:${orderId}`)
 *   .on('postgres_changes',
 *     { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
 *     (payload) => onStatusChange(payload.new.status as OrderStatus)
 *   )
 *   .subscribe();
 * return () => supabase.removeChannel(channel);
 */
export function subscribeToOrderStatus(
  _orderId: string,
  _onStatusChange: (newStatus: OrderStatus) => void,
): () => void {
  return () => {};
}

/**
 * Отменить заказ пока он в статусе pending_participants.
 *
 * const { error } = await supabase
 *   .from('orders')
 *   .update({ status: 'cancelled' })
 *   .eq('id', orderId)
 *   .eq('status', 'pending_participants');
 * if (error) throw error;
 */
export async function cancelOrder(_orderId: string): Promise<void> {
  throw new Error('Not implemented');
}
