// Deterministic per-quote accent so cards feel varied day to day without any
// admin-managed asset table, external images, or per-render randomness — the
// same quote always renders the same theme. Palette stays inside the
// Midnight Teal Glass family (see documentation/DESIGN-SYSTEM.md) so accents
// read as one brand, not a grab-bag of colors.
export type QuoteTheme = { accent: string; glow: string; name: string };

const PALETTE: QuoteTheme[] = [
  { name: "teal", accent: "oklch(0.82 0.14 180)", glow: "oklch(0.82 0.14 180 / 0.16)" },
  { name: "gold", accent: "oklch(0.82 0.12 85)", glow: "oklch(0.82 0.12 85 / 0.14)" },
  { name: "emerald", accent: "oklch(0.78 0.15 155)", glow: "oklch(0.78 0.15 155 / 0.16)" },
  { name: "sky", accent: "oklch(0.80 0.11 220)", glow: "oklch(0.80 0.11 220 / 0.16)" },
  { name: "rose", accent: "oklch(0.75 0.13 20)", glow: "oklch(0.75 0.13 20 / 0.14)" },
  { name: "violet", accent: "oklch(0.75 0.13 300)", glow: "oklch(0.75 0.13 300 / 0.14)" },
  { name: "amber", accent: "oklch(0.80 0.15 65)", glow: "oklch(0.80 0.15 65 / 0.15)" },
  { name: "sea", accent: "oklch(0.78 0.12 200)", glow: "oklch(0.78 0.12 200 / 0.16)" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pickQuoteTheme(quoteId: string): QuoteTheme {
  return PALETTE[hashString(quoteId) % PALETTE.length];
}
