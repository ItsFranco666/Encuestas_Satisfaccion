const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const { processExcel } = require("./routes/processExcel");
const { pool } = require('./db/db');

const app = express();
const upload = multer({ dest: "uploads/" });

// Ruta para verificar la conexión a la base de datos
app.get("/db-status", async (req, res) => {
  try {
    await pool.query("SELECT 1"); // Prueba simple de conexión
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

app.use(express.static("public"));

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo." });
    }

    const result = await processExcel(req.file.path);
    res.json({ message: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error procesando el archivo." });
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
