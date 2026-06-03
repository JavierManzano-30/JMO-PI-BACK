BEGIN;

CREATE TABLE IF NOT EXISTS communities (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(60) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS themes (
  id SERIAL PRIMARY KEY,
  community_id INTEGER REFERENCES communities(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(2000),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(2000),
  image_url TEXT NOT NULL,
  thumb_url TEXT,
  is_moderated BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_votes_user_photo UNIQUE (user_id, photo_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(1000) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation (
  id SERIAL PRIMARY KEY,
  photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  reason VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS winners (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER NOT NULL UNIQUE REFERENCES themes(id) ON DELETE CASCADE,
  photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_theme_id ON photos(theme_id);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_community_id ON photos(community_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_photos_user_theme_active
  ON photos(user_id, theme_id)
  WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_votes_photo_id ON votes(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON comments(photo_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_themes_community_id ON themes(community_id);
CREATE INDEX IF NOT EXISTS idx_themes_is_active ON themes(is_active);

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

DROP TRIGGER IF EXISTS trg_photos_theme_active ON photos;
CREATE TRIGGER trg_photos_theme_active
BEFORE INSERT OR UPDATE OF theme_id ON photos
FOR EACH ROW
EXECUTE FUNCTION ensure_photo_theme_is_active();

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

DROP TRIGGER IF EXISTS trg_votes_theme_active_insert ON votes;
CREATE TRIGGER trg_votes_theme_active_insert
BEFORE INSERT OR UPDATE OF photo_id ON votes
FOR EACH ROW
EXECUTE FUNCTION ensure_vote_theme_is_active();

DROP TRIGGER IF EXISTS trg_votes_theme_active_delete ON votes;
CREATE TRIGGER trg_votes_theme_active_delete
BEFORE DELETE ON votes
FOR EACH ROW
EXECUTE FUNCTION ensure_vote_theme_is_active();

INSERT INTO communities (code, name)
VALUES
  ('ANDALUCIA01', 'Andalucía'),
  ('ARAGON01', 'Aragón'),
  ('ASTURIAS01', 'Principado de Asturias'),
  ('BALEARES01', 'Illes Balears'),
  ('CANARIAS01', 'Canarias'),
  ('CANTABRIA01', 'Cantabria'),
  ('CASTILLA_LA_MANCHA01', 'Castilla-La Mancha'),
  ('CASTILLA_Y_LEON01', 'Castilla y León'),
  ('CATALUNA01', 'Cataluña'),
  ('CEUTA01', 'Ceuta'),
  ('COM_VALENCIANA01', 'Comunitat Valenciana'),
  ('EXTREMADURA01', 'Extremadura'),
  ('GALICIA01', 'Galicia'),
  ('LA_RIOJA01', 'La Rioja'),
  ('MADRID01', 'Comunidad de Madrid'),
  ('MELILLA01', 'Melilla'),
  ('MURCIA01', 'Región de Murcia'),
  ('NAVARRA01', 'Comunidad Foral de Navarra'),
  ('PAIS_VASCO01', 'País Vasco')
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories (slug, name)
VALUES
  ('naturaleza', 'Naturaleza'),
  ('urbano', 'Urbano'),
  ('retrato', 'Retrato'),
  ('montana', 'Montaña'),
  ('viajes', 'Viajes')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO themes (community_id, title, description, start_date, end_date, is_active)
SELECT
  c.id,
  'Paisajes espectaculares',
  'Tema inicial para dejar el flujo de subida listo en local.',
  date_trunc('week', CURRENT_DATE)::date,
  date_trunc('week', CURRENT_DATE)::date + INTERVAL '6 days',
  true
FROM communities c
WHERE c.code = 'MADRID01'
  AND NOT EXISTS (
    SELECT 1
    FROM themes t
    WHERE t.title = 'Paisajes espectaculares'
      AND t.is_active = true
  );

COMMIT;
