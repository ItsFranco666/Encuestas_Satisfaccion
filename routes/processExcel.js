const xlsx = require("xlsx");
const { pool } = require("../db/db");

async function processExcel(filePath) {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { raw: true });

  const normalizedRows = data.map((row) => {
    const normalizedRow = {};
    try {
      for (const key in row) {
        // Asegurarte de que todas las claves sean cadenas
        normalizedRow[String(key).trim()] = row[key];
      }
      return normalizedRow;
    } catch (error) {
      throw new Error(error);
      console.log(error);
    }
  });
  console.log(normalizedRows);

  const client = await pool.connect();

  try {
    console.log(data);
    for (const row of data) {
      const {
        id,
        nombre,
        correo_personal,
        correo_institucional,
        proyecto_curricular,
        hora_finalizacion,
        ...respuestas
      } = row;

      // 1. Verificar o insertar encuesta
      const encuesta = await client.query(
        `INSERT INTO encuestas (nombre_encuesta) 
                VALUES ($1) ON CONFLICT (nombre_encuesta) DO NOTHING 
                RETURNING id_encuesta`,
        ["Nueva Encuesta"]
      );
      const id_encuesta = encuesta.rows[0]?.ID_encuesta;

      console.log(typeof id_encuesta);

      // 2. Insertar preguntas
      const preguntas = Object.keys(respuestas);
      for (const pregunta of preguntas) {
        await client.query(
          `INSERT INTO preguntas (ID_encuesta, pregunta) 
                    VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id_encuesta, pregunta]
        );
      }

      // 3. Insertar usuario
      const usuario = await client.query(
        `INSERT INTO usuarios (nombre, correo_personal) 
                VALUES ($1, $2) ON CONFLICT (correo_personal) DO NOTHING 
                RETURNING ID_usuario`,
        [nombre, correo_electrónico]
      );
      const id_usuario = usuario.rows[0]?.ID_usuario;

      // 4. Insertar respuesta
      const respuesta = await client.query(
        `INSERT INTO respuestas (ID_encuesta, ID_usuario, fecha_respuesta) 
                VALUES ($1, $2, NOW()) RETURNING ID_respuesta`,
        [id_encuesta, id_usuario]
      );
      const id_respuesta = respuesta.rows[0]?.ID_respuesta;

      // 5. Insertar detalles de respuestas
      for (const [pregunta, calificacion] of Object.entries(respuestas)) {
        const preguntaId = await client.query(
          `SELECT ID_pregunta FROM preguntas WHERE pregunta = $1 AND ID_encuesta = $2`,
          [pregunta, id_encuesta]
        );
        await client.query(
          `INSERT INTO detalles_respuestas (ID_respuesta, ID_pregunta, calificacion) 
                    VALUES ($1, $2, $3)`,
          [id_respuesta, preguntaId.rows[0].ID_pregunta, calificacion]
        );
      }
    }
    return "Archivo procesado exitosamente.";
  } catch (error) {
    throw new Error("Error procesando el archivo.");
  } finally {
    client.release();
  }
}

module.exports = { processExcel };
