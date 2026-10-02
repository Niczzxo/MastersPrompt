import { useEffect, useMemo, useState } from 'react';
import {
  Search, Plus, Copy, Check, X, Clapperboard, Clock, Layers,
  Trash2, Upload, Image as ImageIcon, Sparkles, ChevronDown,
  Settings as SettingsIcon, Database, KeyRound,
} from 'lucide-react';
import {
  CATEGORIES, MODELS, CATEGORY_STYLES, type PromptItem,
} from './data/prompts';
import {
  getAllPrompts, addUserPrompt, deleteUserPrompt, bumpCopies,
} from './lib/store';
import {
  getDbConfig, saveDbConfig, getDb, fetchDbPrompts, insertDbPrompt,
  deleteDbPrompt, incrementDbCopies, uploadThumb, testDb,
} from './lib/db';

type View = 'gallery' | 'upload';
type SortKey = 'newest' | 'oldest' | 'title';

const inputCls =
  'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-400/70 placeholder:text-zinc-600';
const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1';

function Thumb({ item, big }: { item: PromptItem; big?: boolean }) {
  const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.Cinematic;
  if (item.image) {
    return (
      <img src={item.image} alt={item.title}
        className={`w-full object-cover ${big ? 'aspect-video' : 'aspect-video'} bg-black`} />
    );
  }
  return (
    <div className={`w-full aspect-video bg-gradient-to-br ${style.gradient} flex flex-col items-center justify-center gap-2 relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 0%, transparent 40%), radial-gradient(circle at 70% 80%, black 0%, transparent 50%)' }} />
      <span className="text-5xl relative">{style.icon}</span>
      <span className="relative text-[10px] font-black uppercase tracking-[0.3em] text-white/70">{item.category}</span>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState<PromptItem[]>(getAllPrompts);
  const [copiesMap, setCopiesMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    getAllPrompts().forEach((p) => { m[p.id] = (p as any).copies || 0; });
    return m;
  });
  const [view, setView] = useState<View>('gallery');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [model, setModel] = useState<string>('All');
  const [sort, setSort] = useState<SortKey>('newest');
  const [mineOnly, setMineOnly] = useState(false);
  const [selected, setSelected] = useState<PromptItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dbOn, setDbOn] = useState(() => !!getDbConfig());
  const [dbNotice, setDbNotice] = useState('');

  // Load database prompts when configured
  useEffect(() => {
    if (!getDbConfig()) return;
    fetchDbPrompts()
      .then((dbPrompts) => {
        if (!dbPrompts.length) return;
        setItems((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          dbPrompts.forEach((p) => { if (!ids.has(p.id)) merged.push(p); });
          merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          return merged;
        });
        setDbOn(true);
      })
      .catch((e) => {
        setDbNotice('Database error: ' + (e.message || 'could not load'));
      });
  }, []);

  const refresh = () => {
    const all = getAllPrompts();
    setItems(all);
    const m: Record<string, number> = {};
    all.forEach((p) => { m[p.id] = (p as any).copies || 0; });
    setCopiesMap(m);
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (mineOnly) list = list.filter((p) => p.mine);
    if (category !== 'All') list = list.filter((p) => p.category === category);
    if (model !== 'All') list = list.filter((p) => p.model === model);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.prompt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === 'newest') list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'oldest') list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    if (sort === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [items, query, category, model, sort, mineOnly]);

  const copyPrompt = async (p: PromptItem) => {
    try {
      await navigator.clipboard.writeText(p.prompt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = p.prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiesMap(bumpCopies(p.id));
    if (p.id.startsWith('db-') && getDb()) {
      incrementDbCopies(p.id)
        .then((n) => setCopiesMap((m) => ({ ...m, [p.id]: n })))
        .catch(() => undefined);
    }
    setCopiedId(p.id);
    setTimeout(() => setCopiedId((c) => (c === p.id ? null : c)), 1600);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    try {
      if (id.startsWith('db-') && getDb()) {
        await deleteDbPrompt(id);
      } else {
        deleteUserPrompt(id);
      }
    } catch (e: any) {
      alert('Delete failed: ' + (e.message || 'unknown error'));
      return;
    }
    setSelected(null);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0b0b0f]/90 backdrop-blur border-b border-white/10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-4 flex items-center gap-3">
          <button onClick={() => { setView('gallery'); setSelected(null); }} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-600 flex items-center justify-center">
              <Clapperboard className="text-white" size={20} />
            </div>
            <div className="text-left">
              <h1 className="font-black text-lg tracking-tight text-white leading-none">PromptReel</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Video prompts library</p>
            </div>
          </button>
          <div className="flex-1" />
          <div className="hidden md:flex relative w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts…"
              className="w-full bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-400/70 placeholder:text-zinc-600" />
          </div>
          <button onClick={() => setMineOnly((v) => !v)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-colors ${mineOnly ? 'border-violet-400/60 bg-violet-400/10 text-violet-200' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'}`}>
            My Prompts
          </button>
          <span title={dbOn ? 'Database connected' : 'Local storage mode — connect DB in Settings'}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold border ${dbOn ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-zinc-500 bg-white/5'}`}>
            <Database size={11} /> {dbOn ? 'DB' : 'Local'}
          </span>
          <button onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors" title="Settings">
            <SettingsIcon size={16} />
          </button>
          <button onClick={() => setView('upload')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all">
            <Plus size={15} /> Upload
          </button>
        </div>
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts…"
              className="w-full bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-violet-400/70 placeholder:text-zinc-600" />
          </div>
        </div>
      </header>

      {view === 'gallery' ? (
        <main className="max-w-[1400px] mx-auto px-4 md:px-8 pb-16">
          {/* Hero */}
          <section className="py-10 md:py-14 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-400/10 border border-violet-400/30 text-violet-300 text-[11px] font-bold uppercase tracking-widest mb-5">
              <Sparkles size={12} /> {items.length} prompts · {CATEGORIES.length} categories
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
              AI video prompts, ready to <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">steal & create</span>
            </h2>
            <p className="text-zinc-500 text-sm md:text-base mt-4 max-w-xl mx-auto">
              Browse the collection, copy any prompt with one tap, or upload your own to build your personal vault.
            </p>
          </section>

          {/* Filters */}
          <section className="flex flex-wrap items-center gap-2 mb-8">
            {['All', ...CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${category === c ? 'border-violet-400/60 bg-violet-400/15 text-violet-200' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white'}`}>
                {c}
              </button>
            ))}
            <div className="flex-1" />
            <div className="relative">
              <select value={model} onChange={(e) => setModel(e.target.value)}
                className="appearance-none bg-black/40 border border-white/10 rounded-full pl-4 pr-9 py-2 text-xs font-bold text-zinc-300 outline-none focus:border-violet-400/70">
                <option value="All" className="bg-zinc-900">All models</option>
                {MODELS.map((m) => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
                className="appearance-none bg-black/40 border border-white/10 rounded-full pl-4 pr-9 py-2 text-xs font-bold text-zinc-300 outline-none focus:border-violet-400/70">
                <option value="newest" className="bg-zinc-900">Newest</option>
                <option value="oldest" className="bg-zinc-900">Oldest</option>
                <option value="title" className="bg-zinc-900">Title A–Z</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </section>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-600">
              <Clapperboard size={40} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No prompts found. Try another search — or upload your own!</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 [column-fill:balance]">
              {filtered.map((p) => (
                <article key={p.id}
                  className="break-inside-avoid mb-5 bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden hover:border-violet-400/40 hover:-translate-y-0.5 transition-all cursor-pointer group"
                  onClick={() => setSelected(p)}>
                  <div className="relative">
                    <Thumb item={p} />
                    {p.mine && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[10px] font-black uppercase tracking-widest text-violet-300 border border-violet-400/40">Mine</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); copyPrompt(p); }}
                      className="absolute top-3 right-3 p-2.5 rounded-xl bg-black/60 backdrop-blur border border-white/15 text-white opacity-0 group-hover:opacity-100 hover:bg-violet-500/80 transition-all"
                      title="Copy prompt">
                      {copiedId === p.id ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    </button>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white leading-snug mb-3">{p.title}</h3>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="px-2.5 py-1 rounded-full bg-violet-400/10 border border-violet-400/30 text-violet-300 font-bold">{p.model}</span>
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">{p.category}</span>
                      <span className="ml-auto text-zinc-600 flex items-center gap-1">
                        <Copy size={11} /> {copiesMap[p.id] || 0}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      ) : (
        <UploadView
          onBack={() => setView('gallery')}
          onSaved={() => { setView('gallery'); setMineOnly(true); refresh(); }}
        />
      )}

      {/* Detail modal */}
      {selected && (
        <DetailModal
          item={selected}
          copies={copiesMap[selected.id] || 0}
          copied={copiedId === selected.id}
          onCopy={() => copyPrompt(selected)}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
        />
      )}

      {/* Settings modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSaved={() => {
            setShowSettings(false);
            const on = !!getDbConfig();
            setDbOn(on);
            setDbNotice('');
            if (on) {
              fetchDbPrompts()
                .then((dbPrompts) => {
                  setItems((prev) => {
                    const ids = new Set(prev.map((p) => p.id));
                    const merged = [...prev];
                    dbPrompts.forEach((p) => { if (!ids.has(p.id)) merged.push(p); });
                    merged.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                    return merged;
                  });
                })
                .catch((e) => setDbNotice('Database error: ' + (e.message || 'could not load')));
            } else {
              refresh();
            }
          }}
        />
      )}

      {dbNotice && (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 mb-4">{dbNotice}</p>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-center">
        <p className="font-black text-white">PromptReel</p>
        <p className="text-xs text-zinc-600 mt-2">Your personal AI video prompts vault · All seed prompts are original</p>
      </footer>
    </div>
  );
}

function SettingsModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const existing = getDbConfig();
  const [url, setUrl] = useState(existing?.url || '');
  const [anonKey, setAnonKey] = useState(existing?.anonKey || '');
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(false);

  const test = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatus('Enter both URL and anon key first.');
      return;
    }
    setTesting(true);
    saveDbConfig({ url: url.trim(), anonKey: anonKey.trim() });
    setStatus(await testDb());
    setTesting(false);
  };

  const save = () => {
    if (url.trim() && anonKey.trim()) {
      saveDbConfig({ url: url.trim(), anonKey: anonKey.trim() });
    }
    onSaved();
  };

  const disconnect = () => {
    localStorage.removeItem('promptreel-db-config');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-8 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg text-white uppercase tracking-tight flex items-center gap-2">
            <Database size={18} className="text-violet-300" /> Database
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl"><X size={18} /></button>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          Connect your Supabase project to store prompts in a real database (works across devices).
          Without this, uploads are kept in this browser only. Find these in your Supabase dashboard →
          Project Settings → API.
        </p>

        <div className="space-y-1.5">
          <label className={labelCls}>Supabase URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xyz.supabase.co"
            className={`${inputCls} font-mono`} />
        </div>

        <div className="space-y-1.5">
          <label className={`${labelCls} flex items-center gap-1.5`}><KeyRound size={11} /> Anon public key</label>
          <input type="password" value={anonKey} onChange={(e) => setAnonKey(e.target.value)}
            placeholder="eyJhbGciOi…"
            className={`${inputCls} font-mono`} />
        </div>

        <div className="flex gap-2">
          <button onClick={test} disabled={testing}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-zinc-200 hover:bg-white/10 disabled:opacity-50">
            {testing ? 'Testing…' : 'Test connection'}
          </button>
          <button onClick={save}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-fuchsia-500 text-black text-sm font-black uppercase tracking-widest hover:brightness-110">
            Save
          </button>
        </div>
        <button onClick={disconnect} className="w-full text-[11px] text-zinc-600 hover:text-zinc-400">
          Disconnect database (use browser storage only)
        </button>

        {status && (
          <p className={`text-xs font-bold px-4 py-3 rounded-xl border ${status.includes('✓') ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
            {status}
          </p>
        )}

        <p className="text-[11px] text-zinc-600 leading-relaxed">
          First time? Run the SQL snippet from the README in your Supabase SQL Editor once to create
          the <span className="font-mono">promptreel_prompts</span> table and thumbnails bucket.
        </p>
      </div>
    </div>
  );
}

function DetailModal({ item, copies, copied, onCopy, onClose, onDelete }: {
  item: PromptItem; copies: number; copied: boolean;
  onCopy: () => void; onClose: () => void; onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <Thumb item={item} big />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80"><X size={18} /></button>
        </div>
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-violet-400/10 border border-violet-400/30 text-violet-300 text-[11px] font-bold">{item.model}</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[11px]">{item.category}</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-500 text-[11px] flex items-center gap-1"><Copy size={11} /> {copies} copies</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{item.title}</h2>
          </div>

          <div>
            <p className={labelCls}>Prompt</p>
            <div className="mt-2 bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {item.prompt}
            </div>
            <button onClick={onCopy}
              className={`mt-3 w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${copied ? 'bg-emerald-500 text-black' : 'bg-gradient-to-r from-violet-400 to-fuchsia-500 text-black hover:brightness-110'}`}>
              {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy prompt</>}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <p className={labelCls}>Duration</p>
              <p className="text-white font-bold mt-1 flex items-center gap-2"><Clock size={14} className="text-violet-300" /> {item.duration}</p>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <p className={labelCls}>Aspect ratio</p>
              <p className="text-white font-bold mt-1 flex items-center gap-2"><Layers size={14} className="text-violet-300" /> {item.aspectRatio}</p>
            </div>
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((t) => (
                <span key={t} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-400">#{t}</span>
              ))}
            </div>
          )}

          {item.mine && (
            <button onClick={onDelete} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 font-bold">
              <Trash2 size={14} /> Delete this prompt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadView({ onBack, onSaved }: { onBack: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [model, setModel] = useState<string>(MODELS[0]);
  const [duration, setDuration] = useState('10s');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dbOn = !!getDb();

  const handleImage = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024 && !getDb()) {
      setError('Image must be under 1.5MB (browser storage limit).');
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError('Image must be under 8MB.');
      return;
    }
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const save = async () => {
    if (!title.trim() || !prompt.trim()) {
      setError('Title and prompt text are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const tagsArr = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (getDb()) {
        // Database mode: upload thumbnail to storage, insert row
        let imageUrl: string | undefined;
        if (imageFile) {
          imageUrl = await uploadThumb(imageFile);
        }
        await insertDbPrompt({
          title: title.trim(),
          prompt: prompt.trim(),
          category,
          model,
          duration,
          aspectRatio,
          tags: tagsArr,
          image: imageUrl,
        });
      } else {
        // Local mode
        addUserPrompt({
          id: `user-${Date.now()}`,
          title: title.trim(),
          prompt: prompt.trim(),
          category,
          model,
          duration,
          aspectRatio,
          tags: tagsArr,
          image,
          createdAt: new Date().toISOString(),
          mine: true,
        });
      }
      onSaved();
    } catch (e: any) {
      setError('Save failed: ' + (e.message || 'unknown error'));
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <button onClick={onBack} className="text-xs font-bold text-zinc-500 hover:text-white mb-6">← Back to gallery</button>
      <h2 className="text-3xl font-black text-white tracking-tight mb-2">Upload a prompt</h2>
      <p className="text-sm text-zinc-500 mb-8">Save your own video prompts to your personal vault. Stored in your browser.</p>

      <div className="space-y-5 bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="space-y-1.5">
          <label className={labelCls}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Neon Samurai Duel"
            className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Prompt</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6}
            placeholder="Describe the video in detail — subject, motion, camera, lighting, style…"
            className={`${inputCls} resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className={labelCls}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} appearance-none`}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>AI Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} className={`${inputCls} appearance-none`}>
              {MODELS.map((m) => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className={`${inputCls} appearance-none`}>
              {['5s', '8s', '10s', '12s', '15s', '30s'].map((d) => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>Aspect ratio</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} className={`${inputCls} appearance-none`}>
              {['16:9', '9:16', '1:1', '21:9'].map((r) => <option key={r} value={r} className="bg-zinc-900">{r}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Tags (comma separated)</label>
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cinematic, night, viral"
            className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Thumbnail image (optional)</label>
          <label className="flex items-center justify-center gap-3 border-2 border-dashed border-white/15 rounded-2xl p-8 cursor-pointer hover:border-violet-400/50 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
            {image ? (
              <img src={image} alt="preview" className="max-h-40 rounded-xl" />
            ) : (
              <span className="flex items-center gap-2 text-sm text-zinc-500">
                <ImageIcon size={18} /> Click to upload, or leave empty for auto art
              </span>
            )}
          </label>
          {image && (
            <button onClick={() => { setImage(undefined); setImageFile(undefined); }} className="text-[11px] text-zinc-500 hover:text-white flex items-center gap-1">
              <Upload size={11} /> Remove image
            </button>
          )}
        </div>

        {!dbOn && (
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Saving to this browser only. Connect a database in Settings (gear icon) to sync across devices.
          </p>
        )}

        {error && <p className="text-xs text-red-400 font-bold">{error}</p>}

        <button onClick={save} disabled={saving}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-400 to-fuchsia-500 text-black font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50">
          {saving ? 'Saving…' : 'Save to my vault →'}
        </button>
      </div>
    </main>
  );
}
