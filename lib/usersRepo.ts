import { arrayUnion, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { Coupon, CouponType, UserProfile } from '@/types';

const COUPON_CATALOG: Record<CouponType, Omit<Coupon, 'id' | 'earnedAt' | 'usedAt'>> = {
  newcomer:       { type: 'newcomer',       title: 'Новичок',         description: 'За вступление в команду',            discount: 3 },
  team_player:    { type: 'team_player',    title: 'Командный игрок', description: 'Команда 3+ участника',               discount: 5 },
  first_purchase: { type: 'first_purchase', title: 'Первая покупка',  description: 'Первый товар в командной корзине',   discount: 2 },
};

function docToProfile(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    id: uid,
    phone: typeof data.phone === 'string' ? data.phone : '',
    name: typeof data.name === 'string' ? data.name : 'Вы',
    city: typeof data.city === 'string' ? data.city : 'Алматы',
    budget: typeof data.budget === 'number' ? data.budget : 300000,
    interests: Array.isArray(data.interests) ? (data.interests as string[]) : [],
    isVerified: typeof data.isVerified === 'boolean' ? data.isVerified : true,
    deviceId: typeof data.deviceId === 'string' ? data.deviceId : uid,
    currentTeamId: typeof data.currentTeamId === 'string' ? data.currentTeamId : undefined,
  };
}

export function subscribeToUser(
  uid: string,
  cb: (profile: UserProfile | null, coupons: Coupon[]) => void,
): () => void {
  if (!db) { cb(null, []); return () => {}; }
  return onSnapshot(doc(db, 'users', uid), (snap) => {
    if (!snap.exists()) { cb(null, []); return; }
    const data = snap.data() as Record<string, unknown>;
    cb(docToProfile(uid, data), Array.isArray(data.coupons) ? (data.coupons as Coupon[]) : []);
  });
}

export async function createOrInitUser(uid: string, phone: string): Promise<void> {
  if (!db) return;
  await setDoc(
    doc(db, 'users', uid),
    { phone, name: 'Вы', city: 'Алматы', budget: 300000, interests: [], coupons: [], isVerified: true, deviceId: uid, createdAt: new Date().toISOString() },
    { merge: true },
  );
}

export async function updateUser(uid: string, patch: Partial<UserProfile>): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'users', uid), patch as Record<string, unknown>);
}

export async function awardCoupon(uid: string, type: CouponType, earnedTypes: Set<CouponType>): Promise<void> {
  if (!db || earnedTypes.has(type)) return;
  const tpl = COUPON_CATALOG[type];
  const coupon: Coupon = { ...tpl, id: `coup-${Date.now()}`, earnedAt: new Date().toISOString() };
  await updateDoc(doc(db, 'users', uid), { coupons: arrayUnion(coupon) });
}
