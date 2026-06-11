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
  // Seller-created products only. Identifies the merchant and the group-buy target.
  sellerId?: string;
  minBatch?: number; // participants needed to unlock the wholesale (group) price
  groupPrice?: number; // wholesale price the seller offers once the batch fills
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
  // Merchant cabinet. A buyer can also open a store; both modes share one profile.
  isSeller?: boolean;
  storeName?: string;
};

/** Draft passed from the add/edit product form into the store. */
export type SellerProductInput = {
  title: string;
  description: string;
  category: string;
  regularPrice: number;
  groupPrice?: number;
  minBatch: number;
  image?: string;
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
