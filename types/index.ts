/** Global domain types for the BirGe collective-purchasing app. */

export type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  marketplace: string;
  image: string;
  regularPrice: number;
  rating: number;
  city: string;
  tags: string[];
  popularity: number;
  activeBuyers: number;
};

export type UserProfile = {
  id: string;
  phone: string;
  name: string;
  city: string;
  budget: number;
  interests: string[];
  isVerified: boolean;
  deviceId: string;
};

export type TeamMember = {
  id: string;
  name: string;
  isCurrentUser?: boolean;
};

export type ShoppingTeam = {
  id: string;
  name: string;
  code: string;
  members: TeamMember[];
  createdAt: string;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type CartState = {
  individualItems: CartItem[];
  teamItems: CartItem[];
};

export type CartKind = 'individual' | 'team';

export type OrderStatus = 'pending_participants' | 'confirmed' | 'shipped' | 'delivered';

export type Order = {
  id: string;
  kind: CartKind;
  status: OrderStatus;
  total: number;
  city: string;
  address: string;
  deliveryMethod: string;
  paymentMethod: string;
  itemCount: number;
  createdAt: string;
  teamId?: string;
  membersNeeded?: number;
  membersAtOrder?: number;
};

export type CouponType = 'newcomer' | 'team_player' | 'first_purchase';

export type Coupon = {
  id: string;
  type: CouponType;
  title: string;
  description: string;
  discount: number;
  earnedAt: string;
  usedAt?: string;
};

export type Category = {
  id: string;
  label: string;
  icon: string; // Ionicons name
  color: string;
};
