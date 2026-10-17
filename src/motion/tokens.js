// Shared motion vocabulary. Motion for React uses the cubic-bezier arrays,
// Anime.js uses its named eases. Keep both in step with styles/tokens.css.

export const ease = {
  out: [0.16, 1, 0.3, 1],    // arrivals: fast start, long settle
  inOut: [0.65, 0, 0.35, 1], // transitions between states
  soft: [0.33, 1, 0.68, 1],  // small UI responses
}

export const duration = { fast: 0.35, base: 0.7, slow: 1.1 }

export const spring = {
  cursor: { stiffness: 520, damping: 42, mass: 0.45 },
  magnetic: { stiffness: 220, damping: 16, mass: 0.4 },
}

export const animeEase = { out: 'outExpo', inOut: 'inOutExpo', draw: 'inOutQuart' }

export const stagger = { chars: 0.028, words: 0.06 }
