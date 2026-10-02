export interface PromptItem {
  id: string;
  title: string;
  prompt: string;
  category: string;
  model: string;
  duration: string;
  aspectRatio: string;
  tags: string[];
  /** 'video' is the default when absent */
  type?: 'video' | 'image';
  featured?: boolean;
  image?: string;
  createdAt: string;
  mine?: boolean;
  copies?: number;
}

export const CATEGORIES = [
  'Cinematic',
  'Viral',
  'Nature',
  'Anime',
  'Product',
  'Sci-Fi',
  'Portrait',
  'Travel',
] as const;

export const MODELS = [
  'Seedance 2.5',
  'Seedance 2.0',
  'Veo 3',
  'Sora',
  'Kling',
  'Runway',
  'Pika',
  'Hailuo',
] as const;

export const IMAGE_MODELS = [
  'Seedream 4.0',
  'Midjourney v7',
  'Flux Pro',
  'GPT Image 1',
  'Imagen 4',
] as const;

export const ALL_MODELS = [...MODELS, ...IMAGE_MODELS] as const;

/** Curated staff picks shown on the home page */
export const FEATURED_IDS = [
  'seed-cine-1',
  'seed-viral-1',
  'seed-anime-1',
  'seed-scifi-1',
  'seed-product-1',
  'seed-nature-1',
  'seed-img-5',
  'seed-travel-1',
];

export const CATEGORY_STYLES: Record<string, { gradient: string; icon: string }> = {
  Cinematic: { gradient: 'from-amber-500 via-orange-600 to-rose-700', icon: '🎬' },
  Viral: { gradient: 'from-fuchsia-500 via-purple-600 to-indigo-700', icon: '🔥' },
  Nature: { gradient: 'from-emerald-500 via-teal-600 to-cyan-700', icon: '🌿' },
  Anime: { gradient: 'from-pink-500 via-rose-500 to-violet-700', icon: '✨' },
  Product: { gradient: 'from-sky-500 via-blue-600 to-indigo-700', icon: '📦' },
  'Sci-Fi': { gradient: 'from-indigo-500 via-violet-600 to-cyan-600', icon: '🚀' },
  Portrait: { gradient: 'from-orange-500 via-red-500 to-pink-700', icon: '👤' },
  Travel: { gradient: 'from-teal-500 via-sky-600 to-blue-700', icon: '✈️' },
};

export const seedPrompts: PromptItem[] = [];
