/**
 * Halyk ePay 2.0 settings.
 *
 * Все creds читаются из .env (префикс EXPO_PUBLIC_*). Переменные с этим
 * префиксом инлайнятся в клиентский бандл — нормально для test-окружения
 * и хакатона, ОПАСНО для прод-ключей.
 *
 * Ниже заданы ТЕСТОВЫЕ creds (test-epay.epayment.kz) как fallback — чтобы
 * деплой на Vercel открывал реальную страницу Halyk даже без выставленных
 * env-переменных. Если env-переменные заданы, они имеют приоритет (env > fallback).
 * Это test-окружение: реальные деньги не двигаются. Для ПРОДА выкинуть fallback
 * и держать secret на сервере (serverless function), а не в EXPO_PUBLIC_*.
 */

import type { HalykConfig, HalykUrls } from '@/integrations/halykClient';

const env = (key: string, fallback = ''): string => {
  const v = process.env[key] as string | undefined;
  return v && v.length > 0 ? v : fallback;
};

/** Halyk TEST-окружение — безопасно коммитить, реальных платежей нет. */
const TEST_DEFAULTS = {
  clientId: 'test',
  clientSecret: 'yF587AV9Ms94qN2QShFzVR3vFnWkhjbAK3sG',
  shopId: '04f25a4b-d2bd-4dd8-b3a7-9390be4774c4',
  terminalId: '67e34d63-102f-4bd1-898e-370781d0074d',
  p2pTerminalId: '40a348cb-68a3-45d5-9002-a4836d79c3b5',
} as const;

export const halykUrls: HalykUrls = {
  oauth: env('EXPO_PUBLIC_HALYK_OAUTH_URL', 'https://test-epay-oauth.epayment.kz/oauth2/token'),
  api: env('EXPO_PUBLIC_HALYK_API_URL', 'https://test-epay-api.epayment.kz'),
};

export const halykConfig: HalykConfig = {
  clientId: env('EXPO_PUBLIC_HALYK_CLIENT_ID', TEST_DEFAULTS.clientId),
  clientSecret: env('EXPO_PUBLIC_HALYK_CLIENT_SECRET', TEST_DEFAULTS.clientSecret),
  shopId: env('EXPO_PUBLIC_HALYK_SHOP_ID', TEST_DEFAULTS.shopId),
  terminalId: env('EXPO_PUBLIC_HALYK_TERMINAL_ID', TEST_DEFAULTS.terminalId),
  p2pTerminalId: env('EXPO_PUBLIC_HALYK_P2P_TERMINAL_ID', TEST_DEFAULTS.p2pTerminalId),
};

export const paymentLinks = {
  postLink: env(
    'EXPO_PUBLIC_HALYK_POSTLINK_URL',
    'https://example.com/payments/webhooks/halyk',
  ),
  backLink: env('EXPO_PUBLIC_HALYK_BACK_LINK', 'birge://checkout/return'),
  failureBackLink: env(
    'EXPO_PUBLIC_HALYK_FAILURE_BACK_LINK',
    'birge://checkout/return?status=failed',
  ),
};

export const commissionPercent = 0;

export const halykConfigured = (): boolean =>
  Boolean(halykConfig.clientId && halykConfig.clientSecret && halykConfig.shopId);
