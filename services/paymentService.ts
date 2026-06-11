/**
 * Payment Service — приём платежей через Halyk ePay.
 *
 * Адаптация серверной логики под клиентский MVP:
 * - initPayment(input) → создаёт invoice_id, дёргает Halyk createInvoice, возвращает invoice_url.
 *   Дальше UI открывает URL в браузере через Linking.openURL.
 * - applyHalykStatus(...) и handlePostLink(...) формально портированы для полноты,
 *   но на проде они должны жить на бэкенде (вебхук Halyk не достучится до телефона).
 */

import { halykConfig, halykConfigured, halykUrls, paymentLinks } from '@/config/payment';
import { HalykClient, HalykError, HalykStatusResponse } from '@/integrations/halykClient';
import { generateInvoiceId } from '@/utils/ids';

export type PaymentStatus = 'pending' | 'charged' | 'failed' | 'cancelled' | 'refunded';

export type PaymentRecord = {
  invoiceId: string;
  amount: number;
  status: PaymentStatus;
  halykTransactionId?: string;
  approvalCode?: string;
  reference?: string;
  cardMask?: string;
  cardType?: string;
  reasonCode?: string;
  reason?: string;
  paidAt?: string;
  refundedAt?: string;
};

export type InitPaymentInput = {
  orderRef: string;
  userId: string;
  title: string;
  amount: number;
  /** Опционально — если задано, Halyk отправит SMS/email со ссылкой. */
  email?: string;
  phone?: string;
};

export type InitPaymentResult = {
  invoiceId: string;
  invoiceUrl: string;
  amount: number;
  expireDate?: string;
};

export type PollResult =
  | { status: 'charged'; transactionId?: string; approvalCode?: string }
  | { status: 'failed'; reason?: string }
  | { status: 'pending' };

export class PaymentError extends Error {
  constructor(message: string, public readonly code: 'config' | 'validation' | 'provider' = 'provider') {
    super(message);
    this.name = 'PaymentError';
  }
}

export class PaymentService {
  constructor(private readonly halyk: HalykClient) {}

  async initPayment(input: InitPaymentInput): Promise<InitPaymentResult> {
    if (!halykConfigured()) {
      throw new PaymentError('Halyk credentials are not configured', 'config');
    }
    if (input.amount <= 0) {
      throw new PaymentError('Invalid amount', 'validation');
    }

    const invoiceId = generateInvoiceId();

    try {
      const invoice = await this.halyk.createInvoice({
        invoiceId,
        amount: Math.round(input.amount),
        description: `BirGe ${input.title.slice(0, 80)}`.replace(/[^\p{L}\p{N}\s.,'"!?#-]/gu, ' '),
        accountId: input.userId,
        email: input.email,
        phone: input.phone,
        postLink: paymentLinks.postLink,
        backLink: paymentLinks.backLink,
        failureBackLink: paymentLinks.failureBackLink,
      });

      return {
        invoiceId,
        invoiceUrl: invoice.invoice_url,
        amount: input.amount,
        expireDate: typeof invoice.expire_date === 'string' ? invoice.expire_date : undefined,
      };
    } catch (err) {
      if (err instanceof HalykError) {
        throw new PaymentError(`Payment provider unavailable: ${err.message}`, 'provider');
      }
      throw new PaymentError('Payment provider unavailable', 'provider');
    }
  }

  /** Проверить статус транзакции у Halyk (для polling-а после возврата из браузера). */
  async getStatus(invoiceId: string): Promise<HalykStatusResponse> {
    return this.halyk.getStatus(invoiceId);
  }

  /**
   * Polls Halyk до финального статуса. Возвращает 'pending' если уложились в
   * лимит попыток и платёж всё ещё не финализирован — UI должен подсказать
   * юзеру свериться позже.
   */
  async pollStatus(
    invoiceId: string,
    opts: { attempts?: number; intervalMs?: number; signal?: AbortSignal } = {},
  ): Promise<PollResult> {
    const attempts = opts.attempts ?? 12;
    const intervalMs = opts.intervalMs ?? 1500;

    for (let i = 0; i < attempts; i++) {
      if (opts.signal?.aborted) return { status: 'pending' };
      try {
        const resp = await this.halyk.getStatus(invoiceId);
        const tx = resp.transaction;
        const name = tx?.statusName;
        if (name === 'CHARGE') {
          return {
            status: 'charged',
            transactionId: tx?.id,
            approvalCode: tx?.approvalCode,
          };
        }
        if (name === 'FAILED' || name === 'REJECT') {
          return { status: 'failed', reason: tx?.reason };
        }
        // 'NEW' / '3D' / прочее → ждём дальше
      } catch {
        // сеть моргнула — продолжаем попытки
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return { status: 'pending' };
  }

  /** Возврат денег. */
  async refundPayment(payment: PaymentRecord, amount?: number): Promise<PaymentRecord> {
    if (payment.status !== 'charged') {
      throw new PaymentError(`Cannot refund payment in status ${payment.status}`, 'validation');
    }
    if (!payment.halykTransactionId) {
      throw new PaymentError('no halykTransactionId stored', 'validation');
    }
    try {
      await this.halyk.refund(payment.halykTransactionId, amount);
    } catch (err) {
      throw new PaymentError('Refund failed', 'provider');
    }
    return { ...payment, status: 'refunded', refundedAt: new Date().toISOString() };
  }

  /**
   * Применить ответ Halyk get-status к Payment. Соответствует серверному
   * `_apply_halyk_status` — используется при возврате юзера из браузера.
   */
  applyHalykStatus(payment: PaymentRecord, response: HalykStatusResponse): PaymentRecord {
    if (response.resultCode !== '100') return payment;
    const tx = response.transaction;
    if (!tx) return payment;

    const next: PaymentRecord = {
      ...payment,
      halykTransactionId: payment.halykTransactionId ?? tx.id,
      approvalCode: payment.approvalCode ?? tx.approvalCode,
      reference: payment.reference ?? tx.reference,
      cardMask: payment.cardMask ?? tx.cardMask,
      cardType: payment.cardType ?? tx.cardType,
      reason: payment.reason ?? tx.reason,
      reasonCode: payment.reasonCode ?? tx.reasonCode,
    };

    switch (tx.statusName) {
      case 'CHARGE':
        return { ...next, status: 'charged', paidAt: new Date().toISOString() };
      case 'FAILED':
      case 'REJECT':
      case '3D':
        return { ...next, status: 'failed', reason: tx.reason };
      case 'REFUND':
        return { ...next, status: 'refunded', refundedAt: new Date().toISOString() };
      default:
        return next;
    }
  }
}

/** Singleton — Halyk-клиент инициализируется один раз. */
export const halykClient = new HalykClient(halykConfig, halykUrls);
export const paymentService = new PaymentService(halykClient);
