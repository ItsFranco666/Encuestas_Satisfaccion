CREATE TABLE encuestas (
    ID_encuesta SERIAL PRIMARY KEY,
    nombre_encuesta VARCHAR(255) NOT NULL
);

CREATE TABLE preguntas (
    ID_pregunta SERIAL PRIMARY KEY,
    ID_encuesta INT REFERENCES encuestas(ID_encuesta) ON DELETE CASCADE,
    pregunta TEXT NOT NULL
);

CREATE TABLE proyectos_curriculares (
    ID_proyecto SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
    ID_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(255),
	correo_personal VARCHAR(255) UNIQUE,
    correo_institucional VARCHAR(255) UNIQUE,    
    ID_proyecto INT REFERENCES proyectos_curriculares(ID_proyecto) ON DELETE SET NULL
);

CREATE TABLE respuestas (
    ID_respuesta SERIAL PRIMARY KEY,
    ID_encuesta INT REFERENCES encuestas(ID_encuesta) ON DELETE CASCADE,
    ID_usuario INT REFERENCES usuarios(ID_usuario) ON DELETE CASCADE,
    fecha_respuesta TIMESTAMP
);

CREATE TABLE detalles_respuestas (
    ID_detalle SERIAL PRIMARY KEY,
    ID_respuesta INT REFERENCES respuestas(ID_respuesta) ON DELETE CASCADE,
    ID_pregunta INT REFERENCES preguntas(ID_pregunta) ON DELETE CASCADE,
    calificacion INT CHECK (calificacion BETWEEN 1 AND 5)
);