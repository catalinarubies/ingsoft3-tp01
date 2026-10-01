// Extraída de MisHabitos.jsx para poder testearla sin renderizar nada de
// React ni tocar el DOM — es una función pura: recibe el estado del
// formulario, devuelve si es válido y por qué no, si corresponde.

export function validarFormularioHabito(form) {
  if (!form.nombre || form.nombre.trim() === '') {
    return { valido: false, error: 'El nombre es obligatorio' };
  }

  if (form.nombre.trim().length > 40) {
    return { valido: false, error: 'El nombre no puede tener más de 40 caracteres' };
  }

  if (form.nombre.trim().length < 2) {
    return { valido: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

    if (form.tipo === 'CONTADOR') {
    const meta = Number(form.meta);
    if (!form.meta || Number.isNaN(meta) || meta <= 0) {
      return { valido: false, error: 'La meta debe ser un número mayor a cero' };
    }

    if (!form.unidad || form.unidad.trim() === '') {
      return { valido: false, error: 'La unidad es obligatoria para hábitos contador' };
    }

    if (form.unidad.trim().length > 15) {
      return { valido: false, error: 'La unidad no puede tener más de 15 caracteres' };
    }
  }

  return { valido: true, error: null };
}