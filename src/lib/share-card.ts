export type ShareTemplate = "midnight" | "parchment" | "gold";
export type ShareFormat = "story" | "square";

export const SHARE_TEMPLATES: ShareTemplate[] = ["midnight", "parchment", "gold"];

// Canvas can't read CSS variables, so palettes are hex mirrors of the design-system tokens
// (midnight = :root, parchment = .light, gold = slate + gold accent from DESIGN-SYSTEM.md).
type Palette = { bg0: string; bg1: string; glow: string; text: string; accent: string; muted: string };

export const PALETTES: Record<ShareTemplate, Palette> = {
  midnight: { bg0: "#0a1d20", bg1: "#0d2a2c", glow: "#14b8a6", text: "#eafaf6", accent: "#5fe3d0", muted: "#8fb8b1" },
  parchment: { bg0: "#f7f3e8", bg1: "#efe8d6", glow: "#1f8a86", text: "#12282b", accent: "#1f8a86", muted: "#5d6f6c" },
  gold: { bg0: "#0b1420", bg1: "#101c2c", glow: "#c9a227", text: "#f6f1e3", accent: "#d4af37", muted: "#9aa3ad" },
};

export type ShareCardOptions = {
  text: string;
  author: string;
  locale: "ar" | "en";
  template: ShareTemplate;
  format: ShareFormat;
  tagline: string;
  host: string;
};

const RLM = "‏";
const hasRtl = (s: string) => /[֐-ࣿ]/.test(s);

const WIDTH = 1080;
const SERIF = '"Amiri", "Noto Naskh Arabic", serif';
const SANS = '"Noto Sans Arabic", "Inter", sans-serif';

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function ensureFonts(text: string, extra: string) {
  try {
    await Promise.all([
      document.fonts.load("700 64px Amiri", text),
      document.fonts.load("600 36px 'Noto Sans Arabic'", extra),
    ]);
  } catch {
    // fall back to whatever the browser already has
  }
}

export async function renderShareCard(opts: ShareCardOptions): Promise<Blob> {
  const { text, author, locale, template, format, tagline, host } = opts;
  const p = PALETTES[template];
  const H = format === "story" ? 1920 : 1080;
  const isAr = locale === "ar";
  const brand = isAr ? "أثر" : "Athar";

  await ensureFonts(text, `${author} ${brand} ${tagline} ${host}`);

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, p.bg0);
  bg.addColorStop(1, p.bg1);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, H);

  for (const [cx, cy, alpha] of [
    [WIDTH * 0.2, 0, "38"],
    [WIDTH * 0.85, H, "2a"],
  ] as const) {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, WIDTH * 0.9);
    glow.addColorStop(0, `${p.glow}${alpha}`);
    glow.addColorStop(1, `${p.glow}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, H);
  }

  ctx.strokeStyle = `${p.accent}40`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(48, 48, WIDTH - 96, H - 96, 44);
  ctx.stroke();

  // Direction follows the quote's own script, not the UI language: an Arabic quote shown in the
  // English UI must still lay out RTL. The RLM anchors trailing punctuation (،) on browsers that
  // resolve the paragraph direction themselves.
  const quoteRtl = hasRtl(text);
  const authorRtl = hasRtl(author);
  const bidi = (s: string, rtl: boolean) => (rtl ? `${RLM}${s}${RLM}` : s);
  ctx.direction = quoteRtl ? "rtl" : "ltr";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const padX = 140;
  const maxWidth = WIDTH - padX * 2;
  const regionTop = format === "story" ? 320 : 200;
  const regionBottom = H - (format === "story" ? 420 : 300);
  const authorBlock = author ? 130 : 0;
  const maxTextHeight = regionBottom - regionTop - authorBlock;

  let size = 96;
  let lines: string[] = [];
  const lineHeight = 1.75;
  for (; size >= 40; size -= 4) {
    ctx.font = `700 ${size}px ${SERIF}`;
    lines = wrapLines(ctx, text, maxWidth);
    if (lines.length * size * lineHeight <= maxTextHeight) break;
  }

  // Narrow the wrap width while the line count stays the same, so the last line isn't a lone word.
  let balancedWidth = maxWidth;
  while (balancedWidth > maxWidth * 0.5) {
    const trial = wrapLines(ctx, text, balancedWidth - 24);
    if (trial.length !== lines.length) break;
    balancedWidth -= 24;
    lines = trial;
  }

  const blockHeight = lines.length * size * lineHeight + authorBlock;
  const startY = regionTop + (regionBottom - regionTop - blockHeight) / 2;

  ctx.fillStyle = p.accent;
  ctx.fillRect(WIDTH / 2 - 40, startY - 60, 80, 4);

  ctx.font = `700 ${size}px ${SERIF}`;
  ctx.fillStyle = p.text;
  lines.forEach((line, i) => {
    ctx.fillText(bidi(line, quoteRtl), WIDTH / 2, startY + i * size * lineHeight + (size * lineHeight) / 2);
  });

  if (author) {
    ctx.direction = authorRtl ? "rtl" : "ltr";
    ctx.font = `600 44px ${SANS}`;
    ctx.fillStyle = p.accent;
    ctx.fillText(bidi(`— ${author}`, authorRtl), WIDTH / 2, startY + lines.length * size * lineHeight + 70);
  }

  ctx.direction = isAr ? "rtl" : "ltr";

  const footerY = H - (format === "story" ? 190 : 150);
  ctx.font = `700 84px ${SERIF}`;
  ctx.fillStyle = p.text;
  ctx.fillText(brand, WIDTH / 2, footerY);
  ctx.font = `500 30px ${SANS}`;
  ctx.fillStyle = p.muted;
  ctx.fillText(`${tagline}  ·  ${host}`, WIDTH / 2, footerY + 72);

  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to render card"))), "image/png");
  });
}
