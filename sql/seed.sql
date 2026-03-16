BEGIN;

INSERT INTO communities (code, name)
VALUES
  ('MADRID01', 'Comunidad de Madrid'),
  ('CATALUNA01', 'Cataluña'),
  ('ANDALUCIA01', 'Andalucía')
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
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days',
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
