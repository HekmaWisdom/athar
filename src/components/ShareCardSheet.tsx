import { Download, Loader2, Share2, X, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useI18n, type dict } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
import { checkAndNotifyBadges } from "@/lib/badges";
import { PALETTES, SHARE_TEMPLATES, renderShareCard, type ShareFormat, type ShareTemplate } from "@/lib/share-card";

type Props = { text: string; author: string; onClose: () => void };

const TEMPLATE_LABEL: Record<ShareTemplate, keyof typeof dict> = {
  midnight: "share_template_midnight",
  parchment: "share_template_parchment",
  gold: "share_template_gold",
};

export function ShareCardSheet({ text, author, onClose }: Props) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [template, setTemplate] = useState<ShareTemplate>("midnight");
  const [format, setFormat] = useState<ShareFormat>("story");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    setBlob(null);
    setFailed(false);
    renderShareCard({
      text,
      author,
      locale,
      template,
      format,
      tagline: t("tagline"),
      host: window.location.host,
    })
      .then((b) => {
        if (cancelled) return;
        url = URL.createObjectURL(b);
        setBlob(b);
        setPreviewUrl(url);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, author, locale, template, format]);

  const fileName = "athar-quote.png";
  const shareText = `"${text}"${author ? ` — ${author}` : ""}`;

  const trackShare = async () => {
    await trackEvent("quote_shared", user?.id ?? null, { template, format });
    if (user) checkAndNotifyBadges(user.id, locale);
  };

  const download = () => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    void trackShare();
  };

  const shareImage = async () => {
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: shareText });
        await trackShare();
      } catch (e) {
        if ((e as Error).name !== "AbortError") toast.error(t("something_wrong"));
      }
      return;
    }
    download();
  };

  const copyText = () => navigator.clipboard.writeText(shareText).then(() => toast.success(t("copied")));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full max-w-[440px] rounded-t-[32px] border-t border-primary/20 p-6 pb-8 shadow-card animate-in slide-in-from-bottom duration-300"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("share_card_title")}</h3>
          <button aria-label="close" onClick={onClose} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-white/5">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-4 flex h-[42vh] items-center justify-center overflow-hidden rounded-2xl border border-border bg-black/20">
          {previewUrl && blob && !failed ? (
            <img src={previewUrl} alt="" className="h-full w-full object-contain" />
          ) : failed ? (
            <p className="text-sm text-muted-foreground">{t("something_wrong")}</p>
          ) : (
            <Loader2 className="size-5 animate-spin text-primary" />
          )}
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {SHARE_TEMPLATES.map((key) => (
              <button
                key={key}
                onClick={() => setTemplate(key)}
                aria-label={t(TEMPLATE_LABEL[key])}
                title={t(TEMPLATE_LABEL[key])}
                className={`size-9 rounded-full border-2 transition-all ${template === key ? "border-primary scale-110" : "border-border"}`}
                style={{ background: `linear-gradient(135deg, ${PALETTES[key].bg0} 50%, ${PALETTES[key].accent} 50%)` }}
              />
            ))}
          </div>
          <div className="glass flex rounded-full p-1 text-xs">
            {(["story", "square"] as ShareFormat[]).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`rounded-full px-3 py-1.5 transition-all ${format === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {t(f === "story" ? "share_format_story" : "share_format_square")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={shareImage}
            disabled={!blob}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50"
          >
            <Share2 className="size-4" />
            {t("share_image")}
          </button>
          <button onClick={download} disabled={!blob} aria-label={t("download")} className="glass grid size-12 place-items-center rounded-xl disabled:opacity-50">
            <Download className="size-4" />
          </button>
          <button onClick={copyText} aria-label={t("copy")} className="glass grid size-12 place-items-center rounded-xl">
            <Copy className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
