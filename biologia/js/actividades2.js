// Actividades nuevas (clases 5 a 7): marcar en el texto, brazo para predecir y observar, etapas animadas,
// dilema con decisiones, historieta de debate y simulador de la glucosa.
import { esc, md } from './estado.js';
import { pantallaCompleta } from './pantalla.js';

const quieto = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const mezclar = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const caja = (cls, etq, b, resuelto, cuerpo) => `<div class="interactivo ${cls} ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || etq)}</div>
  ${b.titulo ? `<h3>${esc(b.titulo)}</h3>` : ''}${b.consigna ? `<div class="consigna">${md(b.consigna)}</div>` : ''}${cuerpo}${b.fuente ? `<p class="m3d-pie">${md(b.fuente)}</p>` : ''}</div>`;

// ------------------------------------------------------------------ Marcar en el texto
// texto con [[palabras correctas]]; las demás palabras también se pueden tocar.
export function bMarcar(w, b, resuelto, marcar) {
  const partes = []; let k = 0;
  b.texto.split(/(\[\[[^\]]+\]\])/).forEach(seg => {
    const ok = seg.startsWith('[[');
    const limpio = ok ? seg.slice(2, -2) : seg;
    if (ok) partes.push({ t: limpio, ok: true, i: k++ });
    else limpio.split(/(\s+)/).forEach(p => { if (!p) return; if (/^\s+$/.test(p)) partes.push({ esp: p }); else partes.push({ t: p, ok: false, i: k++ }); });
  });
  const html = partes.map(p => p.esp ? p.esp : (() => {
    const m = p.t.match(/^([¿¡("«]*)(.*?)([.,;:!?)"»]*)$/);
    return `${esc(m[1])}<button type="button" class="mk-p" data-i="${p.i}">${esc(m[2])}</button>${esc(m[3])}`;
  })()).join('');
  const total = partes.filter(p => p.ok).length;
  w.innerHTML = caja('marcar', '🖍️ Marcá en el texto', b, resuelto, `<p class="instr-act">Tocá las palabras para marcarlas. Si te equivocás, tocala de nuevo y se desmarca.</p>
    <div class="mk-texto">${html}</div><div class="acciones"><span class="mk-cuenta">Marcaste 0</span><button class="btn chico" id="cmp">Comprobar</button></div><div class="fbz"></div>`);
  const fb = w.querySelector('.fbz'), cuenta = w.querySelector('.mk-cuenta'); let fallos = 0;
  const botones = [...w.querySelectorAll('.mk-p')];
  const ok = i => partes.find(p => p.i === i)?.ok;
  const contar = () => { cuenta.textContent = `Marcaste ${botones.filter(x => x.classList.contains('on')).length}`; };
  botones.forEach(x => x.onclick = () => { if (w.firstElementChild.classList.contains('resuelto')) return; x.classList.toggle('on'); x.classList.remove('bien', 'mal', 'falta'); fb.innerHTML = ''; contar(); });
  const resolver = () => { botones.forEach(x => { x.classList.toggle('on', ok(+x.dataset.i)); x.classList.toggle('bien', ok(+x.dataset.i)); }); w.firstElementChild.classList.add('resuelto'); };
  if (resuelto) resolver();
  w.querySelector('#cmp').onclick = () => {
    let bien = 0, mal = 0;
    botones.forEach(x => { const on = x.classList.contains('on'), c = ok(+x.dataset.i); x.classList.remove('bien', 'mal', 'falta');
      if (on && c) { bien++; x.classList.add('bien'); } else if (on && !c) { mal++; x.classList.add('mal'); } });
    if (bien === total && !mal) { resolver(); fb.innerHTML = `<div class="fb ok"><b>¡Muy bien!</b> ${md(b.explicacion)}</div>`; marcar(); return; }
    fallos++;
    const faltan = total - bien;
    fb.innerHTML = `<div class="fb mal"><b>${mal ? `Hay ${mal} ${mal === 1 ? 'palabra marcada que no va' : 'palabras marcadas que no van'} (en rojo).` : ''} ${faltan ? `Te ${faltan === 1 ? 'falta' : 'faltan'} ${faltan}.` : ''}</b> ${fallos >= 2 && b.pista ? md(b.pista) : 'Volvé a leer con atención y probá de nuevo.'}</div>`;
  };
  return true;
}

// ------------------------------------------------------------------ Brazo: predecir, observar y explicar
export function bBrazo(w, b, resuelto, marcar) {
  const P = b.prediccion;
  w.innerHTML = caja('brazo', '🔮 Predecí y comprobá', b, resuelto, `
    <div class="br-cols"><div class="br-dibujo" aria-hidden="true">${dibujoBrazo(b.imagenes)}</div>
    <div class="br-panel">
      <div class="br-paso br-p1"><div class="br-n">1</div><div><b>Predecí.</b> ${md(P.pregunta)}
        <div class="opc-lista">${P.opciones.map((o, i) => `<button type="button" class="opc-btn" data-i="${i}">${esc(o)}</button>`).join('')}</div></div></div>
      <div class="br-paso br-p2 apagado"><div class="br-n">2</div><div><b>Observá.</b> Mové el control y mirá qué pasa con los dos músculos.
        <label class="br-ctrl"><span>Extendido</span><input type="range" min="0" max="100" value="0" disabled aria-label="Doblar el codo"><span>Doblado</span></label>
        <div class="br-estado" aria-live="polite"></div></div></div>
      <div class="br-paso br-p3 apagado"><div class="br-n">3</div><div><b>Lo que comprobaste.</b> <span class="br-exp"></span></div></div>
    </div></div>`);
  const raiz = w.firstElementChild, sl = raiz.querySelector('input'), est = raiz.querySelector('.br-estado');
  const ante = raiz.querySelector('#br-ante'), bic = raiz.querySelector('#br-bic'), tri = raiz.querySelector('#br-tri');
  let fueArriba = false, fueAbajo = false, listo = !!resuelto;
  const E = [205, 560], O_B = [140, 170], O_T = [272, 196];
  const rot = (p, a) => { const r = a * Math.PI / 180, c = Math.cos(r), s = Math.sin(r); return [E[0] + p[0] * c - p[1] * s, E[1] + p[0] * s + p[1] * c]; };
  const musculo = (g, O, I, grosor, ancho, alto) => {
    const dx = I[0] - O[0], dy = I[1] - O[1], L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
    g.setAttribute('transform', `translate(${O[0]} ${O[1]}) rotate(${ang.toFixed(2)}) scale(${(L / ancho).toFixed(4)} ${(grosor / alto).toFixed(4)})`);
    return [(O[0] + I[0]) / 2, (O[1] + I[1]) / 2];
  };
  const rotulo = (id, lin, [x, y], [lx, ly], estado) => {
    raiz.querySelector(id).querySelector('.br-est').textContent = estado;
    raiz.querySelector(lin).setAttribute('d', `M${lx} ${ly} L${x.toFixed(1)} ${y.toFixed(1)}`);
  };
  const poner = v => {
    const c = v / 100, a = c * 130;   // grados de flexión del codo
    ante.setAttribute('transform', `rotate(${a.toFixed(2)} ${E[0]} ${E[1]})`);
    const mb = musculo(bic, O_B, rot([-28, 70], a), 84 + 52 * c, 533, 153);
    const mt = musculo(tri, O_T, rot([58, -10], a), 112 - 42 * c, 621, 217);
    rotulo('#br-rb', '#br-lb', mb, [92, 138], c > 0.5 ? 'se contrae' : c < 0.15 ? 'se relaja' : '');
    rotulo('#br-rt', '#br-lt', mt, [335, 408], c > 0.5 ? 'se relaja' : c < 0.15 ? 'se contrae' : '');
    raiz.querySelector('#br-rb').classList.toggle('activo', c > 0.5); raiz.querySelector('#br-rt').classList.toggle('activo', c < 0.15);
    est.innerHTML = c > 0.6 ? md(b.estados.doblado) : c < 0.1 ? md(b.estados.extendido) : '';
    if (c > 0.85) fueArriba = true;
    if (fueArriba && c < 0.1) fueAbajo = true;
    if (fueArriba && fueAbajo && !listo) terminar(true);
  };
  const terminar = nuevo => {
    listo = true; raiz.querySelector('.br-p3').classList.remove('apagado');
    raiz.querySelector('.br-exp').innerHTML = md(b.explicacion);
    if (nuevo) { raiz.classList.add('resuelto'); marcar(); }
  };
  raiz.querySelectorAll('.br-p1 .opc-btn').forEach(x => x.onclick = () => {
    raiz.querySelectorAll('.br-p1 .opc-btn').forEach(y => { y.disabled = true; y.classList.toggle('bien', +y.dataset.i === P.correcta); });
    if (+x.dataset.i !== P.correcta) x.classList.add('mal');
    raiz.querySelector('.br-p1 .opc-lista').insertAdjacentHTML('afterend', `<p class="br-nota">${+x.dataset.i === P.correcta ? '¡Buena predicción! Ahora comprobalo.' : 'Guardá tu respuesta en la cabeza y comprobá qué pasa.'}</p>`);
    raiz.querySelector('.br-p2').classList.remove('apagado'); sl.disabled = false; sl.focus({ preventScroll: true });
  });
  sl.oninput = () => poner(+sl.value);
  poner(0);
  if (resuelto) { raiz.querySelectorAll('.br-p1 .opc-btn').forEach(y => { y.disabled = true; y.classList.toggle('bien', +y.dataset.i === P.correcta); });
    raiz.querySelector('.br-p2').classList.remove('apagado'); sl.disabled = false; terminar(false); }
  return true;
}
function dibujoBrazo(im) {
  // piezas ilustradas: brazo (306 × 645), antebrazo (220 × 641), bíceps (533 × 153) y tríceps (621 × 217)
  return `<svg viewBox="-340 0 860 1180" xmlns="http://www.w3.org/2000/svg" role="img">
    <g id="br-ante"><image href="${im.ante}" x="${205 - 75}" y="${560 - 45}" width="220" height="641"/></g>
    <image href="${im.sup}" x="0" y="0" width="306" height="645"/>
    <g id="br-tri"><image href="${im.tri}" x="0" y="-108.5" width="621" height="217"/></g>
    <g id="br-bic"><image href="${im.bic}" x="0" y="-76.5" width="533" height="153"/></g>
    <path class="br-lin" id="br-lb" d=""/><path class="br-lin" id="br-lt" d=""/><g class="br-rot" id="br-rb" transform="translate(80 150)"><text class="br-nom" text-anchor="end">Bíceps</text><text class="br-est" dy="44" text-anchor="end"></text></g>
    <g class="br-rot" id="br-rt" transform="translate(345 420)"><text class="br-nom">Tríceps</text><text class="br-est" dy="44"></text></g>
    <text x="-320" y="40" class="br-lado">adelante</text><text x="510" y="40" text-anchor="end" class="br-lado">atrás</text>
  </svg>`;
}

// ------------------------------------------------------------------ Etapas: un dibujo animado que se recorre paso a paso
export function bEtapas(w, b, resuelto, marcar) {
  const n = b.etapas.length;
  w.innerHTML = caja('etapas', '🎬 Paso a paso', b, resuelto, `<div class="et-cols"><div class="et-dibujo"><div class="m3d-cargando">Cargando el dibujo…</div></div>
    <div class="et-panel"><div class="vj-cont"><span class="et-n"></span><div class="vj-puntos">${b.etapas.map(() => '<i></i>').join('')}</div></div>
    <h4 class="et-tit"></h4><p class="et-txt" aria-live="polite"></p>
    <div class="acciones"><button type="button" class="btn chico suave et-ant">Anterior</button><button type="button" class="btn chico et-sig">Siguiente</button></div></div></div>`);
  const raiz = w.firstElementChild, dib = raiz.querySelector('.et-dibujo');
  let i = 0, visto = new Set();
  const ir = k => {
    i = Math.max(0, Math.min(n - 1, k)); visto.add(i);
    const sv = dib.querySelector('svg'); if (sv) { sv.setAttribute('data-etapa', String(i + 1)); sv.classList.toggle('quieto', quieto()); }
    raiz.querySelector('.et-n').textContent = `Paso ${i + 1} de ${n}`;
    raiz.querySelectorAll('.vj-puntos i').forEach((p, k2) => p.className = k2 < i ? 'ya' : k2 === i ? 'ahora' : '');
    raiz.querySelector('.et-tit').textContent = b.etapas[i].titulo;
    raiz.querySelector('.et-txt').innerHTML = md(b.etapas[i].texto);
    raiz.querySelector('.et-ant').disabled = i === 0;
    raiz.querySelector('.et-sig').textContent = i === n - 1 ? 'Volver a empezar' : 'Siguiente';
    if (visto.size === n && !raiz.classList.contains('resuelto')) { raiz.classList.add('resuelto'); marcar(); }
  };
  raiz.querySelector('.et-ant').onclick = () => ir(i - 1);
  raiz.querySelector('.et-sig').onclick = () => ir(i === n - 1 ? 0 : i + 1);
  fetch(b.svg).then(r => r.text()).then(t => { dib.innerHTML = t; ir(0); }).catch(() => { dib.textContent = b.alt || ''; ir(0); });
  return !!b.cuenta;   // por defecto es un recurso para mirar, no una actividad
}

// ------------------------------------------------------------------ Dilema: una situación con decisiones y qué pasa con cada una
export function bDilema(w, b, resuelto, marcar) {
  w.innerHTML = caja('dilema', '🧭 ¿Qué harías?', b, resuelto, `<div class="dl-situacion">${md(b.situacion)}</div>
    <div class="dl-ops">${b.opciones.map((o, i) => `<button type="button" class="dl-op" data-i="${i}"><span class="dl-letra">${'ABCD'[i]}</span>${esc(o.texto)}</button>`).join('')}</div>
    <div class="dl-res" aria-live="polite"></div>`);
  const raiz = w.firstElementChild, res = raiz.querySelector('.dl-res'), vistas = new Set();
  raiz.querySelectorAll('.dl-op').forEach(x => x.onclick = () => {
    const o = b.opciones[+x.dataset.i]; vistas.add(+x.dataset.i);
    raiz.querySelectorAll('.dl-op').forEach(y => y.classList.remove('elegida')); x.classList.add('elegida', o.adecuada ? 'bien' : 'revisar');
    res.innerHTML = `<div class="dl-cons ${o.adecuada ? 'ok' : 'mal'}"><b>${o.adecuada ? 'Puede ayudar.' : 'Pensalo de nuevo.'}</b> ${md(o.consecuencia)}</div>
      ${o.adecuada ? `<p class="dl-cierre">${md(b.cierre)}</p>` : '<p class="ayuda">Probá con otra opción.</p>'}`;
    if (o.adecuada && !raiz.classList.contains('resuelto')) { raiz.classList.add('resuelto'); marcar(); }
  });
  return true;
}

// ------------------------------------------------------------------ Historieta de debate: varios personajes, una idea correcta
const CARAS = [
  ['#7A4A2A', '#F2C9A8', 'M-22 -14 C-24 -36 24 -36 22 -14 C18 -24 -18 -24 -22 -14Z'],
  ['#1F1B2E', '#C98D63', 'M-24 -10 C-28 -40 28 -40 24 -10 C26 6 22 20 18 24 L18 -6 C8 -18 -8 -18 -18 -6 L-18 24 C-22 20 -26 6 -24 -10Z'],
  ['#B5562B', '#F5D3BC', 'M-22 -12 C-22 -34 22 -34 22 -12 C14 -20 -4 -22 -22 -12Z'],
  ['#3B2A20', '#8E5B3E', 'M-21 -16 C-18 -34 18 -34 21 -16 C12 -22 -12 -22 -21 -16Z'],
];
function cara(k, color) {
  const [pelo, piel, d] = CARAS[k % CARAS.length];
  return `<svg viewBox="-34 -40 68 80" class="hi-cara" aria-hidden="true"><path d="M-30 40 C-30 18 30 18 30 40Z" fill="${color}"/><circle r="22" fill="${piel}"/>
    <path d="${d}" fill="${pelo}"/><circle cx="-8" cy="0" r="2.6" fill="#1B1A4A"/><circle cx="8" cy="0" r="2.6" fill="#1B1A4A"/><path d="M-7 9 Q0 14 7 9" stroke="#1B1A4A" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
}
export function bHistorieta(w, b, resuelto, marcar) {
  const cols = ['#5B2A86', '#1F9D6B', '#E8641B', '#4B4FA3'];
  w.innerHTML = caja('historieta', '💬 Historieta de debate', b, resuelto, `<p class="hi-aviso">Personajes inventados.</p><div class="hi-situacion">${md(b.situacion)}</div>
    <div class="hi-vinetas">${b.personajes.map((p, i) => `<div class="hi-p${p.img ? ' con-retrato' : ''}" data-i="${i}" style="--c:${p.color || cols[i % 4]}">${p.img ? `<img class="hi-retrato" src="${p.img}" alt="${esc(p.nombre)}, personaje inventado">` : cara(i, cols[i % 4])}<div class="hi-globo"><b>${esc(p.nombre)}</b>${md(p.dice)}</div></div>`).join('')}</div>
    <div class="consigna hi-preg">${md(b.pregunta)}</div>
    <div class="opc-lista">${b.personajes.map((p, i) => `<button type="button" class="opc-btn" data-i="${i}">${esc(p.nombre)}</button>`).join('')}</div><div class="fbz"></div>`);
  const raiz = w.firstElementChild, fb = raiz.querySelector('.fbz');
  const fin = nuevo => { raiz.querySelectorAll('.opc-btn').forEach(y => { y.disabled = true; y.classList.toggle('bien', +y.dataset.i === b.correcta); });
    raiz.querySelector(`.hi-p[data-i="${b.correcta}"]`).classList.add('razon');
    fb.innerHTML = `<div class="fb ok"><b>Tiene razón ${esc(b.personajes[b.correcta].nombre)}.</b> ${md(b.explicacion)}</div>`; if (nuevo) { raiz.classList.add('resuelto'); marcar(); } };
  raiz.querySelectorAll('.opc-btn').forEach(x => x.onclick = () => {
    if (+x.dataset.i === b.correcta) return fin(true);
    x.classList.add('mal'); x.disabled = true;
    fb.innerHTML = `<div class="fb mal"><b>${esc(b.personajes[+x.dataset.i].nombre)} se confunde.</b> ${md(b.personajes[+x.dataset.i].por_que || b.pista)}</div>`;
  });
  if (resuelto) fin(false);
  return true;
}

// ------------------------------------------------------------------ Simulador de la glucosa en sangre
export function bSimulador(w, b, resuelto, marcar) {
  const P = b.prediccion;
  const organos = b.organos || [{ id: 'pancreas', nombre: 'Páncreas' }, { id: 'higado', nombre: 'Hígado' }];
  const W = 460, H = 250, X0 = 52, X1 = 446, Yp = g => 214 - g * 1.75;   // g: 0 a 110 (normal entre 39 y 74)
  w.innerHTML = caja('simulador', '🧪 Simulador', b, resuelto, `
    <div class="sm-cols"><div class="sm-izq">
      <div class="sm-graf-caja">
        <div class="sm-cab"><span>Glucosa en la sangre</span><b class="sm-estado normal">Normal</b></div>
        <svg class="sm-graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico del nivel de glucosa en la sangre a lo largo del tiempo">
          <defs><linearGradient id="sm-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B83A7A" stop-opacity=".16"/><stop offset="1" stop-color="#B83A7A" stop-opacity="0"/></linearGradient>
            <linearGradient id="sm-banda" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#DDF3E7"/><stop offset="1" stop-color="#EAF8F0"/></linearGradient></defs>
          ${[0, 1, 2, 3, 4].map(k => `<line x1="${X0}" y1="${Yp(k * 27.5)}" x2="${X1}" y2="${Yp(k * 27.5)}" stroke="#EEEAF7"/>`).join('')}
          <rect x="${X0}" y="${Yp(74)}" width="${X1 - X0}" height="${Yp(39) - Yp(74)}" fill="url(#sm-banda)"/>
          <line x1="${X0}" y1="${Yp(74)}" x2="${X1}" y2="${Yp(74)}" stroke="#7CC9A0" stroke-dasharray="5 5"/><line x1="${X0}" y1="${Yp(39)}" x2="${X1}" y2="${Yp(39)}" stroke="#7CC9A0" stroke-dasharray="5 5"/>
          <text x="${X1 - 8}" y="${Yp(74) + 16}" text-anchor="end" class="sm-t-normal">nivel normal</text>
          <text x="${X0 - 8}" y="${Yp(98) + 4}" text-anchor="end" class="sm-t-eje">alta</text><text x="${X0 - 8}" y="${Yp(56) + 4}" text-anchor="end" class="sm-t-eje">normal</text><text x="${X0 - 8}" y="${Yp(14) + 4}" text-anchor="end" class="sm-t-eje">baja</text>
          <text x="${(X0 + X1) / 2}" y="${H - 6}" text-anchor="middle" class="sm-t-eje">tiempo →</text>
          <g class="sm-marcas"></g>
          <path class="sm-relleno" fill="url(#sm-area)" d=""/>
          <path class="sm-linea" fill="none" stroke="#B83A7A" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" d=""/>
          <circle class="sm-halo" r="13" fill="#B83A7A" opacity=".18"/><circle class="sm-punto" r="6.5" fill="#B83A7A" stroke="#fff" stroke-width="2.5"/>
        </svg>
      </div>
      <div class="sm-organos">${organos.map(o => `<div class="sm-org" data-o="${o.id}">
        <div class="sm-org-dib">${o.img ? `<img src="${o.img}" alt="">` : ''}<span class="sm-part"></span><span class="sm-part"></span><span class="sm-part"></span><span class="sm-part"></span></div>
        <div class="sm-org-txt"><span>${esc(o.nombre)}</span><b class="sm-hor"></b></div></div>`).join('')}</div>
      <div class="sm-relato" aria-live="polite"></div>
    </div><div class="sm-der">
      <div class="sm-pred"><b>Antes de empezar, predecí:</b> ${md(P.pregunta)}<div class="opc-lista">${P.opciones.map((o, i) => `<button type="button" class="opc-btn" data-i="${i}">${esc(o)}</button>`).join('')}</div></div>
      <div class="sm-botones apagado">${b.acciones.map((a, i) => `<button type="button" class="sm-acc" data-i="${i}" disabled><span class="sm-acc-ic">${a.icono || '▶'}</span>${esc(a.boton)}</button>`).join('')}</div>
    </div></div>`);
  const raiz = w.firstElementChild, linea = raiz.querySelector('.sm-linea'), relleno = raiz.querySelector('.sm-relleno'), punto = raiz.querySelector('.sm-punto'),
    halo = raiz.querySelector('.sm-halo'), relato = raiz.querySelector('.sm-relato'), estado = raiz.querySelector('.sm-estado'), marcas = raiz.querySelector('.sm-marcas');
  let pts = [], g = 56, t = 0, ocupado = false, hechas = new Set();
  const suave = ps => ps.length < 2 ? '' : ps.reduce((d, [x, y], i) => {
    if (!i) return `M${x} ${y}`;
    const [x0, y0] = ps[i - 1], mx = (x0 + x) / 2;
    return d + ` Q${x0} ${y0} ${mx.toFixed(1)} ${((y0 + y) / 2).toFixed(1)}`;
  }, '') + ` L${ps[ps.length - 1][0]} ${ps[ps.length - 1][1]}`;
  const dibujar = () => {
    const d = suave(pts); linea.setAttribute('d', d);
    const [x, y] = pts[pts.length - 1] || [X0, Yp(g)];
    relleno.setAttribute('d', pts.length > 1 ? `${d} L${x} ${Yp(0)} L${pts[0][0]} ${Yp(0)} Z` : '');
    punto.setAttribute('cx', x); punto.setAttribute('cy', y); halo.setAttribute('cx', x); halo.setAttribute('cy', y);
    const n = g > 74 ? ['alta', 'Alta'] : g < 39 ? ['baja', 'Baja'] : ['normal', 'Normal'];
    estado.className = 'sm-estado ' + n[0]; estado.textContent = n[1];
  };
  const reiniciarSiHaceFalta = () => { if (t > X1 - X0 - 130) { pts = [[X0, Yp(g)]]; t = 0; marcas.innerHTML = ''; } };
  const avanzar = (destino, pasos, alTerminar) => {
    const ini = g, rapido = quieto(); let k = 0;
    const paso = () => {
      k++; const u = k / pasos; g = ini + (destino - ini) * (u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2); t += 2.6;
      pts.push([X0 + t, Yp(g)]); dibujar();
      if (k < pasos) setTimeout(paso, rapido ? 0 : 40); else alTerminar?.();
    };
    paso();
  };
  const marca = (texto, clase) => {
    const x = X0 + t;
    marcas.insertAdjacentHTML('beforeend', `<g class="sm-marca ${clase}"><line x1="${x}" y1="22" x2="${x}" y2="${Yp(0)}" stroke-dasharray="3 4"/><rect x="${x - 40}" y="8" width="80" height="20" rx="10"/><text x="${x}" y="22" text-anchor="middle">${esc(texto)}</text></g>`);
  };
  const tipo = txt => /insulina/i.test(txt) ? (/no /i.test(txt) ? 'falta' : 'insulina') : /glucag/i.test(txt) ? 'glucagon' : /guarda/i.test(txt) ? 'guarda' : /libera/i.test(txt) ? 'libera' : '';
  const encender = (o, txt) => { const el = raiz.querySelector(`.sm-org[data-o="${o}"]`); if (!el) return; el.className = 'sm-org activo ' + tipo(txt); el.querySelector('b').textContent = txt; };
  const apagar = () => raiz.querySelectorAll('.sm-org').forEach(el => { el.className = 'sm-org'; el.querySelector('b').textContent = ''; });
  const correr = a => {
    if (ocupado) return; ocupado = true; raiz.querySelectorAll('.sm-acc').forEach(x => { x.disabled = true; x.classList.toggle('elegido', x.dataset.i === String(b.acciones.indexOf(a))); });
    apagar(); reiniciarSiHaceFalta();
    if (window.innerWidth <= 700) raiz.querySelector('.sm-graf-caja').scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'start' });
    relato.innerHTML = `<p class="sm-paso"><span>1</span><span>${md(a.paso1)}</span></p>`;
    avanzar(a.pico, 22, () => {
      if (a.hormona) { encender(a.organo, a.hormona); if (a.organo2) encender(a.organo2, a.hormona2);
        const tp = tipo(a.hormona); marca(tp === 'insulina' ? 'insulina' : tp === 'glucagon' ? 'glucagón' : 'sin insulina', tp); }
      relato.insertAdjacentHTML('beforeend', `<p class="sm-paso"><span>2</span><span>${md(a.paso2)}</span></p>`);
      avanzar(a.final, 32, () => {
        relato.insertAdjacentHTML('beforeend', `<p class="sm-paso sm-concl"><span>3</span><span>${md(a.paso3)}</span></p>`);
        ocupado = false; raiz.querySelectorAll('.sm-acc').forEach(x => x.disabled = false); hechas.add(a.boton);
        if (hechas.size >= Math.min(2, b.acciones.length) && !raiz.classList.contains('resuelto')) { raiz.classList.add('resuelto'); marcar(); relato.insertAdjacentHTML('beforeend', `<div class="fb ok"><b>Lo que comprobaste:</b> ${md(b.explicacion)}</div>`); }
      });
    });
  };
  raiz.querySelectorAll('.sm-pred .opc-btn').forEach(x => x.onclick = () => {
    raiz.querySelectorAll('.sm-pred .opc-btn').forEach(y => { y.disabled = true; y.classList.toggle('bien', +y.dataset.i === P.correcta); });
    if (+x.dataset.i !== P.correcta) x.classList.add('mal');
    raiz.querySelector('.sm-botones').classList.remove('apagado'); raiz.querySelectorAll('.sm-acc').forEach(y => y.disabled = false);
    relato.innerHTML = `<p class="ayuda">${+x.dataset.i === P.correcta ? '¡Buena predicción!' : 'Fijate si se cumple tu predicción.'} Ahora elegí qué hace la persona.</p>`;
  });
  raiz.querySelectorAll('.sm-acc').forEach(x => x.onclick = () => correr(b.acciones[+x.dataset.i]));
  pts = [[X0, Yp(g)]]; dibujar();
  if (resuelto) { raiz.querySelectorAll('.sm-pred .opc-btn').forEach(y => { y.disabled = true; y.classList.toggle('bien', +y.dataset.i === P.correcta); });
    raiz.querySelector('.sm-botones').classList.remove('apagado'); raiz.querySelectorAll('.sm-acc').forEach(y => y.disabled = false); }
  pantallaCompleta(raiz);
  return true;
}
