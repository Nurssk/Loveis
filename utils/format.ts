/** Formatting helpers (currency, phone). Structured for future localization. */

/** Formats a number as Kazakhstani tenge, e.g. 249990 -> "249 990 ₸". */
export function formatPrice(value: number): string {
  const rounded = Math.round(value);
  const grouped = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${grouped} ₸`;
}

/** Masks a phone for display: +7 707 123 45 67 -> +7 707 ••• 45 67 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 11) return phone;
  // 7 XXX XXX XX XX
  const a = digits.slice(1, 4);
  const last = digits.slice(9, 11);
  return `+7 ${a} ••• ${digits.slice(7, 9)} ${last}`;
}

/** Pretty-prints the KZ phone for input display: +7 (707) 123 45 67 */
export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^8/, '7').replace(/^7?/, '7');
  const d = digits.slice(0, 11);
  const rest = d.slice(1);
  let out = '+7';
  if (rest.length > 0) out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) out += ') ';
  if (rest.length >= 3) out += rest.slice(3, 6);
  if (rest.length >= 6) out += ` ${rest.slice(6, 8)}`;
  if (rest.length >= 8) out += ` ${rest.slice(8, 10)}`;
  return out;
}

/** Returns true if the string contains a complete KZ mobile number. */
export function isValidKzPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'));
}

/** Normalizes any KZ input to +7XXXXXXXXXX. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  return '+' + digits.slice(0, 11);
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** e.g. memberWord(3) -> "участника" */
export function memberWord(n: number): string {
  return pluralRu(n, 'участник', 'участника', 'участников');
}

export function itemWord(n: number): string {
  return pluralRu(n, 'товар', 'товара', 'товаров');
}
