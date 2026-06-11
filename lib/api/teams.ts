/**
 * Teams API
 *
 * ─── ЧТО НУЖНО СДЕЛАТЬ (для команда-страницы) ────────────────────────────────
 *
 * TODO 1: Подключить Supabase клиент
 *   → раскомментировать: import { supabase } from '@/lib/supabase'
 *
 * TODO 2: Реализовать createTeam — вызывается кнопкой "Создать команду" в team.tsx
 *   INSERT teams + team_members, вернуть созданную команду и участника.
 *
 * TODO 3: Реализовать joinTeam — вызывается кнопкой "Присоединиться" в team.tsx
 *   SELECT team по коду → INSERT team_members → вернуть команду + всех участников.
 *
 * TODO 4: Реализовать leaveTeam — вызывается иконкой выхода в team.tsx
 *   DELETE team_members. Если последний — DELETE teams тоже.
 *
 * TODO 5: Реализовать subscribeToTeamMembers и подключить в team.tsx
 *   Включить Realtime для team_members в Supabase Dashboard:
 *   Database → Replication → supabase_realtime → добавить team_members
 *   Подключить в team.tsx:
 *   useEffect(() => {
 *     if (!team) return;
 *     const unsub = subscribeToTeamMembers(team.id, onJoined, onLeft);
 *     return unsub;
 *   }, [team?.id]);
 *   Тогда milestone ladder и discount % обновятся у всех участников мгновенно.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// TODO 1: раскомментировать после подключения Supabase
// import { supabase } from '@/lib/supabase';

import type {
  CreateTeamParams,
  CreateTeamResult,
  DbTeam,
  DbTeamMember,
  JoinTeamParams,
  JoinTeamResult,
  LeaveTeamParams,
} from '@/types/api';

/**
 * Создать новую команду и добавить текущего пользователя первым участником.
 *
 * TODO 2: реализовать
 * const code = randomTeamCode();
 * const { data: team } = await supabase
 *   .from('teams')
 *   .insert({ code, name: params.name, created_by: userId, expires_at: ... })
 *   .select().single();
 * const { data: member } = await supabase
 *   .from('team_members')
 *   .insert({ team_id: team.id, user_id: userId, name: 'Вы', is_current_user: true })
 *   .select().single();
 * return { team, member };
 */
export async function createTeam(_params: CreateTeamParams): Promise<CreateTeamResult> {
  throw new Error('Not implemented');
}

/**
 * Найти команду по коду и присоединиться к ней.
 *
 * TODO 3: реализовать
 * const { data: team } = await supabase
 *   .from('teams').select('*').eq('code', params.code).gt('expires_at', new Date()).single();
 * if (!team) return { ok: false, error: 'Команда не найдена или истекла' };
 * await supabase.from('team_members')
 *   .insert({ team_id: team.id, user_id: userId, name: userName });
 * const { data: members } = await supabase
 *   .from('team_members').select('*').eq('team_id', team.id);
 * return { ok: true, team, members };
 */
export async function joinTeam(_params: JoinTeamParams): Promise<JoinTeamResult> {
  throw new Error('Not implemented');
}

/**
 * Удалить текущего пользователя из команды.
 * Если последний — удалить команду целиком.
 *
 * TODO 4: реализовать
 * await supabase.from('team_members')
 *   .delete().eq('team_id', params.teamId).eq('user_id', params.userId);
 * const { count } = await supabase
 *   .from('team_members').select('*', { count: 'exact' }).eq('team_id', params.teamId);
 * if (count === 0) {
 *   await supabase.from('teams').delete().eq('id', params.teamId);
 * }
 */
export async function leaveTeam(_params: LeaveTeamParams): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * Получить команду и всех её участников по коду приглашения.
 * Возвращает null если не найдена или истекла.
 *
 * const { data } = await supabase
 *   .from('teams').select('*, team_members(*)')
 *   .eq('code', code).gt('expires_at', new Date()).single();
 * return data ?? null;
 */
export async function getTeamByCode(_code: string): Promise<DbTeam | null> {
  throw new Error('Not implemented');
}

/**
 * Подписаться на изменения состава команды в реальном времени.
 * Вызывает onMemberJoined при INSERT в team_members.
 * Вызывает onMemberLeft при DELETE из team_members.
 * Возвращает функцию отписки — вызвать в useEffect cleanup.
 *
 * TODO 5: реализовать
 * const channel = supabase
 *   .channel(`team:${teamId}`)
 *   .on('postgres_changes',
 *     { event: 'INSERT', schema: 'public', table: 'team_members', filter: `team_id=eq.${teamId}` },
 *     (payload) => onMemberJoined(payload.new as DbTeamMember)
 *   )
 *   .on('postgres_changes',
 *     { event: 'DELETE', schema: 'public', table: 'team_members', filter: `team_id=eq.${teamId}` },
 *     (payload) => onMemberLeft(payload.old.id)
 *   )
 *   .subscribe();
 * return () => supabase.removeChannel(channel);
 */
export function subscribeToTeamMembers(
  _teamId: string,
  _onMemberJoined: (member: DbTeamMember) => void,
  _onMemberLeft: (memberId: string) => void,
): () => void {
  return () => {};
}
