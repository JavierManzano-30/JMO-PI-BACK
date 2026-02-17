ALTER TABLE "photos" DROP CONSTRAINT IF EXISTS "uq_photos_user_theme";

CREATE UNIQUE INDEX IF NOT EXISTS "uq_photos_user_theme_active"
  ON "photos" ("user_id", "theme_id")
  WHERE "is_deleted" = false;
