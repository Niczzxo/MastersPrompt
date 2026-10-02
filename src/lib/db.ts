import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { PromptItem } from '../data/prompts';

export interface DbConfig {
  url: string;
  anonKey: string;
}

const LS_KEY = 'masterprompts-db-config';

declare global {
  interface ImportMeta {
    env?: Record<string, string | undefined>;
  }
}

/** DB config: browser settings win, Vercel env vars are the fallback. */
export function getDbConfig(): DbConfig | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const c = JSON.parse(raw);
      if (c.url && c.anonKey) return { url: c.url, anonKey: c.anonKey };
    }
  } catch {
    /* ignore */
  }
  const env = (import.meta as any).env || {};
  if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
    return { url: env.VITE_SUPABASE_URL, anonKey: env.VITE_SUPABASE_ANON_KEY };
  }
  return null;
}

export function saveDbConfig(c: DbConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(c));
}

export function clearDbConfig() {
  localStorage.removeItem(LS_KEY);
}

let client: SupabaseClient | null = null;
let clientKey = '';

export function getDb(): SupabaseClient | null {
  const cfg = getDbConfig();
  if (!cfg) return null;
  const k = `${cfg.url}|${cfg.anonKey}`;
  if (!client || clientKey !== k) {
    client = createClient(cfg.url, cfg.anonKey);
    clientKey = k;
  }
  return client;
}

function rowToItem(r: any): PromptItem {
  return {
    id: r.id,
    title: r.title,
    prompt: r.prompt,
    category: r.category,
    model: r.model,
    duration: r.duration,
    aspectRatio: r.aspect_ratio,
    tags: r.tags || [],
    image: r.image_url || undefined,
    createdAt: r.created_at,
    mine: true,
  };
}

export async function fetchDbPrompts(): Promise<PromptItem[]> {
  const db = getDb();
  if (!db) return [];
  const { data, error } = await db
    .from('masterprompts_prompts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToItem);
}

export async function insertDbPrompt(p: {
  title: string;
  prompt: string;
  category: string;
  model: string;
  duration: string;
  aspectRatio: string;
  tags: string[];
  image?: string;
}): Promise<PromptItem> {
  const db = getDb();
  if (!db) throw new Error('Database not connected');
  const id = `db-${Date.now()}`;
  const { data, error } = await db
    .from('masterprompts_prompts')
    .insert({
      id,
      title: p.title,
      prompt: p.prompt,
      category: p.category,
      model: p.model,
      duration: p.duration,
      aspect_ratio: p.aspectRatio,
      tags: p.tags,
      image_url: p.image || null,
      copies: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToItem(data);
}

export async function deleteDbPrompt(id: string) {
  const db = getDb();
  if (!db) throw new Error('Database not connected');
  const { error } = await db.from('masterprompts_prompts').delete().eq('id', id);
  if (error) throw error;
}

export async function incrementDbCopies(id: string): Promise<number> {
  const db = getDb();
  if (!db) throw new Error('Database not connected');
  const { data } = await db.from('masterprompts_prompts').select('copies').eq('id', id).single();
  const next = ((data as any)?.copies || 0) + 1;
  await db.from('masterprompts_prompts').update({ copies: next }).eq('id', id);
  return next;
}

export async function uploadThumb(file: File): Promise<string> {
  const db = getDb();
  if (!db) throw new Error('Database not connected');
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await db.storage.from('masterprompts-thumbs').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = db.storage.from('masterprompts-thumbs').getPublicUrl(path);
  return data.publicUrl;
}

export async function testDb(): Promise<string> {
  const db = getDb();
  if (!db) return 'Not configured — add your Supabase URL and anon key.';
  try {
    const { error } = await db.from('masterprompts_prompts').select('id', { count: 'exact', head: true });
    if (error) return 'Error: ' + error.message;
    return 'Connected ✓';
  } catch (e: any) {
    return 'Error: ' + (e.message || 'unknown');
  }
}
