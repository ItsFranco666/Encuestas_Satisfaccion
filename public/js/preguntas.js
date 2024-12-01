// Definir la URL de la API o endpoint que devuelve los datos de usuarios
const apiUrl = '/api/preguntas'; // Asegúrate de tener esta ruta implementada en tu servidor

// Función para obtener los datos de usuarios
async function obtenerPreguntas() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Error al obtener preguntas: ${response.status}`);
    }
    const preguntas = await response.json();
    mostrarPreguntas(preguntas);
  } catch (error) {
    console.error(error);
    alert('Ocurrió un error al cargar las preguntas.');
  }
}

// Función para mostrar los usuarios en la tabla
function mostrarPreguntas(preguntas) {
  const tbody = document.querySelector('#tabla-preguntas tbody');
  tbody.innerHTML = ''; // Limpiar el contenido actual

  preguntas.forEach((pregunta) => {
    const fila = document.createElement('tr');

    // Crear celdas para cada columna
    const columnas = ['id_pregunta', 'nombre_encuesta', 'pregunta'];
    columnas.forEach((columna) => {
      const celda = document.createElement('td');
      celda.textContent = pregunta[columna] || 'N/A'; // Mostrar 'N/A' si el campo está vacío
      fila.appendChild(celda);
    });

    tbody.appendChild(fila);
  });
}

// Llamar a la función para obtener y mostrar los usuarios al cargar la página
document.addEventListener('DOMContentLoaded', obtenerPreguntas);
