import { createClient } from '@supabase/supabase-js';
import { checkPassword, signToken, verifyToken } from './_auth.js';

function getAdmin(req) {
  const { token, password } = req.body || {};
  if (token && verifyToken(token)) return true;
  if (password && checkPassword(password)) return true;
  return false;
}

function getDb() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Database not configured');
  return createClient(url, key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!getAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { id, prompt, imageBase64, imageType, removeImage } = req.body || {};
    if (!id || !prompt || !prompt.title || !prompt.prompt) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const db = getDb();

    // fetch current row (for old image cleanup)
    const { data: current } = await db
      .from('masterprompts_prompts')
      .select('image_url')
      .eq('id', id)
      .single();

    let image_url = current?.image_url || null;
    if (removeImage && current?.image_url) {
      const m = String(current.image_url).match(/thumbs\/(.+)$/);
      if (m) await db.storage.from('masterprompts-thumbs').remove([`thumbs/${m[1]}`]);
      image_url = null;
    } else if (imageBase64) {
      const buf = Buffer.from(imageBase64, 'base64');
      if (buf.length > 4 * 1024 * 1024) return res.status(400).json({ error: 'Image too large (max 4MB)' });
      const ext = (imageType || 'image/jpeg').includes('png') ? 'png' : 'jpg';
      const path = `thumbs/${id}.${ext}`;
      const { error: upErr } = await db.storage
        .from('masterprompts-thumbs')
        .upload(path, buf, { contentType: imageType || 'image/jpeg', upsert: true });
      if (upErr) throw upErr;
      image_url = db.storage.from('masterprompts-thumbs').getPublicUrl(path).data.publicUrl;
    }

    const { data, error } = await db
      .from('masterprompts_prompts')
      .update({
        title: String(prompt.title).slice(0, 200),
        prompt: String(prompt.prompt),
        category: String(prompt.category || 'Cinematic'),
        model: String(prompt.model || 'Seedance 2.5'),
        duration: String(prompt.duration || '10s'),
        aspect_ratio: String(prompt.aspectRatio || '16:9'),
        tags: Array.isArray(prompt.tags) ? prompt.tags : [],
        type: prompt.type === 'image' ? 'image' : 'video',
        phases: Array.isArray(prompt.phases)
          ? prompt.phases
              .filter((ph) => ph && (ph.title || ph.text))
              .slice(0, 12)
              .map((ph) => ({
                title: String(ph.title || '').slice(0, 120),
                text: String(ph.text || ''),
              }))
          : [],
        image_url,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const r = data;
    return res.status(200).json({
      ok: true,
      token: signToken(),
      item: {
        id: r.id,
        title: r.title,
        prompt: r.prompt,
        category: r.category,
        model: r.model,
        duration: r.duration,
        aspectRatio: r.aspect_ratio,
        tags: r.tags || [],
        type: r.type || 'video',
        phases: Array.isArray(r.phases) ? r.phases : [],
        image: r.image_url || undefined,
        createdAt: r.created_at,
        mine: true,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Update failed' });
  }
}
