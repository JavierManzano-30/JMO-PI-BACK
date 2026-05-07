BEGIN;

CREATE TABLE IF NOT EXISTS public.user_follows (
  id BIGSERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_user_follows_no_self_follow CHECK (follower_id <> following_id),
  CONSTRAINT uq_user_follows_pair UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON public.user_follows(following_id);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id BIGSERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content VARCHAR(2000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_direct_messages_no_self_message CHECK (sender_id <> receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'direct_messages'
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages';
    END IF;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT u.id
  FROM public.users u
  WHERE lower(u.email) = lower(coalesce(auth.jwt()->>'email', ''))
  LIMIT 1;
$$;

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_follows_select_authenticated ON public.user_follows;
CREATE POLICY user_follows_select_authenticated
ON public.user_follows
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS user_follows_insert_own ON public.user_follows;
CREATE POLICY user_follows_insert_own
ON public.user_follows
FOR INSERT
TO authenticated
WITH CHECK (
  follower_id = public.current_app_user_id()
  AND follower_id <> following_id
);

DROP POLICY IF EXISTS user_follows_delete_own ON public.user_follows;
CREATE POLICY user_follows_delete_own
ON public.user_follows
FOR DELETE
TO authenticated
USING (follower_id = public.current_app_user_id());

DROP POLICY IF EXISTS direct_messages_select_participants ON public.direct_messages;
CREATE POLICY direct_messages_select_participants
ON public.direct_messages
FOR SELECT
TO authenticated
USING (
  sender_id = public.current_app_user_id()
  OR receiver_id = public.current_app_user_id()
);

DROP POLICY IF EXISTS direct_messages_insert_sender ON public.direct_messages;
CREATE POLICY direct_messages_insert_sender
ON public.direct_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = public.current_app_user_id()
  AND sender_id <> receiver_id
);

NOTIFY pgrst, 'reload schema';

COMMIT;
