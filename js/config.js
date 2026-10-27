// POTENCIAR · configuración general
export const NOMBRE_PROYECTO = 'Potenciar';
export const NOMBRE_ASISTENTE = 'Asistente';
export const MODELO_GEMINI = 'gemini-3.1-flash-lite';

export const AJUSTES = {
  // Piloto: el alumno puede usar la plataforma sin clave de IA (corrección local por palabras clave).
  // En producción (Moodle / proxy del Ministerio) poner en false.
  PERMITIR_SIN_IA: true,
  // Piloto: el TP final se habilita sin haber terminado todas las clases (para poder mostrarlo).
  // En producción poner en false.
  TP_LIBRE: true,
  // Intentos fallidos en una cápsula antes de poder marcar "tengo una duda" y seguir.
  INTENTOS_PARA_DUDA: 2,
  // Cantidad mínima de palabras de una respuesta de carpeta (se ajusta por consigna).
  MIN_PALABRAS: 8,
  // Juegos: segundos entre avances del auto rival.
  AUTOS_RIVAL_SEG: 7,
};

export const MODALIDADES = {
  orientada: { nombre: 'Orientada', cursos: [1, 2, 3, 4, 5], habilitado: [4] },
  tecnica: { nombre: 'Técnica', cursos: [1, 2, 3, 4, 5, 6], habilitado: [5] },
};

export const LOGO_BLANCO = 'img/logo-santafe-blanco.png';
export const LOGO_COLOR = 'img/logo-santafe-color.png';
