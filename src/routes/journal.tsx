import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BookOpen, Lock, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { addJournalEntry, ensureJournalSalt, getProfile, listJournal } from "@/lib/quotes";
import { trackEvent } from "@/lib/analytics";
import { checkAndNotifyBadges } from "@/lib/badges";
import {
  cacheJournalKey,
  clearCachedJournalKey,
  decryptJournalText,
  deriveJournalKey,
  encryptJournalText,
  generateSalt,
  getCachedJournalKey,
} from "@/lib/journal-crypto";
import { toast } from "sonner";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "يومياتي · Journal — Athar" },
      { name: "description", content: "دوّن تأملاتك اليومية." },
    ],
  }),
  component: JournalPage,
});

function JournalPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);

  const [journalKey, setJournalKey] = useState<CryptoKey | null>(null);
  const [keyChecked, setKeyChecked] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [unlockError, setUnlockError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [decrypted, setDecrypted] = useState<Map<string, string>>(new Map());

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => (user ? getProfile(user.id) : Promise.resolve(null)),
    enabled: !!user,
  });

  const entries = useQuery({
    queryKey: ["journal", user?.id],
    queryFn: () => (user ? listJournal(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  useEffect(() => {
    getCachedJournalKey().then((k) => {
      setJournalKey(k);
      setKeyChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!journalKey || !entries.data) return;
    let cancelled = false;
    (async () => {
      const map = new Map<string, string>();
      for (const e of entries.data) {
        try {
          map.set(e.id, await decryptJournalText(journalKey, e.ciphertext, e.iv));
        } catch {
          if (!cancelled) {
            clearCachedJournalKey();
            setJournalKey(null);
            toast.error(t("journal_unlock_wrong"));
          }
          return;
        }
      }
      if (!cancelled) setDecrypted(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [journalKey, entries.data, t]);

  async function handleUnlock() {
    if (!user || !passphrase.trim()) return;
    setUnlocking(true);
    setUnlockError(false);
    try {
      let salt = profile.data?.journal_salt ?? null;
      const isNew = !salt;
      if (!salt) salt = generateSalt();
      const key = await deriveJournalKey(passphrase, salt);

      if (isNew) {
        await ensureJournalSalt(user.id, salt);
        void qc.invalidateQueries({ queryKey: ["profile", user.id] });
      } else if (entries.data && entries.data.length > 0) {
        // Wrong passphrase derives a different key silently — only decrypting
        // an existing entry actually proves it's correct (AES-GCM auth tag check).
        await decryptJournalText(key, entries.data[0]!.ciphertext, entries.data[0]!.iv);
      }

      await cacheJournalKey(key);
      setJournalKey(key);
      setPassphrase("");
    } catch {
      setUnlockError(true);
    } finally {
      setUnlocking(false);
    }
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!journalKey) throw new Error("locked");
      const { ciphertext, iv } = await encryptJournalText(journalKey, content);
      return addJournalEntry(user!.id, ciphertext, iv);
    },
    onSuccess: () => {
      setContent("");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["journal"] });
      toast.success(locale === "ar" ? "تم الحفظ" : "Saved");
      void trackEvent("journal_entry_created", user!.id).then(() => checkAndNotifyBadges(user!.id, locale));
    },
    onError: () => toast.error(t("something_wrong")),
  });

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center px-5 pt-20">
          <div className="glass w-full rounded-3xl p-8 text-center">
            <BookOpen className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">{t("journal_title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "ar" ? "سجّل دخولك لتبدأ التدوين" : "Sign in to start journaling"}
            </p>
            <Link
              to="/auth"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t("sign_in")}
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!journalKey) {
    const stillLoading = !keyChecked || profile.isLoading || (!!profile.data?.journal_salt && entries.isLoading);
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center px-5 pt-20">
          <div className="glass w-full rounded-3xl p-8 text-center">
            <Lock className="mx-auto size-8 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">{t("journal_lock_title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.data?.journal_salt ? t("journal_lock_desc_existing") : t("journal_lock_desc_new")}
            </p>
            {!stillLoading && (
              <div className="mt-5 space-y-2">
                <input
                  type="password"
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                    setUnlockError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  placeholder={t("journal_lock_placeholder")}
                  className="w-full rounded-2xl bg-input p-3 text-center text-sm outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                {unlockError && <p className="text-xs text-destructive">{t("journal_unlock_wrong")}</p>}
                <button
                  disabled={!passphrase.trim() || unlocking}
                  onClick={handleUnlock}
                  className="w-full rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  {t("journal_unlock")}
                </button>
              </div>
            )}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="flex items-center justify-between px-5 pt-10 pb-4">
        <div>
          <h1 className="text-2xl font-bold">{t("journal_title")}</h1>
          <p className="text-sm text-muted-foreground">{entries.data?.length ?? 0}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="glass-strong grid size-11 place-items-center rounded-full text-primary shadow-glow"
          aria-label={t("write_now")}
        >
          <Plus className="size-5" />
        </button>
      </header>

      <main className="flex-1 space-y-3 px-5 pb-6">
        {open && (
          <div className="glass-strong space-y-3 rounded-3xl p-5">
            <p className="text-xs text-muted-foreground">{t("journal_prompt")}</p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("journal_placeholder")}
              className="w-full resize-none rounded-2xl bg-input p-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
              rows={5}
              dir="auto"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                disabled={!content.trim() || mut.isPending}
                onClick={() => mut.mutate()}
                className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {t("save")}
              </button>
            </div>
          </div>
        )}

        {entries.data?.length === 0 && !open && (
          <div className="glass rounded-3xl p-8 text-center">
            <p className="text-sm font-medium">{t("no_entries")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("first_entry")}</p>
          </div>
        )}

        {entries.data?.map((e) => (
          <article key={e.id} className="glass rounded-3xl p-5">
            <p className="text-[10px] text-muted-foreground mono">
              {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG-u-nu-arab" : "en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(e.created_at))}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{decrypted.get(e.id) ?? "…"}</p>
          </article>
        ))}
      </main>
    </AppShell>
  );
}
