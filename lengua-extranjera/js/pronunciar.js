// ACOMPAÑAMIENTO PEDAGÓGICO · actividades de escucha (solo Inglés). No usan el micrófono ni envían nada afuera.
//
// 1) "Practicá la pronunciación"  { t:'pronunciar', modo:'escuchar'|'decir', texto, traduccion, explicacion }
//    modo 'escuchar': escucha el modelo (normal o más lento), lo repite en voz alta y marca "Ya la practiqué".
//    modo 'decir':    primero la lee en voz alta ("Ya la leí") y recién ahí se habilita el modelo para comparar.
//
// 2) "Escuchá y escribí"  { t:'dictado', texto, traduccion, explicacion, acepta:[...] }
//    escucha la frase (normal o más lento) y la escribe. Se corrige sin mirar mayúsculas, puntuación ni contracciones
//    (didn't = did not). Se escribe recién después de escuchar. 1.er error: escucharla más lento; después,
//    cada error muestra una palabra más, hasta la frase completa (hay que escribirla para seguir).
import { esc, md, revelarDe } from './estado.js';
import { hablar, RITMO_LENTO, generoPersonaje, personaActual } from './voz.js';

const CONTRACCIONES = { "didn't": 'did not', "don't": 'do not', "doesn't": 'does not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "i'm": 'i am', "it's": 'it is', "can't": 'cannot', "won't": 'will not', "i'd": 'i would', "she's": 'she is', "he's": 'he is', "they're": 'they are', "we're": 'we are', "you're": 'you are', "let's": 'let us', "what's": 'what is' };
export const limpiar = s => (s || '').toLowerCase().replace(/[’`´]/g, "'")
  .split(/\s+/).map(w => w.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')).filter(Boolean)
  .map(w => CONTRACCIONES[w] || w).join(' ').replace(/\bcan not\b/g, 'cannot').replace(/'/g, '').split(' ').filter(Boolean);

// Botones "Escuchar" y "Más lento" compartidos por las dos actividades
function botonesAudio(texto, alTerminar, genero, persona) {
  const caja = document.createElement('div'); caja.className = 'pr-botones';
  caja.innerHTML = `<button type="button" class="btn chico suave pr-oir">🔊 Escuchar</button><button type="button" class="btn chico suave pr-lento">🐢 Más lento</button>`;
  const [oir, lento] = caja.querySelectorAll('button');
  const tocar = ritmo => {
    oir.disabled = lento.disabled = true;
    let listo = false;
    const fin = () => { if (listo) return; listo = true; if (!caja.dataset.bloqueado) oir.disabled = lento.disabled = false; alTerminar?.(); };
    hablar(texto, { ritmo, alTerminar: fin, ...(genero ? { genero } : {}), ...(persona ? { persona } : {}) });
    setTimeout(fin, ritmo < 0.6 ? 12000 : 7000); // por si el navegador no avisa que terminó
  };
  oir.onclick = () => tocar(undefined);
  lento.onclick = () => tocar(RITMO_LENTO);
  caja.bloquear = b => { caja.dataset.bloqueado = b ? '1' : ''; if (b) caja.dataset.bloqueado = '1'; else delete caja.dataset.bloqueado; oir.disabled = lento.disabled = !!b; };
  return caja;
}

export function bPronunciar(w, b, resuelto, marcar) {
  const decirPrimero = b.modo === 'decir';
  let hecho = resuelto, leida = false, escuchada = false;
  w.innerHTML = `<div class="interactivo pronunciar ${resuelto ? 'resuelto' : ''}">
    <div class="etq">${esc(b.etiqueta || (decirPrimero ? '🗣️ Leé y después escuchá' : '🗣️ Practicá la pronunciación'))}</div>
    <div class="consigna">${md(b.consigna || (decirPrimero ? 'Leé esta frase en voz alta. Después escuchá el modelo y compará cómo te salió.' : 'Escuchá la frase y repetila en voz alta. Si la necesitás más despacio, tocá "Más lento".'))}</div>
    <div class="pr-frase" lang="en">${esc(b.texto)}</div>${b.traduccion ? `<div class="pr-trad">${esc(b.traduccion)}</div>` : ''}
    <div class="pr-audio"></div>
    <p class="pr-estado ayuda" aria-live="polite"></p>
    <div class="pr-acciones"></div><div class="fbz"></div></div>`;
  const $ = s => w.querySelector(s), estado = $('.pr-estado'), acciones = $('.pr-acciones'), fb = $('.fbz');
  const audio = botonesAudio(b.texto, () => { escuchada = true; pintar(); }, b.voz === 'personaje' ? generoPersonaje() : null, b.voz === 'personaje' ? personaActual() : '');
  $('.pr-audio').appendChild(audio);
  const terminar = () => {
    if (hecho) return; hecho = true; w.firstChild.classList.add('resuelto'); acciones.innerHTML = ''; estado.textContent = '';
    fb.innerHTML = `<div class="fb ok"><b>¡Bien!</b> ${md(b.explicacion || '')} Podés volver a escucharla cuando quieras.</div>`; marcar();
  };
  function pintar() {
    if (hecho) { audio.bloquear(false); return; }
    if (decirPrimero && !leida) {
      audio.bloquear(true);
      estado.textContent = 'Primero leela vos en voz alta. Después se habilita el modelo.';
      acciones.innerHTML = '<button type="button" class="btn chico pr-lei">Ya la leí en voz alta</button>';
      acciones.querySelector('.pr-lei').onclick = () => { leida = true; audio.bloquear(false); pintar(); };
      return;
    }
    estado.textContent = escuchada ? 'Repetila en voz alta, despacio, todas las veces que necesites.' : 'Tocá "Escuchar" o "Más lento".';
    acciones.innerHTML = `<button type="button" class="btn chico pr-ya" ${escuchada ? '' : 'disabled'}>Ya la practiqué en voz alta</button>`;
    acciones.querySelector('.pr-ya').onclick = terminar;
  }
  if (resuelto) fb.innerHTML = `<div class="fb ok">${md(b.explicacion || 'Ya practicaste esta frase.')} Podés volver a escucharla cuando quieras.</div>`;
  pintar();
  return true;
}

export function bDictado(w, b, resuelto, marcar) {
  let intentos = 0, hecho = resuelto;
  const meta = limpiar(b.texto), metas = [b.texto, ...(b.acepta || [])].map(limpiar);
  const sinAudio = !('speechSynthesis' in window);
  w.innerHTML = `<div class="interactivo dictado ${resuelto ? 'resuelto' : ''}">
    <div class="etq">${esc(b.etiqueta || '🎧 Escuchá y escribí')}</div>
    <div class="consigna">${md(b.consigna || 'Escuchá la frase y escribila en inglés. Podés escucharla todas las veces que quieras, también más lento.')}</div>
    <div class="pr-audio"></div>
    <form class="dc-form" autocomplete="off"><input type="text" lang="en" spellcheck="false" autocapitalize="off" aria-label="Escribí la frase que escuchaste" placeholder="Primero tocá Escuchar" disabled><button type="submit" class="btn chico" disabled>Comprobar</button></form>
    <div class="fbz"></div></div>`;
  const $ = s => w.querySelector(s), input = $('input'), fb = $('.fbz'), form = $('.dc-form'), boton = form.querySelector('button');
  const audio = botonesAudio(b.texto, null, b.voz === 'personaje' ? generoPersonaje() : null, b.voz === 'personaje' ? personaActual() : '');
  $('.pr-audio').appendChild(audio);
  // Se escribe recién después de escuchar la frase
  const habilitar = () => { if (hecho) return; input.disabled = false; boton.disabled = false; input.placeholder = 'Escribí acá lo que escuchaste'; };
  audio.addEventListener('click', ev => { if (ev.target.closest('button')) habilitar(); });
  const cierre = (titulo) => {
    hecho = true; w.firstChild.classList.add('resuelto'); input.disabled = true; boton.disabled = true;
    fb.innerHTML = `<div class="fb ok"><b>${titulo}</b> La frase es: <i lang="en">${esc(b.texto)}</i> ${b.traduccion ? esc(b.traduccion) : ''} ${md(b.explicacion || '')}</div>`;
    marcar();
  };
  form.onsubmit = ev => {
    ev.preventDefault(); if (hecho) return;
    const oido = limpiar(input.value);
    if (!oido.length) { fb.innerHTML = '<div class="fb aviso">Escribí lo que escuchaste antes de comprobar.</div>'; return; }
    if (metas.some(m => m.join(' ') === oido.join(' '))) return cierre('¡Bien!');
    intentos++;
    const bien = meta.filter((p, i) => oido[i] === p).length;
    const cuenta = bien ? `Ya tenés ${bien} de ${meta.length} palabras en su lugar.` : `Todavía no hay palabras en su lugar (0 de ${meta.length}).`;
    // 1.er error: escucharla más lento. Después, cada error muestra una palabra más, hasta la frase completa.
    if (intentos === 1) { fb.innerHTML = `<div class="fb mal"><b>Seguí buscando.</b> ${cuenta} Escuchala con 🐢 Más lento, palabra por palabra.</div>`; return; }
    const r = revelarDe(b.texto, intentos - 1);
    fb.innerHTML = r.completo
      ? `<div class="fb mal"><b>La frase es:</b> ${r.html} Escribila para seguir.</div>`
      : `<div class="fb mal"><b>Seguí buscando.</b> ${cuenta} Empieza así: ${r.html}</div>`;
  };
  if (sinAudio && !resuelto) {
    fb.innerHTML = '<div class="fb aviso">Tu dispositivo no puede reproducir el audio de esta actividad. La marcamos como hecha: anotá en tu carpeta que no la pudiste escuchar y consultala con tu docente.</div>';
    hecho = true; w.firstChild.classList.add('resuelto'); marcar();
  }
  if (resuelto) {
    // Ya resuelta: se puede volver a practicar sin perder lo hecho
    hecho = true;
    fb.innerHTML = `<div class="fb ok">Ya la resolviste. <button type="button" class="btn chico suave dc-otra">Practicar de nuevo</button></div>`;
    fb.querySelector('.dc-otra').onclick = () => { hecho = false; intentos = 0; input.value = ''; fb.innerHTML = ''; input.placeholder = 'Primero tocá Escuchar'; };
  }
  return true;
}
