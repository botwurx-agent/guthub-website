-- ============================================================
-- 009_security_hardening
-- Fix all Security Advisor errors and warnings
-- ============================================================

-- 1. Enable RLS on beta_codes
--    All access goes through SECURITY DEFINER functions which bypass RLS,
--    so no user-facing policies are needed.
ALTER TABLE public.beta_codes ENABLE ROW LEVEL SECURITY;

-- 2. Revoke public execute from SECURITY DEFINER functions

-- handle_new_user is a trigger — only the system invokes it
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- increment_founding_counter is called server-side via service_role only
REVOKE EXECUTE ON FUNCTION public.increment_founding_counter() FROM PUBLIC;

-- activate_beta_code: revoke from public, grant to authenticated
-- (BetaClient.tsx calls it via browser supabase client with a valid session)
REVOKE EXECUTE ON FUNCTION public.activate_beta_code(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_beta_code(uuid, text, text) TO authenticated;

-- validate_beta_code: revoke from public, grant to authenticated
REVOKE EXECUTE ON FUNCTION public.validate_beta_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_beta_code(text) TO authenticated;

-- 3. Fix search_path on all affected functions

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_founding_counter()
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
begin
  update public.founding_counter
  set count = count + 1
  where id = 1 and count < cap;
end;
$$;

CREATE OR REPLACE FUNCTION public.activate_beta_code(p_user_id uuid, p_code text, p_name text DEFAULT NULL::text)
RETURNS jsonb LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row beta_codes%ROWTYPE;
  v_already_beta boolean;
  v_trial_ends timestamptz;
BEGIN
  SELECT beta_user INTO v_already_beta FROM profiles WHERE id = p_user_id;
  IF v_already_beta THEN
    RETURN jsonb_build_object('ok', true, 'already_activated', true);
  END IF;

  SELECT * INTO v_row FROM beta_codes WHERE code = upper(trim(p_code));
  IF NOT FOUND OR NOT v_row.active OR v_row.uses_count >= v_row.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or unavailable beta code.');
  END IF;

  v_trial_ends := now() + (v_row.trial_days || ' days')::interval;

  UPDATE profiles
  SET
    beta_user = true,
    subscription_status = 'trialing',
    trial_ends_at = v_trial_ends,
    name = COALESCE(NULLIF(p_name, ''), name)
  WHERE id = p_user_id;

  UPDATE beta_codes SET uses_count = uses_count + 1 WHERE code = upper(trim(p_code));

  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_beta_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row beta_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row FROM beta_codes WHERE code = upper(trim(p_code));
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid beta code.');
  END IF;
  IF NOT v_row.active THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This beta code is no longer active.');
  END IF;
  IF v_row.uses_count >= v_row.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This beta code has reached its limit.');
  END IF;
  RETURN jsonb_build_object('ok', true, 'trial_days', v_row.trial_days);
END;
$$;

CREATE OR REPLACE FUNCTION public._community_post_comment_count()
RETURNS trigger LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public._community_post_like_count()
RETURNS trigger LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public._community_group_member_count()
RETURNS trigger LANGUAGE plpgsql
SECURITY INVOKER SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$;
