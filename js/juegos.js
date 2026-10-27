// TUTORÍAS VIRTUALES · juegos de práctica (se habilitan al terminar cada cápsula)
// Banco por cápsula:
//   juegos:   [{tipo:'vf', texto, respuesta:true|false, explicacion}, {tipo:'mc', pregunta, opciones:[], correcta:0, explicacion}]
//   palabras: [{palabra, pista}]  (para «Palabra oculta» y «Memotest»)
// Cada cápsula ofrece 3 juegos y van rotando de una cápsula a la otra.
// Todo es HTML, CSS y JavaScript del propio paquete: no usa servicios externos (compatible con Moodle).
import { esc, md, norm } from './estado.js';
import { AJUSTES } from './config.js';

const vfDe = cap => (cap.juegos || []).filter(b => b.tipo === 'vf');
const mcDe = cap => (cap.juegos || []).filter(b => b.tipo === 'mc');

export const JUEGOS = [
  { id: 'vf', nombre: 'Verdadero o falso', icono: '✅', desc: 'Decidí si es cierto', puede: c => vfDe(c).length >= 3,
    instr: 'Leé cada afirmación y tocá <b>Verdadero</b> o <b>Falso</b>. Después leé la explicación y pasá a la siguiente.' },
  { id: 'mc', nombre: 'Múltiple choice', icono: '🎯', desc: 'Elegí la correcta', puede: c => mcDe(c).length >= 3,
    instr: 'Leé la pregunta y tocá la opción correcta. Solo una es la buena.' },
  { id: 'basket', nombre: 'Básquet', icono: '🏀', desc: 'Respondé y encestá', puede: c => (c.juegos || []).length >= 4,
    instr: 'Cada pregunta es un tiro: si elegís la respuesta correcta, la pelota entra y sumás 2 puntos.' },
  { id: 'autos', nombre: 'Carrera de autos', icono: '🏎️', desc: 'Llegá primero a la meta', puede: c => (c.juegos || []).length >= 4,
    instr: 'Cada respuesta correcta hace avanzar tu auto. Mientras pensás, el rival avanza solo: ¡llegá primero a la meta!' },
  { id: 'palabra', nombre: 'Palabra oculta', icono: '🔤', desc: 'Descubrí la palabra', puede: c => (c.palabras || []).length >= 4,
    instr: 'Leé la pista y tocá letras para descubrir la palabra escondida. Tenés 6 vidas por palabra.' },
  { id: 'memo', nombre: 'Memotest', icono: '🧠', desc: 'Uní palabra y pista', puede: c => (c.palabras || []).length >= 4,
    instr: 'Tocá dos tarjetas para darlas vuelta. Encontrá cada palabra con la pista que le corresponde.' },
  { id: 'atrapa', nombre: 'Atrapá la verdadera', icono: '🪂', desc: 'Antes de que caiga', puede: c => vfDe(c).length >= 4,
    instr: 'Cae una afirmación. Si es <b>verdadera</b>, atrapala; si es <b>falsa</b>, dejala pasar. Tenés 3 vidas.' },
];

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
  const fondo = document.createElement('div');
  fondo.className = 'modal-fondo';
  fondo.innerHTML = `<div class="modal juego" role="dialog" aria-modal="true" aria-label="${esc(def.nombre)}">
    <div class="modal-cab"><h3>${def.icono} ${esc(def.nombre)}</h3><button class="cerrar" aria-label="Cerrar">✕</button></div>
    <div class="jg-instr"><b>Cómo se juega:</b> ${def.instr}</div>
    <div class="jg-cuerpo"></div>
    <div class="jg-pie"><div class="jg-fb" aria-live="polite"></div><button class="btn" id="jg-sig" disabled>Siguiente →</button></div></div>`;
  document.body.appendChild(fondo);
  const limpiar = [];
  const cerrar = () => { limpiar.forEach(f => f()); fondo.remove(); };
  fondo.querySelector('.cerrar').onclick = cerrar;
  const fbEl = fondo.querySelector('.jg-fb'), btn = fondo.querySelector('#jg-sig');
  const ui = {
    cuerpo: fondo.querySelector('.jg-cuerpo'),
    limpiar,
    fb(html = '', clase = '') { fbEl.className = 'jg-fb ' + clase; fbEl.innerHTML = html; },
    siguiente(fn, texto = 'Siguiente →') { btn.textContent = texto; btn.disabled = false; btn.onclick = () => { btn.disabled = true; btn.onclick = null; fn(); }; },
    esperar(texto = 'Siguiente →') { btn.textContent = texto; btn.disabled = true; btn.onclick = null; },
    final(puntos, total, extra = '') {
      limpiar.splice(0).forEach(f => f());
      try { onFin?.(tipo, puntos, total); } catch {}
      const pct = total ? Math.round(puntos / total * 100) : 0;
      const msg = pct === 100 ? '¡Perfecto! Dominás este tema.' : pct >= 70 ? '¡Muy bien! Repasá lo que te falló.' : 'Seguí practicando: volvé a leer la cápsula y jugá otra vez cuando quieras.';
      ui.cuerpo.innerHTML = `<div class="jg-final"><div class="grande">${pct >= 70 ? '🏆' : '💪'}</div><h3>${puntos} de ${total}</h3><p>${msg}</p>${extra}</div>`;
      ui.fb('Terminaste el juego. Para volver a jugar, cerrá esta ventana y abrilo de nuevo.');
      btn.textContent = 'Cerrar'; btn.disabled = false; btn.onclick = cerrar;
    },
  };
  ({ vf: juegoVF, mc: juegoMC, basket: juegoBasket, autos: juegoAutos, palabra: juegoPalabra, memo: juegoMemo, atrapa: juegoAtrapa }[tipo])(ui, cap);
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
  const items = mezclar(vfDe(cap));
  let i = 0, p = 0, racha = 0, mejor = 0;
  const paso = () => {
    if (i >= items.length) return ui.final(p, items.length, `<p class="ayuda">Mejor racha: ${mejor} 🔥</p>`);
    const it = items[i];
    ui.fb('Elegí una respuesta.'); ui.esperar(i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `<div class="marcador"><span>Afirmación ${i + 1}/${items.length}</span><span>Puntos: ${p}</span><span>Racha: ${racha} 🔥</span></div>
      <div class="vf-card">${md(it.texto)}</div><div class="vf-botones"><button class="v">Verdadero</button><button class="f">Falso</button></div>`;
    const resp = v => {
      ui.cuerpo.querySelectorAll('.vf-botones button').forEach(b => b.disabled = true);
      const ok = v === it.respuesta;
      if (ok) { p++; racha++; mejor = Math.max(mejor, racha); } else racha = 0;
      ui.fb(`<span><b>${ok ? '¡Correcto!' : 'No era esa.'}</b> ${it.respuesta ? 'Es verdadera.' : 'Es falsa.'} ${md(it.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
      ui.siguiente(() => { i++; paso(); }, i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    };
    ui.cuerpo.querySelector('.v').onclick = () => resp(true);
    ui.cuerpo.querySelector('.f').onclick = () => resp(false);
  };
  paso();
}

/* ---------- Múltiple choice ---------- */
function juegoMC(ui, cap) {
  const items = mezclar(mcDe(cap)).map(aMC).map(preparar);
  let i = 0, p = 0;
  const paso = () => {
    if (i >= items.length) return ui.final(p, items.length);
    const q = items[i];
    ui.fb('Elegí una opción.'); ui.esperar(i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `<div class="marcador"><span>Pregunta ${i + 1}/${items.length}</span><span>Puntos: ${p}</span></div>
      <p style="font-weight:700;font-size:1.1rem">${md(q.pregunta)}</p>${opcionesHTML(q)}`;
    ui.cuerpo.querySelectorAll('.opc-btn').forEach(b => b.onclick = () => {
      const ok = responder(ui.cuerpo, q, b); if (ok) p++;
      ui.cuerpo.querySelector('.marcador span:last-child').textContent = `Puntos: ${p}`;
      ui.fb(`<span><b>${ok ? '¡Correcto!' : 'Casi.'}</b> ${md(q.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
      ui.siguiente(() => { i++; paso(); }, i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    });
  };
  paso();
}

/* ---------- Básquet ---------- */
function juegoBasket(ui, cap) {
  const items = mezclar(cap.juegos).slice(0, 8).map(aMC).map(preparar);
  let i = 0, p = 0, anim = 0;
  ui.limpiar.push(() => cancelAnimationFrame(anim));
  const W = 640, H = 230, SUELO = 205, ARO = { x: 520, y: 80 };
  const pregunta = () => {
    if (i >= items.length) return ui.final(p, items.length, `<p class="ayuda">Encestaste ${p} de ${items.length} tiros: ${p * 2} puntos.</p>`);
    const q = items[i];
    ui.fb('Elegí una opción para tirar.'); ui.esperar(i + 1 < items.length ? 'Siguiente tiro →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `<div class="marcador"><span>Tiro ${i + 1}/${items.length}</span><span class="m-p">Puntos: ${p * 2}</span></div>
      <canvas class="cancha" width="${W}" height="${H}"></canvas><p style="font-weight:700">${md(q.pregunta)}</p>${opcionesHTML(q)}`;
    const c = ui.cuerpo.querySelector('canvas').getContext('2d');
    const dibujar = (bx, by) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#D9B386'; c.fillRect(0, SUELO + 12, W, H);
      c.fillStyle = '#fff'; c.strokeStyle = '#5B2A86'; c.lineWidth = 4;
      c.fillRect(ARO.x + 44, ARO.y - 55, 10, 85); c.strokeRect(ARO.x + 44, ARO.y - 55, 10, 85);
      c.strokeStyle = '#E5194F'; c.lineWidth = 6; c.beginPath(); c.moveTo(ARO.x - 30, ARO.y); c.lineTo(ARO.x + 44, ARO.y); c.stroke();
      c.strokeStyle = 'rgba(90,90,120,.6)'; c.lineWidth = 2;
      for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(ARO.x - 28 + k * 15, ARO.y); c.lineTo(ARO.x - 18 + k * 11, ARO.y + 34); c.stroke(); }
      c.fillStyle = '#F0731E'; c.beginPath(); c.arc(bx, by, 15, 0, 7); c.fill();
      c.strokeStyle = '#7A3A00'; c.lineWidth = 2; c.beginPath(); c.arc(bx, by, 15, 0, 7); c.moveTo(bx - 15, by); c.lineTo(bx + 15, by); c.moveTo(bx, by - 15); c.lineTo(bx, by + 15); c.stroke();
    };
    dibujar(90, SUELO);
    const tirar = (entra, listo) => {
      const x0 = 90, y0 = SUELO, x1 = entra ? ARO.x + 6 : ARO.x - 50, y1 = entra ? ARO.y + 30 : ARO.y - 4;
      let t = 0;
      const vuelo = () => {
        t += 0.024; const u = Math.min(t, 1);
        dibujar(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u - 130 * Math.sin(Math.PI * u));
        if (u < 1) { anim = requestAnimationFrame(vuelo); return; }
        let t2 = 0;
        const cae = () => { t2 += 0.035; const u2 = Math.min(t2, 1); dibujar(entra ? x1 : x1 - 45 * u2, y1 + (SUELO - y1) * u2 * u2); if (u2 < 1) anim = requestAnimationFrame(cae); else listo(); };
        cae();
      };
      vuelo();
    };
    ui.cuerpo.querySelectorAll('.opc-btn').forEach(b => b.onclick = () => {
      const ok = responder(ui.cuerpo, q, b); if (ok) p++;
      ui.fb('🏀 Tirando…');
      tirar(ok, () => {
        ui.cuerpo.querySelector('.m-p').textContent = `Puntos: ${p * 2}`;
        ui.fb(`<span><b>${ok ? '¡Adentro! +2.' : 'Rebotó en el aro.'}</b> ${md(q.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
        ui.siguiente(() => { i++; pregunta(); }, i + 1 < items.length ? 'Siguiente tiro →' : 'Ver resultado');
      });
    });
  };
  pregunta();
}

/* ---------- Carrera de autos ---------- */
function juegoAutos(ui, cap) {
  const META = 6;
  let pool = mezclar(cap.juegos).map(aMC);
  while (pool.length < META + 4) pool = pool.concat(mezclar(cap.juegos).map(aMC));
  const items = pool.map(preparar);
  let yo = 0, rival = 0, i = 0, aciertos = 0, intentos = 0, terminado = false, pensando = false;
  ui.cuerpo.innerHTML = `<div class="pista"><div class="carril"><small>Vos</small><span class="auto" id="a1">🏎️</span><span class="meta"></span></div>
    <div class="carril"><small>Rival</small><span class="auto" id="a2">🚙</span><span class="meta"></span></div></div><div class="zona-q"></div>`;
  const pos = n => `${(n / META) * (100 - 12)}%`;
  const mover = () => { ui.cuerpo.querySelector('#a1').style.left = pos(yo); ui.cuerpo.querySelector('#a2').style.left = pos(rival); };
  mover();
  // El rival avanza solo mientras hay una pregunta abierta
  const tictac = setInterval(() => {
    if (terminado || !pensando) return;
    rival++; mover();
    if (rival >= META) final(false);
  }, AJUSTES.AUTOS_RIVAL_SEG * 1000);
  ui.limpiar.push(() => clearInterval(tictac));
  const final = gano => {
    terminado = true; clearInterval(tictac);
    ui.final(aciertos, intentos || 1, `<p><b>${gano ? '🏁 ¡Ganaste la carrera!' : '🐢 Esta vez ganó el rival.'}</b></p>`);
  };
  const pregunta = () => {
    if (terminado) return;
    const q = items[i % items.length];
    pensando = true;
    ui.fb('Respondé rápido: el rival avanza mientras pensás.'); ui.esperar();
    ui.cuerpo.querySelector('.zona-q').innerHTML = `<p style="font-weight:700">${md(q.pregunta)}</p>${opcionesHTML(q)}`;
    ui.cuerpo.querySelectorAll('.opc-btn').forEach(b => b.onclick = () => {
      if (terminado) return;
      pensando = false; intentos++;
      const ok = responder(ui.cuerpo, q, b);
      if (ok) { aciertos++; yo++; mover(); }
      if (yo >= META) { ui.fb('<b>¡Cruzaste la meta!</b>', 'ok'); setTimeout(() => final(true), 700); return; }
      ui.fb(`<span><b>${ok ? '¡Acelerás!' : 'Frenaste.'}</b> ${md(q.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
      ui.siguiente(() => { i++; pregunta(); });
    });
  };
  pregunta();
}

/* ---------- Palabra oculta ---------- */
const sinTilde = s => s.normalize('NFD').replace(/[̀-̂̄-ͯ]/g, '').normalize('NFC'); // conserva la Ñ
function juegoPalabra(ui, cap) {
  const items = mezclar(cap.palabras).slice(0, 5);
  const LETRAS = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  let i = 0, p = 0;
  const paso = () => {
    if (i >= items.length) return ui.final(p, items.length);
    const it = items[i], pal = it.palabra.toUpperCase(), base = sinTilde(pal);
    const usadas = new Set(); let vidas = 6, listo = false;
    ui.fb('Tocá una letra.'); ui.esperar(i + 1 < items.length ? 'Siguiente palabra →' : 'Ver resultado');
    const pintar = () => {
      const completa = [...base].every(ch => !/[A-ZÑ]/.test(ch) || usadas.has(ch));
      ui.cuerpo.innerHTML = `<div class="marcador"><span>Palabra ${i + 1}/${items.length}</span><span>Puntos: ${p}</span><span class="vidas">${'❤️'.repeat(vidas)}${'🤍'.repeat(6 - vidas)}</span></div>
        <div class="pista-palabra">💡 ${md(it.pista)}</div>
        <div class="palabra">${[...pal].map((ch, k) => ch === ' ' ? '<span class="esp"></span>' : `<span>${usadas.has(base[k]) || listo || !/[A-ZÑ]/.test(base[k]) ? ch : ''}</span>`).join('')}</div>
        <div class="letras">${LETRAS.map(l => `<button data-l="${l}" ${usadas.has(l) || listo ? 'disabled' : ''} class="${usadas.has(l) && base.includes(l) ? 'si' : ''}">${l}</button>`).join('')}</div>`;
      ui.cuerpo.querySelectorAll('.letras button').forEach(b => b.onclick = () => {
        const l = b.dataset.l; usadas.add(l);
        if (!base.includes(l)) vidas--;
        const ok = [...base].every(ch => !/[A-ZÑ]/.test(ch) || usadas.has(ch));
        if (ok || vidas <= 0) {
          listo = true; if (ok) p++;
          pintar();
          ui.fb(ok ? `<span><b>¡La descubriste!</b> La palabra es «${esc(pal)}».</span>` : `<span><b>Se terminaron las vidas.</b> La palabra era «${esc(pal)}».</span>`, ok ? 'ok' : 'mal');
          ui.siguiente(() => { i++; paso(); }, i + 1 < items.length ? 'Siguiente palabra →' : 'Ver resultado');
        } else { pintar(); ui.fb(base.includes(l) ? `¡Bien! La «${l}» está.` : `La «${l}» no está. Te quedan ${vidas} vidas.`); }
      });
      return completa;
    };
    pintar();
  };
  paso();
}

/* ---------- Memotest ---------- */
function juegoMemo(ui, cap) {
  const pares = mezclar(cap.palabras).slice(0, 4);
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
      ui.fb(`<span><b>¡Par encontrado!</b> «${esc(pares[cartas[a].k].palabra)}».</span>`, 'ok');
      if (encontradas === pares.length) setTimeout(() => ui.final(pares.length, pares.length, `<p class="ayuda">Lo lograste en ${intentos} intentos.</p>`), 900);
    } else {
      ocupado = true; ui.fb('No son pareja. Memorizalas y probá de nuevo.', 'mal');
      setTimeout(() => { [a, z].forEach(x => { btns[x].className = ''; btns[x].textContent = '?'; }); ocupado = false; }, 1500);
    }
  });
}

/* ---------- Atrapá la verdadera ---------- */
function juegoAtrapa(ui, cap) {
  const items = mezclar(vfDe(cap)).slice(0, 8);
  const DUR = 11000;
  let i = 0, p = 0, vidas = 3, anim = 0;
  ui.limpiar.push(() => cancelAnimationFrame(anim));
  const paso = () => {
    if (i >= items.length || vidas <= 0) return ui.final(p, Math.min(items.length, i), vidas <= 0 ? '<p class="ayuda">Te quedaste sin vidas.</p>' : '');
    const it = items[i];
    let decidido = false;
    ui.fb('Decidí antes de que llegue al piso.'); ui.esperar(i + 1 < items.length ? 'Siguiente →' : 'Ver resultado');
    ui.cuerpo.innerHTML = `<div class="marcador"><span>${i + 1}/${items.length}</span><span>Atrapadas bien: ${p}</span><span class="vidas">${'❤️'.repeat(vidas)}${'🤍'.repeat(3 - vidas)}</span></div>
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
      ui.cuerpo.querySelector('.vidas').textContent = '❤️'.repeat(Math.max(vidas, 0)) + '🤍'.repeat(3 - Math.max(vidas, 0));
      ui.fb(`<span><b>${ok ? '¡Bien!' : tiempo ? 'Llegó al piso.' : 'Uy.'}</b> Era ${it.respuesta ? 'verdadera' : 'falsa'}. ${md(it.explicacion || '')}</span>`, ok ? 'ok' : 'mal');
      ui.siguiente(() => { i++; paso(); }, i + 1 < items.length && vidas > 0 ? 'Siguiente →' : 'Ver resultado');
    };
    ui.cuerpo.querySelector('.v').onclick = () => decidir(true);
    ui.cuerpo.querySelector('.f').onclick = () => decidir(false);
    anim = requestAnimationFrame(caer);
  };
  paso();
}
