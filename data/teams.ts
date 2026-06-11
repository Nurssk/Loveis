import { ShoppingTeam, TeamMember } from '@/types';
import { uid } from '@/utils/ids';

/** Pool of mock member names for the "add test member" demo control. */
export const DEMO_MEMBER_NAMES = ['Алия', 'Нуржан', 'Данияр', 'Аружан', 'Ербол', 'Сабина'];

export function makeMember(name: string, isCurrentUser = false): TeamMember {
  return { id: uid('m'), name, isCurrentUser };
}

/** Pre-built teams the user can join with a valid demo code. */
export const DEMO_TEAMS: Record<string, () => ShoppingTeam> = {
  'BUY-2026': () => ({
    id: uid('team'),
    name: 'Семейная закупка',
    code: 'BUY-2026',
    createdAt: new Date().toISOString(),
    members: [
      makeMember('Вы', true),
      makeMember('Айгерим'),
      makeMember('Тимур'),
    ],
  }),
  'SMART-5': () => ({
    id: uid('team'),
    name: 'Техно-команда',
    code: 'SMART-5',
    createdAt: new Date().toISOString(),
    members: [
      makeMember('Вы', true),
      makeMember('Бекзат'),
      makeMember('Дана'),
      makeMember('Мадина'),
    ],
  }),
  'TEAM-KZ': () => ({
    id: uid('team'),
    name: 'Соседи по дому',
    code: 'TEAM-KZ',
    createdAt: new Date().toISOString(),
    members: [
      makeMember('Вы', true),
      makeMember('Аскар'),
      makeMember('Жанна'),
      makeMember('Олжас'),
      makeMember('Камила'),
    ],
  }),
};

export const VALID_DEMO_CODES = Object.keys(DEMO_TEAMS);

export function joinDemoTeam(code: string): ShoppingTeam | null {
  const key = code.trim().toUpperCase();
  const factory = DEMO_TEAMS[key];
  return factory ? factory() : null;
}
