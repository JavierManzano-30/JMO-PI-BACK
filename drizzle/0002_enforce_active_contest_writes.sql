CREATE OR REPLACE FUNCTION ensure_photo_theme_is_active()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM themes
    WHERE id = NEW.theme_id
      AND is_active = true
      AND start_date <= CURRENT_DATE
      AND end_date >= CURRENT_DATE
  ) THEN
    RAISE EXCEPTION 'No se pueden subir fotos a concursos inactivos o finalizados'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_photos_theme_active ON photos;
--> statement-breakpoint
CREATE TRIGGER trg_photos_theme_active
BEFORE INSERT OR UPDATE OF theme_id ON photos
FOR EACH ROW
EXECUTE FUNCTION ensure_photo_theme_is_active();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION ensure_vote_theme_is_active()
RETURNS trigger AS $$
DECLARE
  target_photo_id integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_photo_id := OLD.photo_id;
  ELSE
    target_photo_id := NEW.photo_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM photos p
    JOIN themes t ON t.id = p.theme_id
    WHERE p.id = target_photo_id
      AND p.is_deleted = false
      AND t.is_active = true
      AND t.start_date <= CURRENT_DATE
      AND t.end_date >= CURRENT_DATE
  ) THEN
    RAISE EXCEPTION 'No se pueden cambiar votos de concursos inactivos o finalizados'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_votes_theme_active_insert ON votes;
--> statement-breakpoint
CREATE TRIGGER trg_votes_theme_active_insert
BEFORE INSERT OR UPDATE OF photo_id ON votes
FOR EACH ROW
EXECUTE FUNCTION ensure_vote_theme_is_active();
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_votes_theme_active_delete ON votes;
--> statement-breakpoint
CREATE TRIGGER trg_votes_theme_active_delete
BEFORE DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION ensure_vote_theme_is_active();
