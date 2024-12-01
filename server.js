// Dependencias
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Modulos
const { processExcel } = require('./routes/processExcel');
const { pool } = require('./db/db');

// Configuración del puerto y cargar variables de entorno
require('dotenv').config();
const port = process.env.PORT;

// Inicializar la aplicación express y configurar multer para la subida de archivos
const app = express();
const upload = multer({ dest: 'uploads/' });

// EndPoint para verificar la conexión a la base de datos
app.get('/db-status', async (req, res) => {
  try {
    // Prueba simple de conexión
    await pool.query('SELECT 1');
    res.json({
      status: 'success',
      message: 'Conexión exitosa a la base de datos',
    });
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error.message);
    res.json({
      status: 'error',
      message: 'Error al conectar a la base de datos',
    });
  }
});

// Dar acceso al uso de los recursos de la carpeta 'public'
app.use(express.static('public'));

// Ruta de subida del reporte de la encuesta
app.post('/upload', upload.single('file'), async (req, res) => {
  //Verificar que se haya enviado un archivo
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo.' });
  }

  // Llamar al metodo que procesa el documento desde la ruta
  const filePath = req.file.path;
  const nombreArchivo = req.body.nombreArchivo;

  try {
    // Procesar el documento excel
    const result = await processExcel(filePath, nombreArchivo);
    fs.unlinkSync(filePath); // Eliminar el archivo subido para liberar espacio
    res.json({ message: result });
  } catch (error) {
    console.error('Error procesando el archivo: ', error);
    res.status(500).json({ message: 'Error procesando el archivo.' });
  }
});

// Rutas para interfaces de tablas
app.get('/encuestas', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'encuestas.html'));
})
;app.get('/usuarios', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'usuarios.html'));
});
app.get('/preguntas', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'preguntas.html'));
});
app.get('/respuestas', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'respuestas.html'));
});
app.get('/calificaciones', function(req, res) {
  res.sendFile(path.join(__dirname, 'public', 'calificaciones.html'));
});

/**Rutas para API's de Tablas */
// Ruta para obtener usuarios
app.get('/api/encuestas', async (req, res) => {
  try {
    const resultados = await pool.query(`
      SELECT encuesta.id_encuesta, encuesta.nombre_encuesta , COUNT(pregunta.pregunta) AS numero_preguntas
      FROM encuestas encuesta
      INNER JOIN preguntas pregunta
      ON pregunta.id_encuesta = encuesta.id_encuesta
      GROUP BY(encuesta.id_encuesta);
    `);
    res.json(resultados.rows);
  } catch (error) {
    console.error('Error obteniendo encuestas:', error);
    res.status(500).json({ message: 'Error al obtener las encuestas.' });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const resultados = await pool.query(`
      SELECT usuario.id_usuario, usuario.nombre, usuario.correo_personal, usuario.correo_institucional, proyecto.nombre AS nombre_proyecto
      FROM usuarios AS usuario
      LEFT JOIN proyectos_curriculares AS proyecto
      ON proyecto.id_proyecto = usuario.id_proyecto;
    `);
    res.json(resultados.rows);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios.' });
  }
});

app.get('/api/preguntas', async (req, res) => {
  try {
    const resultados = await pool.query(`
      SELECT pregunta.id_pregunta, encuesta.nombre_encuesta, pregunta.pregunta
      FROM preguntas as pregunta
      INNER JOIN encuestas as encuesta
      ON pregunta.id_encuesta = encuesta.id_encuesta;
    `);
    res.json(resultados.rows);
  } catch (error) {
    console.error('Error obteniendo preguntas:', error);
    res.status(500).json({ message: 'Error al obtener las preguntas.' });
  }
});

app.get('/api/respuestas', async (req, res) => {
  try {
    const resultados = await pool.query(`
      SELECT encuesta.nombre_encuesta, usuario.nombre,
      CAST(respuesta.fecha_respuesta AS date) AS fecha_respuesta, 
      TO_CHAR(respuesta.fecha_respuesta, 'HH12:MI AM') AS hora_respuesta
      FROM respuestas AS respuesta
      INNER JOIN encuestas encuesta ON respuesta.id_encuesta = encuesta.id_encuesta
      LEFT JOIN usuarios usuario ON respuesta.id_usuario = usuario.id_usuario;
    `);
    res.json(resultados.rows);
  } catch (error) {
    console.error('Error obteniendo respuestas:', error);
    res.status(500).json({ message: 'Error al obtener las respuestas.' });
  }
});

app.get('/api/calificaciones', async (req, res) => {
  try {
    const resultados = await pool.query(`
      SELECT encuesta.nombre_encuesta, usuario.nombre,
      AVG(respuesta.calificacion) AS promedio_calificacion
      FROM respuestas AS respuesta
      INNER JOIN encuestas encuesta ON respuesta.id_encuesta = encuesta.id_encuesta
      LEFT JOIN usuarios usuario ON respuesta.id_usuario = usuario.id_usuario
      GROUP BY encuesta.id_encuesta, usuario.id_usuario;
    `);
    res.json(resultados.rows);
  } catch (error) {
    console.error('Error obteniendo calificaciones:', error);
    res.status(500).json({ message: 'Error al obtener las calificaciones.' });
  }
});

// Inicializar el servidor en el puerto 3000
app.listen(port, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
