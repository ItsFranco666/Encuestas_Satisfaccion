// Verificar estado de la base de datos
async function checkDatabaseStatus() {
  try {
    const response = await fetch("/db-status");
    const data = await response.json();
    const statusDiv = document.getElementById("db-status");

    console.log(JSON.stringify(data));
    console.log(data.status);

    if (data.status === "success") {
      statusDiv.textContent = data.message;
      statusDiv.className = "success";
    } else {
      statusDiv.textContent = data.message;
      statusDiv.className = "error";
    }
  } catch (error) {
    console.error("Error al verificar la base de datos:", error);
    const statusDiv = document.getElementById("db-status");
    statusDiv.textContent = "No se pudo verificar la conexión a la base de datos";
    statusDiv.className = "error";
  }
}

// Llamar la función al cargar la página
window.onload = checkDatabaseStatus;

document
  .getElementById("upload-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const fileInput = document.getElementById("file");
    if (fileInput.files.length === 0) {
      alert("Seleccione un archivo antes de subirlo.");
      return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    console.log(formData);

    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    document.getElementById("message").textContent = result.message;
  });