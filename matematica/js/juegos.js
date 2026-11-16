// TUTORÍAS VIRTUALES · juegos de práctica (se habilitan al terminar cada cápsula)
// Banco por cápsula:
//   juegos:   [{tipo:'vf', texto, respuesta:true|false, explicacion}, {tipo:'mc', pregunta, opciones:[], correcta:0, explicacion}]
//   palabras: [{palabra, pista}]  (para "Palabra oculta" y "Memotest")
// Cada cápsula ofrece 3 juegos y van rotando de una cápsula a la otra.
// Todo es HTML, CSS y JavaScript del propio paquete: no usa servicios externos (compatible con Moodle).
import { esc, md, norm } from './estado.js';

const vfDe = cap => (cap.juegos || []).filter(b => b.tipo === 'vf');
const mcDe = cap => (cap.juegos || []).filter(b => b.tipo === 'mc');

const MAX = 4; // ningún juego tiene más de 4 preguntas, palabras o pares
// El orden importa: se ofrecen 3 juegos seguidos de esta lista. V/F y "Atrapá la verdadera" (que se parecen)
// están separados para que nunca aparezcan juntos en la misma parte.
export const JUEGOS = [
  { id: 'vf', nombre: 'Verdadero o falso', icono: '✅', desc: 'Decidí si es cierto', puede: c => vfDe(c).length >= 3,
    instr: 'Leé cada afirmación y tocá <b>Verdadero</b> o <b>Falso</b>. Después leé la explicación y pasá a la siguiente. Son 4 afirmaciones.' },
  { id: 'mc', nombre: 'Múltiple choice', icono: '🎯', desc: 'Elegí la correcta', puede: c => mcDe(c).length >= 3,
    instr: 'Leé la pregunta y tocá la opción correcta. Solo una es la buena. Son 4 preguntas.' },
  { id: 'palabra', nombre: 'Palabra oculta', icono: '🔤', desc: 'Descubrí la palabra', puede: c => (c.palabras || []).length >= 4,
    instr: 'Leé la pista y tocá letras para descubrir la palabra escondida. Tenés 6 intentos por palabra. Son 4 palabras.' },
  { id: 'atrapa', nombre: 'Atrapá la verdadera', icono: '🪂', desc: 'Antes de que caiga', puede: c => vfDe(c).length >= 4,
    instr: 'Cae una afirmación. Si es <b>verdadera</b>, atrapala; si es <b>falsa</b>, dejala pasar. Son 4 afirmaciones y tenés 3 oportunidades.' },
  { id: 'antes', nombre: '¿Antes o después?', icono: '⏳', desc: '¿Qué pasó primero?', puede: c => eventosDe(c).length >= 3,
    instr: 'Aparecen dos hechos. Tocá el que <b>pasó primero</b>. Después vas a ver el año de cada uno. Son 4 rondas.' },
  { id: 'basket', nombre: 'Básquet', icono: '🏀', desc: 'Respondé y encestá', puede: c => (c.juegos || []).length >= 4,
    instr: 'Cada pregunta es un tiro: si elegís la respuesta correcta, la pelota entra y sumás 2 puntos. Son 4 tiros.' },
  { id: 'error', nombre: 'Detective del error', icono: '🕵️', desc: 'Encontrá la falsa', puede: c => vfDe(c).filter(x => !x.respuesta).length >= 2 && vfDe(c).filter(x => x.respuesta).length >= 2,
    instr: 'En cada caso hay tres afirmaciones y <b>solo una es falsa</b>. Encontrala y leé por qué.' },
  { id: 'memo', nombre: 'Memotest', icono: '🧠', desc: 'Uní palabra y pista', puede: c => (c.palabras || []).length >= 4,
    instr: 'Tocá dos tarjetas para darlas vuelta. Encontrá cada palabra con la pista que le corresponde. Son 4 pares.' },
  { id: 'autos', nombre: 'Carrera de autos', icono: '🏎️', desc: 'Llegá primero a la meta', puede: c => (c.juegos || []).length >= 4,
    instr: 'Son 4 preguntas. Cada acierto hace avanzar tu auto; si elegís otra opción, avanza el otro. ¡Llegá primero a la meta!' },
];
// Hechos con año de las líneas de tiempo de la parte (para "¿Antes o después?")
function eventosDe(cap) {
  const out = [];
  for (const b of cap.bloques || []) if (b.t === 'linea') for (const v of b.eventos || []) {
    const m = String(v.anio).match(/\d{4}/); if (m) out.push({ anio: +m[0], etiqueta: String(v.anio), titulo: v.titulo });
  }
  return out;
}

// Tres juegos por cápsula, que van cambiando de una cápsula a otra
export function juegosPara(cap, claseId = '', i = 0) {
  const disp = JUEGOS.filter(j => j.puede(cap));
  if (disp.length <= 3) return disp;
  const semilla = [...claseId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const inicio = (semilla + i * 3) % disp.length;
  return [0, 1, 2].map(k => disp[(inicio + k) % disp.length]);
}

const mezclar = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const aMC = it => it.tipo === 'vf'
  ? { pregunta: it.texto, opciones: ['Verdadero', 'Falso'], correcta: it.respuesta ? 0 : 1, explicacion: it.explicacion, fijo: true }
  : { pregunta: it.pregunta, opciones: it.opciones, correcta: it.correcta, explicacion: it.explicacion };
const preparar = q => {
  if (q.fijo) return q;
  const idx = mezclar(q.opciones.map((_, i) => i));
  return { ...q, opciones: idx.map(i => q.opciones[i]), correcta: idx.indexOf(q.correcta) };
};

export function abrirJuego(tipo, cap, { onFin } = {}) {
  const def = JUEGOS.find(j => j.id === tipo);
  const rediseniado = ['atrapa', 'memo', 'mc', 'palabra', 'vf'].includes(tipo);   // juegos con el diseño nuevo (cartel ¡Bien!/¡Ups!, ventana compacta)
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `<div class="modal juego jg-${tipo}${rediseniado ? ' nuevo' : ''}" role="dialog" aria-modal="true" aria-label="${esc(def.nombre)}">
    <div class="modal-cab"><h3>${def.icono} ${esc(def.nombre)}</h3><button class="cerrar" aria-label="Cerrar">✕</button></div>
    <div class="jg-instr"><b>Cómo se juega:</b> ${def.instr}</div><div class="jg-toast" aria-live="assertive"></div>
    <div class="jg-cuerpo"></div>
    <div class="jg-pie"><div class="jg-fb" aria-live="polite"></div><button class="btn" id="jg-sig" disabled>Siguiente →</button></div></div>`;
  document.body.appendChild(fondo);
  const limpiar = [];
  const cerrar = () => { limpiar.forEach(f => f()); fondo.remove(); };
  fondo.querySelector('.cerrar').onclick = cerrar;
  const fbEl = fondo.querySelector('.jg-fb'), btn = fondo.querySelector('#jg-sig'), toast = fondo.querySelector('.jg-toast');
  let toastTimer;
  limpiar.push(() => clearTimeout(toastTimer));
  const mostrarToast = ok => { clearTimeout(toastTimer); toast.textContent = ok ? '¡Bien!' : '¡Ups!'; toast.className = 'jg-toast visible ' + (ok ? 'ok' : 'mal'); toast.style.opacity = '1'; toast.style.visibility = 'visible'; toast.style.display = 'block'; toastTimer = setTimeout(() => { toast.classList.remove('visible'); toast.style.opacity = ''; toast.style.visibility = ''; toast.style.display = ''; }, 1100); };
  const ui = {
    cuerpo: fondo.querySelector('.jg-cuerpo'),
    limpiar,
    toast(ok) { try { mostrarToast(ok); } catch (error) { console.warn('No se pudo mostrar el cartel de respuesta', error); } },
    fb(html = '', clase = '') { fbEl.className = 'jg-fb ' + clase; fbEl.innerHTML = html; },
    siguiente(fn, texto = 'Siguiente →') { btn.textContent = texto; btn.disabled = false; btn.onclick = () => { btn.disabled = true; btn.onclick = null; fn(); }; },
    esperar(texto = 'Siguiente →') { btn.textContent = texto; btn.disabled = true; btn.onclick = null; },
    final(puntos, total, extra = '') {
      limpiar.splice(0).forEach(f => f());
      try { onFin?.(tipo, puntos, total); } catch {}
      const pct = total ? Math.round(puntos / total * 100) : 0;
      const msg = pct === 100 ? '¡Muy bien! Respondiste todo correctamente.' : pct >= 70 ? '¡Bien! Repasá esos temas en el material para afianzarlos.' : 'Seguí practicando: volvé a leer el material y jugá otra vez cuando quieras.';
      ui.cuerpo.style.zoom = '';
      ui.cuerpo.innerHTML = `<div class="jg-final"><div class="grande">${pct >= 70 ? '🏆' : '💪'}</div><h3>Respondiste bien ${puntos} de ${total}</h3>${extra}<p>${msg}</p></div>`;
      ui.fb('Terminaste el juego. Para volver a jugar, cerrá esta ventana y abrilo de nuevo.');
      btn.textContent = 'Cerrar'; btn.disabled = false; btn.onclick = cerrar;
    },
  };
  // Si la parte visible de la pantalla es baja (por ejemplo, en Moodle con su barra fija arriba), el contenido
  // del juego se achica lo justo para que entre completo, sin barra de desplazamiento (hasta un 65 %).
  const cuerpo = ui.cuerpo;
  const ajustar = () => {
    cuerpo.style.zoom = '';
    let z = 1;
    // se mide de nuevo después de cada paso, porque el contenido no siempre se achica en proporción exacta
    for (let k = 0; k < 12 && cuerpo.clientHeight > 0 && cuerpo.scrollHeight > cuerpo.clientHeight + 2 && z > 0.66; k++) {
      z = Math.max(0.65, Math.round((z * Math.min(0.97, cuerpo.clientHeight / cuerpo.scrollHeight)) * 100) / 100);
      cuerpo.style.zoom = z;
    }
  };
  let cuadroAj = 0;
  const pedirAjuste = () => { cancelAnimationFrame(cuadroAj); cuadroAj = requestAnimationFrame(ajustar); };
  const obs = new MutationObserver(pedirAjuste);
  obs.observe(cuerpo, { childList: true, subtree: true, characterData: true });
  const ro = new ResizeObserver(pedirAjuste); ro.observe(fondo.querySelector('.modal'));
  limpiar.push(() => { obs.disconnect(); ro.disconnect(); cancelAnimationFrame(cuadroAj); });
  ({ antes: juegoAntes, error: juegoError, vf: juegoVF, mc: juegoMC, basket: juegoBasket, autos: juegoAutos, palabra: juegoPalabra, memo: juegoMemo, atrapa: juegoAtrapa }[tipo])(ui, cap);
}

const opcionesHTML = q => `<div class="opc-lista">${q.opciones.map((o, k) => `<button class="opc-btn" data-k="${k}">${md(o)}</button>`).join('')}</div>`;
// Marca la respuesta en una lista de opciones y devuelve si fue correcta
function responder(host, q, b) {
  const k = +b.dataset.k, ok = k === q.correcta;
  host.querySelectorAll('.opc-btn').forEach(x => { x.disabled = true; if (+x.dataset.k === q.correcta) x.classList.add('bien'); });
  if (!ok) b.classList.add('mal');
  return ok;
}

/* ---------- Verdadero o falso ---------- */
function juegoVF(ui, cap) {
  const items = mezclar(vfDe(cap)).slice(0, MAX);
  let i = 0, p = 0, racha = 0, mejor = 0;
  const ICO_V = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7.5 12.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICO_F = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
  const paso = () => {
    if (i >= items.length) return ui.final(p, items.length, `<p class="ayuda">Mejor racha: ${mejor}</p>`);
    const it = items[i];
    ui.fb('Elegí una respuesta.'); ui.esperar(i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `<div class="marcador"><span>Afirmación ${i + 1}/${items.length}</span><span>Puntos: ${p}</span><span>Racha: ${racha}</span></div>
      <div class="vf-card"><p>${md(it.texto)}</p></div>
      <div class="vf-botones"><button class="v">${ICO_V}<span>Verdadero</span></button><button class="f">${ICO_F}<span>Falso</span></button></div>`;
    const resp = v => {
      const btns = ui.cuerpo.querySelectorAll('.vf-botones button');
      btns.forEach(b => b.disabled = true);
      ui.cuerpo.querySelector(it.respuesta ? '.v' : '.f').classList.add('correcta');
      const ok = v === it.respuesta;
      if (ok) { p++; racha++; mejor = Math.max(mejor, racha); } else racha = 0;
      try { ui.toast(ok); } catch (error) { console.warn('No se pudo mostrar el cartel de respuesta', error); }
      ui.cuerpo.querySelector('.marcador span:nth-child(2)').textContent = `Puntos: ${p}`;
      ui.cuerpo.querySelector('.marcador span:nth-child(3)').textContent = `Racha: ${racha}`;
      ui.fb(`<span><b>${ok ? '¡Correcto!' : 'Era la otra.'}</b> ${it.respuesta ? 'Es verdadera.' : 'Es falsa.'} ${md(it.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
      ui.siguiente(() => { i++; paso(); }, i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    };
    ui.cuerpo.querySelector('.v').onclick = () => resp(true);
    ui.cuerpo.querySelector('.f').onclick = () => resp(false);
  };
  paso();
}

/* ---------- Múltiple choice ---------- */
function juegoMC(ui, cap) {
  const items = mezclar(mcDe(cap)).slice(0, MAX).map(aMC).map(preparar);
  let i = 0, p = 0;
  const paso = () => {
    if (i >= items.length) return ui.final(p, items.length);
    const q = items[i];
    ui.fb('Elegí una opción.'); ui.esperar(i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `<div class="marcador"><span>Pregunta ${i + 1}/${items.length}</span><span>Puntos: ${p}</span></div>
      <p style="font-weight:700;font-size:1.1rem">${md(q.pregunta)}</p>${opcionesHTML(q)}`;
    ui.cuerpo.querySelectorAll('.opc-btn').forEach(b => b.onclick = () => {
      const ok = responder(ui.cuerpo, q, b); try { ui.toast(ok); } catch (error) { console.warn("No se pudo mostrar el cartel de respuesta", error); } if (ok) p++;
      ui.cuerpo.querySelector('.marcador span:last-child').textContent = `Puntos: ${p}`;
      ui.fb(`<span><b>${ok ? '¡Correcto!' : 'Repasemos esta.'}</b> ${md(q.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
      ui.siguiente(() => { i++; paso(); }, i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    });
  };
  paso();
}

/* ---------- Básquet ---------- */
function juegoBasket(ui, cap) {
  const items = mezclar(cap.juegos).slice(0, MAX).map(aMC).map(preparar);
  let i = 0, p = 0, anim = 0;
  ui.limpiar.push(() => cancelAnimationFrame(anim));
  const W = 640, H = 320, SUELO = 285, ARO = { x: 514, y: 111 };
  const pregunta = () => {
    if (i >= items.length) return ui.final(p, items.length, `<p class="ayuda">Encestaste ${p} de ${items.length} tiros: ${p * 2} puntos.</p>`);
    const q = items[i];
    ui.fb('Elegí una opción para tirar.'); ui.esperar(i + 1 < items.length ? 'Siguiente tiro →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `<div class="marcador"><span>Tiro ${i + 1}/${items.length}</span><span class="m-p">Puntos: ${p * 2}</span></div>
      <canvas class="cancha" width="${W}" height="${H}" role="img" aria-label="Pelota en vuelo hacia el aro sobre una cancha de básquet"></canvas><p style="font-weight:700">${md(q.pregunta)}</p>${opcionesHTML(q)}`;
    const c = ui.cuerpo.querySelector('canvas').getContext('2d');
    const dibujar = (bx, by) => {
      c.clearRect(0, 0, W, H);
      // La cancha vive en un SVG liviano; el canvas solo anima la pelota.
      c.save(); c.globalAlpha = .2; c.fillStyle = '#17152b'; c.beginPath(); c.ellipse(bx + 4, SUELO + 4, 12, 3.5, 0, 0, Math.PI * 2); c.fill(); c.restore();
      c.save(); c.shadowColor = 'rgba(17,16,36,.38)'; c.shadowBlur = 8; c.shadowOffsetX = 2; c.shadowOffsetY = 4;
      const ball = c.createRadialGradient(bx - 6, by - 7, 1, bx, by, 16);
      ball.addColorStop(0, '#FFD17C'); ball.addColorStop(.38, '#F58C37'); ball.addColorStop(1, '#B94720');
      c.fillStyle = ball; c.beginPath(); c.arc(bx, by, 14, 0, Math.PI * 2); c.fill(); c.restore();
      c.save(); c.beginPath(); c.arc(bx, by, 13.7, 0, Math.PI * 2); c.clip();
      c.strokeStyle = '#68351f'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(bx - 16, by); c.quadraticCurveTo(bx, by - 5, bx + 16, by); c.stroke();
      c.beginPath(); c.moveTo(bx, by - 16); c.quadraticCurveTo(bx - 5, by, bx, by + 16); c.stroke();
      c.beginPath(); c.ellipse(bx, by, 6.4, 14, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      c.fillStyle = 'rgba(255,255,255,.52)'; c.beginPath(); c.ellipse(bx - 4.5, by - 7.5, 3, 1.5, -.55, 0, Math.PI * 2); c.fill();
    };
    dibujar(90, SUELO);
    const tirar = (entra, listo) => {
      const x0 = 90, y0 = SUELO, x1 = entra ? ARO.x : ARO.x - 50, y1 = entra ? ARO.y - 14 : ARO.y - 4;
      // Con "reducir movimiento", la pelota aparece directamente donde termina el tiro
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { dibujar(entra ? ARO.x : x1 - 45, entra ? ARO.y + 12 : SUELO); listo(); return; }
      let t = 0;
      const vuelo = () => {
        t += 0.024; const u = Math.min(t, 1);
        dibujar(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - 175 * Math.sin(Math.PI * u));
        if (u < 1) { anim = requestAnimationFrame(vuelo); return; }
        let t2 = 0;
        const cae = () => { t2 += 0.035; const u2 = Math.min(t2, 1); dibujar(entra ? x1 : x1 - 45 * u2, y1 + (SUELO - y1) * u2 * u2); if (u2 < 1) anim = requestAnimationFrame(cae); else listo(); };
        cae();
      };
      vuelo();
    };
    ui.cuerpo.querySelectorAll('.opc-btn').forEach(b => b.onclick = () => {
      const ok = responder(ui.cuerpo, q, b); if (ok) p++;
      ui.fb('Tirando…');
      tirar(ok, () => {
        const aviso = document.createElement('div');
        aviso.className = 'basket-shot-toast ' + (ok ? 'bien' : 'ups');
        aviso.setAttribute('role', 'status'); aviso.setAttribute('aria-live', 'assertive');
        aviso.textContent = ok ? '¡Bien!' : '¡Ups!';
        ui.cuerpo.appendChild(aviso);
        const tAviso = window.setTimeout(() => aviso.remove(), 1000); ui.limpiar.push(() => clearTimeout(tAviso));
        ui.cuerpo.querySelector('.m-p').textContent = `Puntos: ${p * 2}`;
        ui.fb(`<span><b>${ok ? '¡Bien!' : '¡Ups!'}</b> ${md(q.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
        ui.siguiente(() => { i++; pregunta(); }, i + 1 < items.length ? 'Siguiente tiro →' : 'Ver resultado');
      });
    });
  };
  pregunta();
}

/* ---------- Carrera de autos ---------- */
// 4 preguntas. Tu auto avanza con cada acierto; el otro auto avanza con cada error.
// Gana quien llegue primero a la meta o, al terminar las 4 preguntas, quien esté más adelante.
function juegoAutos(ui, cap) {
  const items = mezclar(cap.juegos).slice(0, MAX).map(aMC).map(preparar);
  const META = items.length;
  let yo = 0, rival = 0, i = 0, aciertos = 0, terminado = false;
  ui.cuerpo.innerHTML = `<div class="marcador race-score"><span class="m-q"></span><span class="m-a">Correctas: 0</span></div>
    <section class="race-shell" aria-label="Pista de carrera">
      <div class="race-top"><span class="race-rule">Cada acierto avanza un tramo</span></div>
      <div class="pista">
        <div class="carril carril-jugador"><small class="lane-name">VOS</small><span class="auto" id="a1" aria-label="Tu auto"><svg viewBox="0 0 100 50" aria-hidden="true"><defs><linearGradient id="car-player" x2="0" y2="1"><stop stop-color="#ffb15a"/><stop offset=".5" stop-color="#f0731e"/><stop offset="1" stop-color="#dc4a24"/></linearGradient></defs><path d="M5 32 8 24q1-3 7-4l13-1 9-11q3-4 8-4h14q6 0 9 5l5 11 20 2q8 1 9 7l1 5q0 4-5 4h-4a10 10 0 0 0-20 0H39a10 10 0 0 0-20 0h-8q-6 0-6-5z" fill="url(#car-player)" stroke="#602d48" stroke-width="2"/><path d="M31 17 39 7h11v10z M53 7h5q4 0 8 10H53z" fill="#e8f7ff" stroke="#6a4260" stroke-width="1.5"/><path d="M51 7v10" stroke="#6a4260" stroke-width="1.5"/><path d="M7 24h4M89 23h7M97 28v4" stroke="#fff0d2" stroke-width="2" stroke-linecap="round"/><circle cx="29" cy="38" r="7" fill="#27243e"/><circle cx="29" cy="38" r="3" fill="#d9d6e8"/><circle cx="76" cy="38" r="7" fill="#27243e"/><circle cx="76" cy="38" r="3" fill="#d9d6e8"/></svg></span><span class="meta" aria-hidden="true"><b>META</b></span></div>
        <div class="carril carril-rival"><span class="auto" id="a2" aria-label="Auto contrario"><svg viewBox="0 0 100 50" aria-hidden="true"><defs><linearGradient id="car-rival" x2="0" y2="1"><stop stop-color="#aaa9ed"/><stop offset=".5" stop-color="#6969c5"/><stop offset="1" stop-color="#494b9a"/></linearGradient></defs><path d="M5 32 8 24q1-3 7-4l13-1 9-11q3-4 8-4h14q6 0 9 5l5 11 20 2q8 1 9 7l1 5q0 4-5 4h-4a10 10 0 0 0-20 0H39a10 10 0 0 0-20 0h-8q-6 0-6-5z" fill="url(#car-rival)" stroke="#272747" stroke-width="2"/><path d="M31 17 39 7h11v10z M53 7h5q4 0 8 10H53z" fill="#e8f7ff" stroke="#3d3f76" stroke-width="1.5"/><path d="M51 7v10" stroke="#3d3f76" stroke-width="1.5"/><path d="M7 24h4M89 23h7M97 28v4" stroke="#f4f3ff" stroke-width="2" stroke-linecap="round"/><circle cx="29" cy="38" r="7" fill="#27243e"/><circle cx="29" cy="38" r="3" fill="#d9d6e8"/><circle cx="76" cy="38" r="7" fill="#27243e"/><circle cx="76" cy="38" r="3" fill="#d9d6e8"/></svg></span><span class="meta" aria-hidden="true"><b>META</b></span></div>
      </div>
      <div class="race-progress" aria-hidden="true"><span class="race-progress-fill"></span></div>
      <div class="race-toast" aria-live="assertive" hidden></div>
    </section><div class="zona-q"></div>`;
  const mover = () => {
    [['#a1', yo], ['#a2', rival]].forEach(([selector, avance]) => {
      const car = ui.cuerpo.querySelector(selector), lane = car?.closest('.carril');
      if (!car || !lane) return;
      const meta = lane.querySelector('.meta');
      const max = Math.max(0, lane.clientWidth - meta.offsetWidth - car.offsetWidth - 7);
      const start = Math.min(54, max);
      car.style.left = `${Math.round(start + (Math.min(avance, META) / META) * Math.max(0, max - start))}px`;
    });
    const fill = ui.cuerpo.querySelector('.race-progress-fill');
    if (fill) fill.style.width = `${(Math.min(yo, META) / META) * 100}%`;
  };
  mover();
  const onResize = () => mover();
  window.addEventListener('resize', onResize, { passive: true });
  ui.limpiar.push(() => window.removeEventListener('resize', onResize));
  const final = () => {
    terminado = true;
    const res = yo > rival ? '¡Ganaste la carrera!' : yo === rival ? '¡Empate! Llegaron a la par.' : 'El otro auto llegó más lejos. ¡En la próxima lo alcanzás!';
    ui.final(aciertos, items.length, `<p><b>${res}</b></p>`);
  };
  const mostrarAviso = (ok, ronda) => {
    if (terminado || i !== ronda) return;
    const toast = ui.cuerpo.querySelector('.race-toast');
    if (!toast) return;
    toast.hidden = false;
    toast.className = `race-toast ${ok ? 'bien' : 'ups'}`;
    toast.innerHTML = `<span class="race-toast-icon" aria-hidden="true">${ok ? '✓' : '!'}</span><b>${ok ? '¡Bien!' : '¡Ups!'}</b>`;
    const timer = window.setTimeout(() => { toast.hidden = true; }, 1000);
    ui.limpiar.push(() => clearTimeout(timer));
  };
  const pregunta = () => {
    if (terminado) return;
    if (i >= items.length) return final();
    const q = items[i];

    ui.cuerpo.querySelector('.m-q').textContent = `Pregunta ${i + 1} de ${items.length}`;
    ui.cuerpo.querySelector('.m-a').textContent = `Correctas: ${aciertos}`;
    ui.fb('Pensá con calma: cada acierto te acerca a la meta.'); ui.esperar(i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    ui.cuerpo.querySelector('.zona-q').innerHTML = `<p class="race-question">${md(q.pregunta)}</p>${opcionesHTML(q)}`;
    ui.cuerpo.querySelectorAll('.opc-btn').forEach(b => b.onclick = () => {
      if (terminado) return;

      const ronda = i;
      const ok = responder(ui.cuerpo, q, b);
      if (ok) { aciertos++; yo++; } else { rival = Math.min(META, rival + 1); }
      mover();
      ui.cuerpo.querySelector('.m-a').textContent = `Correctas: ${aciertos}`;
      ui.fb(`<span><b>${ok ? '¡Bien! Tu auto avanza.' : '¡Ups! Avanza el otro auto.'}</b> ${md(q.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
      const avanzar = () => {
        if (terminado || i !== ronda) return;
        mostrarAviso(ok, ronda);
        ui.siguiente(() => { i++; pregunta(); }, i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
      };
      window.setTimeout(avanzar, 620);
    });
  };
  pregunta();
}

/* ---------- Palabra oculta ---------- */
const sinAcento = s => s.normalize('NFD').replace(/[̀-̂̄-ͯ]/g, '').normalize('NFC'); // conserva la Ñ
function juegoPalabra(ui, cap) {
  const items = mezclar(cap.palabras).slice(0, MAX);
  const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  let i = 0, p = 0;
  const paso = () => {
    if (i >= items.length) return ui.final(p, items.length);
    const it = items[i], pal = it.palabra.toUpperCase(), base = sinAcento(pal);
    const usadas = new Set(); let vidas = 6, listo = false;
    ui.fb('Tocá una letra.'); ui.esperar(i + 1 < items.length ? 'Siguiente palabra →' : 'Ver resultado');
    const pintar = () => {
      const completa = [...base].every(ch => !/[A-ZÑ]/.test(ch) || usadas.has(ch));
      ui.cuerpo.innerHTML = `<div class="marcador"><span>Palabra ${i + 1}/${items.length}</span><span>Puntos: ${p}</span><span>Intentos: ${vidas}</span></div>
        <div class="pista-palabra">💡 ${md(it.pista)}</div>
        <div class="palabra">${[...pal].map((ch, k) => ch === ' ' ? '<span class="esp"></span>' : `<span>${usadas.has(base[k]) || listo || !/[A-ZÑ]/.test(base[k]) ? ch : ''}</span>`).join('')}</div>
        <div class="letras">${LETRAS.map(l => `<button data-l="${l}" ${usadas.has(l) || listo ? 'disabled' : ''} class="${usadas.has(l) && base.includes(l) ? 'si' : ''}">${l}</button>`).join('')}</div>`;
      ui.cuerpo.querySelectorAll('.letras button').forEach(b => b.onclick = () => {
        const l = b.dataset.l; usadas.add(l);
        if (!base.includes(l)) vidas--;
        const ok = [...base].every(ch => !/[A-ZÑ]/.test(ch) || usadas.has(ch));
        if (ok || vidas <= 0) {
          listo = true; if (ok) { ui.toast(true); p++; } else { ui.toast(false); }
          pintar();
          ui.fb(ok ? `<span><b>¡La descubriste!</b> La palabra es "${esc(pal)}".</span>` : `<span>La palabra era "${esc(pal)}".</span>`, ok ? 'ok' : 'mal');
          ui.siguiente(() => { i++; paso(); }, i + 1 < items.length ? 'Siguiente palabra →' : 'Ver resultado');
        } else { pintar(); const acerto = base.includes(l); if (!acerto) ui.toast(false); ui.fb(acerto ? `La "${l}" está.` : `La "${l}" no está. Te quedan ${vidas} intento${vidas === 1 ? '' : 's'}.`, acerto ? 'ok' : 'mal'); }
      });
      return completa;
    };
    pintar();
  };
  paso();
}

/* ---------- Memotest ---------- */
function juegoMemo(ui, cap) {
  const pares = mezclar(cap.palabras).slice(0, MAX);
  const cartas = mezclar(pares.flatMap((x, k) => [{ k, txt: x.palabra, tipo: 'palabra-c' }, { k, txt: x.pista, tipo: 'pista-c' }]));
  let abiertas = [], encontradas = 0, intentos = 0, ocupado = false;
  ui.esperar(); ui.fb('Tocá una tarjeta para empezar.');
  ui.cuerpo.innerHTML = `<div class="marcador"><span class="m-i">Intentos: 0</span><span class="m-e">Pares: 0/${pares.length}</span></div>
    <div class="memo">${cartas.map((c, n) => `<button data-n="${n}" aria-label="Tarjeta ${n + 1}">?</button>`).join('')}</div>`;
  const btns = [...ui.cuerpo.querySelectorAll('.memo button')];
  btns.forEach(b => b.onclick = () => {
    const n = +b.dataset.n, c = cartas[n];
    if (ocupado || b.classList.contains('vista') || b.classList.contains('par')) return;
    b.classList.add('vista', c.tipo); b.textContent = c.txt; abiertas.push(n);
    if (abiertas.length < 2) { ui.fb('Ahora tocá otra tarjeta.'); return; }
    intentos++; ui.cuerpo.querySelector('.m-i').textContent = `Intentos: ${intentos}`;
    const [a, z] = abiertas; abiertas = [];
    if (cartas[a].k === cartas[z].k && cartas[a].tipo !== cartas[z].tipo) {
      [a, z].forEach(x => { btns[x].classList.remove('vista'); btns[x].classList.add('par'); });
      encontradas++; ui.cuerpo.querySelector('.m-e').textContent = `Pares: ${encontradas}/${pares.length}`;
      ui.toast(true); ui.fb(`<span><b>¡Par encontrado!</b> "${esc(pares[cartas[a].k].palabra)}".</span>`, 'ok');
      if (encontradas === pares.length) setTimeout(() => ui.final(pares.length, pares.length, `<p class="ayuda">Lo lograste en ${intentos} intentos.</p>`), 900);
    } else {
      ocupado = true; ui.toast(false); ui.fb('Esas tarjetas no forman un par. Recordá dónde están y seguí buscando.', 'mal');
      setTimeout(() => { [a, z].forEach(x => { btns[x].className = ''; btns[x].textContent = '?'; }); ocupado = false; }, 1500);
    }
  });
}

/* ---------- Atrapá la verdadera ---------- */
function juegoAtrapa(ui, cap) {
  const items = mezclar(vfDe(cap)).slice(0, MAX);
  const DUR = 11000;
  let i = 0, p = 0, vidas = 3, anim = 0;
  ui.limpiar.push(() => cancelAnimationFrame(anim));
  const paso = () => {
    if (i >= items.length || vidas <= 0) return ui.final(p, items.length);
    const it = items[i];
    let decidido = false;
    ui.fb('Decidí antes de que llegue al piso.'); ui.esperar(i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `<div class="marcador"><span>${i + 1}/${items.length}</span><span>Atrapadas bien: ${p}</span><span class="vidas">Oportunidades: ${vidas}</span></div>
      <div class="caida"><div class="carta">${md(it.texto)}</div><div class="suelo"></div></div>
      <div class="vf-botones" style="margin-top:12px"><button class="v">✋ ¡Atrapar! (verdadera)</button><button class="f">👋 Dejar pasar (falsa)</button></div>`;
    const carta = ui.cuerpo.querySelector('.carta'), area = ui.cuerpo.querySelector('.caida');
    const t0 = performance.now();
    const caer = t => {
      if (decidido) return;
      const u = Math.min((t - t0) / DUR, 1);
      carta.style.top = (u * (area.clientHeight - carta.offsetHeight - 10)) + 'px';
      if (u < 1) anim = requestAnimationFrame(caer); else decidir(false, true);
    };
    const decidir = (atrapa, tiempo = false) => {
      if (decidido) return; decidido = true; cancelAnimationFrame(anim);
      ui.cuerpo.querySelectorAll('.vf-botones button').forEach(b => b.disabled = true);
      const ok = atrapa === it.respuesta;
      if (ok) p++; else vidas--;
      ui.toast(ok);
      ui.cuerpo.querySelector('.vidas').textContent = 'Oportunidades: ' + Math.max(vidas, 0);
      ui.fb(`<span><b>${ok ? '¡Bien!' : tiempo ? 'Llegó al piso.' : 'Era la otra.'}</b> Era ${it.respuesta ? 'verdadera' : 'falsa'}. ${md(it.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
      ui.siguiente(() => { i++; paso(); }, i + 1 < items.length && vidas > 0 ? 'Siguiente →' : 'Ver resultado');
    };
    ui.cuerpo.querySelector('.v').onclick = () => decidir(true);
    ui.cuerpo.querySelector('.f').onclick = () => decidir(false);
    anim = requestAnimationFrame(caer);
  };
  paso();
}

/* ---------- ¿Antes o después? ---------- */
// Íconos propios (SVG), con la paleta de la plataforma
const AD_ICONO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
const AD_RELOJ = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#5B2A86"/><path d="M8 6.5h8M8 17.5h8M9 6.5c0 3 6 3.5 6 5.5s-6 2.5-6 5.5M15 6.5c0 3-6 3.5-6 5.5" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>';
// Mini línea de tiempo con los dos hechos, ubicados según su año
function adLinea(a, b, angosto = false) {
  const [x, y] = a.anio <= b.anio ? [a, b] : [b, a];
  const W = angosto ? 340 : 600, H = 92, m = angosto ? 44 : 70, ancho = W - 2 * m;
  const xa = m, xb = m + ancho;
  const recorte = s => s.length > 34 ? s.slice(0, 32).trimEnd() + '…' : s;
  const pto = (cx, h, cls, col, arriba) => `<g class="pt ${cls}"><circle cx="${cx}" cy="46" r="11" fill="${col}"/><circle cx="${cx}" cy="46" r="4.5" fill="#fff"/></g>
    <text x="${cx}" y="${arriba ? 24 : 82}" text-anchor="middle" font-size="19" font-weight="800" fill="${col}">${esc(h.etiqueta)}</text>`;
  const dif = y.anio - x.anio;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Línea de tiempo: primero ${esc(x.titulo)} (${esc(x.etiqueta)}), después ${esc(y.titulo)} (${esc(y.etiqueta)})">
    <defs><linearGradient id="adg" gradientUnits="userSpaceOnUse" x1="18" y1="0" x2="${W - 14}" y2="0"><stop offset="0" stop-color="#4B4FA3"/><stop offset=".5" stop-color="#E5194F"/><stop offset="1" stop-color="#F0731E"/></linearGradient>
    </defs>
    <line x1="18" y1="46" x2="${W - 26}" y2="46" stroke="url(#adg)" stroke-width="5" stroke-linecap="round"/><path d="M${W - 30} 38 L${W - 12} 46 L${W - 30} 54z" fill="#F0731E"/>
    ${pto(xa, x, 'a', '#1F9D6B', true)}${pto(xb, y, 'b', '#5B2A86', true)}
    <text x="${xa}" y="82" text-anchor="middle" font-size="14" font-weight="700" fill="#4A4870">Primero</text>
    <text x="${xb}" y="82" text-anchor="middle" font-size="14" font-weight="700" fill="#4A4870">Después</text>
    <text x="${(xa + xb) / 2}" y="82" text-anchor="middle" font-size="14" font-weight="700" fill="#4A4870">${dif === 1 ? '1 año' : dif + ' años'}${angosto ? '' : ' entre uno y otro'}</text>
  </svg>`;
}
function juegoAntes(ui, cap) {
  const ev = eventosDe(cap);
  const rondas = [];
  const pares = mezclar(ev.flatMap((a, i) => ev.slice(i + 1).filter(b => b.anio !== a.anio).map(b => [a, b])));
  for (const par of pares) { if (rondas.length >= MAX) break; rondas.push(mezclar(par)); }
  let i = 0, p = 0;
  const prog = () => `<div class="ad-prog"><div class="seg" aria-label="Ronda ${i + 1} de ${rondas.length}">${rondas.map((_, k) => `<i class="${k < i ? 'hecha' : k === i ? 'actual' : ''}"></i>`).join('')}</div>
    <div class="pts">${AD_RELOJ}<span>Ronda ${Math.min(i + 1, rondas.length)}/${rondas.length} · ${p} ${p === 1 ? 'punto' : 'puntos'}</span></div></div>`;
  const paso = () => {
    if (i >= rondas.length) return ui.final(p, rondas.length);
    const [a, b] = rondas[i];
    ui.fb('Tocá la tarjeta del hecho que pasó primero.'); ui.esperar(i + 1 < rondas.length ? 'Siguiente →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `${prog()}<p class="ad-preg">¿Cuál pasó <span>primero</span>?</p>
      <div class="ad-zona"><div class="ad-par">${[a, b].map((x, k) => `<button class="ad-carta" data-k="${k}">
        <span class="ad-cab">${AD_ICONO}Hecho ${k ? 'B' : 'A'}</span>
        <span class="ad-tit">${esc(x.titulo)}</span>
        <span class="ad-pie"><span class="ad-anio"></span><span class="ad-sello"></span></span></button>`).join('<span class="ad-vs" aria-hidden="true">¿o?</span>')}</div>
      <div class="ad-linea" aria-live="polite"></div></div>`;
    const cartas = ui.cuerpo.querySelectorAll('.ad-carta');
    cartas.forEach(c => c.onclick = () => {
      const k0 = +c.dataset.k, elegido = [a, b][k0], otro = [a, b][1 - k0], ok = elegido.anio < otro.anio;
      if (ok) p++;
      cartas.forEach((x, k) => {
        const h = [a, b][k], prim = h.anio < [a, b][1 - k].anio;
        x.disabled = true; x.classList.add('revelada', prim ? 'primero' : 'despues');
        x.querySelector('.ad-anio').textContent = h.etiqueta;
        x.querySelector('.ad-sello').textContent = prim ? '✓ Primero' : 'Después';
        if (k === k0) { x.classList.add('elegida'); x.insertAdjacentHTML('beforeend', '<span class="ad-elegiste">Tu elección</span>'); }
      });
      ui.cuerpo.querySelector('.ad-zona').insertAdjacentHTML('beforeend', ok
        ? '<div class="ad-globo bien" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>¡Bien!</div>'
        : '<div class="ad-globo ups" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 15.5c1-1.2 2.2-1.8 3.5-1.8s2.5.6 3.5 1.8"/><circle cx="9" cy="10" r=".6" fill="#fff"/><circle cx="15" cy="10" r=".6" fill="#fff"/></svg>¡Ups!</div>');
      const lin = ui.cuerpo.querySelector('.ad-linea'); lin.innerHTML = adLinea(a, b, lin.clientWidth < 440);
      requestAnimationFrame(() => requestAnimationFrame(() => { lin.classList.add('ver'); lin.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }));
      ui.cuerpo.querySelector('.ad-prog .pts span').textContent = `Ronda ${i + 1}/${rondas.length} · ${p} ${p === 1 ? 'punto' : 'puntos'}`;
      const primero = a.anio < b.anio ? a : b;
      ui.fb(`<span><b>${ok ? '¡Bien!' : '¡Ups!'}</b> Primero fue "${esc(primero.titulo)}" (${esc(primero.etiqueta)}).</span>`, ok ? 'ok' : 'mal');
      ui.siguiente(() => { i++; paso(); }, i + 1 < rondas.length ? 'Siguiente →' : 'Ver resultado');
    });
  };
  paso();
}

/* ---------- Detective del error ---------- */
function juegoError(ui, cap) {
  const falsas = mezclar(vfDe(cap).filter(x => !x.respuesta)), ciertas = vfDe(cap).filter(x => x.respuesta);
  const casos = falsas.slice(0, MAX).map(f => mezclar([f, ...mezclar(ciertas).slice(0, 2)]));
  let i = 0, p = 0;
  const paso = () => {
    if (i >= casos.length) return ui.final(p, casos.length);
    const caso = casos[i];
    ui.fb('Tocá la afirmación falsa.'); ui.esperar(i + 1 < casos.length ? 'Siguiente caso →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `<div class="marcador de-marcador"><span>CASO ${String(i + 1).padStart(2, '0')} / ${String(casos.length).padStart(2, '0')}</span><span class="de-puntos">Puntos ${p}</span></div>
      <section class="de-caso" aria-label="Caso histórico">
        <div class="de-cab">
          <div class="de-lupa" aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="27" cy="27" r="17"/><path d="m40 40 14 14M20 28h14M27 21v14"/></svg></div>
          <div class="de-titulos"><span class="de-sobrelinea">EXPEDIENTE</span><h2>Tres afirmaciones</h2><p>Una no coincide con lo que estudiaste.</p></div>
          <span class="de-sello">INVESTIGÁ</span>
        </div>
        <div class="de-consigna"><span class="de-punto"></span>Encontrá la afirmación falsa</div>
        <div class="de-opciones">${caso.map((x, k) => `<button class="opc-btn de-opcion" data-k="${k}"><span class="de-num">${String(k + 1).padStart(2, '0')}</span><span class="de-texto">${md(x.texto)}</span><span class="de-marca" aria-hidden="true"></span></button>`).join('')}</div>
      </section>`;
    ui.cuerpo.querySelectorAll('.opc-btn').forEach(bt => bt.onclick = () => {
      const k = +bt.dataset.k, ok = !caso[k].respuesta, fk = caso.findIndex(x => !x.respuesta);
      if (ok) p++;
      ui.cuerpo.querySelectorAll('.opc-btn').forEach((x, j) => { x.disabled = true; if (j === fk) x.classList.add('bien'); });
      if (!ok) bt.classList.add('mal');
      ui.fb(`<span><b>${ok ? '¡Bien!' : '¡Ups!'}</b> ${ok ? 'La encontraste.' : 'Esa es verdadera. La falsa es la que quedó en verde, con ✓.'} ${md(caso[fk].explicacion || '')}</span>`, ok ? 'ok' : 'mal');
      ui.siguiente(() => { i++; paso(); }, i + 1 < casos.length ? 'Siguiente caso →' : 'Ver resultado');
    });
  };
  paso();
}

