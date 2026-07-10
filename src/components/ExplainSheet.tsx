import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, X, Loader2 } from "lucide-react";
import { explainQuote } from "@/lib/ai.functions";
import { useI18n } from "@/lib/i18n";
import type { QuoteFull } from "@/lib/quotes";
import { useEffect } from "react";

export function ExplainSheet({ quote, onClose }: { quote: QuoteFull; onClose: () => void }) {
  const { t, locale } = useI18n();
  const explain = useServerFn(explainQuote);

  const mut = useMutation({
    mutationFn: () =>
      explain({
        data: {
          text_ar: quote.text_ar,
          text_en: quote.text_en,
          author: quote.author
            ? locale === "ar"
              ? quote.author.name_ar
              : quote.author.name_en || quote.author.name_ar
            : null,
          locale,
        },
      }),
  });

  useEffect(() => {
    mut.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote.id]);

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
            <h3 className="text-sm font-semibold">{t("ai_reasoning")}</h3>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-white/5">
            <X className="size-4" />
          </button>
        </div>

        {mut.isPending && (
          <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>{t("ai_thinking")}</span>
          </div>
        )}

        {mut.isError && (
          <p className="py-4 text-sm text-destructive">
            {t("something_wrong")}. <button onClick={() => mut.mutate()} className="underline">{t("try_again")}</button>
          </p>
        )}

        {mut.data && (
          <div className="space-y-5">
            <p className="naskh text-[17px] leading-relaxed text-foreground">{mut.data.explanation}</p>

            {mut.data.action && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{t("action_step")}</p>
                <p className="text-sm text-foreground">{mut.data.action}</p>
              </div>
            )}

            {mut.data.reflection && (
              <div className="rounded-2xl border border-border bg-surface p-4">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("reflection_q")}</p>
                <p className="naskh text-[16px] font-medium text-foreground">{mut.data.reflection}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
