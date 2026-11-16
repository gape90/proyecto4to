// ACOMPAÑAMIENTO PEDAGÓGICO · configuración general (sin IA). Cada materia tiene su copia con su ESPACIO y MATERIA.
export const NOMBRE_PROYECTO = 'Acompañamiento Pedagógico';
export const ESPACIO = 'lengua';
// Datos de la materia que se muestran en pantalla. "prefijo": comienzo del id de sus clases. "ejemplos": palabras de ejemplo del asistente.
export const MATERIA = { nombre: 'Lengua y Literatura', anio: '4.º año (orientada) · 5.º año (técnica)', prefijo: 'len-', ejemplos: '"tragedia" o "tesis"' };

export const AJUSTES = {
  // Para mostrar la plataforma: el TP se abre sin terminar las clases. Para uso con estudiantes, poner en false.
  TP_LIBRE: true,
  // Versión de GitHub para probar el material: se puede avanzar sin resolver las actividades. En las versiones para Moodle no existe.
  MODO_PRUEBA: true,
  // Intentos fallidos en una carpeta antes de poder marcar "tengo una duda" y seguir.
  INTENTOS_PARA_DUDA: 2,
  // Cantidad mínima de palabras de una respuesta de carpeta (se ajusta por consigna).
  MIN_PALABRAS: 8,
};

export const LOGO_BLANCO = 'img/logo-santafe-blanco.png';
export const LOGO_COLOR = 'img/logo-santafe-color.png';
