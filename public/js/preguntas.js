document.addEventListener('DOMContentLoaded', async () => {
  const selectEncuestas = document.getElementById('encuestas');
  const tablaPreguntas = document.getElementById('tablaPreguntas');
  const tablaBody = tablaPreguntas.querySelector('tbody');
  const mensaje = document.getElementById('mensaje');

  // Cargar encuestas al select
  async function cargarEncuestas() {
    try {
      const response = await fetch('/api/encuestas');
      const encuestas = await response.json();

      if (encuestas.length === 0) {
        mensaje.classList.remove('hidden');
        return;
      }

      mensaje.classList.add('hidden');
      encuestas.forEach((encuesta) => {
        const option = document.createElement('option');
        option.value = encuesta.id_encuesta;
        option.textContent = encuesta.nombre_encuesta;
        selectEncuestas.appendChild(option);
      });
    } catch (error) {
      console.error('Error cargando encuestas:', error);
    }
  }

  // Cargar preguntas de la encuesta seleccionada
  async function cargarPreguntas(idEncuesta) {
    try {
      const response = await fetch(`/api/preguntas/${idEncuesta}`);
      const preguntas = await response.json();

      tablaBody.innerHTML = ''; // Limpiar tabla
      if (preguntas.length === 0) {
        tablaPreguntas.classList.add('hidden');
        return;
      }

      preguntas.forEach((pregunta) => {
        const row = document.createElement('tr');
        row.innerHTML = `
                  <td>${pregunta.id_pregunta}</td>
                  <td>${pregunta.pregunta}</td>
              `;
        tablaBody.appendChild(row);
      });

      tablaPreguntas.classList.remove('hidden');
    } catch (error) {
      console.error('Error cargando preguntas:', error);
    }
  }

  // Evento para cargar preguntas al seleccionar una encuesta
  selectEncuestas.addEventListener('change', (event) => {
    const idEncuesta = event.target.value;
    if (idEncuesta) {
      cargarPreguntas(idEncuesta);
    }
  });

  // Cargar encuestas al iniciar
  cargarEncuestas();
});
