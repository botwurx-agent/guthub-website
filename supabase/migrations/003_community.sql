-- Community feature: posts, likes, comments, groups

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE community_posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  body          text        NOT NULL,
  tag           text        NOT NULL DEFAULT 'General',
  pinned        boolean     NOT NULL DEFAULT false,
  status        text        NOT NULL DEFAULT 'active', -- 'active' | 'pending' | 'removed'
  like_count    int         NOT NULL DEFAULT 0,
  comment_count int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE community_post_likes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE community_post_comments (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE community_groups (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  description  text,
  member_count int         NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE community_group_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid        NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_community_posts_status_created  ON community_posts (status, created_at DESC);
CREATE INDEX idx_community_posts_user_id          ON community_posts (user_id);
CREATE INDEX idx_community_post_likes_user        ON community_post_likes (user_id);
CREATE INDEX idx_community_post_comments_post     ON community_post_comments (post_id, created_at);
CREATE INDEX idx_community_group_members_user     ON community_group_members (user_id);

-- ── Triggers: denormalised counts ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION _community_post_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_community_post_like_count
AFTER INSERT OR DELETE ON community_post_likes
FOR EACH ROW EXECUTE FUNCTION _community_post_like_count();

CREATE OR REPLACE FUNCTION _community_post_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_community_post_comment_count
AFTER INSERT OR DELETE ON community_post_comments
FOR EACH ROW EXECUTE FUNCTION _community_post_comment_count();

CREATE OR REPLACE FUNCTION _community_group_member_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_community_group_member_count
AFTER INSERT OR DELETE ON community_group_members
FOR EACH ROW EXECUTE FUNCTION _community_group_member_count();

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE community_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_group_members ENABLE ROW LEVEL SECURITY;

-- Posts: anyone authenticated can read active posts; owner can create/update
CREATE POLICY "community_posts_select" ON community_posts
  FOR SELECT USING (status = 'active');

CREATE POLICY "community_posts_insert" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_posts_update" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Likes
CREATE POLICY "community_post_likes_select" ON community_post_likes
  FOR SELECT USING (true);

CREATE POLICY "community_post_likes_insert" ON community_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_post_likes_delete" ON community_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "community_post_comments_select" ON community_post_comments
  FOR SELECT USING (true);

CREATE POLICY "community_post_comments_insert" ON community_post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_post_comments_delete" ON community_post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Groups: public read
CREATE POLICY "community_groups_select" ON community_groups
  FOR SELECT USING (true);

-- Group members
CREATE POLICY "community_group_members_select" ON community_group_members
  FOR SELECT USING (true);

CREATE POLICY "community_group_members_insert" ON community_group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_group_members_delete" ON community_group_members
  FOR DELETE USING (auth.uid() = user_id);

-- ── Seed: groups ─────────────────────────────────────────────────────────────

INSERT INTO community_groups (name, description, member_count) VALUES
  ('Low-FODMAP kitchen',  'Recipes and grocery tips for the low-FODMAP elimination diet', 3240),
  ('Reflux recovery',     'Managing GERD, LPR, and acid reflux through diet and lifestyle', 1890),
  ('Midlife metabolism',  'Gut health changes in your 40s and 50s', 2104),
  ('SIBO survivors',      'Support and strategies for small intestinal bacterial overgrowth', 876);
