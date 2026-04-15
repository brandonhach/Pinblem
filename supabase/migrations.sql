-- ============================================================
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. notifications table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type        TEXT NOT NULL,   -- 'message' | 'review' | 'trade_offer'
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  link        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- drop old policies if re-running
DROP POLICY IF EXISTS "read own notifications"    ON notifications;
DROP POLICY IF EXISTS "mark own notifications read" ON notifications;

CREATE POLICY "read own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "mark own notifications read"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ── 2. reviews table ────────────────────────────────────────
-- The pre-existing reviews table uses int4 ids which are incompatible
-- with auth.users.id (uuid). Drop it and recreate with correct types.
DROP TABLE IF EXISTS reviews CASCADE;

CREATE TABLE reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_username   TEXT NOT NULL,
  reviewer_avatar_url TEXT,
  rating              INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment             TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (seller_id, reviewer_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read reviews"
  ON reviews FOR SELECT USING (TRUE);

CREATE POLICY "insert own review"
  ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ── 3. user presence ────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Allow each user to update their own last_seen_at.
-- Skip if you already have a broader UPDATE policy on users.
DROP POLICY IF EXISTS "update own last_seen_at" ON users;
CREATE POLICY "update own last_seen_at"
  ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── 4. unread-read tracking on conversations ────────────────
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_read_buyer_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_read_seller_at TIMESTAMPTZ;

-- ── 5. Trigger: notify recipient on new message ─────────────
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_recipient_id  UUID;
  v_sender_name   TEXT;
BEGIN
  SELECT CASE
    WHEN c.buyer_id = NEW.sender_id THEN c.seller_id
    ELSE c.buyer_id
  END INTO v_recipient_id
  FROM conversations c WHERE c.id = NEW.conversation_id;

  SELECT username INTO v_sender_name
  FROM users WHERE id = NEW.sender_id;

  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    v_recipient_id,
    'message',
    'New message from ' || COALESCE(v_sender_name, 'someone'),
    LEFT(NEW.content, 100),
    '/messages?convo=' || NEW.conversation_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_message ON messages;
CREATE TRIGGER trg_notify_on_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- ── 6. Trigger: notify seller on new review + update rating ─
CREATE OR REPLACE FUNCTION notify_and_update_on_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reviewer_name TEXT;
BEGIN
  SELECT username INTO v_reviewer_name
  FROM users WHERE id = NEW.reviewer_id;

  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    NEW.seller_id,
    'review',
    'New review from ' || COALESCE(v_reviewer_name, 'someone'),
    COALESCE(v_reviewer_name, 'Someone') || ' left you a ' || NEW.rating || '-star review',
    '/profile/' || NEW.seller_id
  );

  UPDATE users
  SET
    total_reviews = (SELECT COUNT(*)                         FROM reviews WHERE seller_id = NEW.seller_id),
    rating        = (SELECT ROUND(AVG(rating)::numeric, 1)  FROM reviews WHERE seller_id = NEW.seller_id)
  WHERE id = NEW.seller_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_review ON reviews;
CREATE TRIGGER trg_notify_on_review
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION notify_and_update_on_review();
