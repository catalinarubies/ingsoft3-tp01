CREATE TABLE IF NOT EXISTS habitos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  tipo ENUM('CONTADOR', 'BOOLEANO') NOT NULL,
  meta DECIMAL(10,2) NULL,        -- solo aplica a CONTADOR
  unidad VARCHAR(20) NULL,        -- solo aplica a CONTADOR (ej: "ml", "pasos")
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  habito_id INT NOT NULL,
  fecha DATE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,   -- CONTADOR: cantidad. BOOLEANO: 1 o 0.
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (habito_id) REFERENCES habitos(id),
  UNIQUE KEY unico_habito_fecha (habito_id, fecha)  -- un registro por hábito por día
);
