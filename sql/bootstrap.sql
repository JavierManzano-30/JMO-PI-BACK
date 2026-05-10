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
