/**
 * Backend row types — mirror the Supabase DB schema.
 * These are separate from domain types in index.ts intentionally:
 * DB rows use snake_case and include server-set fields (id, created_at, etc.)
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type DbUser = {
  id: string;
  phone: string;
  name: string;
  city: string;
  created_at: string;
};

// ─── Teams ────────────────────────────────────────────────────────────────────

export type DbTeam = {
  id: string;
  code: string;
  name: string;
  created_by: string; // user id
  created_at: string;
  expires_at: string;
};

export type DbTeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  name: string;
  is_current_user: boolean;
  joined_at: string;
};

// ─── Coupons ──────────────────────────────────────────────────────────────────

export type CouponType =
  | 'newcomer'       // joined a team
  | 'team_player'    // team reached 3+ members
  | 'first_purchase' // first item added to team cart
  | 'daily_login'    // logged in today
  | 'invite';        // invited a new member

export type DbCoupon = {
  id: string;
  user_id: string;
  type: CouponType;
  discount_pct: number;
  earned_at: string;
  used_at: string | null;
  order_id: string | null;
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending_participants' // team order waiting for more members
  | 'confirmed'            // enough members joined, order locked in
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type DbOrder = {
  id: string;
  team_id: string | null;
  user_id: string;
  kind: 'individual' | 'team';
  status: OrderStatus;
  total: number;
  city: string;
  address: string;
  delivery_method: string;
  payment_method: string;
  item_count: number;
  created_at: string;
};

export type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
};

// ─── API params / results ─────────────────────────────────────────────────────

export type CreateTeamParams = {
  name: string;
};

export type CreateTeamResult = {
  team: DbTeam;
  member: DbTeamMember;
};

export type JoinTeamParams = {
  code: string;
};

export type JoinTeamResult =
  | { ok: true; team: DbTeam; members: DbTeamMember[] }
  | { ok: false; error: string };

export type LeaveTeamParams = {
  teamId: string;
  userId: string;
};

export type GetCouponsResult = {
  coupons: DbCoupon[];
};

export type ApplyCouponParams = {
  couponId: string;
  orderId: string;
};

export type PlaceOrderParams = {
  teamId: string | null;
  kind: 'individual' | 'team';
  items: { productId: string; quantity: number; unitPrice: number }[];
  total: number;
  city: string;
  address: string;
  deliveryMethod: string;
  paymentMethod: string;
};

export type PlaceOrderResult = {
  order: DbOrder;
};

export type GetOrdersResult = {
  orders: DbOrder[];
};
