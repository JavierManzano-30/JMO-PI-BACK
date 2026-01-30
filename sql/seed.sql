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

COMMIT;
