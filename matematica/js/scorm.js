// TUTORÍAS VIRTUALES · conexión con Moodle (SCORM 2004)
// Si la página corre dentro de un aula SCORM, el avance se guarda en la cuenta del estudiante (cmi.suspend_data).
// Si no hay LMS (GitHub Pages, iniciar.bat), todo sigue funcionando con localStorage.
import { compressToBase64, decompressFromBase64 } from './lz-string.js';

const MARCA = 'lz1:';
const LIMITE = 60000;          // SCORM 2004 4.ª ed. admite 64.000 caracteres en suspend_data
let api = null, listo = false;

function buscarAPI() {
  const ventanas = [];
  try { let w = window; for (let i = 0; i < 20 && w; i++) { ventanas.push(w); if (w === w.parent) break; w = w.parent; } } catch {}
  try { let o = window.opener; for (let i = 0; i < 20 && o; i++) { ventanas.push(o); if (o === o.parent) break; o = o.parent; } } catch {}
  for (const w of ventanas) { try { if (w.API_1484_11) return w.API_1484_11; } catch {} }
  return null;
}

function iniciar() {
  // Dentro del marco del paquete (scorm.html), la conexión con el aula la maneja el marco: esta página no la toca.
  try { if (window.parent !== window && window.parent.TV) return; } catch {}
  api = buscarAPI();
  if (!api) return;
  try {
    const r = String(api.Initialize(''));
    // "false" con error 103 = ya estaba iniciada por la página anterior (el paquete tiene varias páginas): está bien
    if (r !== 'true' && String(api.GetLastError()) !== '103') { api = null; return; }
    listo = true;
    const est = String(api.GetValue('cmi.completion_status'));
    if (est === 'not attempted' || est === 'unknown' || est === '') { api.SetValue('cmi.completion_status', 'incomplete'); }
    api.SetValue('cmi.exit', 'suspend'); // para que Moodle conserve el avance y lo devuelva en la próxima entrada
  } catch { api = null; listo = false; }
}
iniciar();

export const hayLMS = () => listo && !!api;

// "Apellido, Nombre" (formato de Moodle) -> "Nombre Apellido"
export function nombreDelLMS() {
  if (!hayLMS()) return '';
  try {
    const n = String(api.GetValue('cmi.learner_name') || '').trim();
    if (!n) return '';
    const m = n.split(',');
    return m.length === 2 ? `${m[1].trim()} ${m[0].trim()}` : n;
  } catch { return ''; }
}

export function leerGuardado() {
  if (!hayLMS()) return null;
  try {
    const t = String(api.GetValue('cmi.suspend_data') || '');
    if (!t) return '';
    if (t.startsWith(MARCA)) return decompressFromBase64(t.slice(MARCA.length)) || '';
    return t;
  } catch { return ''; }
}

// Devuelve true si Moodle lo aceptó
export function volcar(json) {
  if (!hayLMS()) return false;
  try {
    const z = MARCA + compressToBase64(json);
    if (z.length > LIMITE) { console.warn('Acompañamiento Pedagógico: el avance supera el límite de SCORM (' + z.length + ').'); return false; }
    const ok = String(api.SetValue('cmi.suspend_data', z)) === 'true';
    api.SetValue('cmi.exit', 'suspend');
    api.Commit('');
    return ok;
  } catch { return false; }
}

export function borrar() {
  if (!hayLMS()) return;
  try { api.SetValue('cmi.suspend_data', ''); api.Commit(''); } catch {}
}

// "Finalizar" solo guarda. El intento queda siempre "en curso" a propósito: si se marcara "completado",
// Moodle abriría las siguientes entradas en "Modo revisión", que no guarda el avance del estudiante.
export function marcarCompletado() {
  if (!hayLMS()) return;
  try { api.SetValue('cmi.exit', 'suspend'); api.Commit(''); } catch {}
}

// Cierre de la sesión (lo llama el marco al salir de la actividad): conserva el avance para la próxima entrada.
export function terminar() {
  if (!hayLMS()) return;
  try { api.SetValue('cmi.exit', 'suspend'); api.Commit(''); api.Terminate(''); } catch {}
  listo = false;
}
