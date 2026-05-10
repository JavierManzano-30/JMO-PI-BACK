import pool from '../db/pool.js';
import config from '../config.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKLY_CONTEST_LOCK_ID = 20260510;

export const WEEKLY_CONTEST_THEMES = [
  {
    title: 'Luz de amanecer',
    description: 'Fotografías donde la primera luz del día sea protagonista.',
  },
  {
    title: 'Geometría urbana',
    description: 'Calles, edificios y detalles de ciudad con líneas, patrones o simetrías.',
  },
  {
    title: 'Naturaleza cercana',
    description: 'Escenas naturales encontradas en el entorno cotidiano.',
  },
  {
    title: 'Retratos con historia',
    description: 'Retratos que transmitan una emoción, oficio o momento personal.',
  },
  {
    title: 'Color dominante',
    description: 'Composiciones donde un color marque claramente la imagen.',
  },
  {
    title: 'Movimiento congelado',
    description: 'Acción, deporte, agua o gestos capturados en el instante exacto.',
  },
  {
    title: 'Sombras y contraste',
    description: 'Imágenes construidas con sombras, siluetas y contraste de luz.',
  },
  {
    title: 'Vida de barrio',
    description: 'Momentos cotidianos que representen la identidad de un barrio o pueblo.',
  },
  {
    title: 'Detalles mínimos',
    description: 'Primeros planos o detalles pequeños que normalmente pasan desapercibidos.',
  },
  {
    title: 'Cielo abierto',
    description: 'Cielos, nubes, estrellas o horizontes como elemento principal.',
  },
];

let schedulerTimer = null;

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

export function formatLocalDate(date) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-');
}

export function getWeeklyContestRange(referenceDate = new Date()) {
  const localDate = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const dayOfWeek = localDate.getDay();
  const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startDate = new Date(localDate);
  startDate.setDate(localDate.getDate() + daysFromMonday);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return {
    startDate: formatLocalDate(startDate),
    endDate: formatLocalDate(endDate),
  };
}

export function selectWeeklyContestThemes(startDateValue) {
  const [year, month, day] = startDateValue.split('-').map(Number);
  const weekIndex = Math.floor(Date.UTC(year, month - 1, day) / (MS_PER_DAY * 7));
  const firstIndex = (weekIndex * 2) % WEEKLY_CONTEST_THEMES.length;
  const secondIndex = (firstIndex + 1) % WEEKLY_CONTEST_THEMES.length;

  return [
    WEEKLY_CONTEST_THEMES[firstIndex],
    WEEKLY_CONTEST_THEMES[secondIndex],
  ];
}

export async function ensureWeeklyContests({
  db = pool,
  referenceDate = new Date(),
} = {}) {
  const client = await db.connect();
  const { startDate, endDate } = getWeeklyContestRange(referenceDate);

  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [WEEKLY_CONTEST_LOCK_ID]);

    const existingResult = await client.query(
      `SELECT id, title
       FROM themes
       WHERE is_active = true
         AND start_date = $1
         AND end_date = $2
       ORDER BY created_at ASC, id ASC`,
      [startDate, endDate]
    );

    const existingThemes = existingResult.rows || [];
    const needed = Math.max(0, 2 - existingThemes.length);
    const created = [];

    if (needed > 0) {
      const existingTitles = new Set(existingThemes.map((theme) => theme.title));
      const selectedThemes = selectWeeklyContestThemes(startDate)
        .filter((theme) => !existingTitles.has(theme.title))
        .slice(0, needed);

      for (const theme of selectedThemes) {
        const insertResult = await client.query(
          `INSERT INTO themes (community_id, title, description, start_date, end_date, is_active)
           VALUES (NULL, $1, $2, $3, $4, true)
           RETURNING id, title, description, start_date, end_date, is_active, created_at`,
          [theme.title, theme.description, startDate, endDate]
        );

        if (insertResult.rows[0]) {
          created.push(insertResult.rows[0]);
          existingTitles.add(theme.title);
        }
      }
    }

    await client.query('COMMIT');

    return {
      start_date: startDate,
      end_date: endDate,
      existing_count: existingThemes.length,
      created_count: created.length,
      created,
    };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Si falla el rollback, propagamos el error original.
    }
    throw error;
  } finally {
    client.release();
  }
}

export function startWeeklyContestScheduler({
  intervalMs = config.contests.automationCheckIntervalMs,
  logger = console,
} = {}) {
  if (schedulerTimer) {
    return schedulerTimer;
  }

  const run = async () => {
    try {
      const result = await ensureWeeklyContests();
      if (result.created_count > 0) {
        logger.info(
          `Concursos semanales creados: ${result.created_count} (${result.start_date} a ${result.end_date})`
        );
      }
    } catch (error) {
      logger.error('No se pudieron asegurar los concursos semanales:', error);
    }
  };

  run();
  schedulerTimer = setInterval(run, intervalMs);
  schedulerTimer.unref?.();

  return schedulerTimer;
}

export function stopWeeklyContestScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}
