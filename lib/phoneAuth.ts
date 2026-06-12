/**
 * Firebase phone (SMS OTP) authentication helper.
 *
 * Web is fully supported: an invisible reCAPTCHA is rendered into a DOM node
 * (id = RECAPTCHA_CONTAINER_ID, mounted by the login screen) and used as the
 * app verifier for `signInWithPhoneNumber`.
 *
 * Native (iOS/Android via Expo Go / JS SDK) is NOT supported here: the Firebase
 * JS SDK needs reCAPTCHA, which requires a DOM. The maintained native path is
 * `@react-native-firebase/auth` with an EAS dev build — until then native falls
 * back to a clear error so it never silently "succeeds".
 */
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { Platform } from 'react-native';

import { auth } from './firebase';

/** DOM id the web invisible-reCAPTCHA attaches to (rendered in login.tsx). */
export const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

let verifier: RecaptchaVerifier | null = null;
let confirmation: ConfirmationResult | null = null;

/** Strip everything except digits and a single leading "+" → strict E.164. */
function toE164(raw: string): string {
  const digits = (raw || '').replace(/[^\d]/g, '');
  return digits ? '+' + digits : '';
}

/** Guarantee the invisible-reCAPTCHA container exists in the DOM (web). */
function ensureRecaptchaContainer(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (!document.getElementById(RECAPTCHA_CONTAINER_ID)) {
    const el = document.createElement('div');
    el.id = RECAPTCHA_CONTAINER_ID;
    el.style.display = 'none';
    document.body.appendChild(el);
  }
}

/**
 * Build a FRESH invisible reCAPTCHA verifier. A verifier that has already been
 * used (or errored) throws `auth/argument-error` if reused, so we clear any old
 * one and recreate it on every attempt.
 */
function getVerifier(): RecaptchaVerifier {
  if (!auth) {
    throw new Error('Firebase не настроен. Проверьте ключи в .env.local.');
  }
  if (Platform.OS !== 'web') {
    throw new Error(
      'Вход по SMS пока работает только в web-сборке. Для iOS/Android нужен dev build с @react-native-firebase.',
    );
  }
  ensureRecaptchaContainer();
  if (verifier) {
    try {
      verifier.clear();
    } catch {
      // ignore — widget may already be detached
    }
    verifier = null;
  }
  verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
    size: 'invisible',
  });
  return verifier;
}

/** Request an SMS code for the given phone (any format → sanitised to E.164). */
export async function sendOtp(phone: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase не настроен. Проверьте ключи в .env.local.');
  }

  const e164 = toE164(phone);
  if (!/^\+\d{10,15}$/.test(e164)) {
    throw new Error(`Некорректный номер телефона: "${phone}" → "${e164}"`);
  }

  const appVerifier = getVerifier();

  // Debug: log the arguments (primitives only — the verifier object has cyclic
  // refs Metro can't serialize) so it's clear which one the SDK rejects on
  // auth/argument-error.
  console.log(
    `[auth] signInWithPhoneNumber → authReady=${!!auth} phone="${e164}" verifierType=${appVerifier?.type}`,
  );

  try {
    confirmation = await signInWithPhoneNumber(auth, e164, appVerifier);
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error('[auth] signInWithPhoneNumber FAILED →', {
      code: e?.code,
      message: e?.message,
      phone: e164,
      verifierType: appVerifier?.type,
    });
    // Reset so the next attempt builds a clean verifier.
    try {
      verifier?.clear();
    } catch {
      // ignore
    }
    verifier = null;
    throw err;
  }
}

/** Confirm the code from the SMS. Returns the authenticated user's uid. */
export async function confirmOtp(code: string): Promise<string> {
  if (!confirmation) {
    throw new Error('Сначала запросите код подтверждения.');
  }
  const credential = await confirmation.confirm(code);
  return credential.user.uid;
}

/** Clear any in-flight confirmation (e.g. when leaving the flow). */
export function resetOtp(): void {
  confirmation = null;
}
