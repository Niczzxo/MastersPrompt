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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { password } = req.body || {};
  if (!checkPassword(password)) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  return res.status(200).json({ token: adminToken() });
}
