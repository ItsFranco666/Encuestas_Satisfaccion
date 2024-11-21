const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const { processExcel } = require("./routes/processExcel");
require('dotenv').config();
const port = process.env.PORT;
const { pool } = require('./db/db');

const app = express();
const upload = multer({ dest: "uploads/" });

// EndPoint para verificar la conexión a la base de datos
app.get("/db-status", async (req, res) => {
  try {
    // Prueba simple de conexión
    await pool.query("SELECT 1");
    res.json({
      status: "success",
      message: "Conexión exitosa a la base de datos",
    });
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
    res.json({
      status: "error",
      message: "Error al conectar a la base de datos",
    });
  }
});

// Dar acceso al uso de los recursos de la carpeta 'public'
app.use(express.static("public"));

// Ruta de subida del reporte de la encuesta
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    //Verificar que se haya enviado un archivo
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo." });
    }

    // Llamar al metodo que procesa el documento desde la ruta
    const result = await processExcel(req.file.path);
    res.json({ message: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error procesando el archivo." });
  }
});

// Inicializar el servidor en el puerto 3000
app.listen(port, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
