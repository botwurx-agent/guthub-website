-- ============================================================
-- 010_user_activity_stats_view
-- Per-user engagement counts for the admin Users tab.
-- ============================================================
-- security_invoker = true so the caller's RLS applies. The admin page reads
-- this with the service role (BYPASSRLS) so it sees every user. Revoked from
-- anon/authenticated so it never exposes cross-user counts through PostgREST.

CREATE OR REPLACE VIEW public.user_activity_stats
WITH (security_invoker = true) AS
SELECT
  p.id AS user_id,
  COALESCE(ml.cnt, 0)  AS meal_count,
  COALESCE(sl.cnt, 0)  AS symptom_count,
  COALESCE(bm.cnt, 0)  AS bm_count,
  COALESCE(wl.cnt, 0)  AS water_count,
  COALESCE(wt.cnt, 0)  AS weight_count,
  COALESCE(nl.cnt, 0)  AS note_count,
  COALESCE(sup.cnt, 0) AS supplement_count,
  COALESCE(cm.cnt, 0)  AS coach_msg_count,
  COALESCE(mp.cnt, 0)  AS meal_plan_count,
  COALESCE(ml.cnt,0) + COALESCE(sl.cnt,0) + COALESCE(bm.cnt,0)
    + COALESCE(wl.cnt,0) + COALESCE(wt.cnt,0) + COALESCE(nl.cnt,0)
    + COALESCE(sup.cnt,0) AS total_logs,
  GREATEST(ml.last, sl.last, bm.last, wl.last, wt.last, nl.last, sup.last, cm.last, mp.last) AS last_active
FROM public.profiles p
LEFT JOIN (SELECT user_id, count(*) cnt, max(created_at) last FROM public.meal_logs       GROUP BY user_id) ml  ON ml.user_id  = p.id
LEFT JOIN (SELECT user_id, count(*) cnt, max(created_at) last FROM public.symptom_logs    GROUP BY user_id) sl  ON sl.user_id  = p.id
LEFT JOIN (SELECT user_id, count(*) cnt, max(created_at) last FROM public.bm_logs         GROUP BY user_id) bm  ON bm.user_id  = p.id
LEFT JOIN (SELECT user_id, count(*) cnt, max(created_at) last FROM public.water_logs      GROUP BY user_id) wl  ON wl.user_id  = p.id
LEFT JOIN (SELECT user_id, count(*) cnt, max(created_at) last FROM public.weight_logs     GROUP BY user_id) wt  ON wt.user_id  = p.id
LEFT JOIN (SELECT user_id, count(*) cnt, max(created_at) last FROM public.note_logs       GROUP BY user_id) nl  ON nl.user_id  = p.id
LEFT JOIN (SELECT user_id, count(*) cnt, max(created_at) last FROM public.supplement_logs GROUP BY user_id) sup ON sup.user_id = p.id
LEFT JOIN (SELECT user_id, count(*) cnt, max(created_at) last FROM public.coach_messages WHERE role = 'user' GROUP BY user_id) cm ON cm.user_id = p.id
LEFT JOIN (SELECT user_id, count(*) cnt, max(created_at) last FROM public.meal_plan_slots  GROUP BY user_id) mp  ON mp.user_id  = p.id;

REVOKE ALL ON public.user_activity_stats FROM anon, authenticated;
GRANT SELECT ON public.user_activity_stats TO service_role;
