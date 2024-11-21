const xlsx = require('xlsx');
const moment = require("moment-timezone");
const { pool } = require('../db/db');

async function processExcel(filePath) {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { raw: false });

  const normalizedRows = data.map((row) => {
    const normalizedRow = {};
    for (const key in row) {
      let value = row[key];
      // Verificar si el valor es una fecha
      if (value instanceof Date) {
        // Convertir a string en el formato correcto
        // Si necesitas una zona horaria específica, usa moment-timezone
        value = moment(value).tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss');
        value = value.toISOString().replace('T', ' ').replace('Z', '').replace('0', '00'); // Eliminar la 'Z' y reemplazar 'T' por un espacio
      }
      normalizedRow[String(key).trim()] = value;
    }
    return normalizedRow;
  });

  const client = await pool.connect();

  try {
    for (const row of data) {
      const {...respuestas} = row;

      const datos_usuario = Object.values(respuestas).slice(0, 8);
      const fechaFinalizacion = moment(datos_usuario[2], 'MM/DD/YY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');

      // 1. Verificar o insertar encuesta
      const encuesta = await client.query(
        `INSERT INTO encuestas (nombre_encuesta) 
                VALUES ($1)
                RETURNING id_encuesta`,
        ['Nueva Encuesta']
      );
      const id_encuesta = encuesta.rows[0]?.id_encuesta;

      // 2. Insertar preguntas
      const preguntas = Object.keys(respuestas).slice(8);

      for (const pregunta of preguntas) {
        await client.query(
          `INSERT INTO preguntas (ID_encuesta, pregunta) 
                    VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id_encuesta, pregunta]
        );
      }

      // 3. Insertar usuario
      const proyecto = await client.query(
        `SELECT id_proyecto FROM proyectos_curriculares
          WHERE nombre = $1`,
          [datos_usuario[5]]
      );

      const id_proyecto = proyecto.rows[0]?.id_proyecto;

      const usuario = await client.query(
        `INSERT INTO usuarios (nombre, correo_personal, correo_institucional, id_proyecto) 
                VALUES ($1, $2, $3, $4) ON CONFLICT (correo_personal) DO NOTHING 
                RETURNING id_usuario`,
        [datos_usuario[4], datos_usuario[7], datos_usuario[6], id_proyecto]
      );
      const id_usuario = usuario.rows[0]?.id_usuario;

      // 4. Insertar respuesta
      const respuesta = await client.query(
        `INSERT INTO respuestas (ID_encuesta, ID_usuario, fecha_respuesta) 
                VALUES ($1, $2, $3) RETURNING ID_respuesta`,
        [id_encuesta, id_usuario, fechaFinalizacion]
      );
      const id_respuesta = respuesta.rows[0]?.id_respuesta;

      // 5. Insertar detalles de respuestas
      for (const [pregunta, calificacion] of Object.entries(respuestas).slice(8)) {
        const consulta_preguntaId = await client.query(
          `SELECT ID_pregunta FROM preguntas WHERE pregunta = $1 AND ID_encuesta = $2`,
          [pregunta, id_encuesta]
        );

        const preguntaId = consulta_preguntaId.rows[0].id_pregunta;

        await client.query(
          `INSERT INTO detalles_respuestas (ID_respuesta, ID_pregunta, calificacion) 
                    VALUES ($1, $2, $3)`,
          [id_respuesta, preguntaId, calificacion]
        );
      }
    }
    return 'Archivo procesado exitosamente.';
  } catch (error) {
    console.error(error);
    throw new Error('Error procesando el archivo.');
  } finally {
    client.release();
  }
}

module.exports = { processExcel };
