import { collection, doc, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { Order } from '@/types';

export async function createOrder(
  userId: string,
  orderId: string,
  order: Omit<Order, 'id' | 'createdAt'>,
): Promise<void> {
  if (!db) return;
  await setDoc(doc(db, 'orders', orderId), {
    ...order,
    userId,
    createdAt: new Date().toISOString(),
  });
}

export function subscribeToOrders(uid: string, cb: (orders: Order[]) => void): () => void {
  if (!db) { cb([]); return () => {}; }
  const q = query(collection(db, 'orders'), where('userId', '==', uid));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ ...d.data(), id: d.id } as Order)));
  });
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  if (!db) return;
  await updateDoc(doc(db, 'orders', orderId), { status });
}
