import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { addJournalEntry, listJournal } from "@/lib/quotes";
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

  const entries = useQuery({
    queryKey: ["journal", user?.id],
    queryFn: () => (user ? listJournal(user.id) : Promise.resolve([])),
    enabled: !!user,
  });

  const mut = useMutation({
    mutationFn: () => addJournalEntry(user!.id, content),
    onSuccess: () => {
      setContent("");
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["journal"] });
      toast.success(locale === "ar" ? "تم الحفظ" : "Saved");
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
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{e.content}</p>
          </article>
        ))}
      </main>
    </AppShell>
  );
}
