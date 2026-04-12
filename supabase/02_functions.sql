-- ============================================================
--  02_functions.sql — RPC Functions & pg_cron
-- ============================================================

-- ─────────────────────────────────────────
-- RPC: increment_points
-- Gọi từ client/server sau mỗi quiz
-- ─────────────────────────────────────────
create or replace function public.increment_points(p_user_id uuid, p_points integer)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set total_points = total_points + p_points
  where id = p_user_id;
end;
$$;

-- ─────────────────────────────────────────
-- RPC: get_topic_stats (dùng cho admin dashboard)
-- ─────────────────────────────────────────
create or replace function public.get_topic_stats(p_topic_id uuid)
returns table (
  total_words     bigint,
  published_words bigint,
  draft_words     bigint,
  total_learners  bigint,
  avg_mastery_pct numeric
) language sql security definer as $$
  select
    count(*)                                              as total_words,
    count(*) filter (where status = 'published')         as published_words,
    count(*) filter (where status = 'draft')             as draft_words,
    (select count(distinct user_id)
     from user_topic_progress
     where topic_id = p_topic_id)                        as total_learners,
    coalesce(round(
      (select avg(words_mastered::numeric / nullif(t2.word_count,0) * 100)
       from user_topic_progress utp
       join topics t2 on t2.id = utp.topic_id
       where utp.topic_id = p_topic_id)
    , 1), 0)                                             as avg_mastery_pct
  from words
  where topic_id = p_topic_id;
$$;

-- ─────────────────────────────────────────
-- RPC: get_user_dashboard_stats
-- Tổng hợp cho trang Progress
-- ─────────────────────────────────────────
create or replace function public.get_user_dashboard_stats(p_user_id uuid)
returns json language plpgsql security definer as $$
declare
  v_result json;
begin
  select json_build_object(
    'total_words_learned', (
      select count(*) from user_word_progress
      where user_id = p_user_id and status != 'new'
    ),
    'total_words_mastered', (
      select count(*) from user_word_progress
      where user_id = p_user_id and status = 'mastered'
    ),
    'quizzes_completed', (
      select count(*) from quiz_sessions
      where user_id = p_user_id
    ),
    'avg_quiz_score', (
      select coalesce(round(avg(correct_answers::numeric / total_questions * 100), 1), 0)
      from quiz_sessions where user_id = p_user_id
    ),
    'words_due_today', (
      select count(*) from user_word_progress
      where user_id = p_user_id
        and next_review_at <= now()
        and status != 'mastered'
    ),
    'streak_this_week', (
      select count(*) from streak_logs
      where user_id = p_user_id
        and log_date >= current_date - interval '6 days'
        and goal_reached = true
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ─────────────────────────────────────────
-- pg_cron — kích hoạt trong Supabase Dashboard
-- Extensions > pg_cron > Enable
-- ─────────────────────────────────────────

-- Chạy AI jobs mỗi 2 phút
select cron.schedule(
  'process-ai-jobs',
  '*/2 * * * *',
  $$
    select net.http_post(
      url := current_setting('app.edge_function_url') || '/process-ai-job',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.anon_key')
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Reset streak nếu hôm qua không học (chạy lúc 00:05 mỗi ngày)
select cron.schedule(
  'reset-missed-streaks',
  '5 0 * * *',
  $$
    update public.profiles
    set current_streak = 0
    where id in (
      select p.id from public.profiles p
      where p.current_streak > 0
        and p.last_activity_at < current_date - interval '1 day'
    );
  $$
);
