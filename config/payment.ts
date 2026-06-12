/**
 * Halyk ePay 2.0 settings.
 *
 * Все creds читаются из .env (префикс EXPO_PUBLIC_*). Переменные с этим
 * префиксом инлайнятся в клиентский бандл — нормально для test-окружения
 * и хакатона, ОПАСНО для прод-ключей.
 */

import type { HalykConfig, HalykUrls } from '@/integrations/halykClient';

const env = (key: string, fallback = ''): string =>
  (process.env[key] as string | undefined) ?? fallback;

export const halykUrls: HalykUrls = {
  oauth: env('EXPO_PUBLIC_HALYK_OAUTH_URL', 'https://test-epay-oauth.epayment.kz/oauth2/token'),
  api: env('EXPO_PUBLIC_HALYK_API_URL', 'https://test-epay-api.epayment.kz'),
};

export const halykConfig: HalykConfig = {
  clientId: env('EXPO_PUBLIC_HALYK_CLIENT_ID'),
  clientSecret: env('EXPO_PUBLIC_HALYK_CLIENT_SECRET'),
  shopId: env('EXPO_PUBLIC_HALYK_SHOP_ID'),
  terminalId: env('EXPO_PUBLIC_HALYK_TERMINAL_ID'),
  p2pTerminalId: env('EXPO_PUBLIC_HALYK_P2P_TERMINAL_ID'),
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
