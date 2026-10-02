import { createHmac, timingSafeEqual } from 'crypto';

export function adminToken() {
  const secret = process.env.ADMIN_PASSWORD || '';
  return createHmac('sha256', secret).update('masterprompts-admin').digest('hex');
}

export function checkToken(token) {
  try {
    const a = Buffer.from(String(token || ''), 'hex');
    const b = Buffer.from(adminToken(), 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(String(password || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
