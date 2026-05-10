BEGIN;

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
