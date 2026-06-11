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

export type Order = {
  id: string;
  kind: CartKind;
  total: number;
  city: string;
  address: string;
  deliveryMethod: string;
  paymentMethod: string;
  itemCount: number;
  createdAt: string;
};

export type Category = {
  id: string;
  label: string;
  icon: string; // Ionicons name
  color: string;
};
