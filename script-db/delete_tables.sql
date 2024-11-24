INSERT INTO preguntas (column1, column2)
VALUES
    (value1, value2),
    (value3, value4),
    (value5, value6),
    (value7, value8)
ON CONFLICT preguntas DO NOTHING;