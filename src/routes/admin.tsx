import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, ShieldCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإدارة · Admin — Athar" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const { locale } = useI18n();
  const nav = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState<"quotes" | "authors" | "categories">("quotes");
  const [editing, setEditing] = useState<null | {
    id?: string;
    text_ar: string;
    text_en: string;
    author_id: string | null;
    category_id: string | null;
    published: boolean;
    explanation_ar: string;
    explanation_en: string;
    modern_context_ar: string;
    modern_context_en: string;
    action_step_ar: string;
    action_step_en: string;
    journal_prompt_ar: string;
    journal_prompt_en: string;
    is_premium_explanation: boolean;
  }>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) void nav({ to: "/" });
  }, [user, isAdmin, loading, nav]);

  const quotes = useQuery({
    queryKey: ["admin-quotes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("quotes")
        .select(
          "id, text_ar, text_en, published, author_id, category_id, explanation_ar, explanation_en, modern_context_ar, modern_context_en, action_step_ar, action_step_en, journal_prompt_ar, journal_prompt_en, is_premium_explanation, author:authors(name_ar), category:categories(name_ar)",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const authors = useQuery({
    queryKey: ["admin-authors"],
    queryFn: async () => (await supabase.from("authors").select("*").order("name_ar")).data ?? [],
  });

  const cats = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const payload = {
        text_ar: editing.text_ar,
        text_en: editing.text_en || null,
        author_id: editing.author_id,
        category_id: editing.category_id,
        published: editing.published,
        explanation_ar: editing.explanation_ar || null,
        explanation_en: editing.explanation_en || null,
        modern_context_ar: editing.modern_context_ar || null,
        modern_context_en: editing.modern_context_en || null,
        action_step_ar: editing.action_step_ar || null,
        action_step_en: editing.action_step_en || null,
        journal_prompt_ar: editing.journal_prompt_ar || null,
        journal_prompt_en: editing.journal_prompt_en || null,
        is_premium_explanation: editing.is_premium_explanation,
      };
      if (editing.id) {
        const { error } = await supabase.from("quotes").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("quotes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم الحفظ" : "Saved");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["admin-quotes"] });
      void qc.invalidateQueries({ queryKey: ["daily-quote"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      void qc.invalidateQueries({ queryKey: ["admin-quotes"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Error"),
  });

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!isAdmin) return null;

  return (
    <div className="mx-auto min-h-screen max-w-[720px] px-5 pt-10 pb-20">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => nav({ to: "/" })} className="glass grid size-10 place-items-center rounded-full">
            <ArrowLeft className="size-4 flip-x" />
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold">
              <ShieldCheck className="size-5 text-gold" />
              لوحة الإدارة · Admin
            </h1>
            <p className="text-xs text-muted-foreground">Content management</p>
          </div>
        </div>
      </header>

      <div className="glass mb-6 grid grid-cols-3 gap-1 rounded-2xl p-1">
        {(["quotes", "authors", "categories"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-xl py-2 text-xs font-semibold capitalize transition-all ${
              tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {tab === "quotes" && (
        <section className="space-y-3">
          <button
            onClick={() =>
              setEditing({
                text_ar: "",
                text_en: "",
                author_id: null,
                category_id: null,
                published: true,
                explanation_ar: "",
                explanation_en: "",
                modern_context_ar: "",
                modern_context_en: "",
                action_step_ar: "",
                action_step_en: "",
                journal_prompt_ar: "",
                journal_prompt_en: "",
                is_premium_explanation: false,
              })
            }
            className="glass flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-primary hover:bg-primary/5"
          >
            <Plus className="size-4" /> {locale === "ar" ? "إضافة حكمة" : "Add quote"}
          </button>

          {quotes.data?.map((q) => (
            <div key={q.id} className="glass rounded-2xl p-4">
              <p className="naskh line-clamp-2 text-sm">{q.text_ar}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {(q.author as { name_ar?: string } | null)?.name_ar} ·{" "}
                  {(q.category as { name_ar?: string } | null)?.name_ar} ·{" "}
                  {q.published ? "منشور" : "مسودة"}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setEditing({
                        id: q.id,
                        text_ar: q.text_ar,
                        text_en: q.text_en ?? "",
                        author_id: q.author_id,
                        category_id: q.category_id,
                        published: q.published,
                        explanation_ar: q.explanation_ar ?? "",
                        explanation_en: q.explanation_en ?? "",
                        modern_context_ar: q.modern_context_ar ?? "",
                        modern_context_en: q.modern_context_en ?? "",
                        action_step_ar: q.action_step_ar ?? "",
                        action_step_en: q.action_step_en ?? "",
                        journal_prompt_ar: q.journal_prompt_ar ?? "",
                        journal_prompt_en: q.journal_prompt_en ?? "",
                        is_premium_explanation: q.is_premium_explanation,
                      })
                    }
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => confirm("Delete?") && remove.mutate(q.id)}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "authors" && (
        <section className="space-y-2">
          {authors.data?.map((a) => (
            <div key={a.id} className="glass flex items-center justify-between rounded-2xl p-4">
              <div>
                <p className="text-sm font-medium">{a.name_ar}</p>
                <p className="text-[10px] text-muted-foreground">{a.name_en} · {a.era}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "categories" && (
        <section className="space-y-2">
          {cats.data?.map((c) => (
            <div key={c.id} className="glass flex items-center justify-between rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{c.icon}</span>
                <div>
                  <p className="text-sm font-medium">{c.name_ar}</p>
                  <p className="text-[10px] text-muted-foreground">{c.slug}</p>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-full max-w-[560px] space-y-3 rounded-t-3xl p-6 pb-10"
          >
            <h3 className="text-sm font-semibold">{editing.id ? "Edit" : "New"} quote</h3>
            <textarea
              value={editing.text_ar}
              onChange={(e) => setEditing({ ...editing, text_ar: e.target.value })}
              placeholder="النص العربي"
              rows={3}
              className="w-full rounded-2xl bg-input p-3 text-sm outline-none"
              dir="rtl"
            />
            <textarea
              value={editing.text_en}
              onChange={(e) => setEditing({ ...editing, text_en: e.target.value })}
              placeholder="English text (optional)"
              rows={2}
              className="w-full rounded-2xl bg-input p-3 text-sm outline-none"
              dir="ltr"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={editing.author_id ?? ""}
                onChange={(e) => setEditing({ ...editing, author_id: e.target.value || null })}
                className="rounded-2xl bg-input p-3 text-sm outline-none"
              >
                <option value="">— Author —</option>
                {authors.data?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name_ar}</option>
                ))}
              </select>
              <select
                value={editing.category_id ?? ""}
                onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                className="rounded-2xl bg-input p-3 text-sm outline-none"
              >
                <option value="">— Category —</option>
                {cats.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_ar}</option>
                ))}
              </select>
            </div>

            <p className="pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Curated content (shown instead of AI-generated explanation, when filled in)
            </p>
            <textarea
              value={editing.explanation_ar}
              onChange={(e) => setEditing({ ...editing, explanation_ar: e.target.value })}
              placeholder="الشرح (عربي)"
              rows={2}
              className="w-full rounded-2xl bg-input p-3 text-sm outline-none"
              dir="rtl"
            />
            <textarea
              value={editing.explanation_en}
              onChange={(e) => setEditing({ ...editing, explanation_en: e.target.value })}
              placeholder="Explanation (English)"
              rows={2}
              className="w-full rounded-2xl bg-input p-3 text-sm outline-none"
              dir="ltr"
            />
            <textarea
              value={editing.modern_context_ar}
              onChange={(e) => setEditing({ ...editing, modern_context_ar: e.target.value })}
              placeholder="السياق المعاصر (عربي، اختياري)"
              rows={2}
              className="w-full rounded-2xl bg-input p-3 text-sm outline-none"
              dir="rtl"
            />
            <textarea
              value={editing.modern_context_en}
              onChange={(e) => setEditing({ ...editing, modern_context_en: e.target.value })}
              placeholder="Modern context (English, optional)"
              rows={2}
              className="w-full rounded-2xl bg-input p-3 text-sm outline-none"
              dir="ltr"
            />
            <div className="grid grid-cols-2 gap-2">
              <textarea
                value={editing.action_step_ar}
                onChange={(e) => setEditing({ ...editing, action_step_ar: e.target.value })}
                placeholder="خطوة عملية (عربي)"
                rows={2}
                className="rounded-2xl bg-input p-3 text-sm outline-none"
                dir="rtl"
              />
              <textarea
                value={editing.action_step_en}
                onChange={(e) => setEditing({ ...editing, action_step_en: e.target.value })}
                placeholder="Action step (English)"
                rows={2}
                className="rounded-2xl bg-input p-3 text-sm outline-none"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <textarea
                value={editing.journal_prompt_ar}
                onChange={(e) => setEditing({ ...editing, journal_prompt_ar: e.target.value })}
                placeholder="سؤال للتأمل (عربي)"
                rows={2}
                className="rounded-2xl bg-input p-3 text-sm outline-none"
                dir="rtl"
              />
              <textarea
                value={editing.journal_prompt_en}
                onChange={(e) => setEditing({ ...editing, journal_prompt_en: e.target.value })}
                placeholder="Journal prompt (English)"
                rows={2}
                className="rounded-2xl bg-input p-3 text-sm outline-none"
                dir="ltr"
              />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={editing.is_premium_explanation}
                onChange={(e) => setEditing({ ...editing, is_premium_explanation: e.target.checked })}
              />
              Premium explanation
            </label>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={editing.published}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              />
              Published
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="rounded-full px-4 py-2 text-xs">Cancel</button>
              <button
                onClick={() => save.mutate()}
                disabled={!editing.text_ar.trim() || save.isPending}
                className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
