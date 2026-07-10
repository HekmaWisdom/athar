import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { QuoteCard } from "@/components/QuoteCard";
import { ExplainSheet } from "@/components/ExplainSheet";
import { useI18n } from "@/lib/i18n";
import { listCategories, listQuotesByCategory, searchQuotes, type QuoteFull } from "@/lib/quotes";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "استكشاف · Discover — Athar" },
      { name: "description", content: "استكشف مواضيع الحكمة والحياة والنجاح." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [explain, setExplain] = useState<QuoteFull | null>(null);

  const cats = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const searchRes = useQuery({
    queryKey: ["search", query],
    queryFn: () => searchQuotes(query),
    enabled: query.trim().length > 1,
  });
  const byCat = useQuery({
    queryKey: ["cat-quotes", activeCat],
    queryFn: () => (activeCat ? listQuotesByCategory(activeCat) : Promise.resolve([])),
    enabled: !!activeCat && query.trim().length < 2,
  });

  const showing = query.trim().length > 1 ? searchRes.data ?? [] : byCat.data ?? [];

  return (
    <AppShell>
      <header className="px-5 pt-10 pb-4">
        <h1 className="text-2xl font-bold">{t("nav_discover")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("browse_categories")}</p>

        <div className="glass mt-5 flex items-center gap-2 rounded-2xl px-4 py-3">
          <SearchIcon className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search")}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            dir="auto"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 space-y-6 px-5 pb-4">
        {/* Categories */}
        <section className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <CategoryChip active={!activeCat} onClick={() => setActiveCat(null)} label={t("view_all")} />
            {cats.data?.map((c) => (
              <CategoryChip
                key={c.id}
                active={activeCat === c.slug}
                onClick={() => setActiveCat(c.slug)}
                label={locale === "ar" ? c.name_ar : c.name_en}
                icon={c.icon}
              />
            ))}
          </div>
        </section>

        {/* Category grid when nothing active/search */}
        {!activeCat && query.trim().length < 2 && cats.data && (
          <section className="grid grid-cols-2 gap-3">
            {cats.data.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.slug)}
                className="glass group aspect-[5/4] rounded-3xl p-5 text-start transition-all hover:border-primary/40 hover:shadow-glow"
              >
                <div className="text-3xl">{c.icon}</div>
                <p className="mt-6 text-base font-semibold">
                  {locale === "ar" ? c.name_ar : c.name_en}
                </p>
              </button>
            ))}
          </section>
        )}

        {/* Quotes list */}
        {(activeCat || query.trim().length > 1) && (
          <section className="space-y-4">
            {showing.length === 0 ? (
              <p className="glass rounded-2xl p-6 text-center text-sm text-muted-foreground">
                {query ? t("no_results") : t("loading")}
              </p>
            ) : (
              showing.map((q) => (
                <QuoteCard key={q.id} quote={q} onExplain={() => setExplain(q)} showDate={false} />
              ))
            )}
          </section>
        )}
      </main>

      {explain && <ExplainSheet quote={explain} onClose={() => setExplain(null)} />}
    </AppShell>
  );
}

function CategoryChip({ active, onClick, label, icon }: { active?: boolean; onClick: () => void; label: string; icon?: string | null }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-glow"
          : "glass text-foreground hover:border-primary/30"
      }`}
    >
      {icon && <span className="me-1.5">{icon}</span>}
      {label}
    </button>
  );
}
