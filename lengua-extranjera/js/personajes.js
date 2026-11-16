// ACOMPAÑAMIENTO PEDAGÓGICO · personajes del aula de Inglés.
// El estudiante elige un personaje al empezar (en la página de contenidos, index.html) y no lo puede cambiar: queda en e.personaje.
// En las clases, cualquier objeto con "porPersonaje": { lucy: {...}, ben: {...}, ... } toma los campos del
// personaje elegido (si el valor es null, ese bloque no se muestra). En los textos, {{nombre}}, {{ciudad}}
// y {{pais}} se reemplazan por los datos del personaje. [[~frase]] se lee con la voz del personaje.
import { cargarJSON } from './estado.js';

let cache = null;
export async function cargarPersonajes() {
  if (!cache) cache = await cargarJSON('contenidos/personajes.json');
  return cache;
}
export async function personajeDe(e) {
  if (!e.personaje) return null;
  const p = await cargarPersonajes();
  return p.personajes.find(x => x.id === e.personaje) || null;
}
export function usaPersonajes(clase) {
  return JSON.stringify(clase).includes('porPersonaje') || JSON.stringify(clase).includes('{{nombre}}');
}
export function personalizar(obj, p) {
  const rec = v => {
    if (typeof v === 'string') return v.replace(/\{\{nombre\}\}/g, p.nombre).replace(/\{\{ciudad\}\}/g, p.ciudad).replace(/\{\{pais\}\}/g, p.pais);
    if (Array.isArray(v)) return v.map(rec).filter(x => x !== SACAR);
    if (v && typeof v === 'object') {
      let o = v;
      if ('porPersonaje' in o) {
        const propio = o.porPersonaje[p.id];
        if (propio === null) return SACAR;
        const { porPersonaje, ...resto } = o;
        o = { ...resto, ...(propio || {}) };
      }
      const r = {};
      for (const [k, x] of Object.entries(o)) { const y = rec(x); if (y !== SACAR) r[k] = y; }
      return r;
    }
    return v;
  };
  return rec(obj);
}
const SACAR = Symbol('sacar');
// La voz del personaje (para [[~frase]] y para las actividades con voz:"personaje")
export function vozDelPersonaje(p) {
  if (p) { document.body.dataset.pgenero = p.genero; document.body.dataset.pvoz = p.id; }
}
