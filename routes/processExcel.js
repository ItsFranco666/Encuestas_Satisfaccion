const xlsx = require('xlsx'); // Lectura de archivos xlsx
const moment = require('moment-timezone'); // Manejo de fechas
const { pool } = require('../db/db'); // Conexion con la base de datos postgre

// Funcion asincrona para procesar los datos de la hoja de calculo (reportes de cada encuesta)
async function processExcel(filePath, nombreArchivo) {
  // Leer el archivo de Excel y convertirlo a un array de objetos JSON con las filas normalizadas
  const workbook = xlsx.readFile(filePath, { cellDates: true });

  // Extraer el nombre de la hoja de calculo
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Extraer datos de la hoja de calculo seleccionada y utilizar un formato crudo (raw) para la poosterior conversion de los datos
  const data = xlsx.utils.sheet_to_json(sheet, { raw: false });

  /**Funcion para convertir la fecha mal recuperada del excel en un formato admisible para postgreSQL. */
  const normalizedRows = data.map((row) => {
    const normalizedRow = {};

    // Recorrer cabeceras de la tabla
    for (const key in row) {
      // Guardar valor de la celda
      let value = row[key];

      // Verificar si el valor es un objeto de fecha
      if (value instanceof Date) {
        // Libreria moment para usar la zona horaria de Bogota
        value = moment(value)
          .tz('America/Bogota')
          .format('YYYY-MM-DD HH:mm:ss');

        // Eliminar la 'Z' y reemplazar 'T' por un espacio por formato de excel
        value = value.toISOString().replace('T', ' ').replace('Z', '');
      }

      // Se asigna al objeto el valor normalizado
      normalizedRow[String(key).trim()] = value;
    }
    return normalizedRow;
  });

  // Iniciar conexion con la base de datos
  const client = await pool.connect();

  // Realizar transacciones en la base de datos
  try {
    // Recorrer cada fila de la tabla
    for (const row of data) {
      // Objeto con los valores/atributos de cada fila
      const { ...respuestas } = row;

      // Lista con los datos personales del usuario (primeras 8 columnas)
      const datos_usuario = Object.values(respuestas).slice(0, 9);

      /**Formatear la fecha obtenida de la celda de hora de finalizacion la cual se utilizara como fecha de realizacion
       * del cuestionario. EL formato se realiza para adaptarlo al formato TIMESTAMP que admite postgreSQL */
      const fechaFinalizacion = moment(
        datos_usuario[2],
        'MM/DD/YY HH:mm:ss'
      ).format('YYYY-MM-DD HH:mm:ss');

      // 1. Verificar o insertar encuesta
      const verificarEncuesta = await client.query(
        `SELECT id_encuesta 
            FROM encuestas 
            WHERE nombre_encuesta = $1;`,
        [nombreArchivo]
      );

      let id_encuesta;

      // Verificar que la encuesta ya se encuestre en la bd y extraer su ID
      if (verificarEncuesta.rows.length > 0) {
        // Ternario para no agregar nada en caso de que no se cumpla la condicion
        id_encuesta = verificarEncuesta.rows[0]?.id_encuesta;
      } else {
        // Si no se encuetra en ID agregar la encuesta a la bd
        const encuesta = await client.query(
          `INSERT INTO encuestas (nombre_encuesta) 
              VALUES ($1)
              RETURNING id_encuesta`,
          [nombreArchivo]
        );

        id_encuesta = encuesta.rows[0]?.id_encuesta;
      }

      // Insertar preguntas solo una vez por encuesta
      const preguntasExistentes = new Set();
      const preguntasDB = await client.query(
        `SELECT pregunta FROM preguntas WHERE ID_encuesta = $1`,
        [id_encuesta]
      );
      preguntasDB.rows.forEach((row) => preguntasExistentes.add(row.pregunta));

      // Lista con las preguntas
      const preguntas = Object.keys(respuestas).slice(9);

      // 2. Insertar preguntas
      for (const pregunta of preguntas) {
        if (!preguntasExistentes.has(pregunta)) {
          await client.query(
            `INSERT INTO preguntas (ID_encuesta, pregunta) 
                VALUES ($1, $2)`,
            [id_encuesta, pregunta]
          );
          preguntasExistentes.add(pregunta);
        }
      }

      // 3. Buscar el proyecto curricular en la bd
      const proyecto = await client.query(
        `SELECT id_proyecto FROM proyectos_curriculares
            WHERE nombre = $1`,
        [datos_usuario[6]]
      );

      // Recuperar el id del proyecto curricular de la bd
      const id_proyecto = proyecto.rows[0]?.id_proyecto;

      // 3. Insertar usuario
      const usuario = await client.query(
        `INSERT INTO usuarios (nombre, correo_personal, correo_institucional, id_proyecto) 
            VALUES ($1, $2, $3, $4) ON CONFLICT (correo_personal) DO NOTHING 
            RETURNING id_usuario`,
        [datos_usuario[4], datos_usuario[7], datos_usuario[3], id_proyecto]
      );

      // Recuperar el id del usuario de la bd
      const id_usuario = usuario.rows[0]?.id_usuario;

      // 4. Insertar respuesta
      const respuesta = await client.query(
        `INSERT INTO respuestas (ID_encuesta, ID_usuario, fecha_respuesta) 
                VALUES ($1, $2, $3) RETURNING ID_respuesta`,
        [id_encuesta, id_usuario, fechaFinalizacion]
      );
      const id_respuesta = respuesta.rows[0]?.id_respuesta;

      // 5. Insertar detalles de respuestas
      for (const [pregunta, calificacion] of Object.entries(respuestas).slice(9)) {
        // Buscar el id de la pregunta en la bd según el nombre y la encuesta actual
        const consulta_preguntaId = await client.query(
          `SELECT ID_pregunta FROM preguntas WHERE pregunta = $1 AND ID_encuesta = $2`,
          [pregunta, id_encuesta]
        );

        // Recuperar el id de la pregunta de la bd
        const preguntaId = consulta_preguntaId.rows[0].id_pregunta;

        // Insertar detalles de respuestas en la bd
        await client.query(
          `INSERT INTO detalles_respuestas (ID_respuesta, ID_pregunta, calificacion) 
                    VALUES ($1, $2, $3)`,
          [id_respuesta, preguntaId, calificacion]
        );
      }
    }
    return 'Archivo procesado exitosamente';
  } catch (error) {
    console.error(error);
    throw new Error('Error procesando el archivo');
  } finally {
    // Terminar pool con la bd
    client.release();
  }
}

module.exports = { processExcel };
