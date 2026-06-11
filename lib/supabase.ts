/**
 * Supabase client
 *
 * ─── ЧТО НУЖНО СДЕЛАТЬ ────────────────────────────────────────────────────────
 *
 * TODO 1: Установить пакет
 *   npx expo install @supabase/supabase-js
 *
 * TODO 2: Создать проект на https://supabase.com
 *   → Project Settings → API → скопировать Project URL и anon key
 *
 * TODO 3: Вставить значения в SUPABASE_URL и SUPABASE_ANON_KEY ниже
 *
 * TODO 4: Раскомментировать строки:
 *   - import { createClient } from '@supabase/supabase-js'
 *   - import AsyncStorage from '@react-native-async-storage/async-storage'
 *   - export const supabase = createClient(...)
 *   - удалить заглушку в конце файла
 *
 * TODO 5: Сгенерировать типы БД (опционально, но рекомендуется):
 *   npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
 *   → после этого раскомментировать: import type { Database } from './database.types'
 *   → и добавить дженерик: createClient<Database>(...)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

// TODO 1+4: раскомментировать после установки @supabase/supabase-js
// import { createClient } from '@supabase/supabase-js';

// TODO 4: раскомментировать вместе с клиентом
// import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO 5: раскомментировать после генерации типов (npx supabase gen types ...)
// import type { Database } from './database.types';

// ─── Config ───────────────────────────────────────────────────────────────────

// TODO 3: вставить реальные значения из Project Settings → API
export const SUPABASE_URL = '';       // https://<project-ref>.supabase.co
export const SUPABASE_ANON_KEY = '';  // eyJ...

// ─── Client ───────────────────────────────────────────────────────────────────

// TODO 4: раскомментировать блок ниже и удалить заглушку export const supabase = ...
//
// export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
//   auth: {
//     storage: AsyncStorage,       // сессия сохраняется в AsyncStorage на устройстве
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: false,   // обязательно для React Native
//   },
// });

// TODO 4: удалить эту заглушку когда раскомментируете createClient выше
export const supabase = null as unknown as never;
