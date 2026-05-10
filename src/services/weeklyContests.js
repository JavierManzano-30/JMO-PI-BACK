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
  {
    title: 'Reflejos cotidianos',
    description: 'Cristales, charcos, espejos o superficies que transformen una escena real.',
  },
  {
    title: 'Rincones con memoria',
    description: 'Lugares que transmitan historia, uso o paso del tiempo.',
  },
  {
    title: 'Texturas naturales',
    description: 'Piedra, madera, hojas, arena o agua como protagonistas visuales.',
  },
  {
    title: 'Puertas y ventanas',
    description: 'Encuadres donde puertas o ventanas sugieran entrada, salida o mirada.',
  },
  {
    title: 'Rojo protagonista',
    description: 'Una composición donde el color rojo guíe la lectura de la imagen.',
  },
  {
    title: 'Azul en calma',
    description: 'Fotografías donde el azul transmita serenidad, profundidad o distancia.',
  },
  {
    title: 'Verde vivo',
    description: 'Escenas donde el verde represente naturaleza, frescura o crecimiento.',
  },
  {
    title: 'Amarillo y energía',
    description: 'Imágenes donde el amarillo aporte luz, calor o dinamismo.',
  },
  {
    title: 'Blanco y silencio',
    description: 'Composiciones limpias con predominio de blancos o espacios vacíos.',
  },
  {
    title: 'Negro profundo',
    description: 'Fotografías apoyadas en sombras densas, fondos oscuros o bajo contraste tonal.',
  },
  {
    title: 'Simetría encontrada',
    description: 'Escenas reales donde la simetría aparezca de forma clara o sugerida.',
  },
  {
    title: 'Asimetría equilibrada',
    description: 'Composiciones descentradas que aun así mantengan armonía visual.',
  },
  {
    title: 'Líneas que guían',
    description: 'Caminos, barandillas, calles o formas que dirijan la mirada.',
  },
  {
    title: 'Curvas suaves',
    description: 'Fotografías construidas alrededor de curvas, arcos o formas orgánicas.',
  },
  {
    title: 'Escaleras',
    description: 'Escaleras reales como recurso de ritmo, profundidad o narrativa.',
  },
  {
    title: 'Puentes',
    description: 'Puentes físicos o visuales que conecten espacios, personas o ideas.',
  },
  {
    title: 'Agua en movimiento',
    description: 'Ríos, lluvia, fuentes, olas o gotas capturadas con intención.',
  },
  {
    title: 'Agua quieta',
    description: 'Superficies de agua en calma, reflejos y escenas pausadas.',
  },
  {
    title: 'Lluvia',
    description: 'Fotografías donde la lluvia cambie el ambiente, el color o la textura.',
  },
  {
    title: 'Viento visible',
    description: 'Elementos movidos por el viento: ropa, árboles, cabello, polvo o nubes.',
  },
  {
    title: 'Calor de verano',
    description: 'Escenas que transmitan sol, altas temperaturas o vida veraniega.',
  },
  {
    title: 'Frío de invierno',
    description: 'Imágenes que comuniquen frío mediante luz, color, ropa o paisaje.',
  },
  {
    title: 'Otoño en detalle',
    description: 'Hojas, tonos cálidos, lluvia o cambios de estación vistos de cerca.',
  },
  {
    title: 'Primavera urbana',
    description: 'Brotes, flores o color natural dentro de entornos urbanos.',
  },
  {
    title: 'Manos trabajando',
    description: 'Manos realizando un oficio, gesto, tarea o acción cotidiana.',
  },
  {
    title: 'Miradas',
    description: 'Retratos o escenas donde una mirada sostenga la emoción principal.',
  },
  {
    title: 'Espaldas que cuentan',
    description: 'Personas fotografiadas de espaldas con una narrativa clara.',
  },
  {
    title: 'Gestos pequeños',
    description: 'Acciones mínimas que revelen personalidad, relación o momento.',
  },
  {
    title: 'Multitudes',
    description: 'Grupos de personas, patrones humanos o escenas de alta actividad.',
  },
  {
    title: 'Soledad acompañada',
    description: 'Una persona o elemento aislado dentro de un espacio significativo.',
  },
  {
    title: 'Mascotas y vínculo',
    description: 'Animales domésticos y la relación visual con su entorno o sus personas.',
  },
  {
    title: 'Vida en la calle',
    description: 'Momentos espontáneos del espacio público con interés visual.',
  },
  {
    title: 'Mercados',
    description: 'Puestos, productos, compradores o detalles de mercados y comercios locales.',
  },
  {
    title: 'Transporte diario',
    description: 'Autobuses, trenes, bicis, coches o desplazamientos cotidianos.',
  },
  {
    title: 'Caminos y senderos',
    description: 'Rutas que inviten a recorrer visualmente la imagen.',
  },
  {
    title: 'Arquitectura antigua',
    description: 'Edificios, detalles o espacios que destaquen por su antigüedad.',
  },
  {
    title: 'Arquitectura moderna',
    description: 'Estructuras contemporáneas, materiales actuales y geometrías limpias.',
  },
  {
    title: 'Fachadas con carácter',
    description: 'Fachadas que destaquen por color, textura, historia o composición.',
  },
  {
    title: 'Balcones',
    description: 'Balcones como pequeños escenarios de vida, color o repetición.',
  },
  {
    title: 'Luces nocturnas',
    description: 'Iluminación artificial, neones, farolas o interiores vistos de noche.',
  },
  {
    title: 'Hora azul',
    description: 'Fotografías tomadas al amanecer o atardecer cuando domina el azul.',
  },
  {
    title: 'Hora dorada',
    description: 'Luz cálida y baja que transforme personas, paisaje o arquitectura.',
  },
  {
    title: 'Contraluz',
    description: 'Siluetas, bordes iluminados y escenas construidas contra la fuente de luz.',
  },
  {
    title: 'Luz dura',
    description: 'Sombras marcadas y contrastes fuertes bajo luz directa.',
  },
  {
    title: 'Luz suave',
    description: 'Ambientes difusos, niebla, nubes o interiores con iluminación delicada.',
  },
  {
    title: 'Minimalismo',
    description: 'Pocos elementos, composición clara y atención al espacio negativo.',
  },
  {
    title: 'Caos ordenado',
    description: 'Escenas cargadas de elementos pero con una composición intencional.',
  },
  {
    title: 'Patrones repetidos',
    description: 'Repeticiones de formas, colores, personas u objetos.',
  },
  {
    title: 'Un elemento distinto',
    description: 'Una repetición rota por un detalle que destaque claramente.',
  },
  {
    title: 'Objetos olvidados',
    description: 'Cosas abandonadas o fuera de lugar que sugieran una historia.',
  },
  {
    title: 'Objetos favoritos',
    description: 'Un objeto personal o cotidiano fotografiado con intención narrativa.',
  },
  {
    title: 'Cocina y hogar',
    description: 'Alimentos, utensilios, mesas o escenas domésticas con atractivo visual.',
  },
  {
    title: 'Café y sobremesa',
    description: 'Momentos alrededor de bebidas, conversación, descanso o mesas compartidas.',
  },
  {
    title: 'Fiestas locales',
    description: 'Tradiciones, celebraciones, detalles o ambientes festivos de una comunidad.',
  },
  {
    title: 'Deporte urbano',
    description: 'Actividad física, movimiento y energía en entornos urbanos.',
  },
  {
    title: 'Silencio rural',
    description: 'Paisajes, detalles o escenas de pueblos y campo con ritmo pausado.',
  },
  {
    title: 'Horizontes',
    description: 'Líneas de horizonte naturales o urbanas como estructura principal.',
  },
  {
    title: 'Montañas',
    description: 'Relieves, caminos, cumbres o detalles relacionados con la montaña.',
  },
  {
    title: 'Costa',
    description: 'Playas, puertos, acantilados o vida cerca del mar.',
  },
  {
    title: 'Bosque',
    description: 'Árboles, caminos, claros, sombras o vida dentro de un bosque.',
  },
  {
    title: 'Desierto visual',
    description: 'Espacios secos, vacíos, austeros o con sensación de amplitud.',
  },
  {
    title: 'Niebla',
    description: 'Escenas donde la niebla o bruma reduzca, oculte o sugiera.',
  },
  {
    title: 'Nubes dramáticas',
    description: 'Cielos con volumen, tormenta, textura o presencia dominante.',
  },
  {
    title: 'Estrellas',
    description: 'Fotografías nocturnas donde el cielo estrellado tenga peso visual.',
  },
  {
    title: 'La luna',
    description: 'La luna como protagonista o como detalle dentro de una composición.',
  },
  {
    title: 'Tecnología cotidiana',
    description: 'Dispositivos, pantallas, cables o herramientas digitales en la vida diaria.',
  },
  {
    title: 'Pantallas',
    description: 'Reflejos, luces o escenas construidas alrededor de pantallas.',
  },
  {
    title: 'Analógico',
    description: 'Objetos, técnicas o ambientes que recuerden procesos no digitales.',
  },
  {
    title: 'Señales y carteles',
    description: 'Textos urbanos, señales, rótulos o tipografías encontrados en la calle.',
  },
  {
    title: 'Tipografía encontrada',
    description: 'Letras, números o palabras integradas en una composición fotográfica.',
  },
  {
    title: 'Sombras humanas',
    description: 'Sombras proyectadas por personas como elemento narrativo principal.',
  },
  {
    title: 'Siluetas',
    description: 'Figuras reconocibles mediante contorno y contraste, con pocos detalles internos.',
  },
  {
    title: 'Movimiento borroso',
    description: 'Uso intencional del desenfoque de movimiento para expresar velocidad o ritmo.',
  },
  {
    title: 'Quietud',
    description: 'Fotografías que transmitan pausa, espera o calma absoluta.',
  },
  {
    title: 'A través de algo',
    description: 'Escenas vistas a través de cristales, rejas, telas, puertas o huecos.',
  },
  {
    title: 'Marco natural',
    description: 'Elementos del entorno que enmarquen el sujeto principal.',
  },
  {
    title: 'Primer plano',
    description: 'Detalles cercanos con textura, forma o emoción protagonista.',
  },
  {
    title: 'Gran angular',
    description: 'Escenas amplias donde el espacio y la profundidad sean esenciales.',
  },
  {
    title: 'Perspectiva baja',
    description: 'Fotografías tomadas desde cerca del suelo o con ángulo bajo.',
  },
  {
    title: 'Perspectiva alta',
    description: 'Escenas vistas desde arriba, balcones, miradores o planos cenitales.',
  },
  {
    title: 'Composición diagonal',
    description: 'Imágenes donde una diagonal aporte tensión, dirección o dinamismo.',
  },
  {
    title: 'Centro de atención',
    description: 'Un sujeto principal claramente destacado por luz, color, foco o posición.',
  },
  {
    title: 'Fuera de foco',
    description: 'Uso creativo del desenfoque para sugerir, ocultar o ambientar.',
  },
  {
    title: 'Bokeh',
    description: 'Luces o fondos desenfocados como recurso estético principal.',
  },
  {
    title: 'Refugios',
    description: 'Espacios que transmitan protección, descanso o intimidad.',
  },
  {
    title: 'Trabajo en equipo',
    description: 'Personas colaborando, ayudándose o compartiendo una tarea.',
  },
  {
    title: 'Generaciones',
    description: 'Contrastes o vínculos entre edades, épocas o formas de vivir.',
  },
  {
    title: 'Contrastes sociales',
    description: 'Diferencias visibles entre espacios, usos, ritmos o formas de habitar.',
  },
  {
    title: 'Pequeñas alegrías',
    description: 'Momentos simples que transmitan bienestar, humor o cercanía.',
  },
  {
    title: 'Melancolía',
    description: 'Escenas que sugieran nostalgia, ausencia o recuerdo.',
  },
  {
    title: 'Misterio',
    description: 'Una imagen que plantee preguntas, oculte información o cree tensión.',
  },
  {
    title: 'Humor visual',
    description: 'Coincidencias, gestos o composiciones que generen una lectura divertida.',
  },
  {
    title: 'Antes y después',
    description: 'Una imagen que sugiera cambio, transformación o paso del tiempo.',
  },
  {
    title: 'Nuevo comienzo',
    description: 'Imágenes que sugieran inicio, renovación, decisión o expectativa.',
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
