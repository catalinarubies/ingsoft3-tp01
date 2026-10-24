import { describe, test, expect } from 'vitest';
import { validarFormularioHabito } from './validacionHabito';

describe('validarFormularioHabito', () => {
  // Test parametrizado: la misma regla de negocio (¿el formulario está
  // completo y es válido?) probada con varias combinaciones de entrada.
  test.each([
    [{ nombre: '', tipo: 'CONTADOR', meta: '2000' }, false, 'nombre vacío'],
    [{ nombre: 'Agua', tipo: 'CONTADOR', meta: '' }, false, 'meta vacía en CONTADOR'],
    [{ nombre: 'Agua', tipo: 'CONTADOR', meta: '0' }, false, 'meta en cero (caso borde)'],
    [{ nombre: 'Agua', tipo: 'CONTADOR', meta: '-5' }, false, 'meta negativa'],
    [{ nombre: 'Agua', tipo: 'CONTADOR', meta: '2000', unidad: 'ml' }, true, 'CONTADOR válido'],
    [{ nombre: 'Ejercicio', tipo: 'BOOLEANO', meta: '' }, true, 'BOOLEANO no necesita meta'],
  ])('con %o, válido debería ser %s (%s)', (form, esperado) => {
    const resultado = validarFormularioHabito(form);
    expect(resultado.valido).toBe(esperado);
  });

  test('devuelve un mensaje de error específico cuando falta el nombre (caso de error)', () => {
    const resultado = validarFormularioHabito({ nombre: '', tipo: 'CONTADOR', meta: '2000' });
    expect(resultado.error).toBe('El nombre es obligatorio');
  });
});