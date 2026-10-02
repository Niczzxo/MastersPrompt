import { createClient } from '@supabase/supabase-js';
import { checkToken } from './_auth.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { token, prompt, imageBase64, imageType } = req.body || {};
  if (!checkToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!prompt || !prompt.title || !prompt.prompt) {
    return res.status(400).json({ error: 'Title and prompt are required' });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }
  const db = createClient(url, serviceKey);

  try {
    let image_url = null;
    if (imageBase64) {
      const base64 = String(imageBase64).includes(',')
        ? String(imageBase64).split(',')[1]
        : String(imageBase64);
      const buf = Buffer.from(base64, 'base64');
      if (buf.length > 8 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image must be under 8MB' });
      }
      const ext = (imageType || 'image/jpeg').includes('png') ? 'png' : 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await db.storage
        .from('masterprompts-thumbs')
        .upload(path, buf, { contentType: imageType || 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      image_url = db.storage.from('masterprompts-thumbs').getPublicUrl(path).data.publicUrl;
    }

    const id = `db-${Date.now()}`;
    const { data, error } = await db
      .from('masterprompts_prompts')
      .insert({
        id,
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
        copies: 0,
      })
      .select()
      .single();
    if (error) throw error;
    const r = data;
    return res.status(200).json({
      ok: true,
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
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
}
