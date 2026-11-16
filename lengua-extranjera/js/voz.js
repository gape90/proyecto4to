// ACOMPAÑAMIENTO PEDAGÓGICO · pronunciación con la voz del navegador (funciona también en Moodle)
// En los textos, [[palabra o frase]] se muestra en cursiva con un botón 🔊 (lo arma md() en estado.js).
// No usar [[ ]] dentro de opciones, fichas ni juegos: el botón quedaría dentro de otro botón.
// Voz: más lenta que lo normal. Partes 1 y 3 con voz de mujer; parte 2 con voz de varón.
// Las voces dependen del equipo: se eligen las más claras que haya. Si no hay voz masculina en inglés,
// se usa la femenina con un tono más grave.
export const RITMO = 0.72;
const MUJER = ['Microsoft Aria', 'Microsoft Jenny', 'Microsoft Ava', 'Google US English', 'Samantha', 'Microsoft Zira', 'Google UK English Female', 'Karen', 'Moira', 'Tessa', 'Serena', 'Victoria', 'Allison', 'Susan'];
const VARON = ['Microsoft Guy', 'Microsoft Andrew', 'Microsoft Christopher', 'Microsoft Davis', 'Microsoft Eric', 'Google UK English Male', 'Microsoft David', 'Microsoft Mark', 'Alex', 'Daniel', 'Aaron', 'Fred', 'Oliver', 'Arthur', 'Tom'];
const enIngles = () => (window.speechSynthesis?.getVoices() || []).filter(v => /^en([-_]|$)/i.test(v.lang || ''));
const buscar = (voces, nombres) => {
  for (const n of nombres) {
    const v = voces.filter(x => x.name.includes(n));
    // entre varias, la "Natural"/"Online" suena más clara; después, la de EE. UU.
    const mejor = v.find(x => /natural|online/i.test(x.name)) || v.find(x => /en[-_]US/i.test(x.lang)) || v[0];
    if (mejor) return mejor;
  }
  return null;
};
export function generoActual() {
  const parte = (document.body?.dataset.capsula || '').split('|')[1] || '';
  return parte === 'c2' ? 'varon' : 'mujer';
}
// Voces de los personajes (Inglés). Pensadas para Chrome: en computadora suele haber una voz femenina de EE. UU.,
// una femenina y una masculina británicas, más las del sistema (en Windows, David y Mark; en Mac, Samantha,
// Daniel o Karen). En celulares hay otras. Se busca por nombre; si no está, por idioma y género; y a cada
// personaje se le da un tono propio, un poco más alto, para que suenen jóvenes y distintos entre sí.
// Pedido de Gabi: las dos chicas con la misma voz y los tres varones con la misma voz, todas bien agudas
// para que suenen jóvenes (aunque alguna quede "de dibujo animado").
const CHICA = { nombres: ['Google US English', 'Google UK English Female', 'Microsoft Zira', 'Microsoft Aria', 'Samantha', 'Karen', 'Serena'], lang: /en[-_](US|GB)/i, genero: 'mujer', tono: 1.4 };
const VARON_JOVEN = { nombres: ['Google UK English Male', 'Microsoft David', 'Microsoft Mark', 'Microsoft Guy', 'Daniel', 'Alex', 'Fred'], lang: /en[-_](US|GB)/i, genero: 'varon', tono: 1.45 };
const PERSONAS = { lucy: CHICA, mia: CHICA, ben: VARON_JOVEN, liam: VARON_JOVEN, joaquin: VARON_JOVEN };
const esVaron = v => /\bmale\b|guy|man\b|david|mark|daniel|arthur|oliver|alex|aaron|fred|tom\b|ryan|connor|george|andrew|christopher|eric|davis/i.test(v.name) && !/female/i.test(v.name);
function vozPersona(id) {
  const p = PERSONAS[id]; const voces = enIngles();
  if (!p || !voces.length) return null;
  const v = buscar(voces, p.nombres)
    || voces.find(x => p.lang.test(x.lang) && (p.genero === 'varon') === esVaron(x))
    || voces.find(x => (p.genero === 'varon') === esVaron(x));
  if (v) return { voz: v, tono: p.tono };
  // sin voz del género del personaje: la que haya, con el tono corrido para diferenciarla
  return { voz: voces[0], tono: p.genero === 'varon' ? 0.8 : 1.3 };
}
// Personaje que habla: el de la tarjeta (data-voz) o el elegido (lo guarda personajes.js en el body)
export const personaActual = el => el?.closest?.('[data-voz]')?.dataset.voz || document.body?.dataset.pvoz || '';
export const generoPersonaje = () => document.body?.dataset.pgenero || generoActual();
function elegirVoz(genero) {
  const voces = enIngles();
  if (genero === 'varon') {
    const v = buscar(voces, VARON) || voces.find(x => /\bmale\b|guy|man\b/i.test(x.name) && !/female/i.test(x.name));
    if (v) return { voz: v, tono: 1 };
    return { voz: buscar(voces, MUJER) || voces[0] || null, tono: 0.7 };
  }
  const v = buscar(voces, MUJER) || voces.find(x => /female|woman/i.test(x.name));
  return { voz: v || voces[0] || null, tono: 1 };
}
export const RITMO_LENTO = 0.45;
// En las clases de Inglés, todas las voces son las del personaje elegido (persona por defecto).
export function hablar(texto, { genero = generoActual(), persona = document.body?.dataset.pvoz || '', alTerminar, ritmo = RITMO } = {}) {
  if (!('speechSynthesis' in window)) { avisoSinVoz(); alTerminar?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  const { voz, tono } = (persona && vozPersona(persona)) || elegirVoz(genero);
  u.lang = voz?.lang || 'en-US'; if (voz) u.voice = voz;
  u.rate = ritmo; u.pitch = tono;
  if (alTerminar) { u.onend = alTerminar; u.onerror = alTerminar; }
  window.speechSynthesis.speak(u);
}
function avisoSinVoz() {
  const d = document.createElement('div'); d.className = 'aviso-voz'; d.setAttribute('role', 'status');
  d.textContent = 'Este navegador no puede pronunciar. Probá con Chrome o Edge actualizados.';
  document.body.appendChild(d); setTimeout(() => d.remove(), 4000);
}
if (typeof document !== 'undefined' && !window.__vozLista) {
  window.__vozLista = true;
  window.addEventListener('pagehide', () => window.speechSynthesis?.cancel());
  window.speechSynthesis?.getVoices(); // algunos navegadores cargan las voces recién después del primer pedido
  window.speechSynthesis?.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices());
  document.addEventListener('click', ev => {
    const b = ev.target.closest?.('.hablar'); if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    hablar(b.dataset.t, b.dataset.v === 'p' || b.closest('[data-voz]') ? { persona: personaActual(b), genero: generoPersonaje() } : {});
  }, true);
}
