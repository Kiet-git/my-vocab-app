-- ============================================================
--  LUCID POLYGLOT — Supabase Database Schema
--  Version: 1.0
--  Tính năng:
--    - Auth tích hợp Supabase Auth (auth.users)
--    - Topics & Words với đầy đủ metadata
--    - Học tập cá nhân hoá (progress, sessions)
--    - Quiz engine có thể mở rộng
--    - Streak tracking
--    - AI generation log (sẵn sàng tích hợp)
--    - Row Level Security (RLS) toàn diện
-- ============================================================

-- ─────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- full-text search nhanh hơn

-- ─────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────
create type word_status       as enum ('draft', 'published', 'archived');
create type difficulty_level  as enum ('beginner', 'intermediate', 'advanced');
create type question_type     as enum ('multiple_choice', 'fill_blank', 'true_false', 'matching');
create type ai_job_status     as enum ('pending', 'processing', 'done', 'failed');
create type learning_status   as enum ('new', 'learning', 'reviewing', 'mastered');

-- ─────────────────────────────────────────
-- TABLE: profiles
-- Mở rộng auth.users của Supabase
-- ─────────────────────────────────────────
create table public.profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  username        text        unique not null,
  display_name    text,
  avatar_url      text,
  bio             text,
  -- Gamification
  total_points    integer     not null default 0 check (total_points >= 0),
  current_streak  integer     not null default 0 check (current_streak >= 0),
  longest_streak  integer     not null default 0 check (longest_streak >= 0),
  last_activity_at date,
  -- Settings
  daily_goal      integer     not null default 10 check (daily_goal between 1 and 200),
  ui_language     text        not null default 'en',
  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.profiles is 'Hồ sơ người dùng, mở rộng từ auth.users';

-- ─────────────────────────────────────────
-- TABLE: topics
-- Chủ đề từ vựng (Travel, Food, Work...)
-- ─────────────────────────────────────────
create table public.topics (
  id              uuid        primary key default uuid_generate_v4(),
  slug            text        unique not null
                              check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title           text        not null check (length(title) between 1 and 100),
  description     text,
  icon            text        not null default 'book',        -- Material Symbol name
  difficulty      difficulty_level not null default 'beginner',
  is_published    boolean     not null default false,
  sort_order      integer     not null default 0,
  -- Thống kê cache (cập nhật qua trigger)
  word_count      integer     not null default 0 check (word_count >= 0),
  -- AI metadata
  ai_generated    boolean     not null default false,
  ai_prompt       text,                                       -- prompt đã dùng để generate
  -- Audit
  created_by      uuid        references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.topics is 'Chủ đề từ vựng. slug dùng cho URL routing';
create index idx_topics_slug        on public.topics(slug);
create index idx_topics_published   on public.topics(is_published) where is_published = true;

-- ─────────────────────────────────────────
-- TABLE: words
-- Từ vựng trong từng topic
-- ─────────────────────────────────────────
create table public.words (
  id              uuid        primary key default uuid_generate_v4(),
  topic_id        uuid        not null references public.topics(id) on delete cascade,
  -- Nội dung từ
  term            text        not null check (length(term) between 1 and 200),
  language        text        not null default 'English',     -- ngôn ngữ gốc của từ
  definition      text        not null check (length(definition) >= 5),
  pronunciation   text,                                       -- IPA: /ɪˈfɛmərəl/
  example_sentence text,
  notes           text,                                       -- ghi chú thêm của admin
  image_url       text,                                       -- ảnh minh hoạ
  audio_url       text,                                       -- file phát âm
  -- Phân loại
  status          word_status       not null default 'draft',
  difficulty      difficulty_level  not null default 'beginner',
  icon            text              not null default 'translate',  -- Material Symbol
  sort_order      integer           not null default 0,
  -- AI metadata
  ai_generated    boolean     not null default false,
  ai_model        text,                                       -- vd: 'gpt-4o', 'claude-3-5'
  ai_job_id       uuid,                                       -- liên kết ai_jobs
  -- Timestamps
  created_by      uuid        references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Ràng buộc: 1 term không trùng trong cùng topic
  unique (topic_id, term)
);

comment on table public.words is 'Từ vựng thuộc topic. Mỗi từ là 1 flashcard';
create index idx_words_topic_id     on public.words(topic_id);
create index idx_words_status       on public.words(status);
create index idx_words_term_trgm    on public.words using gin (term gin_trgm_ops);
create index idx_words_definition_trgm on public.words using gin (definition gin_trgm_ops);

-- ─────────────────────────────────────────
-- TABLE: user_word_progress
-- Tiến độ học từng từ của mỗi user
-- ─────────────────────────────────────────
create table public.user_word_progress (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.profiles(id) on delete cascade,
  word_id             uuid        not null references public.words(id) on delete cascade,
  -- Trạng thái học
  status              learning_status not null default 'new',
  -- Spaced Repetition (SM-2 algorithm)
  ease_factor         numeric(4,2) not null default 2.50
                                   check (ease_factor >= 1.30),
  interval_days       integer     not null default 1 check (interval_days >= 1),
  repetitions         integer     not null default 0 check (repetitions >= 0),
  next_review_at      timestamptz not null default now(),
  -- Thống kê
  times_seen          integer     not null default 0 check (times_seen >= 0),
  times_correct       integer     not null default 0 check (times_correct >= 0),
  times_wrong         integer     not null default 0 check (times_wrong >= 0),
  last_seen_at        timestamptz,
  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- 1 user chỉ có 1 record per word
  unique (user_id, word_id)
);

comment on table public.user_word_progress is
  'Tiến độ học từng từ. Lưu trữ dữ liệu Spaced Repetition (SM-2)';
create index idx_uwp_user_id        on public.user_word_progress(user_id);
create index idx_uwp_word_id        on public.user_word_progress(word_id);
create index idx_uwp_next_review    on public.user_word_progress(user_id, next_review_at)
  where status != 'mastered';
create index idx_uwp_status         on public.user_word_progress(user_id, status);

-- ─────────────────────────────────────────
-- TABLE: user_topic_progress
-- Tổng quan tiến độ theo topic (cache)
-- ─────────────────────────────────────────
create table public.user_topic_progress (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  topic_id        uuid        not null references public.topics(id) on delete cascade,
  -- Thống kê (cập nhật qua trigger khi user_word_progress thay đổi)
  words_seen      integer     not null default 0 check (words_seen >= 0),
  words_mastered  integer     not null default 0 check (words_mastered >= 0),
  last_studied_at timestamptz,
  -- Timestamps
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, topic_id)
);

comment on table public.user_topic_progress is
  'Cache tiến độ tổng hợp theo topic, tránh query nặng mỗi lần render';
create index idx_utp_user_id   on public.user_topic_progress(user_id);
create index idx_utp_topic_id  on public.user_topic_progress(topic_id);

-- ─────────────────────────────────────────
-- TABLE: quiz_sessions
-- Mỗi lần user làm quiz = 1 session
-- ─────────────────────────────────────────
create table public.quiz_sessions (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  topic_id        uuid        not null references public.topics(id) on delete cascade,
  -- Kết quả
  total_questions integer     not null check (total_questions > 0),
  correct_answers integer     not null default 0
                              check (correct_answers >= 0 and correct_answers <= total_questions),
  score_points    integer     not null default 0 check (score_points >= 0),
  duration_secs   integer                         check (duration_secs >= 0),
  -- Metadata
  quiz_type       question_type not null default 'multiple_choice',
  completed_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

comment on table public.quiz_sessions is 'Mỗi lần làm quiz của user';
create index idx_qs_user_id    on public.quiz_sessions(user_id);
create index idx_qs_topic_id   on public.quiz_sessions(topic_id);
create index idx_qs_completed  on public.quiz_sessions(user_id, completed_at desc);

-- ─────────────────────────────────────────
-- TABLE: quiz_answers
-- Chi tiết từng câu trả lời trong session
-- ─────────────────────────────────────────
create table public.quiz_answers (
  id              uuid        primary key default uuid_generate_v4(),
  session_id      uuid        not null references public.quiz_sessions(id) on delete cascade,
  word_id         uuid        not null references public.words(id) on delete cascade,
  -- Câu hỏi & đáp án
  question_type   question_type not null,
  correct_answer  text        not null,
  user_answer     text        not null,
  is_correct      boolean     not null,
  time_taken_ms   integer                     check (time_taken_ms >= 0),
  -- Dùng để generate câu hỏi lại sau
  distractors     text[],                     -- các lựa chọn sai đã hiện
  created_at      timestamptz not null default now()
);

comment on table public.quiz_answers is 'Chi tiết từng câu trả lời trong quiz session';
create index idx_qa_session_id  on public.quiz_answers(session_id);
create index idx_qa_word_id     on public.quiz_answers(word_id);

-- ─────────────────────────────────────────
-- TABLE: streak_logs
-- Log hàng ngày để tính streak chính xác
-- ─────────────────────────────────────────
create table public.streak_logs (
  id          uuid    primary key default uuid_generate_v4(),
  user_id     uuid    not null references public.profiles(id) on delete cascade,
  log_date    date    not null default current_date,
  -- Thống kê ngày đó
  words_studied   integer not null default 0 check (words_studied >= 0),
  quizzes_done    integer not null default 0 check (quizzes_done >= 0),
  points_earned   integer not null default 0 check (points_earned >= 0),
  goal_reached    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, log_date)
);

comment on table public.streak_logs is 'Log hoạt động hàng ngày để tính streak';
create index idx_sl_user_date on public.streak_logs(user_id, log_date desc);

-- ─────────────────────────────────────────
-- TABLE: ai_jobs
-- Queue cho các tác vụ AI (generate words, quiz...)
-- Sẵn sàng tích hợp OpenAI / Claude API
-- ─────────────────────────────────────────
create table public.ai_jobs (
  id              uuid        primary key default uuid_generate_v4(),
  -- Loại tác vụ
  job_type        text        not null
                              check (job_type in (
                                'generate_words',      -- tạo từ vựng cho topic
                                'generate_quiz',       -- tạo câu hỏi quiz
                                'generate_example',    -- tạo câu ví dụ
                                'generate_audio',      -- text-to-speech
                                'translate_topic'      -- dịch topic sang ngôn ngữ khác
                              )),
  status          ai_job_status not null default 'pending',
  -- Liên kết
  topic_id        uuid        references public.topics(id) on delete set null,
  word_id         uuid        references public.words(id) on delete set null,
  requested_by    uuid        references public.profiles(id) on delete set null,
  -- Input / Output
  input_payload   jsonb       not null default '{}',  -- tham số gửi vào AI
  output_payload  jsonb,                              -- kết quả trả về
  error_message   text,
  -- AI model config
  ai_provider     text        not null default 'openai'
                              check (ai_provider in ('openai', 'anthropic', 'google')),
  ai_model        text        not null default 'gpt-4o-mini',
  -- Token tracking
  tokens_used     integer     check (tokens_used >= 0),
  cost_usd        numeric(10,6) check (cost_usd >= 0),
  -- Retry
  attempt_count   integer     not null default 0,
  max_attempts    integer     not null default 3,
  -- Timestamps
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.ai_jobs is
  'Queue tác vụ AI. Xử lý bất đồng bộ qua Supabase Edge Functions';
create index idx_aj_status     on public.ai_jobs(status) where status in ('pending', 'processing');
create index idx_aj_topic_id   on public.ai_jobs(topic_id);
create index idx_aj_created    on public.ai_jobs(created_at desc);

-- ─────────────────────────────────────────
-- TRIGGERS — updated_at tự động
-- ─────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_topics_updated_at
  before update on public.topics
  for each row execute function public.set_updated_at();

create trigger trg_words_updated_at
  before update on public.words
  for each row execute function public.set_updated_at();

create trigger trg_uwp_updated_at
  before update on public.user_word_progress
  for each row execute function public.set_updated_at();

create trigger trg_utp_updated_at
  before update on public.user_topic_progress
  for each row execute function public.set_updated_at();

create trigger trg_ai_jobs_updated_at
  before update on public.ai_jobs
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────
-- TRIGGER — đồng bộ word_count trong topics
-- ─────────────────────────────────────────
create or replace function public.sync_topic_word_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'DELETE' then
    update public.topics
    set word_count = (
      select count(*) from public.words
      where topic_id = old.topic_id and status = 'published'
    )
    where id = old.topic_id;
    return old;
  else
    update public.topics
    set word_count = (
      select count(*) from public.words
      where topic_id = new.topic_id and status = 'published'
    )
    where id = new.topic_id;
    return new;
  end if;
end;
$$;

create trigger trg_sync_word_count
  after insert or update of status or delete on public.words
  for each row execute function public.sync_topic_word_count();

-- ─────────────────────────────────────────
-- TRIGGER — đồng bộ user_topic_progress
-- khi user_word_progress thay đổi
-- ─────────────────────────────────────────
create or replace function public.sync_user_topic_progress()
returns trigger language plpgsql as $$
declare
  v_topic_id uuid;
  v_user_id  uuid;
begin
  -- Lấy topic_id từ word
  if TG_OP = 'DELETE' then
    v_user_id  := old.user_id;
    select topic_id into v_topic_id from public.words where id = old.word_id;
  else
    v_user_id  := new.user_id;
    select topic_id into v_topic_id from public.words where id = new.word_id;
  end if;

  -- Upsert user_topic_progress
  insert into public.user_topic_progress (user_id, topic_id, words_seen, words_mastered, last_studied_at)
  select
    v_user_id,
    v_topic_id,
    count(*) filter (where uwp.status != 'new'),
    count(*) filter (where uwp.status = 'mastered'),
    max(uwp.last_seen_at)
  from public.user_word_progress uwp
  join public.words w on w.id = uwp.word_id
  where uwp.user_id = v_user_id and w.topic_id = v_topic_id
  on conflict (user_id, topic_id) do update set
    words_seen     = excluded.words_seen,
    words_mastered = excluded.words_mastered,
    last_studied_at = excluded.last_studied_at,
    updated_at     = now();

  return coalesce(new, old);
end;
$$;

create trigger trg_sync_topic_progress
  after insert or update of status or delete on public.user_word_progress
  for each row execute function public.sync_user_topic_progress();

-- ─────────────────────────────────────────
-- TRIGGER — tự tạo profile sau khi đăng ký
-- ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────

-- profiles
alter table public.profiles enable row level security;
create policy "Ai cũng xem được profile"
  on public.profiles for select using (true);
create policy "Chỉ chính mình mới sửa được profile"
  on public.profiles for update using (auth.uid() = id);

-- topics
alter table public.topics enable row level security;
create policy "Xem topic đã publish"
  on public.topics for select
  using (is_published = true or auth.uid() in (
    select id from public.profiles -- admin check qua app metadata
  ));
create policy "Admin tạo topic"
  on public.topics for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admin sửa topic"
  on public.topics for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- words
alter table public.words enable row level security;
create policy "Xem word published"
  on public.words for select
  using (
    status = 'published'
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
create policy "Admin tạo word"
  on public.words for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admin sửa word"
  on public.words for update
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admin xoá word"
  on public.words for delete
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- user_word_progress
alter table public.user_word_progress enable row level security;
create policy "User xem progress của mình"
  on public.user_word_progress for select using (auth.uid() = user_id);
create policy "User tạo progress của mình"
  on public.user_word_progress for insert with check (auth.uid() = user_id);
create policy "User cập nhật progress của mình"
  on public.user_word_progress for update using (auth.uid() = user_id);

-- user_topic_progress
alter table public.user_topic_progress enable row level security;
create policy "User xem topic progress của mình"
  on public.user_topic_progress for select using (auth.uid() = user_id);
create policy "User tạo/sửa topic progress của mình"
  on public.user_topic_progress for insert with check (auth.uid() = user_id);
create policy "User update topic progress của mình"
  on public.user_topic_progress for update using (auth.uid() = user_id);

-- quiz_sessions
alter table public.quiz_sessions enable row level security;
create policy "User xem session của mình"
  on public.quiz_sessions for select using (auth.uid() = user_id);
create policy "User tạo session của mình"
  on public.quiz_sessions for insert with check (auth.uid() = user_id);

-- quiz_answers
alter table public.quiz_answers enable row level security;
create policy "User xem answers của mình"
  on public.quiz_answers for select
  using (auth.uid() = (select user_id from public.quiz_sessions where id = session_id));
create policy "User tạo answers của mình"
  on public.quiz_answers for insert
  with check (auth.uid() = (select user_id from public.quiz_sessions where id = session_id));

-- streak_logs
alter table public.streak_logs enable row level security;
create policy "User xem streak của mình"
  on public.streak_logs for select using (auth.uid() = user_id);
create policy "User tạo/sửa streak của mình"
  on public.streak_logs for insert with check (auth.uid() = user_id);
create policy "User update streak của mình"
  on public.streak_logs for update using (auth.uid() = user_id);

-- ai_jobs
alter table public.ai_jobs enable row level security;
create policy "Admin xem ai_jobs"
  on public.ai_jobs for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Admin tạo ai_jobs"
  on public.ai_jobs for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- ─────────────────────────────────────────
-- VIEWS tiện lợi
-- ─────────────────────────────────────────

-- Leaderboard top 20
create or replace view public.leaderboard as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.total_points,
  p.current_streak,
  rank() over (order by p.total_points desc) as rank
from public.profiles p
order by p.total_points desc
limit 20;

-- Words cần ôn tập hôm nay của user hiện tại
create or replace view public.words_due_today as
select
  w.*,
  uwp.status        as learning_status,
  uwp.ease_factor,
  uwp.interval_days,
  uwp.repetitions,
  uwp.next_review_at,
  uwp.times_correct,
  uwp.times_wrong,
  t.title           as topic_title,
  t.slug            as topic_slug
from public.user_word_progress uwp
join public.words  w on w.id  = uwp.word_id
join public.topics t on t.id  = w.topic_id
where uwp.user_id       = auth.uid()
  and uwp.next_review_at <= now()
  and uwp.status        != 'mastered'
order by uwp.next_review_at asc;

-- ─────────────────────────────────────────
-- SEED DATA — Topics & Words mẫu
-- ─────────────────────────────────────────
insert into public.topics (slug, title, description, icon, difficulty, is_published, sort_order)
values
  ('travel',     'Travel',        'Essential phrases for airports, hotels, and navigating new cities.', 'flight_takeoff', 'beginner',     true, 1),
  ('food',       'Food & Dining', 'Master culinary terms and ordering at restaurants.',                  'restaurant',     'beginner',     true, 2),
  ('work',       'Work & Career', 'Professional vocabulary for meetings and corporate environments.',   'work',           'intermediate', true, 3),
  ('nature',     'Nature',        'Describing the natural world, weather and landscapes.',              'forest',         'beginner',     true, 4),
  ('arts',       'Arts & Culture','Vocabulary for museums, cinema, music and artistic expression.',     'palette',        'intermediate', true, 5),
  ('daily-life', 'Daily Life',    'Common objects, morning routines and household conversations.',      'home',           'beginner',     true, 6);

-- Words cho topic Travel
insert into public.words (topic_id, term, language, definition, pronunciation, example_sentence, icon, status, difficulty)
select
  t.id, v.term, v.language, v.definition, v.pronunciation, v.example_sentence, v.icon, 'published', 'beginner'
from public.topics t,
(values
  ('Dépaysement',   'French',        'The feeling of being in a foreign country; change of scenery.',                '/depe.iz.mɑ̃/',   'J''adore le dépaysement quand je voyage en Asie.',           'translate'),
  ('Fernweh',       'German',        'A longing for far-off places; homesickness for a place you''ve never been.', '/ˈfɛʁnveː/',      'I have constant fernweh for the mountains of Chile.',         'luggage'),
  ('Wanderlust',    'German',        'A strong desire or impulse to wander or travel and explore the world.',       '/ˈvandɐˌlʊst/',   'Her wanderlust led her to 50 countries by age 30.',           'explore'),
  ('Itinerary',     'English',       'A planned route or journey; a list of places to visit.',                      '/aɪˈtɪnərəri/',   'We need to finalize our itinerary for Paris next week.',      'map'),
  ('Accommodation', 'English',       'A room, group of rooms, or building in which someone may live or stay.',      '/əˌkɒməˈdeɪʃən/', 'The hostel provided excellent accommodation for travelers.',   'bed'),
  ('Voyage',        'French',        'A long journey involving travel by sea or in space.',                         '/vwa.jaʒ/',       'Bon voyage! Have a wonderful trip to Iceland.',               'train')
) as v(term, language, definition, pronunciation, example_sentence, icon)
where t.slug = 'travel';
