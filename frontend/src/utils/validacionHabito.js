// Extraída de MisHabitos.jsx para poder testearla sin renderizar nada de
// React ni tocar el DOM — es una función pura: recibe el estado del
// formulario, devuelve si es válido y por qué no, si corresponde.
export function validarFormularioHabito(form) {
  if (!form.nombre || form.nombre.trim() === '') {
    return { valido: false, error: 'El nombre es obligatorio' };
  }

  if (form.tipo === 'CONTADOR') {
    const meta = Number(form.meta);
    if (!form.meta || Number.isNaN(meta) || meta <= 0) {
      return { valido: false, error: 'La meta debe ser un número mayor a cero' };
    }
  }

  return { valido: true, error: null };
}