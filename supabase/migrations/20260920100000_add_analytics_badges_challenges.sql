-- Analytics + gamification foundation (badges, challenges). No PostHog, no paid
-- service: events land in our own table, read only via /admin (or ad-hoc SQL)
-- until there's real traffic to build a dashboard for.

-- ── Analytics ────────────────────────────────────────────────────────────────
create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  session_id uuid not null,
  event_name text not null,
  properties jsonb not null default '{}',
  occurred_at timestamptz not null default now()
);
create index if not exists idx_analytics_events_name_time on public.analytics_events (event_name, occurred_at);
create index if not exists idx_analytics_events_user on public.analytics_events (user_id, occurred_at);

alter table public.analytics_events enable row level security;

-- Anyone (including anonymous/guest sessions) can log an event, but only for
-- themselves — never on someone else's user_id — and never read any back.
create policy "anyone can insert own events" on public.analytics_events
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

create policy "admins can read events" on public.analytics_events
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ── Badges (catalog + earned) ────────────────────────────────────────────────
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  icon text not null default '🏅',
  kind text not null check (kind in ('streak', 'xp', 'journal', 'share', 'favorite')),
  threshold integer not null,
  sort_order integer not null default 0
);
alter table public.badges enable row level security;
create policy "everyone can read badges" on public.badges for select to anon, authenticated using (true);
create policy "admins manage badges" on public.badges for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
alter table public.user_badges enable row level security;
create policy "users manage own badges" on public.user_badges for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.badges (slug, name_ar, name_en, description_ar, description_en, icon, kind, threshold, sort_order) values
  ('streak-3',  'شرارة البداية', 'First Spark',    'حافظت على تواصلك ٣ أيام متتالية', 'You kept a 3-day streak',    '🔥', 'streak', 3,   1),
  ('streak-7',  'أسبوع الأثر',   'A Week of Athar', 'حافظت على تواصلك ٧ أيام متتالية', 'You kept a 7-day streak',    '🔥', 'streak', 7,   2),
  ('streak-30', 'شهر من الحكمة', 'A Month of Wisdom','حافظت على تواصلك ٣٠ يومًا متتاليًا', 'You kept a 30-day streak', '🔥', 'streak', 30,  3),
  ('streak-100','مئة يوم',       'Centurion',       'حافظت على تواصلك ١٠٠ يوم متتالٍ', 'You kept a 100-day streak', '🔥', 'streak', 100, 4),
  ('xp-100',    'طالب حكمة',     'Seeker',          'جمعت ١٠٠ نقطة خبرة',           'You earned 100 XP',          '⭐', 'xp',     100, 5),
  ('xp-1000',   'حكيم صاعد',     'Rising Sage',     'جمعت ١٠٠٠ نقطة خبرة',          'You earned 1000 XP',         '⭐', 'xp',     1000,6),
  ('journal-1', 'أول سطر',       'First Words',     'كتبت أول تدوينة لك',           'You wrote your first journal entry', '📝', 'journal', 1, 7),
  ('journal-10','دفتر الحكمة',   'The Journal',     'كتبت ١٠ تدوينات',              'You wrote 10 journal entries', '📝', 'journal', 10, 8),
  ('share-1',   'ناشر الأثر',    'First Share',     'شاركت أول حكمة',               'You shared your first wisdom', '📤', 'share', 1, 9),
  ('favorite-10','مقتنيات الحكيم','Collector',      'حفظت ١٠ حكم في المفضلة',       'You saved 10 favorites',       '❤️', 'favorite', 10, 10)
on conflict (slug) do nothing;

-- ── Challenges ────────────────────────────────────────────────────────────────
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_ar text not null,
  title_en text not null,
  description_ar text,
  description_en text,
  kind text not null check (kind in ('weekly', 'monthly')),
  goal_type text not null check (goal_type in ('reads', 'reflections', 'shares')),
  goal_count integer not null,
  starts_on date not null,
  ends_on date not null,
  badge_id uuid references public.badges(id)
);
alter table public.challenges enable row level security;
create policy "everyone can read challenges" on public.challenges for select to anon, authenticated using (true);
create policy "admins manage challenges" on public.challenges for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table if not exists public.challenge_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  progress integer not null default 0,
  completed_at timestamptz,
  primary key (user_id, challenge_id)
);
alter table public.challenge_progress enable row level security;
create policy "users manage own challenge progress" on public.challenge_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
