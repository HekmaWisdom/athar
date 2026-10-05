import { Heart, Share2, Sparkles, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ShareCardSheet } from "@/components/ShareCardSheet";
import type { QuoteFull } from "@/lib/quotes";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { toggleFavorite } from "@/lib/quotes";
import { pickQuoteTheme } from "@/lib/quote-theme";
import { trackEvent } from "@/lib/analytics";
import { checkAndNotifyBadges } from "@/lib/badges";

type Props = {
  quote: QuoteFull;
  favored?: boolean;
  onExplain?: () => void;
  showDate?: boolean;
};

export function QuoteCard({ quote, favored: initialFav, onExplain, showDate = true }: Props) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [fav, setFav] = useState(!!initialFav);
  const [shareOpen, setShareOpen] = useState(false);

  const text = locale === "ar" ? quote.text_ar : quote.text_en || quote.text_ar;
  const authorName = quote.author
    ? locale === "ar"
      ? quote.author.name_ar
      : quote.author.name_en || quote.author.name_ar
    : "";
  const catName = quote.category
    ? locale === "ar"
      ? quote.category.name_ar
      : quote.category.name_en
    : "";

  const theme = pickQuoteTheme(quote.id);

  const dateLabel = showDate
    ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-arab" : "en-US", {
        day: "numeric",
        month: "long",
      }).format(new Date())
    : "";

  const toggleFav = async () => {
    if (!user) {
      toast.error(locale === "ar" ? "سجّل دخولك لحفظ الحكم" : "Sign in to save wisdoms");
      return;
    }
    const next = !fav;
    setFav(next);
    try {
      await toggleFavorite(user.id, quote.id, next);
      if (next) {
        await trackEvent("quote_favorited", user.id, { quote_id: quote.id });
        checkAndNotifyBadges(user.id, locale);
      }
    } catch {
      setFav(!next);
      toast.error(t("something_wrong"));
    }
  };

  return (
    <article className="relative">
      <div
        className="absolute -inset-6 -z-10 rounded-[40px] blur-3xl opacity-60"
        style={{ backgroundColor: theme.glow }}
      />
      <div className="glass-strong relative overflow-hidden rounded-[32px] p-7 shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <span
            className="rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ borderColor: `color-mix(in oklch, ${theme.accent} 30%, transparent)`, color: theme.accent }}
          >
            {t("today_wisdom")}
          </span>
          {dateLabel && (
            <span className="mono text-[10px]" style={{ color: `color-mix(in oklch, ${theme.accent} 50%, transparent)` }}>
              {dateLabel}
            </span>
          )}
        </div>

        <blockquote className="naskh text-pretty text-[27px] font-medium leading-[1.9] text-foreground">
          &ldquo;{text}&rdquo;
        </blockquote>

        <div className="mt-7 flex flex-col gap-1">
          {authorName && (
            <p className="text-sm font-medium" style={{ color: `color-mix(in oklch, ${theme.accent} 85%, white)` }}>
              {authorName}
            </p>
          )}
          {catName && (
            <p className="flex items-center gap-1.5 text-xs" style={{ color: `color-mix(in oklch, ${theme.accent} 50%, transparent)` }}>
              <span>{quote.category?.icon}</span>
              <span>{catName}</span>
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
          <div className="flex items-center gap-1">
            <IconButton onClick={toggleFav} active={fav} label={t("save")}>
              <Heart className={`size-4 ${fav ? "fill-primary text-primary" : ""}`} />
            </IconButton>
            <IconButton onClick={() => setShareOpen(true)} label={t("share")}>
              <Share2 className="size-4" />
            </IconButton>
            <IconButton onClick={() => navigator.clipboard.writeText(text).then(() => toast.success(t("copied")))} label={t("copy")}>
              <Copy className="size-4" />
            </IconButton>
          </div>
          {onExplain && (
            <button
              onClick={onExplain}
              className="glass flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <Sparkles className="size-3.5" />
              <span>{t("reflect_deeply")}</span>
            </button>
          )}
        </div>
      </div>
      {shareOpen && <ShareCardSheet text={text} author={authorName} onClose={() => setShareOpen(false)} />}
    </article>
  );
}

function IconButton({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  label: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-full transition-all ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
