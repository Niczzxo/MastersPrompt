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

const d = (daysAgo: number) => {
  const t = new Date();
  t.setDate(t.getDate() - daysAgo);
  return t.toISOString();
};

export const seedPrompts: PromptItem[] = [
  // ── Cinematic ──
  {
    id: 'seed-cine-1',
    title: 'Rainy Neon Alley Chase',
    prompt:
      'A lone figure in a long coat sprints through a rain-soaked neon alley at night, reflections shimmering on wet asphalt. Camera tracks low and fast beside them, rain streaking past the lens. Distant sirens, flickering signs in cyan and magenta. Ends on a close-up of their determined face as they turn a corner into blinding white light. Cinematic 35mm film look, shallow depth of field, dramatic rim lighting.',
    category: 'Cinematic',
    model: 'Seedance 2.5',
    duration: '10s',
    aspectRatio: '16:9',
    tags: ['cinematic', 'night', 'rain', 'action'],
    createdAt: d(1),
  },
  {
    id: 'seed-cine-2',
    title: 'Desert Sunrise Standoff',
    prompt:
      'Two silhouetted riders face each other on horseback in a vast desert at sunrise, dust swirling in golden light. Extremely slow push-in from a wide aerial shot to an intense eye-level close-up. Heat shimmer on the horizon, long shadows stretching across rippled sand. Epic orchestral silence broken only by wind. Shot on 70mm, warm color grade, anamorphic lens flares.',
    category: 'Cinematic',
    model: 'Veo 3',
    duration: '15s',
    aspectRatio: '21:9',
    tags: ['cinematic', 'western', 'desert', 'epic'],
    createdAt: d(2),
  },
  {
    id: 'seed-cine-3',
    title: 'Underwater Ballroom Waltz',
    prompt:
      'A couple in elegant formal wear slow-dances inside a sunken ballroom, fabric and hair drifting weightlessly in deep blue water. Shafts of sunlight pierce from above, particles floating like snow. Camera orbits them gracefully in a continuous spiral. Dreamlike, melancholic, ultra-detailed. Muted teal and gold palette, volumetric lighting, photorealistic.',
    category: 'Cinematic',
    model: 'Kling',
    duration: '10s',
    aspectRatio: '16:9',
    tags: ['cinematic', 'underwater', 'dreamlike', 'romance'],
    createdAt: d(3),
  },
  // ── Viral ──
  {
    id: 'seed-viral-1',
    title: 'POV: Your Cat Pays Rent',
    prompt:
      'POV handheld phone footage: a cat in a tiny business suit sits at a desk counting miniature dollar bills, then slides a stack toward the camera with a serious expression. Quick zoom on the cash, comedic record-scratch freeze frame. Bright apartment lighting, vertical 9:16 framing, slightly shaky authentic phone aesthetic. Funny, shareable, meme energy.',
    category: 'Viral',
    model: 'Seedance 2.5',
    duration: '8s',
    aspectRatio: '9:16',
    tags: ['viral', 'funny', 'cat', 'tiktok'],
    createdAt: d(1),
  },
  {
    id: 'seed-viral-2',
    title: 'Expectation vs Reality: Morning Routine',
    prompt:
      'Split-screen vertical video. Left side: glamorous influencer morning routine, smoothie bowls, sunrise yoga, perfect hair in slow motion. Right side: same person hitting snooze five times, hair a mess, spilling coffee, running for the bus. Fast cuts, trending upbeat audio sync, punchy captions appearing on each side. Relatable comedy, high energy.',
    category: 'Viral',
    model: 'Pika',
    duration: '12s',
    aspectRatio: '9:16',
    tags: ['viral', 'comedy', 'relatable', 'reels'],
    createdAt: d(4),
  },
  {
    id: 'seed-viral-3',
    title: 'Tiny Chef Cooks Giant Burger',
    prompt:
      'A miniature chef, six inches tall, climbs a gigantic gourmet burger with a tiny rope, then cooks a tiny egg on top using a magnifying glass and sunlight. Extreme macro photography style, steam rising, cheese pull in slow motion. Whimsical, satisfying, oddly realistic textures. Bright kitchen lighting, playful tone, loopable ending.',
    category: 'Viral',
    model: 'Hailuo',
    duration: '8s',
    aspectRatio: '9:16',
    tags: ['viral', 'miniature', 'food', 'satisfying'],
    createdAt: d(5),
  },
  // ── Nature ──
  {
    id: 'seed-nature-1',
    title: 'Aurora Over Frozen Fjord',
    prompt:
      'Time-lapse style shot of vivid green and violet aurora borealis dancing over a mirror-still frozen fjord, snow-capped peaks framing the scene. Stars wheeling slowly overhead, occasional shooting star. A lone cabin window glows warm in the distance. Camera drifts almost imperceptibly forward. Breathtaking, serene, ultra high detail night photography look.',
    category: 'Nature',
    model: 'Seedance 2.5',
    duration: '15s',
    aspectRatio: '16:9',
    tags: ['nature', 'aurora', 'night', 'landscape'],
    createdAt: d(2),
  },
  {
    id: 'seed-nature-2',
    title: 'Monarch Migration Close-Up',
    prompt:
      'Extreme macro of a monarch butterfly emerging from its chrysalis, wings unfolding in exquisite slow motion, morning dew sparkling. Background of blurred wildflowers swaying gently. Shallow depth of field, golden hour backlight making the wings glow translucent orange. Intimate, miraculous, nature-documentary quality.',
    category: 'Nature',
    model: 'Veo 3',
    duration: '10s',
    aspectRatio: '16:9',
    tags: ['nature', 'macro', 'butterfly', 'documentary'],
    createdAt: d(6),
  },
  {
    id: 'seed-nature-3',
    title: 'Elephant Herd at Waterhole',
    prompt:
      'A herd of elephants approaches a savanna waterhole at dusk, calves staying close to their mothers, dust glowing orange in the low sun. Birds scatter as the lead elephant sprays water with its trunk, droplets catching the light. Wide cinematic shot slowly pushing in. Powerful, tender, National Geographic style realism.',
    category: 'Nature',
    model: 'Kling',
    duration: '12s',
    aspectRatio: '16:9',
    tags: ['nature', 'wildlife', 'elephant', 'savanna'],
    createdAt: d(7),
  },
  // ── Anime ──
  {
    id: 'seed-anime-1',
    title: 'Sky-Whale Over Floating City',
    prompt:
      'A colossal sky-whale with glowing patterns glides serenely above a floating city of lantern-lit islands at twilight, waterfalls pouring off the edges into clouds below. A small girl stands on a rooftop, hair whipping in the wind, reaching toward it. Studio Ghibli-inspired painterly anime style, rich purples and golds, sense of wonder, fluid 2D animation motion.',
    category: 'Anime',
    model: 'Seedance 2.5',
    duration: '10s',
    aspectRatio: '16:9',
    tags: ['anime', 'fantasy', 'ghibli', 'whale'],
    createdAt: d(3),
  },
  {
    id: 'seed-anime-2',
    title: 'Cyber Samurai Duel',
    prompt:
      'Two cyber-samurai clash on a rain-slicked Tokyo rooftop at night, neon katanas leaving light trails, sparks flying in slow motion. Dynamic anime fight choreography with dramatic speed lines and impact frames. One fighter leaps high as lightning splits the sky behind them. High-contrast cel-shaded anime style, electric blue and hot pink palette.',
    category: 'Anime',
    model: 'Runway',
    duration: '8s',
    aspectRatio: '16:9',
    tags: ['anime', 'cyberpunk', 'fight', 'action'],
    createdAt: d(8),
  },
  {
    id: 'seed-anime-3',
    title: 'Cozy Ramen Shop in Snow',
    prompt:
      'Inside a tiny ramen shop during a snowstorm, steam rising from bowls, a cat sleeping on the counter, warm lantern light against frosted windows. Outside, snow falls thick and silent. Lo-fi anime aesthetic, soft muted colors, gentle looping motion — steam curls, snow drifts, cat tail twitches. Peaceful, nostalgic, perfect loop.',
    category: 'Anime',
    model: 'Pika',
    duration: '10s',
    aspectRatio: '1:1',
    tags: ['anime', 'lofi', 'cozy', 'loop'],
    createdAt: d(9),
  },
  // ── Product ──
  {
    id: 'seed-product-1',
    title: 'Perfume Bottle: Liquid Gold Reveal',
    prompt:
      'Luxury perfume bottle rotating on a black reflective surface, a ribbon of liquid gold swirling around it in slow motion, petals drifting through the air. Macro shots of the glass catching light, logo glinting. Dark moody studio lighting with a single dramatic spotlight. Ultra-premium commercial aesthetic, 8k product photography motion.',
    category: 'Product',
    model: 'Seedance 2.5',
    duration: '8s',
    aspectRatio: '16:9',
    tags: ['product', 'luxury', 'perfume', 'commercial'],
    createdAt: d(4),
  },
  {
    id: 'seed-product-2',
    title: 'Sneaker Explosion Assembly',
    prompt:
      'A sneaker explodes into its individual components in mid-air — sole, laces, eyelets, fabric panels floating in perfect formation — then snaps back together with a satisfying click. Studio white background, crisp shadows, hyper-detailed product render style. Fast, punchy, engineered precision feel. Ideal for a techwear ad.',
    category: 'Product',
    model: 'Kling',
    duration: '6s',
    aspectRatio: '1:1',
    tags: ['product', 'sneaker', 'exploded-view', 'ad'],
    createdAt: d(10),
  },
  {
    id: 'seed-product-3',
    title: 'Smartwatch: Morning Light',
    prompt:
      'A sleek smartwatch on a wrist catches the first rays of sunrise through bedroom blinds, screen lighting up with notifications in a smooth UI animation. Camera glides from macro of the watch face pulling back to a lifestyle shot of someone starting their day. Clean, aspirational tech commercial style, soft natural light, shallow depth of field.',
    category: 'Product',
    model: 'Veo 3',
    duration: '10s',
    aspectRatio: '16:9',
    tags: ['product', 'tech', 'watch', 'lifestyle'],
    createdAt: d(11),
  },
  // ── Sci-Fi ──
  {
    id: 'seed-scifi-1',
    title: 'Generation Ship Awakening',
    prompt:
      'Interior of a colossal generation ship waking from centuries of sleep: rows of cryo-pods opening with hissing vapor, lights cascading on down an endless corridor, a massive viewport revealing a swirling nebula. One astronaut floats weightlessly toward the viewport, silhouetted. Vast scale, cold blue palette with warm emergency accents, hard sci-fi realism.',
    category: 'Sci-Fi',
    model: 'Seedance 2.5',
    duration: '15s',
    aspectRatio: '21:9',
    tags: ['scifi', 'space', 'spaceship', 'epic'],
    createdAt: d(5),
  },
  {
    id: 'seed-scifi-2',
    title: 'Neon Market on Mars',
    prompt:
      'A bustling street market inside a Martian dome city: vendors selling glowing alien fruit, robots haggling with humans in exosuits, dust devils swirling outside the glass. Hover-trams glide overhead. Camera weaves through the crowd at eye level. Dense, lived-in sci-fi world, Blade Runner meets street food documentary, rich detail everywhere.',
    category: 'Sci-Fi',
    model: 'Sora',
    duration: '12s',
    aspectRatio: '16:9',
    tags: ['scifi', 'mars', 'cyberpunk', 'market'],
    createdAt: d(12),
  },
  {
    id: 'seed-scifi-3',
    title: 'Time Fracture in the Lab',
    prompt:
      'A scientist reaches toward a floating fractured sphere of cracked time — shards showing different moments: a dinosaur, a medieval castle, a future city — orbiting in a dark lab. The shards ripple as her hand nears, warping the air. Eerie blue glow, floating dust, slow ominous camera push. Mind-bending, high-concept sci-fi.',
    category: 'Sci-Fi',
    model: 'Runway',
    duration: '10s',
    aspectRatio: '16:9',
    tags: ['scifi', 'time', 'lab', 'concept'],
    createdAt: d(13),
  },
  // ── Portrait ──
  {
    id: 'seed-portrait-1',
    title: 'Golden Hour Muse',
    prompt:
      'Close-up portrait of a woman with freckles and wind-swept curly hair, golden hour sunlight flaring across the lens, city bokeh melting behind her. She laughs mid-frame, eyes crinkling, utterly candid. Skin texture hyper-detailed, film grain, 85mm lens look. Warm, joyful, editorial fashion-film aesthetic.',
    category: 'Portrait',
    model: 'Seedance 2.5',
    duration: '8s',
    aspectRatio: '9:16',
    tags: ['portrait', 'fashion', 'golden-hour', 'editorial'],
    createdAt: d(6),
  },
  {
    id: 'seed-portrait-2',
    title: 'Ink and Motion: Dancer',
    prompt:
      'A contemporary dancer moves through clouds of black ink suspended in water, each gesture trailing ribbons of darkness that bloom and dissolve. Shot against pure white, high-speed capture of fabric and ink interplay. Striking monochrome with a single red accent on her costume. Artistic, powerful, gallery-film quality.',
    category: 'Portrait',
    model: 'Kling',
    duration: '10s',
    aspectRatio: '16:9',
    tags: ['portrait', 'dance', 'ink', 'art'],
    createdAt: d(14),
  },
  {
    id: 'seed-portrait-3',
    title: 'Elder Craftsman Hands',
    prompt:
      'Weathered hands of an elderly woodcarver shaping a small bird from cedar, shavings curling away, afternoon light raking across the workbench. Camera stays tight on the hands, every wrinkle and scar telling a story. Quiet, reverent, documentary intimacy. Warm natural palette, tactile detail, slow deliberate motion.',
    category: 'Portrait',
    model: 'Veo 3',
    duration: '10s',
    aspectRatio: '16:9',
    tags: ['portrait', 'craft', 'hands', 'documentary'],
    createdAt: d(15),
  },
  // ── Travel ──
  {
    id: 'seed-travel-1',
    title: 'Cliffside Village Flyover',
    prompt:
      'FPV drone dives off a cliff and sweeps through a Mediterranean village of whitewashed houses and blue domes, threading narrow alleys, bursting out over a turquoise harbor with bobbing boats. Seagulls scatter. One continuous breathtaking take, sunrise light, speed ramps at the reveal. Wanderlust in its purest form.',
    category: 'Travel',
    model: 'Seedance 2.5',
    duration: '12s',
    aspectRatio: '16:9',
    tags: ['travel', 'drone', 'fpv', 'village'],
    createdAt: d(7),
  },
  {
    id: 'seed-travel-2',
    title: 'Night Train Through Alps',
    prompt:
      'View from a night train window speeding through the snow-covered Alps: moonlit peaks flashing past, tiny lit villages in valleys below, reflections of the warm cabin interior ghosting on the glass. Gentle rhythmic motion, occasional tunnel darkness. Cozy, cinematic, deeply nostalgic travel mood.',
    category: 'Travel',
    model: 'Hailuo',
    duration: '10s',
    aspectRatio: '16:9',
    tags: ['travel', 'train', 'alps', 'night'],
    createdAt: d(16),
  },
  {
    id: 'seed-travel-3',
    title: 'Floating Market Dawn',
    prompt:
      'Aerial drift over a Southeast Asian floating market at dawn: dozens of wooden boats laden with tropical fruit, vendors in conical hats, mist rising off the water, golden light breaking through palm silhouettes. Camera descends smoothly to water level, gliding between boats. Vibrant, alive, documentary travel-film beauty.',
    category: 'Travel',
    model: 'Kling',
    duration: '12s',
    aspectRatio: '16:9',
    tags: ['travel', 'market', 'aerial', 'asia'],
    createdAt: d(17),
  },
  // ── Image prompts ──
  {
    id: 'seed-img-1',
    title: 'Fallen Empire Throne Room',
    prompt:
      'Vast abandoned throne room of a fallen empire, shafts of dusty light through a shattered dome, vines reclaiming marble columns, a cracked golden throne covered in moss. Epic scale, hyper-detailed digital painting, cinematic lighting, 8k, moody atmosphere, intricate architecture.',
    category: 'Cinematic',
    model: 'Flux Pro',
    duration: '1344×768',
    aspectRatio: '16:9',
    tags: ['image', 'throne', 'ruins', 'epic'],
    type: 'image',
    createdAt: d(2),
  },
  {
    id: 'seed-img-2',
    title: 'Neon Geisha Portrait',
    prompt:
      'Striking portrait of a geisha with holographic neon face paint, rain droplets on skin, Tokyo neon signs bokeh behind, cyberpunk elegance. Ultra-detailed skin texture, dramatic rim light in cyan and magenta, 85mm photography look, editorial fashion aesthetic.',
    category: 'Portrait',
    model: 'Midjourney v7',
    duration: '1024×1024',
    aspectRatio: '1:1',
    tags: ['image', 'portrait', 'cyberpunk', 'neon'],
    type: 'image',
    createdAt: d(3),
  },
  {
    id: 'seed-img-3',
    title: 'Watch Macro: Time Frozen',
    prompt:
      'Extreme macro of a luxury chronograph watch face, water droplet suspended mid-air above the glass, gears visible through skeleton dial, dramatic studio lighting on black background. Advertising photography, tack-sharp detail, reflections, premium commercial style.',
    category: 'Product',
    model: 'GPT Image 1',
    duration: '1024×1024',
    aspectRatio: '1:1',
    tags: ['image', 'product', 'watch', 'macro'],
    type: 'image',
    createdAt: d(4),
  },
  {
    id: 'seed-img-4',
    title: 'Misty Fjord Sunrise',
    prompt:
      'Norwegian fjord at sunrise, layers of mist drifting between pine-covered cliffs, mirror-calm water reflecting pink and gold sky, a lone red cabin on the shore. Landscape photography, long exposure feel, serene, ultra high detail, national geographic quality.',
    category: 'Nature',
    model: 'Imagen 4',
    duration: '1920×1080',
    aspectRatio: '16:9',
    tags: ['image', 'landscape', 'fjord', 'sunrise'],
    type: 'image',
    createdAt: d(5),
  },
  {
    id: 'seed-img-5',
    title: 'Spirit Train Across the Sky',
    prompt:
      'A vintage steam train gliding across railway tracks woven through glowing clouds at dusk, spirit lanterns floating alongside, distant floating islands. Ghibli-inspired painterly anime illustration, dreamy purples and golds, sense of wonder, highly detailed.',
    category: 'Anime',
    model: 'Seedream 4.0',
    duration: '1344×768',
    aspectRatio: '16:9',
    tags: ['image', 'anime', 'train', 'fantasy'],
    type: 'image',
    createdAt: d(1),
  },
  {
    id: 'seed-img-6',
    title: 'Derelict Space Station',
    prompt:
      'Interior of a derelict space station, torn solar panels visible through a breached hull, floating debris and frozen vapor, Earth glowing through the rupture. Hard sci-fi concept art, cold blue palette with emergency orange accents, immense detail, cinematic composition.',
    category: 'Sci-Fi',
    model: 'Flux Pro',
    duration: '1920×1080',
    aspectRatio: '16:9',
    tags: ['image', 'scifi', 'space', 'concept-art'],
    type: 'image',
    createdAt: d(6),
  },
  {
    id: 'seed-img-7',
    title: 'Santorini Blue Hour',
    prompt:
      'Santorini caldera at blue hour, whitewashed houses cascading down cliffs, iconic blue domes glowing warm from within, deep indigo sea below, first stars appearing. Travel photography, perfect symmetry, rich colors, postcard-perfect but real.',
    category: 'Travel',
    model: 'Imagen 4',
    duration: '768×1344',
    aspectRatio: '9:16',
    tags: ['image', 'travel', 'santorini', 'blue-hour'],
    type: 'image',
    createdAt: d(7),
  },
  {
    id: 'seed-img-8',
    title: 'Tiny Astronaut, Giant Donut',
    prompt:
      'A tiny astronaut in a white spacesuit planting a flag on top of a gigantic pink frosted donut floating in space, sprinkles drifting like stars, Earth in the background. Whimsical surrealism, vibrant colors, playful, ultra-detailed, meme-worthy.',
    category: 'Viral',
    model: 'GPT Image 1',
    duration: '1024×1024',
    aspectRatio: '1:1',
    tags: ['image', 'viral', 'surreal', 'funny'],
    type: 'image',
    createdAt: d(8),
  },

];
