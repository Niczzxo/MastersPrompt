import type { PromptItem } from '../data/prompts';
import { seedPrompts } from '../data/prompts';

const USER_KEY = 'promptreel-user-prompts';
const COPIES_KEY = 'promptreel-copies';

export function loadUserPrompts(): PromptItem[] {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function saveUserPrompts(items: PromptItem[]) {
  localStorage.setItem(USER_KEY, JSON.stringify(items));
}

export function loadCopies(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COPIES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

export function bumpCopies(id: string): Record<string, number> {
  const m = loadCopies();
  m[id] = (m[id] || 0) + 1;
  localStorage.setItem(COPIES_KEY, JSON.stringify(m));
  return m;
}

export function getAllPrompts(): PromptItem[] {
  const user = loadUserPrompts();
  const copies = loadCopies();
  const withCopies = (p: PromptItem) => ({ ...p, copies: copies[p.id] || 0 });
  return [...user.map(withCopies), ...seedPrompts.map(withCopies)].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function addUserPrompt(item: PromptItem) {
  const user = loadUserPrompts();
  user.unshift(item);
  saveUserPrompts(user);
}

export function deleteUserPrompt(id: string) {
  saveUserPrompts(loadUserPrompts().filter((p) => p.id !== id));
}
