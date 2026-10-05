import { Sparkles, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { QuoteFull } from "@/lib/quotes";

// Explanations are hand-curated per quote (edited in /admin) — deliberately no live AI call,
// so there is no API cost or key to manage.
function pickLocalized(ar: string | null, en: string | null, locale: "ar" | "en") {
  const value = locale === "ar" ? ar : en || ar;
  return value?.trim() ? value : null;
}

export function ExplainSheet({ quote, onClose }: { quote: QuoteFull; onClose: () => void }) {
  const { t, locale } = useI18n();

  const explanation = pickLocalized(quote.explanation_ar, quote.explanation_en, locale);
  const content = explanation
    ? {
        explanation,
        modernContext: pickLocalized(quote.modern_context_ar, quote.modern_context_en, locale),
        action: pickLocalized(quote.action_step_ar, quote.action_step_en, locale),
        reflection: pickLocalized(quote.journal_prompt_ar, quote.journal_prompt_en, locale),
      }
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-[440px] rounded-t-[32px] border-t border-primary/20 p-6 pb-10 shadow-card animate-in slide-in-from-bottom duration-300"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="size-4" />
            </div>
            <h3 className="text-sm font-semibold">{t("curated_insight")}</h3>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-white/5">
            <X className="size-4" />
          </button>
        </div>

        {!content && <p className="py-6 text-sm text-muted-foreground">{t("explain_coming_soon")}</p>}

        {content && (
          <div className="space-y-5">
            <p className="naskh text-[17px] leading-relaxed text-foreground">{content.explanation}</p>

            {content.modernContext && (
              <p className="text-sm leading-relaxed text-foreground/85">{content.modernContext}</p>
            )}

            {content.action && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{t("action_step")}</p>
                <p className="text-sm text-foreground">{content.action}</p>
              </div>
            )}

            {content.reflection && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("reflection_q")}</p>
                <p className="naskh text-[16px] font-medium text-foreground">{content.reflection}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
