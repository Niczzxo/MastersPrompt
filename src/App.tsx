import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Search, Plus, Copy, Check, Clock, Layers, Trash2, Upload,
  Image as ImageIcon, Sparkles, ChevronDown, Pencil,
  Database, Heart, Film, ArrowLeft, Crown, LayoutGrid,
  Share2, Eye, Tag, Zap, Home, FolderOpen, Bookmark, Maximize2,
} from 'lucide-react';
import {
  CATEGORIES, MODELS, IMAGE_MODELS, ALL_MODELS, CATEGORY_STYLES,
  FEATURED_IDS, type PromptItem,
} from './data/prompts';
import { COLLECTIONS, promptsInCollection, type Collection } from './data/collections';
import {
  getAllPrompts, deleteUserPrompt, bumpCopies,
} from './lib/store';
import {
  getDbConfig, getDb, fetchDbPrompts,
  incrementDbCopies,
} from './lib/db';

type Route = { view: 'home' | 'browse' | 'detail' | 'collections' | 'collection' | 'saved' | 'upload'; id?: string };
type SortKey = 'newest' | 'oldest' | 'title';
type TypeFilter = 'all' | 'video' | 'image';

const SAVED_KEY = 'masterprompts-saved';
const ADMIN_TOKEN_KEY = 'masterprompts-admin-token';

const isAdmin = () => {
  try { return !!sessionStorage.getItem(ADMIN_TOKEN_KEY); } catch { return false; }
};

async function apiPost(path: string, body: any) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const inputCls =
  'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400/70 placeholder:text-zinc-600';
const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1';
const goldBtn =
  'bg-gradient-to-r from-amber-200 via-yellow-500 to-amber-600 text-black font-black hover:brightness-110 transition-all';

function loadSaved(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return ''; }
}

function isVideo(p: PromptItem): boolean {
  return p.type !== 'image';
}

function Thumb({ item, big }: { item: PromptItem; big?: boolean }) {
  const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.Cinematic;
  if (item.image) {
    return (
      <img src={item.image} alt={item.title}
        className={`w-full object-cover ${big ? 'aspect-video' : 'aspect-video'} bg-black`} />
    );
  }
  const initial = item.category.charAt(0);
  return (
    <div className="w-full aspect-video relative overflow-hidden bg-[#0d0b09]">
      <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />
      <div className="absolute inset-0 opacity-40"
        style={{ background: 'radial-gradient(ellipse at 50% 115%, rgba(212,175,55,0.55), transparent 62%)' }} />
      <div className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")` }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-display font-black text-amber-100/90 leading-none ${big ? 'text-7xl' : 'text-6xl'}`}
          style={{ textShadow: '0 2px 30px rgba(212,175,55,0.45)' }}>{initial}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-200/70 mt-3">{item.category}</span>
      </div>
      <div className="absolute inset-0 rounded-none border border-amber-200/10 pointer-events-none" />
    </div>
  );
}

function TypeBadge({ item }: { item: PromptItem }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur border border-white/15 text-[10px] font-bold text-zinc-300">
      {isVideo(item) ? <Film size={10} /> : <ImageIcon size={10} />}
      {isVideo(item) ? 'Video' : 'Image'}
    </span>
  );
}

/* ---------- Smooth motion + glow helpers ---------- */
function useRevealRef<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--reveal-delay', `${delay}ms`);
    el.classList.add('reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -2% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return ref;
}

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRevealRef<HTMLDivElement>(delay);
  return <div ref={ref} className={className}>{children}</div>;
}

function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none select-none">
      <div className="ambient-orb" style={{ width: '34rem', height: '34rem', top: '-10rem', left: '-8rem', background: 'radial-gradient(circle, rgba(212,175,55,0.13), transparent 70%)' }} />
      <div className="ambient-orb" style={{ width: '40rem', height: '40rem', top: '34%', right: '-14rem', background: 'radial-gradient(circle, rgba(140,95,25,0.11), transparent 70%)', animationDelay: '-6s' }} />
      <div className="ambient-orb" style={{ width: '30rem', height: '30rem', bottom: '-10rem', left: '32%', background: 'radial-gradient(circle, rgba(212,175,55,0.08), transparent 70%)', animationDelay: '-12s' }} />
    </div>
  );
}

function PromptCard({ p, copies, saved, copied, isAdmin, onOpen, onCopy, onToggleSave }: {
  p: PromptItem; copies: number; saved: boolean; copied: boolean; isAdmin: boolean;
  onOpen: () => void; onCopy: () => void; onToggleSave: () => void;
}) {
  const revealRef = useRevealRef<HTMLElement>();
  return (
    <article ref={revealRef}
      className="break-inside-avoid mb-5 bg-white/[0.03] border border-white/10 rounded-3xl overflow-hidden hover:border-amber-400/40 hover:-translate-y-1 hover:shadow-[0_12px_45px_rgba(212,175,55,0.14)] transition-all cursor-pointer group"
      onClick={onOpen}>
      <div className="relative">
        <Thumb item={p} />
        <div className="absolute top-3 left-3 flex gap-2">
          <TypeBadge item={p} />
          {p.mine && isAdmin && (
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-[10px] font-black uppercase tracking-widest text-amber-300 border border-amber-400/40">Mine</span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
            className={`p-2.5 rounded-xl backdrop-blur border transition-all ${saved ? 'bg-amber-400/90 border-amber-300 text-black' : 'bg-black/60 border-white/15 text-white hover:bg-amber-500/80'}`}
            title={saved ? 'Remove from saved' : 'Save prompt'}>
            <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onCopy(); }}
            className="p-2.5 rounded-xl bg-black/60 backdrop-blur border border-white/15 text-white hover:bg-amber-500/80 transition-all"
            title="Copy prompt">
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-white leading-snug mb-3">{p.title}</h3>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-200 font-bold">{p.model}</span>
          <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400">{p.category}</span>
          <span className="ml-auto text-zinc-600 flex items-center gap-1">
            <Copy size={11} /> {copies}
          </span>
        </div>
      </div>
    </article>
  );
}

/* Sliding active-pill for navbars — the gold pill glides between tabs */
function useSlidingPill(activeId: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState({ x: 0, w: 0, show: false });
  useEffect(() => {
    const update = () => {
      const c = containerRef.current;
      if (!c) return;
      const btn = c.querySelector<HTMLElement>(`[data-tab="${activeId}"]`);
      if (btn && btn.offsetWidth > 0) {
        setPill({ x: btn.offsetLeft, w: btn.offsetWidth, show: true });
      } else {
        setPill((p) => ({ ...p, show: false }));
      }
    };
    update();
    const t1 = setTimeout(update, 120);
    const t2 = setTimeout(update, 600);
    window.addEventListener('resize', update);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', update); };
  }, [activeId]);
  return { containerRef, pill };
}

const PILL_TRANSITION = 'transform 0.42s cubic-bezier(0.22,1,0.36,1), width 0.42s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease';

export default function App() {
  const [items, setItems] = useState<PromptItem[]>(getAllPrompts);
  const [copiesMap, setCopiesMap] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    getAllPrompts().forEach((p) => { m[p.id] = p.copies || 0; });
    return m;
  });
  const [route, setRoute] = useState<Route>({ view: 'home' });
  const [editingItem, setEditingItem] = useState<PromptItem | null>(null);
  const handleEdit = (item: PromptItem) => {
    setEditingItem(item);
    setRoute({ view: 'upload' });
  };
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [model, setModel] = useState<string>('All');
  const [ptype, setPtype] = useState<TypeFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [mineOnly, setMineOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>(loadSaved);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [dbOn, setDbOn] = useState(() => !!getDbConfig());
  const [dbNotice, setDbNotice] = useState('');

  const go = (view: Route['view'], id?: string) => {
    setRoute({ view, id });
    window.scrollTo({ top: 0 });
  };

  const goUpload = () => {
    if (isAdmin()) go('upload');
    else setShowLogin(true);
  };

  const logoutAdmin = () => {
    try { sessionStorage.removeItem(ADMIN_TOKEN_KEY); } catch { /* ignore */ }
    go('browse');
  };

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
      .catch((e) => setDbNotice('Database error: ' + (e.message || 'could not load')));
  }, []);

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

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    try {
      if (id.startsWith('db-')) {
        const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
        if (!token) {
          alert('Admin login required.');
          return;
        }
        await apiPost('/api/delete', { token, id });
      } else {
        deleteUserPrompt(id);
      }
    } catch (e: any) {
      alert('Delete failed: ' + (e.message || 'unknown error'));
      return;
    }
    setSavedIds((prev) => prev.filter((x) => x !== id));
    setItems((prev) => prev.filter((p) => p.id !== id));
    go('browse');
  };

  const shareLink = async (p: PromptItem) => {
    const url = `${window.location.origin}${window.location.pathname}#prompt-${p.id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
    setCopiedId('share-' + p.id);
    setTimeout(() => setCopiedId((c) => (c === 'share-' + p.id ? null : c)), 1600);
  };

  const filtered = useMemo(() => {
    let list = [...items];
    if (mineOnly) list = list.filter((p) => p.mine);
    if (ptype !== 'all') list = list.filter((p) => isVideo(p) === (ptype === 'video'));
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
  }, [items, query, category, model, ptype, sort, mineOnly]);

  const detailItem = route.view === 'detail' ? items.find((p) => p.id === route.id) || null : null;
  const collection = route.view === 'collection' ? COLLECTIONS.find((c) => c.id === route.id) || null : null;
  const savedItems = items.filter((p) => savedIds.includes(p.id));
  const totalCopies = Object.values(copiesMap).reduce((a, b) => a + b, 0);

  const cardProps = (p: PromptItem) => ({
    copies: copiesMap[p.id] || 0,
    saved: savedIds.includes(p.id),
    copied: copiedId === p.id,
    isAdmin: isAdmin(),
    onOpen: () => go('detail', p.id),
    onCopy: () => copyPrompt(p),
    onToggleSave: () => toggleSave(p.id),
  });

  const mainTabs = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'browse', label: 'Browse', Icon: LayoutGrid },
    { id: 'collections', label: 'Collections', Icon: FolderOpen },
    { id: 'saved', label: 'Saved', Icon: Bookmark },
  ];
  const activeTab =
    route.view === 'home' ? 'home'
    : route.view === 'browse' || route.view === 'detail' ? 'browse'
    : route.view === 'collections' || route.view === 'collection' ? 'collections'
    : route.view === 'saved' ? 'saved' : '';
  const goTab = (id: string) => go(id as Route['view']);
  const desktopPill = useSlidingPill(activeTab);
  const mobilePill = useSlidingPill(activeTab);

  const mobileTab = (t: { id: string; label: string; Icon: any }) => {
    const isActive = activeTab === t.id;
    return (
      <button key={t.id} data-tab={t.id} onClick={() => goTab(t.id)}
        className="btn-press relative z-10 flex flex-col items-center gap-1 w-14 py-1.5 rounded-2xl">
        <t.Icon size={22} className={`${isActive ? 'text-amber-300 animate-tab-pop drop-shadow-[0_0_10px_rgba(212,175,55,0.9)]' : 'text-zinc-500'} transition-colors duration-300`} />
        <span className={`text-[10px] font-bold transition-colors duration-300 ${isActive ? 'text-amber-200' : 'text-zinc-500'}`}>{t.label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0908] text-zinc-200">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0908]/90 backdrop-blur border-b border-amber-400/10">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3.5 flex items-center gap-2 md:gap-3">
          <button onClick={() => go('home')} className="flex items-center gap-3 shrink-0 mx-auto sm:mx-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.35)]">
              <Crown className="text-black" size={20} />
            </div>
            <div className="text-left">
              <h1 className="font-display font-black text-lg tracking-tight text-white leading-none">MastersPrompt</h1>
              <p className="text-[9px] text-amber-400/70 uppercase tracking-[0.25em] mt-0.5">Premium library</p>
            </div>
          </button>
          <nav className="hidden lg:block ml-4">
            <div ref={desktopPill.containerRef} className="relative flex items-center gap-1">
              <div aria-hidden
                className="absolute left-0 top-0 bottom-0 rounded-full bg-amber-400/15 border border-amber-400/40 shadow-[0_0_18px_rgba(212,175,55,0.25)]"
                style={{ transform: `translateX(${desktopPill.pill.x}px)`, width: desktopPill.pill.w, opacity: desktopPill.pill.show ? 1 : 0, transition: PILL_TRANSITION }} />
              {mainTabs.map((t) => (
                <button key={t.id} data-tab={t.id} onClick={() => goTab(t.id)}
                  className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-colors duration-300 ${activeTab === t.id ? 'text-amber-200' : 'text-zinc-400 hover:text-white'}`}>
                  <t.Icon size={13} /> {t.label}
                </button>
              ))}
            </div>
          </nav>
          <div className="flex-1 hidden lg:block" />
          <div className="hidden md:flex relative w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(e) => { setQuery(e.target.value); if (route.view !== 'browse') go('browse'); }}
              placeholder="Search prompts…"
              className="w-full bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-400/70 placeholder:text-zinc-600" />
          </div>
          <span title={dbOn ? 'Database connected' : 'Local mode'}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold border ${dbOn ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-zinc-500 bg-white/5'}`}>
            <Database size={11} /> {dbOn ? 'DB' : 'Local'}
          </span>
          <button onClick={goUpload}
            className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-full text-xs uppercase tracking-widest ${goldBtn}`}>
            <Plus size={15} /> Upload
          </button>
        </div>
      </header>

      {/* Mobile bottom tab bar — Upload FAB raised in the center */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="rounded-[1.75rem] bg-[#14120e]/95 backdrop-blur-xl border border-amber-400/15 shadow-[0_-10px_50px_rgba(0,0,0,0.65),0_0_30px_rgba(212,175,55,0.07)]">
          <div ref={mobilePill.containerRef} className="relative flex items-center justify-around px-2 pt-2.5 pb-2">
            {/* sliding top glow indicator — glides to the active tab */}
            <div aria-hidden
              className="absolute left-0 top-0 h-[3px] w-7 rounded-full bg-gradient-to-r from-amber-200 to-amber-500 shadow-[0_0_12px_rgba(212,175,55,0.9)]"
              style={{
                transform: `translateX(${mobilePill.pill.x + mobilePill.pill.w / 2 - 14}px)`,
                opacity: mobilePill.pill.show ? 1 : 0,
                transition: PILL_TRANSITION,
              }} />
            {mainTabs.slice(0, 2).map(mobileTab)}
            <button onClick={goUpload} aria-label="Upload prompt"
              className="btn-press relative z-10 -translate-y-4 w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 flex items-center justify-center text-black shadow-[0_8px_30px_rgba(212,175,55,0.55)] border-2 border-amber-200/40">
              <Plus size={26} strokeWidth={2.5} />
            </button>
            {mainTabs.slice(2).map(mobileTab)}
          </div>
        </div>
      </nav>

      {dbNotice && (
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-4">
          <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5">{dbNotice}</p>
        </div>
      )}

      <AmbientBackground />
      <div key={route.view + (route.view === 'detail' ? `-${(route as any).id || ''}` : '')} className="page-enter relative z-10">
      {route.view === 'home' && (
        <HomeView items={items} copiesMap={copiesMap} cardProps={cardProps}
          onSearch={(q) => { setQuery(q); go('browse'); }}
          onCategory={(c) => { setCategory(c); setQuery(''); go('browse'); }}
          onUpload={goUpload} />
      )}
      {route.view === 'browse' && (
        <BrowseView items={filtered} query={query} setQuery={setQuery}
          category={category} setCategory={setCategory} model={model} setModel={setModel}
          ptype={ptype} setPtype={setPtype} sort={sort} setSort={setSort}
          mineOnly={mineOnly} setMineOnly={setMineOnly} isAdmin={isAdmin()} cardProps={cardProps} />
      )}
      {route.view === 'detail' && detailItem && (
        <DetailView item={detailItem} items={items} copies={copiesMap[detailItem.id] || 0}
          saved={savedIds.includes(detailItem.id)} copied={copiedId === detailItem.id}
          shareCopied={copiedId === 'share-' + detailItem.id} isAdmin={isAdmin()}
          onCopy={() => copyPrompt(detailItem)} onToggleSave={() => toggleSave(detailItem.id)}
          onShare={() => shareLink(detailItem)} onDelete={() => handleDelete(detailItem.id)}
          onEdit={() => handleEdit(detailItem)}
          onOpen={(id) => go('detail', id)} onBack={() => go('browse')}
          onCategory={(c) => { setCategory(c); go('browse'); }} cardProps={cardProps} />
      )}
      {route.view === 'detail' && !detailItem && (
        <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-20 text-center text-zinc-500">
          <p>Prompt not found.</p>
          <button onClick={() => go('browse')} className="mt-4 text-amber-300 font-bold text-sm">← Back to browse</button>
        </main>
      )}
      {route.view === 'collections' && (
        <CollectionsView onOpen={(id) => go('collection', id)} items={items} />
      )}
      {route.view === 'collection' && collection && (
        <CollectionDetailView collection={collection} items={promptsInCollection(collection, items)}
          cardProps={cardProps} onBack={() => go('collections')} />
      )}
      {route.view === 'saved' && (
        <SavedView items={savedItems} cardProps={cardProps} onBrowse={() => go('browse')} />
      )}
      {route.view === 'upload' && (
        <UploadView onBack={() => { setEditingItem(null); go('browse'); }}
          editing={editingItem}
          onSaved={(newItem) => {
            if (newItem) {
              setItems((prev) => [newItem, ...prev]);
              setCopiesMap((m) => ({ ...m, [newItem.id]: 0 }));
            }
            setMineOnly(true);
            go('browse');
          }}
          onUpdated={(updated) => {
            setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setEditingItem(null);
            go('detail', updated.id);
          }}
          onLogout={logoutAdmin} />
      )}
      </div>

      {showLogin && (
        <AdminLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => { setShowLogin(false); go('upload'); }}
        />
      )}

      {/* spacer so the mobile bottom bar never covers content */}
      <div className="h-24 lg:hidden" />

      {/* Footer */}
      <footer className="border-t border-amber-400/10 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 flex items-center justify-center">
                <Crown className="text-black" size={17} />
              </div>
              <p className="font-display font-black text-white text-lg">MastersPrompt</p>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-sm">
              The premium library of AI video & image prompts. Every prompt is original,
              curated by the MastersPrompt studio and ready to copy in one tap.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/70 mb-4">Explore</p>
            <div className="space-y-2.5 text-sm">
              <button onClick={() => go('browse')} className="block text-zinc-400 hover:text-amber-300">Browse prompts</button>
              <button onClick={() => go('collections')} className="block text-zinc-400 hover:text-amber-300">Collections</button>
              <button onClick={() => go('saved')} className="block text-zinc-400 hover:text-amber-300">Saved prompts</button>
              <button onClick={goUpload} className="block text-zinc-400 hover:text-amber-300">Upload a prompt</button>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/70 mb-4">Categories</p>
            <div className="space-y-2.5 text-sm">
              {CATEGORIES.slice(0, 4).map((c) => (
                <button key={c} onClick={() => { setCategory(c); go('browse'); }}
                  className="block text-zinc-400 hover:text-amber-300">{c}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/5 py-6 text-center">
          <p className="text-[11px] text-zinc-600">MastersPrompt © 2026 · {items.length} prompts · {totalCopies.toLocaleString()} copies served</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Home ── */

function HomeView({ items, copiesMap, cardProps, onSearch, onCategory, onUpload }: {
  items: PromptItem[]; copiesMap: Record<string, number>;
  cardProps: (p: PromptItem) => any;
  onSearch: (q: string) => void; onCategory: (c: string) => void; onUpload: () => void;
}) {
  const [q, setQ] = useState('');
  const featured = FEATURED_IDS.map((id) => items.find((p) => p.id === id)).filter(Boolean) as PromptItem[];
  const totalCopies = Object.values(copiesMap).reduce((a, b) => a + b, 0);
  const stats = [
    { n: items.length.toString(), l: 'Curated prompts' },
    { n: CATEGORIES.length.toString(), l: 'Categories' },
    { n: ALL_MODELS.length.toString(), l: 'AI models' },
    { n: totalCopies.toLocaleString(), l: 'Copies served' },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-40 blur-[120px]"
            style={{ background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)' }} />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full gold-card text-amber-200 text-[11px] font-bold uppercase tracking-widest mb-6">
            <Sparkles size={12} /> The premium AI prompts library
          </div>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.05] glow-text">
            Craft cinema from a<br /><span className="gold-text italic">single sentence.</span>
          </h2>
          <p className="text-zinc-400 text-sm md:text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
            Hand-curated video & image prompts for Seedance, Veo, Sora, Midjourney and more.
            Copy any prompt in one tap — or save it to your vault.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); onSearch(q); }}
            className="mt-8 max-w-2xl mx-auto relative">
            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-400/60" />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Try “neon samurai”, “aerial”, “product shot”…"
              className="w-full bg-black/50 border border-amber-400/25 rounded-full pl-13 pr-32 py-4 md:py-5 text-sm md:text-base text-white outline-none focus:border-amber-400/70 placeholder:text-zinc-600 shadow-[0_0_40px_rgba(212,175,55,0.12)]" />
            <button type="submit"
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 md:py-3 rounded-full text-xs font-black uppercase tracking-widest ${goldBtn}`}>
              Search
            </button>
          </form>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-12">
            {stats.map((s) => (
              <div key={s.l} className="gold-card rounded-2xl px-4 py-5">
                <p className="font-display text-2xl md:text-3xl font-black gold-text">{s.n}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
          <Reveal>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/70 mb-1">Hand-picked</p>
              <h3 className="font-display text-2xl md:text-3xl font-black text-white">Staff picks</h3>
            </div>
          </div>
          </Reveal>
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {featured.map((p) => (
              <div key={p.id} className="w-72 md:w-80 shrink-0">
                <PromptCard p={p} {...cardProps(p)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-10">
        <Reveal>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/70 mb-1">Find your style</p>
        <h3 className="font-display text-2xl md:text-3xl font-black text-white mb-6">Browse by category</h3>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.map((c) => {
            const style = CATEGORY_STYLES[c];
            const count = items.filter((p) => p.category === c).length;
            return (
              <button key={c} onClick={() => onCategory(c)}
                className={`relative overflow-hidden rounded-3xl p-6 text-left bg-gradient-to-br ${style.gradient} hover:scale-[1.02] transition-transform group`}>
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />
                <span className="relative font-display font-black text-4xl text-white/90" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>{c.charAt(0)}</span>
                <p className="relative font-display font-black text-white text-lg mt-3">{c}</p>
                <p className="relative text-[11px] text-white/70 font-bold uppercase tracking-widest mt-1">{count} prompts</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-[1400px] mx-auto px-4 md:px-8 py-14">
        <Reveal>
        <div className="gold-card rounded-[2rem] p-8 md:p-14 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-20 blur-[80px] animate-float-slow"
            style={{ background: '#d4af37' }} />
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/70 mb-2 text-center">Effortless</p>
          <h3 className="font-display text-3xl md:text-4xl font-black text-white text-center mb-10 glow-text">From idea to generation in <span className="gold-text italic">seconds</span></h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Search size={22} />, t: 'Discover', d: 'Browse curated prompts by category, model or mood — every one tested for quality.' },
              { icon: <Copy size={22} />, t: 'Copy in one tap', d: 'A single tap copies the full prompt, tuned with camera language and style keywords.' },
              { icon: <Zap size={22} />, t: 'Generate anywhere', d: 'Paste into Seedance, Veo, Sora or Midjourney and watch your vision come alive.' },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 120}>
              <div className="bg-black/30 border border-amber-400/15 rounded-3xl p-7 card-lift h-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-600 flex items-center justify-center text-black mb-5 shadow-[0_0_25px_rgba(212,175,55,0.35)]">
                  {s.icon}
                </div>
                <p className="text-[11px] font-black text-amber-400/70 uppercase tracking-widest mb-1">Step {i + 1}</p>
                <h4 className="font-display text-xl font-black text-white mb-2">{s.t}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.d}</p>
              </div>
              </Reveal>
            ))}
          </div>
          <div className="text-center mt-10">
            <button onClick={onUpload}
              className={`btn-press inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm uppercase tracking-widest shadow-[0_0_35px_rgba(212,175,55,0.3)] ${goldBtn}`}>
              <Plus size={16} /> Share your own prompt
            </button>
          </div>
        </div>
        </Reveal>
      </section>
    </main>
  );
}

/* ── Browse ── */

function BrowseView({ items, query, setQuery, category, setCategory, model, setModel, ptype, setPtype, sort, setSort, mineOnly, setMineOnly, isAdmin, cardProps }: {
  items: PromptItem[]; query: string; setQuery: (v: string) => void;
  category: string; setCategory: (v: string) => void; model: string; setModel: (v: string) => void;
  ptype: TypeFilter; setPtype: (v: TypeFilter) => void; sort: SortKey; setSort: (v: SortKey) => void;
  mineOnly: boolean; setMineOnly: (v: boolean) => void; isAdmin: boolean;
  cardProps: (p: PromptItem) => any;
}) {
  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-8 pb-16">
      <section className="py-10 md:py-12">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/70 mb-2">The vault</p>
        <h2 className="font-display text-3xl md:text-5xl font-black text-white tracking-tight">
          Browse <span className="gold-text italic">{items.length}</span> prompts
        </h2>
        <div className="md:hidden relative mt-6">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts…"
            className="w-full bg-black/40 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm outline-none focus:border-amber-400/70 placeholder:text-zinc-600" />
        </div>
      </section>

      {/* Type toggle */}
      <section className="flex flex-wrap items-center gap-2 mb-5">
        {([
          { k: 'all', label: 'All', Icon: LayoutGrid },
          { k: 'video', label: 'Video', Icon: Film },
          { k: 'image', label: 'Image', Icon: ImageIcon },
        ] as const).map(({ k, label, Icon }) => (
          <button key={k} onClick={() => setPtype(k)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${ptype === k ? 'bg-gradient-to-r from-amber-200 to-amber-500 text-black border-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white'}`}>
            <Icon size={14} /> {label}
          </button>
        ))}
        <div className="flex-1" />
        {isAdmin && (
          <button onClick={() => setMineOnly(!mineOnly)}
            className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-colors ${mineOnly ? 'border-amber-400/60 bg-amber-400/10 text-amber-200' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'}`}>
            My Prompts
          </button>
        )}
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-2 mb-8">
        {['All', ...CATEGORIES].map((c) => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${category === c ? 'border-amber-400/60 bg-amber-400/15 text-amber-200' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white'}`}>
            {c}
          </button>
        ))}
        <div className="flex-1" />
        <div className="relative">
          <select value={model} onChange={(e) => setModel(e.target.value)}
            className="appearance-none bg-black/40 border border-white/10 rounded-full pl-4 pr-9 py-2 text-xs font-bold text-zinc-300 outline-none focus:border-amber-400/70">
            <option value="All" className="bg-zinc-900">All models</option>
            {ALL_MODELS.map((m) => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none bg-black/40 border border-white/10 rounded-full pl-4 pr-9 py-2 text-xs font-bold text-zinc-300 outline-none focus:border-amber-400/70">
            <option value="newest" className="bg-zinc-900">Newest</option>
            <option value="oldest" className="bg-zinc-900">Oldest</option>
            <option value="title" className="bg-zinc-900">Title A–Z</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        </div>
      </section>

      {items.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <Crown size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No prompts found. Try another search — or upload your own!</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 [column-fill:balance]">
          {items.map((p) => (
            <PromptCard key={p.id} p={p} {...cardProps(p)} />
          ))}
        </div>
      )}
    </main>
  );
}

/* ── Detail page ── */

function PhasesSection({ phases }: { phases: { title: string; text: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  if (!phases || phases.length === 0) return null;

  const copyPhase = async (text: string, i: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedIdx(i);
    setTimeout(() => setCopiedIdx(null), 1600);
  };

  return (
    <section>
      <p className={`${labelCls} mb-3 flex items-center gap-1.5`}>
        <Layers size={11} className="text-amber-400" /> Workflow phases
      </p>
      <div className="space-y-2.5">
        {phases.map((ph, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className={`bg-black/40 border rounded-2xl overflow-hidden transition-colors ${isOpen ? 'border-amber-400/30' : 'border-white/10'}`}>
              <button onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
                <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 flex items-center justify-center text-black font-black text-xs">{i + 1}</span>
                <span className="flex-1 font-bold text-white text-sm truncate">{ph.title || `Phase ${i + 1}`}</span>
                <ChevronDown size={16} className={`text-amber-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`acc-panel ${isOpen ? 'open' : ''}`}>
                <div>
                  <div className="px-5 pb-5 pt-1 border-t border-white/5">
                    <p className="mt-3 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Phase {String(i + 1).padStart(2, '0')} of {String(phases.length).padStart(2, '0')} — Prompt instruction
                    </p>
                    <button onClick={() => copyPhase(ph.text, i)}
                      className={`btn-press w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl text-sm font-black uppercase tracking-widest ${copiedIdx === i ? 'bg-emerald-500 text-black' : 'bg-gradient-to-r from-amber-200 to-amber-500 text-black hover:brightness-110 shadow-[0_0_25px_rgba(212,175,55,0.25)]'}`}>
                      {copiedIdx === i ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Phase {i + 1}</>}
                    </button>
                    <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap mt-4">{ph.text}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DetailView({ item, items, copies, saved, copied, shareCopied, isAdmin, onCopy, onToggleSave, onShare, onDelete, onEdit, onOpen, onBack, onCategory, cardProps }: {
  item: PromptItem; items: PromptItem[]; copies: number;
  saved: boolean; copied: boolean; shareCopied: boolean;
  isAdmin: boolean;
  onCopy: () => void; onToggleSave: () => void; onShare: () => void; onDelete: () => void; onEdit: () => void;
  onOpen: (id: string) => void; onBack: () => void; onCategory: (c: string) => void;
  cardProps: (p: PromptItem) => any;
}) {
  const related = items.filter((p) => p.id !== item.id && p.category === item.category).slice(0, 6);
  const video = isVideo(item);
  const compatModels = (video ? MODELS : IMAGE_MODELS).filter((m) => m !== item.model).slice(0, 3);

  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-6 flex-wrap">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-amber-300"><Home size={12} /> Browse</button>
        <span>/</span>
        <button onClick={() => onCategory(item.category)} className="hover:text-amber-300">{item.category}</button>
        <span>/</span>
        <span className="text-zinc-300 font-bold truncate max-w-[200px] md:max-w-md">{item.title}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-[2rem] overflow-hidden border border-amber-400/15 relative">
            <Thumb item={item} big />
            <div className="absolute top-4 left-4"><TypeBadge item={item} /></div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-200 text-[11px] font-bold">{item.model}</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-[11px]">{item.category}</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-500 text-[11px] flex items-center gap-1"><Copy size={11} /> {copies} copies</span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-500 text-[11px] flex items-center gap-1"><Eye size={11} /> {fmtDate(item.createdAt)}</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-black text-white tracking-tight leading-tight glow-text">{item.title}</h1>
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={onCopy}
                className={`btn-press flex items-center gap-2 px-8 py-4 rounded-full text-sm uppercase tracking-widest ${copied ? 'bg-emerald-500 text-black' : `${goldBtn} shadow-[0_0_35px_rgba(212,175,55,0.35)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)]`}`}>
                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy prompt</>}
              </button>
              <button onClick={onToggleSave}
                className={`btn-press flex items-center gap-2 px-6 py-4 rounded-full text-sm font-bold border ${saved ? 'bg-amber-400/15 border-amber-400/50 text-amber-200 shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-white/15 text-zinc-300 hover:border-amber-400/40 hover:text-amber-200'}`}>
                <Heart size={16} fill={saved ? 'currentColor' : 'none'} /> {saved ? 'Saved' : 'Save'}
              </button>
              <button onClick={onShare}
                className="btn-press flex items-center gap-2 px-6 py-4 rounded-full text-sm font-bold border border-white/15 text-zinc-300 hover:border-amber-400/40 hover:text-amber-200">
                {shareCopied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />} {shareCopied ? 'Link copied' : 'Share'}
              </button>
            </div>
          </div>

          {/* Prompt */}
          {item.prompt && item.prompt.trim() && (
            <section>
              <p className={`${labelCls} flex items-center gap-1.5 mb-2`}><Sparkles size={11} className="text-amber-400" /> The prompt</p>
              <div className="bg-black/40 border border-amber-400/15 rounded-3xl p-6 md:p-8 text-[15px] text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {item.prompt}
              </div>
            </section>
          )}

          <PhasesSection phases={item.phases || []} />

          {/* Settings */}
          <section>
            <p className={`${labelCls} mb-3`}>Recommended settings</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="gold-card rounded-2xl p-5">
                <p className={labelCls}>{video ? 'Duration' : 'Dimensions'}</p>
                <p className="text-white font-black mt-1.5 flex items-center gap-2 text-sm md:text-base"><Clock size={15} className="text-amber-300 shrink-0" /> {item.duration}</p>
              </div>
              <div className="gold-card rounded-2xl p-5">
                <p className={labelCls}>Aspect ratio</p>
                <p className="text-white font-black mt-1.5 flex items-center gap-2 text-sm md:text-base"><Layers size={15} className="text-amber-300 shrink-0" /> {item.aspectRatio}</p>
              </div>
              <div className="gold-card rounded-2xl p-5">
                <p className={labelCls}>Best for</p>
                <p className="text-white font-black mt-1.5 flex items-center gap-2 text-sm md:text-base"><Maximize2 size={15} className="text-amber-300 shrink-0" /> {video ? 'Video gen' : 'Image gen'}</p>
              </div>
            </div>
          </section>

          {/* Compatible models */}
          <section>
            <p className={`${labelCls} mb-3`}>Compatible models</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-200 to-amber-500 text-black text-xs font-black">{item.model} ✓</span>
              {compatModels.map((m) => (
                <span key={m} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold">{m}</span>
              ))}
            </div>
          </section>

          {/* How to use */}
          <section className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8">
            <p className={`${labelCls} mb-5`}>How to use this prompt</p>
            <div className="space-y-5">
              {[
                { t: 'Copy the prompt', d: 'Hit the gold copy button above — the full prompt, with camera and style language, lands on your clipboard.' },
                { t: 'Paste into your generator', d: `Open ${item.model} (or any compatible model), set ${video ? `duration to ${item.duration}` : `dimensions to ${item.duration}`} and ${item.aspectRatio} framing, then paste.` },
                { t: 'Refine & remix', d: 'Swap the subject, lighting or mood words to make it yours — then save the remix to your vault.' },
              ].map((s, i) => (
                <div key={s.t} className="flex gap-4">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 flex items-center justify-center text-black font-black text-sm">{i + 1}</div>
                  <div>
                    <p className="font-bold text-white text-sm">{s.t}</p>
                    <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tags */}
          {item.tags.length > 0 && (
            <section>
              <p className={`${labelCls} mb-3 flex items-center gap-1.5`}><Tag size={11} /> Tags</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((t) => (
                  <span key={t} className="px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 hover:border-amber-400/40 hover:text-amber-200 transition-colors cursor-default">#{t}</span>
                ))}
              </div>
            </section>
          )}

          {isAdmin && (
            <div className="flex items-center gap-5">
              <button onClick={onEdit} className="flex items-center gap-2 text-xs text-amber-300 hover:text-amber-200 font-bold">
                <Pencil size={14} /> Edit this prompt
              </button>
              <button onClick={onDelete} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 font-bold">
                <Trash2 size={14} /> Delete this prompt
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="gold-card rounded-3xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 flex items-center justify-center shadow-[0_0_25px_rgba(212,175,55,0.35)]">
                <Crown className="text-black" size={24} />
              </div>
              <div>
                <p className="font-black text-white">MastersPrompt Studio</p>
                <p className="text-[11px] text-zinc-500">Curated prompt studio</p>
              </div>
            </div>
            <button className={`w-full mt-5 py-3 rounded-full text-xs font-black uppercase tracking-widest ${goldBtn}`}>
              Follow studio
            </button>
            <p className="text-[11px] text-zinc-600 text-center mt-3">Get new curated prompts every week</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6">
            <p className={`${labelCls} mb-4`}>Overview</p>
            <div className="space-y-3 text-sm">
              {[
                ['Status', 'Curated ✓'],
                ['Type', video ? 'Video prompt' : 'Image prompt'],
                ['Category', item.category],
                ['Published', fmtDate(item.createdAt)],
                ['Prompt ID', item.id],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <span className="text-zinc-500">{k}</span>
                  <span className="text-zinc-200 font-bold text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-2xl md:text-3xl font-black text-white">Related prompts</h3>
            <button onClick={() => onCategory(item.category)} className="text-xs font-black uppercase tracking-widest text-amber-300 hover:text-amber-200">
              More {item.category} →
            </button>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
            {related.map((p) => (
              <PromptCard key={p.id} p={p} {...cardProps(p)} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/* ── Collections ── */

function CollectionsView({ items, onOpen }: { items: PromptItem[]; onOpen: (id: string) => void }) {
  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-14">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/70 mb-2">Curated for you</p>
      <h2 className="font-display text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
        Prompt <span className="gold-text italic">collections</span>
      </h2>
      <p className="text-zinc-500 text-sm md:text-base max-w-2xl mb-10">
        Themed bundles assembled by the MastersPrompt studio — grab a whole pack of ideas in one go.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {COLLECTIONS.map((c) => {
          const count = promptsInCollection(c, items).length;
          return (
            <button key={c.id} onClick={() => onOpen(c.id)}
              className={`relative overflow-hidden rounded-[2rem] p-8 text-left bg-gradient-to-br ${c.gradient} hover:scale-[1.02] transition-transform group min-h-[240px] flex flex-col justify-end`}>
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/15 transition-colors" />
              <span className="absolute top-6 right-8 font-display font-black text-6xl text-white/25 animate-float-slow select-none">{c.title.charAt(0)}</span>
              <div className="relative">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70 mb-2">{count} prompts</p>
                <h3 className="font-display text-2xl font-black text-white mb-2">{c.title}</h3>
                <p className="text-sm text-white/75 leading-relaxed mb-4">{c.description}</p>
                <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white">
                  Explore collection <ArrowLeft size={13} className="rotate-180" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}

function CollectionDetailView({ collection, items, cardProps, onBack }: {
  collection: Collection; items: PromptItem[]; cardProps: (p: PromptItem) => any; onBack: () => void;
}) {
  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-amber-300 mb-6">
        <ArrowLeft size={14} /> All collections
      </button>
      <div className={`relative overflow-hidden rounded-[2rem] p-8 md:p-12 bg-gradient-to-br ${collection.gradient} mb-10`}>
        <div className="absolute inset-0 bg-black/30" />
        <span className="absolute top-6 right-8 font-display font-black text-8xl text-white/20 select-none">{collection.title.charAt(0)}</span>
        <div className="relative max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70 mb-2">{items.length} prompts</p>
          <h2 className="font-display text-3xl md:text-5xl font-black text-white tracking-tight mb-3">{collection.title}</h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">{collection.description}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-center text-zinc-600 py-16 text-sm">No prompts in this collection yet.</p>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
          {items.map((p) => (
            <PromptCard key={p.id} p={p} {...cardProps(p)} />
          ))}
        </div>
      )}
    </main>
  );
}

/* ── Saved ── */

function SavedView({ items, cardProps, onBrowse }: {
  items: PromptItem[]; cardProps: (p: PromptItem) => any; onBrowse: () => void;
}) {
  return (
    <main className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 md:py-14">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/70 mb-2">Your vault</p>
      <h2 className="font-display text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
        Saved <span className="gold-text italic">prompts</span>
      </h2>
      <p className="text-zinc-500 text-sm mb-10">Tap the heart on any prompt to keep it here, on this device.</p>
      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={44} className="mx-auto mb-5 text-amber-400/30" />
          <p className="text-zinc-400 font-bold mb-2">Nothing saved yet</p>
          <p className="text-sm text-zinc-600 mb-6">Hearts you tap on prompts will live here.</p>
          <button onClick={onBrowse} className={`px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-widest ${goldBtn}`}>
            Browse prompts
          </button>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5">
          {items.map((p) => (
            <PromptCard key={p.id} p={p} {...cardProps(p)} />
          ))}
        </div>
      )}
    </main>
  );
}

/* ── Admin login ── */

function AdminLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!password) return;
    setBusy(true);
    setError('');
    try {
      const data = await apiPost('/api/admin-login', { password });
      sessionStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit}
        className="w-full max-w-sm bg-zinc-900 border border-amber-400/20 rounded-3xl p-6 md:p-8 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 flex items-center justify-center mb-4">
            <Crown className="text-black" size={24} />
          </div>
          <h3 className="font-display font-black text-xl text-white">Admin access</h3>
          <p className="text-xs text-zinc-500 mt-1">Only the site owner can upload prompts.</p>
        </div>
        <div className="space-y-1.5">
          <label className={labelCls}>Admin password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password" autoFocus className={inputCls} />
        </div>
        {error && <p className="text-xs text-red-400 font-bold text-center">{error}</p>}
        <button type="submit" disabled={busy}
          className={`w-full py-3.5 rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50 ${goldBtn}`}>
          {busy ? 'Checking…' : 'Unlock upload →'}
        </button>
      </form>
    </div>
  );
}

/* ── Upload ── */

function UploadView({ onBack, onSaved, onLogout, editing, onUpdated }: {
  onBack: () => void; onSaved: (newItem?: PromptItem) => void; onLogout: () => void;
  editing?: PromptItem | null; onUpdated?: (item: PromptItem) => void;
}) {
  const [ptype, setPtype] = useState<'video' | 'image'>(editing?.type === 'image' ? 'image' : 'video');
  const [title, setTitle] = useState(editing?.title || '');
  const [prompt, setPrompt] = useState(editing?.prompt || '');
  const [category, setCategory] = useState<string>(editing?.category || CATEGORIES[0]);
  const [model, setModel] = useState<string>(editing?.model || MODELS[0]);
  const [duration, setDuration] = useState(editing?.duration || '10s');
  const [aspectRatio, setAspectRatio] = useState(editing?.aspectRatio || '16:9');
  const [tags, setTags] = useState(editing?.tags?.join(', ') || '');
  const [phases, setPhases] = useState<{ title: string; text: string }[]>(
    editing?.phases?.map((p) => ({ title: p.title || '', text: p.text || '' })) || []);
  const [image, setImage] = useState<string | undefined>(editing?.image);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const models = ptype === 'video' ? MODELS : IMAGE_MODELS;
  const durationOpts = ptype === 'video'
    ? ['5s', '8s', '10s', '12s', '15s', '30s']
    : ['1024×1024', '1344×768', '768×1344', '1920×1080'];

  const firstPtype = useRef(true);
  useEffect(() => {
    if (firstPtype.current) { firstPtype.current = false; return; }
    setModel(ptype === 'video' ? MODELS[0] : IMAGE_MODELS[0]);
    setDuration(ptype === 'video' ? '10s' : '1024×1024');
  }, [ptype]);

  const handleImage = (f: File | undefined) => {
    if (!f) return;
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
    const hasPhaseText = phases.some((ph) => ph.text.trim());
    if (!title.trim() || (!prompt.trim() && !hasPhaseText)) {
      setError('Title and either a prompt or at least one phase are required.');
      return;
    }
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setError('Admin session expired — please log in again.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const tagsArr = tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      const payload = {
        title: title.trim(),
        prompt: prompt.trim(),
        category,
        model,
        duration,
        aspectRatio,
        tags: tagsArr,
        type: ptype,
        phases: phases.filter((ph) => ph.title.trim() || ph.text.trim()),
      };
      if (editing) {
        const imageChanged = image !== editing.image;
        const data = await apiPost('/api/update', {
          token,
          id: editing.id,
          prompt: payload,
          imageBase64: imageChanged ? image || undefined : undefined,
          imageType: imageFile?.type || undefined,
          removeImage: !image && !!editing.image,
        });
        if (onUpdated) onUpdated(data.item);
        return;
      }
      const data = await apiPost('/api/upload', {
        token,
        prompt: payload,
        imageBase64: image || undefined,
        imageType: imageFile?.type || undefined,
      });
      onSaved(data.item);
    } catch (e: any) {
      setError('Save failed: ' + (e.message || 'unknown error'));
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-amber-300">
          <ArrowLeft size={14} /> Back to browse
        </button>
        <button onClick={onLogout} className="text-[11px] font-bold text-zinc-600 hover:text-amber-300 uppercase tracking-widest">
          Admin ✓ · Logout
        </button>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/70 mb-2">Contribute</p>
      <h2 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight mb-2">{editing ? 'Edit prompt' : 'Upload a prompt'}</h2>
      <p className="text-sm text-zinc-500 mb-8">{editing ? 'Update your prompt — changes go live instantly.' : `Share your own ${ptype} prompts with the vault. Published straight to the live database.`}</p>

      <div className="space-y-5 bg-white/[0.03] border border-amber-400/15 rounded-3xl p-6 md:p-8">
        <div className="flex gap-2">
          {(['video', 'image'] as const).map((t) => (
            <button key={t} onClick={() => setPtype(t)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${ptype === t ? 'bg-gradient-to-r from-amber-200 to-amber-500 text-black border-transparent' : 'border-white/10 text-zinc-400 hover:text-white'}`}>
              {t === 'video' ? <Film size={14} /> : <ImageIcon size={14} />} {t}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Neon Samurai Duel" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Prompt {phases.some((ph) => ph.text.trim()) ? '(optional — using phases)' : ''}</label>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6}
            placeholder={ptype === 'video' ? 'Describe the video — subject, motion, camera, lighting, style… (skip if using phases below)' : 'Describe the image — subject, composition, lighting, style… (skip if using phases below)'}
            className={`${inputCls} resize-none`} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className={labelCls}>Workflow phases (optional)</label>
            <button type="button" onClick={() => setPhases((p) => [...p, { title: '', text: '' }])}
              className="text-[11px] font-black uppercase tracking-widest text-amber-300 hover:text-amber-200 flex items-center gap-1">
              <Plus size={12} /> Add phase
            </button>
          </div>
          {phases.map((ph, i) => (
            <div key={i} className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-amber-200 to-amber-600 flex items-center justify-center text-black font-black text-xs">{i + 1}</span>
                <input value={ph.title} onChange={(e) => setPhases((p) => p.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                  placeholder={`Phase ${i + 1} title (e.g. The Hook)`} className={inputCls} />
                <button type="button" onClick={() => setPhases((p) => p.filter((_, j) => j !== i))}
                  className="p-2 text-zinc-500 hover:text-red-400 shrink-0" title="Remove phase">
                  <Trash2 size={15} />
                </button>
              </div>
              <textarea value={ph.text} onChange={(e) => setPhases((p) => p.map((x, j) => j === i ? { ...x, text: e.target.value } : x))}
                rows={4} placeholder="Full prompt text for this phase…" className={`${inputCls} resize-none`} />
            </div>
          ))}
          {phases.length === 0 && (
            <p className="text-[11px] text-zinc-600 leading-relaxed">Split a multi-shot video into phases — each phase gets its own tab with a copy button on the prompt page.</p>
          )}
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
              {models.map((m) => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls}>{ptype === 'video' ? 'Duration' : 'Dimensions'}</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)} className={`${inputCls} appearance-none`}>
              {durationOpts.map((d) => <option key={d} value={d} className="bg-zinc-900">{d}</option>)}
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
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cinematic, night, viral" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className={labelCls}>Thumbnail image (optional)</label>
          <label className="flex items-center justify-center gap-3 border-2 border-dashed border-white/15 rounded-2xl p-8 cursor-pointer hover:border-amber-400/50 transition-colors">
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

        {error && <p className="text-xs text-red-400 font-bold">{error}</p>}

        <button onClick={save} disabled={saving}
          className={`w-full py-4 rounded-2xl text-sm uppercase tracking-widest disabled:opacity-50 ${goldBtn}`}>
          {saving ? 'Saving…' : editing ? 'Save changes →' : 'Save to my vault →'}
        </button>
      </div>
    </main>
  );
}
