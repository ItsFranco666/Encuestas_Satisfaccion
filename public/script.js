// // Verificar estado de la base de datos
// async function checkDatabaseStatus() {
//   try {
//     const response = await fetch("/db-status");
//     const data = await response.json();
//     const statusDiv = document.getElementById("db-status");

//     console.log(JSON.stringify(data));
//     console.log(data.status);

//     if (data.status === "success") {
//       statusDiv.textContent = data.message;
//       statusDiv.className = "success";
//     } else {
//       statusDiv.textContent = data.message;
//       statusDiv.className = "error";
//     }
//   } catch (error) {
//     console.error("Error al verificar la base de datos:", error);
//     const statusDiv = document.getElementById("db-status");
//     statusDiv.textContent = "No se pudo verificar la conexión a la base de datos";
//     statusDiv.className = "error";
//   }
// }

// // Llamar la función al cargar la página
// window.onload = checkDatabaseStatus;

/**Manejo del DOM para el envio del formulario.
 * 1. Comprueba si se subio un archivo antes de subir.
 * 2. Crea un objeto de FormData con el archivo subido
 * 3. Manda el objeto a la ruta de /upload que se manejara desde server.js
 * 4. Esperara una respuesta de la rutay retornara el mensaje que devuelve */
document
    .getElementById('upload-form')
    .addEventListener('submit', async (event) => {
        event.preventDefault();

        const mensaje = document.getElementById('mensaje');

        const fileInput = document.getElementById('file');
        if (fileInput.files.length === 0) {
            alert('Seleccione un archivo antes de subirlo.');
            return;
        }

        // Obtener el nombre del archivo
        const archivo = fileInput.files[0]; // Obtener el archivo cargado
        const nombreArchivo = archivo.name;

        const formData = new FormData();
        formData.append('file', archivo);
        formData.append('nombreArchivo', nombreArchivo);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();
        document.getElementById('mensaje').textContent = result.message;

        response.ok?mensaje.classList.toggle('ok'):mensaje.classList.toggle('error');
    });
