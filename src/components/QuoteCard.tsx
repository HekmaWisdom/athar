import { Heart, Share2, Sparkles, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { QuoteFull } from "@/lib/quotes";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { toggleFavorite } from "@/lib/quotes";

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
  const [copied, setCopied] = useState(false);

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
    } catch {
      setFav(!next);
      toast.error(t("something_wrong"));
    }
  };

  const share = async () => {
    const shareText = `"${text}"${authorName ? ` — ${authorName}` : ""}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Athar", text: shareText });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success(t("copied"));
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <article className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[40px] bg-primary/10 blur-3xl opacity-60" />
      <div className="glass-strong relative overflow-hidden rounded-[32px] p-7 shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <span className="rounded-full border border-primary/30 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
            {t("today_wisdom")}
          </span>
          {dateLabel && <span className="mono text-[10px] text-primary/50">{dateLabel}</span>}
        </div>

        <blockquote className="naskh text-pretty text-[27px] font-medium leading-[1.65] text-foreground">
          &ldquo;{text}&rdquo;
        </blockquote>

        <div className="mt-7 flex flex-col gap-1">
          {authorName && <p className="text-sm font-medium text-primary/85">{authorName}</p>}
          {catName && (
            <p className="flex items-center gap-1.5 text-xs text-primary/50">
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
            <IconButton onClick={share} label={t("share")}>
              {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
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
