/** Small id / code generators for the demo. */

export function randomTeamCode(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `BUY-${n}`;
}

export function randomDeviceId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `DEVICE-KZ-${n}`;
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function orderNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `KZ-${n}`;
}
