// Definir la URL de la API o endpoint que devuelve los datos de usuarios
const apiUrl = '/api/usuarios'; // Asegúrate de tener esta ruta implementada en tu servidor

// Función para obtener los datos de usuarios
async function obtenerUsuarios() {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Error al obtener usuarios: ${response.status}`);
    }
    const usuarios = await response.json();

    !usuarios.length ? alert('no se encontraron usuarios') : mostrarUsuarios(usuarios);

  } catch (error) {
    console.error(error);
    alert('Ocurrió un error al cargar los usuarios.');
  }
}

// Función para mostrar los usuarios en la tabla
function mostrarUsuarios(usuarios) {
  const tbody = document.querySelector('#tabla-usuarios tbody');
  tbody.innerHTML = ''; // Limpiar el contenido actual
  
  usuarios.forEach((usuario) => {
    const fila = document.createElement('tr');

    // Crear celdas para cada columna
    const columnas = ['id_usuario', 'nombre', 'correo_personal', 'correo_institucional', 'nombre_proyecto'];
    columnas.forEach((columna) => {
      const celda = document.createElement('td');
      celda.textContent = usuario[columna] || 'N/A'; // Mostrar 'N/A' si el campo está vacío
      fila.appendChild(celda);
    });

    tbody.appendChild(fila);
  });
}

// Llamar a la función para obtener y mostrar los usuarios al cargar la página
document.addEventListener('DOMContentLoaded', obtenerUsuarios);
