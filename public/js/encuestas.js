// Definir la URL de la API o endpoint que devuelve los datos de usuarios
const apiUrl = '/api/encuestas'; // Asegúrate de tener esta ruta implementada en tu servidor

// Función para obtener los datos de usuarios
async function obtenerEncuesta() {
  try {
    const respuesta = await fetch(apiUrl);
    if (!respuesta.ok) {
      throw new Error(`Error al obtener encuestas: ${respuesta.status}`);
    }
    const encuestas = await respuesta.json();

    !encuestas.length ? alert('No se encontraron encuestas') : mostrarEncuestas(encuestas);
        
  } catch (error) {
    console.error(error);
    alert('Ocurrió un error al cargar las encuestas.');
  }
}

// Función para mostrar las encuestas
function mostrarEncuestas(encuestas) {
  const tbody = document.querySelector('#tabla-encuestas tbody');
  tbody.innerHTML = ''; // Limpiar el contenido actual

  encuestas.forEach((encuesta) => {
    const fila = document.createElement('tr');

    // Crear celdas para cada columna
    const columnas = ['id_encuesta', 'nombre_encuesta', 'numero_preguntas'];
    columnas.forEach((columna) => {
      const celda = document.createElement('td');
      celda.textContent = encuesta[columna] || 'N/A'; // Mostrar 'N/A' si el campo está vacío
      fila.appendChild(celda);
    });

    tbody.appendChild(fila);
  });
}

// Llamar a la función para obtener y mostrar las encuestas al cargar la página
document.addEventListener('DOMContentLoaded', obtenerEncuesta);
