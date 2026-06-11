/**
 * Halyk ePay 2.0 — Invoice Link API (TypeScript port).
 *
 * Docs: https://epayment.kz/docs/invoice-link-API
 */

export type HalykConfig = {
  clientId: string;
  clientSecret: string;
  /** Для создания invoice. */
  shopId: string;
  /** Для refund / status. */
  terminalId: string;
  p2pTerminalId?: string;
};

export type HalykUrls = {
  oauth: string;
  api: string;
};

export type CreateInvoiceParams = {
  invoiceId: string;
  amount: number;
  description: string;
  accountId: string;
  /** Опционально — если задан, Halyk шлёт ссылку на оплату email-ом. */
  email?: string;
  /** Опционально — если задан, Halyk шлёт SMS со ссылкой. На fake-номерах шлюз даёт 1079. */
  phone?: string;
  postLink: string;
  backLink: string;
  failureBackLink?: string;
  expirePeriod?: string;
  language?: string;
};

export type CreateInvoiceResponse = {
  invoice_url: string;
  invoice_id?: string;
  expire_date?: string;
  [key: string]: unknown;
};

export type HalykStatusResponse = {
  resultCode?: string;
  transaction?: {
    id?: string;
    statusName?: string;
    approvalCode?: string;
    reference?: string;
    cardMask?: string;
    cardType?: string;
    reason?: string;
    reasonCode?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export class HalykError extends Error {
  constructor(message: string, public readonly status?: number, public readonly body?: string) {
    super(message);
    this.name = 'HalykError';
  }
}

function redact(s: string, keep = 4): string {
  if (!s) return '';
  if (s.length <= keep) return '***';
  return s.slice(0, keep) + '***' + s.slice(-2);
}

function logRequest(label: string, url: string, body: unknown) {
  console.log(`[halyk→] ${label} ${url}`);
  console.log('[halyk→] body:', body);
}

function logResponse(label: string, status: number, body: unknown) {
  console.log(`[halyk←] ${label} status=${status}`);
  console.log('[halyk←] body:', body);
}

export class HalykClient {
  /** Scope для invoice link API — короче чем у платёжной страницы. */
  private static readonly INVOICE_SCOPE = 'payment';
  /** Scope для refund / status (старый API). */
  private static readonly OPS_SCOPE =
    'webapi usermanagement email_send verification statement statistics payment';

  private opsToken: string | null = null;
  private opsTokenExpiresAt = 0;

  constructor(private readonly config: HalykConfig, private readonly urls: HalykUrls) {
    console.log('[halyk] init', {
      shopId: config.shopId,
      terminalId: config.terminalId,
      clientId: config.clientId,
      clientSecret: redact(config.clientSecret),
      oauth: this.urls.oauth,
      api: this.urls.api,
    });
  }

  // =======================================================================
  // CREATE INVOICE — генерирует ссылку для оплаты
  // =======================================================================

  async createInvoice(params: CreateInvoiceParams): Promise<CreateInvoiceResponse> {
    const token = await this.getInvoiceToken();

    const payload: Record<string, unknown> = {
      shop_id: this.config.shopId,
      account_id: params.accountId,
      invoice_id: params.invoiceId,
      amount: params.amount,
      currency: 'KZT',
      language: params.language ?? 'rus',
      description: params.description.slice(0, 125),
      expire_period: params.expirePeriod ?? '1d',
      post_link: params.postLink,
      back_link: params.backLink,
      failure_back_link: params.failureBackLink ?? params.backLink,
    };
    // Контакты опциональны: Halyk использует их для отправки ссылки на оплату.
    // Если передать кривой номер/email — invoice не создастся (code:1079 для SMS).
    if (params.email) payload.recipient_contact = params.email;
    if (params.phone) payload.recipient_contact_sms = params.phone;

    const url = `${this.urls.api}/invoice`;
    logRequest('POST /invoice', url, payload);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    logResponse('POST /invoice', res.status, parsed);

    if (!res.ok) {
      throw new HalykError(`createInvoice failed: ${res.status} ${text}`, res.status, text);
    }
    return parsed as CreateInvoiceResponse;
  }

  /** Token для создания invoice. Не кэшируем — короткий запрос. */
  private async getInvoiceToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: HalykClient.INVOICE_SCOPE,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    logRequest('POST /oauth2/token (invoice)', this.urls.oauth, {
      grant_type: 'client_credentials',
      scope: HalykClient.INVOICE_SCOPE,
      client_id: this.config.clientId,
      client_secret: redact(this.config.clientSecret),
    });

    const res = await fetch(this.urls.oauth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const text = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    const redacted =
      parsed && typeof parsed === 'object' && 'access_token' in parsed
        ? { ...(parsed as Record<string, unknown>), access_token: redact(String((parsed as Record<string, unknown>).access_token)) }
        : parsed;
    logResponse('POST /oauth2/token (invoice)', res.status, redacted);

    if (!res.ok) {
      throw new HalykError(`oauth(invoice) failed: ${res.status} ${text}`, res.status, text);
    }
    return (parsed as { access_token: string }).access_token;
  }

  // =======================================================================
  // GET STATUS — проверка статуса транзакции
  // =======================================================================

  async getStatus(invoiceId: string): Promise<HalykStatusResponse> {
    const token = await this.getOpsToken();
    const url = `${this.urls.api}/check-status/payment/transaction/${invoiceId}`;
    logRequest('GET /check-status', url, null);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const text = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    logResponse('GET /check-status', res.status, parsed);

    if (!res.ok) {
      throw new HalykError(`getStatus failed: ${res.status}`, res.status, text);
    }
    return parsed as HalykStatusResponse;
  }

  // =======================================================================
  // REFUND — возврат денег
  // =======================================================================

  /**
   * amount === undefined → полный возврат.
   * amount === X         → частичный (минимум 10 KZT).
   */
  async refund(transactionId: string, amount?: number): Promise<boolean> {
    const token = await this.getOpsToken();
    const url = new URL(`${this.urls.api}/operation/${transactionId}/refund`);
    if (amount !== undefined) url.searchParams.set('amount', String(amount));

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HalykError(`refund failed: ${res.status}`, res.status, text);
    }
    return true;
  }

  // =======================================================================
  // OPS TOKEN — для refund / status (внутренний, кэшируется)
  // =======================================================================

  private async getOpsToken(): Promise<string> {
    const now = Date.now() / 1000;
    if (this.opsToken && now < this.opsTokenExpiresAt) return this.opsToken;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: HalykClient.OPS_SCOPE,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      terminal: this.config.terminalId,
    });

    const res = await fetch(this.urls.oauth, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new HalykError(`oauth(ops) failed: ${res.status} ${text}`, res.status, text);
    }
    const payload = (await res.json()) as { access_token: string; expires_in?: number };

    this.opsToken = payload.access_token;
    const expiresIn = typeof payload.expires_in === 'number' ? payload.expires_in : 7200;
    this.opsTokenExpiresAt = now + Math.max(expiresIn - 300, 60);
    return this.opsToken;
  }
}
