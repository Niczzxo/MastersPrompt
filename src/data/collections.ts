import type { PromptItem } from './prompts';
import { FEATURED_IDS } from './prompts';

export interface Collection {
  id: string;
  title: string;
  description: string;
  gradient: string;
  icon: string;
  match: (p: PromptItem) => boolean;
}

export const COLLECTIONS: Collection[] = [
  {
    id: 'viral-starter',
    title: 'Viral Starter Pack',
    description: 'Scroll-stopping ideas engineered for TikTok, Reels and Shorts. Funny, relatable, loopable.',
    gradient: 'from-fuchsia-600 via-purple-700 to-indigo-900',
    icon: '🔥',
    match: (p) => p.category === 'Viral',
  },
  {
    id: 'cinematic-essentials',
    title: 'Cinematic Essentials',
    description: 'Film-grade shots with dramatic light, camera language and color. Your shortcut to a festival look.',
    gradient: 'from-amber-600 via-orange-700 to-rose-900',
    icon: '🎬',
    match: (p) => p.category === 'Cinematic',
  },
  {
    id: 'seedance-picks',
    title: 'Seedance 2.5 Picks',
    description: 'Prompts tuned for ByteDance Seedance 2.5 — native audio, smooth motion, multi-shot storytelling.',
    gradient: 'from-cyan-600 via-sky-700 to-blue-900',
    icon: '⚡',
    match: (p) => p.model === 'Seedance 2.5' && !p.type,
  },
  {
    id: 'image-masters',
    title: 'Image Masters',
    description: 'Stills that look expensive. Tuned for Seedream, Midjourney, Flux and GPT Image.',
    gradient: 'from-violet-600 via-purple-700 to-fuchsia-900',
    icon: '🖼️',
    match: (p) => p.type === 'image',
  },
  {
    id: 'anime-dreams',
    title: 'Anime Dreams',
    description: 'Painterly worlds, Ghibli warmth and cyberpunk duels — anime prompts with real motion language.',
    gradient: 'from-pink-600 via-rose-700 to-red-900',
    icon: '✨',
    match: (p) => p.category === 'Anime',
  },
  {
    id: 'staff-picks',
    title: "Staff Picks",
    description: 'The finest prompts in the vault, hand-selected by the MastersPrompt studio team.',
    gradient: 'from-yellow-500 via-amber-600 to-yellow-800',
    icon: '💎',
    match: (p) => FEATURED_IDS.includes(p.id),
  },
];

export function promptsInCollection(col: Collection, items: PromptItem[]): PromptItem[] {
  return items.filter(col.match);
}
