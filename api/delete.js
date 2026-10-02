import { createClient } from '@supabase/supabase-js';
import { checkToken } from './_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { token, id } = req.body || {};
  if (!checkToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!id || !String(id).startsWith('db-')) {
    return res.status(400).json({ error: 'Invalid id' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }
  const db = createClient(url, serviceKey);

  try {
    const { error } = await db.from('masterprompts_prompts').delete().eq('id', id);
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Delete failed' });
  }
}
