import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { ShoppingTeam, TeamMember } from '@/types';
import { randomTeamCode, uid } from '@/utils/ids';

const DEMO_MEMBER_NAMES = ['Алия', 'Нуржан', 'Данияр', 'Аружан', 'Ербол', 'Сабина', 'Мадина', 'Бекзат'];

type TeamDoc = Omit<ShoppingTeam, 'members'>;

function docToTeam(id: string, data: Record<string, unknown>): TeamDoc {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Команда',
    code: typeof data.code === 'string' ? data.code : '',
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
  };
}

function docToMember(id: string, data: Record<string, unknown>, currentUid: string | null): TeamMember {
  return {
    id,
    name: typeof data.name === 'string' ? data.name : 'Участник',
    isCurrentUser: data.uid === currentUid,
  };
}

export async function createTeam(creatorUid: string, name: string): Promise<{ teamId: string; code: string }> {
  if (!db) throw new Error('Firestore not configured');
  const code = randomTeamCode();
  const teamRef = await addDoc(collection(db, 'teams'), {
    name,
    code,
    createdBy: creatorUid,
    createdAt: new Date().toISOString(),
  });
  await setDoc(doc(db, 'teams', teamRef.id, 'members', creatorUid), {
    name: 'Вы',
    isCreator: true,
    uid: creatorUid,
    joinedAt: new Date().toISOString(),
  });
  return { teamId: teamRef.id, code };
}

export async function joinTeamByCode(
  joinerUid: string,
  code: string,
  memberName: string,
): Promise<{ ok: true; teamId: string } | { ok: false; error: string }> {
  if (!db) return { ok: false, error: 'Firestore не настроен.' };
  const q = query(collection(db, 'teams'), where('code', '==', code.trim().toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) {
    return { ok: false, error: 'Команда с таким кодом не найдена. Проверьте код и попробуйте снова.' };
  }
  const teamId = snap.docs[0].id;
  await setDoc(doc(db, 'teams', teamId, 'members', joinerUid), {
    name: memberName,
    isCreator: false,
    uid: joinerUid,
    joinedAt: new Date().toISOString(),
  });
  return { ok: true, teamId };
}

export async function leaveTeam(memberUid: string, teamId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'teams', teamId, 'members', memberUid));
  const remainingSnap = await getDocs(collection(db, 'teams', teamId, 'members'));
  if (remainingSnap.empty) {
    await deleteDoc(doc(db, 'teams', teamId));
  }
}

export async function addSyntheticMember(teamId: string, name?: string): Promise<void> {
  if (!db) return;
  const existingSnap = await getDocs(collection(db, 'teams', teamId, 'members'));
  const usedNames = existingSnap.docs.map((d) => d.data().name as string);
  const memberName = name ?? DEMO_MEMBER_NAMES.find((n) => !usedNames.includes(n)) ?? `Гость ${existingSnap.size}`;
  const syntheticId = uid('synthetic');
  await setDoc(doc(db, 'teams', teamId, 'members', syntheticId), {
    name: memberName,
    isCreator: false,
    uid: null,
    joinedAt: new Date().toISOString(),
  });
}

export function subscribeToTeam(teamId: string, cb: (team: TeamDoc | null) => void): () => void {
  if (!db) { cb(null); return () => {}; }
  return onSnapshot(doc(db, 'teams', teamId), (snap) => {
    cb(snap.exists() ? docToTeam(snap.id, snap.data() as Record<string, unknown>) : null);
  });
}

export function subscribeToMembers(
  teamId: string,
  currentUid: string | null,
  cb: (members: TeamMember[]) => void,
): () => void {
  if (!db) { cb([]); return () => {}; }
  return onSnapshot(collection(db, 'teams', teamId, 'members'), (snap) => {
    cb(snap.docs.map((d) => docToMember(d.id, d.data() as Record<string, unknown>, currentUid)));
  });
}
