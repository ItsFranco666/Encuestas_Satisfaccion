// Definir la URL de la API o endpoint que devuelve los datos de usuarios
const apiUrl = '/api/respuestas'; // Asegúrate de tener esta ruta implementada en tu servidor

// Función para obtener los datos de usuarios
async function obtenerRespuestas() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Error al obtener respuestas: ${response.status}`);
    }
    const respuestas = await response.json();
    mostrarRespuestas(respuestas);
  } catch (error) {
    console.error(error);
    alert('Ocurrió un error al cargar las respuestas.');
  }
}

// Función para mostrar los usuarios en la tabla
function mostrarRespuestas(respuestas) {
  const tbody = document.querySelector('#tabla-respuestas tbody');
  tbody.innerHTML = ''; // Limpiar el contenido actual

  respuestas.forEach((respuesta) => {
    const fila = document.createElement('tr');

    // Crear celdas para cada columna
    const columnas = ['nombre_encuesta', 'nombre', 'fecha_respuesta', 'hora_respuesta'];
    columnas.forEach((columna) => {
      const celda = document.createElement('td');
      celda.textContent = respuesta[columna] || 'N/A'; // Mostrar 'N/A' si el campo está vacío
      fila.appendChild(celda);
    });

    tbody.appendChild(fila);
  });
}

// Llamar a la función para obtener y mostrar los usuarios al cargar la página
document.addEventListener('DOMContentLoaded', obtenerRespuestas);
