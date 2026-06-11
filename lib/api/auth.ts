/**
 * Auth API
 *
 * ─── ЧТО НУЖНО СДЕЛАТЬ (для команда-страницы) ────────────────────────────────
 *
 * TODO 1: Установить Supabase и заполнить lib/supabase.ts
 *   → раскомментировать: import { supabase } from '@/lib/supabase'
 *
 * TODO 2: Включить Phone Auth в Supabase Dashboard
 *   Authentication → Providers → Phone → Enable
 *   Выбрать SMS провайдер (Twilio / Vonage / MessageBird)
 *
 * TODO 3: Реализовать sendOtp и verifyOtp
 *   Нужны чтобы у каждого участника был реальный userId —
 *   без него joinTeam / createTeam не знают кто пользователь.
 *
 * TODO 4: Реализовать getCurrentUser
 *   Вызывать при старте app/(tabs)/team.tsx чтобы получить userId
 *   для createTeam / joinTeam / leaveTeam.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// TODO 1: раскомментировать после подключения Supabase
// import { supabase } from '@/lib/supabase';

import type { DbUser } from '@/types/api';

/**
 * Отправить OTP на номер телефона.
 *
 * TODO 3: реализовать
 * const { error } = await supabase.auth.signInWithOtp({ phone });
 * if (error) throw error;
 */
export async function sendOtp(_phone: string): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * Проверить OTP-код от пользователя.
 *
 * TODO 3: реализовать
 * const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
 * if (error) throw error;
 */
export async function verifyOtp(_phone: string, _token: string): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * Выйти из аккаунта.
 *
 * const { error } = await supabase.auth.signOut();
 * if (error) throw error;
 */
export async function signOut(): Promise<void> {
  throw new Error('Not implemented');
}

/**
 * Получить текущего авторизованного пользователя.
 * Нужен в team.tsx чтобы знать userId при createTeam / joinTeam / leaveTeam.
 *
 * TODO 4: реализовать
 * const { data: { user } } = await supabase.auth.getUser();
 * if (!user) return null;
 * const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
 * return data;
 */
export async function getCurrentUser(): Promise<DbUser | null> {
  throw new Error('Not implemented');
}

/**
 * Создать или обновить профиль после верификации.
 *
 * const { data, error } = await supabase
 *   .from('users')
 *   .upsert({ id: userId, ...patch })
 *   .select().single();
 * if (error) throw error;
 * return data;
 */
export async function upsertProfile(
  _userId: string,
  _patch: Partial<Pick<DbUser, 'name' | 'city'>>,
): Promise<DbUser> {
  throw new Error('Not implemented');
}
