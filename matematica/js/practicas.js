// ACOMPAÑAMIENTO PEDAGÓGICO · prácticas interactivas de Matemática (sin IA).
//  · "Ubicá en la recta" (t: 'recta', modo: 'ubicar'): todos los números a la vista; se arrastran a la recta en cualquier orden
//    (o se toca uno y después la recta).
//    Cada ficha está bien si queda dentro de su tramo (entre: [a, b], sin los extremos).
//  · "Acotá en la recta" (t: 'recta', modo: 'acotar'): se tocan las dos marcas consecutivas entre las que está un número.
//  · Simulador con objetivo (t: 'sim' con "objetivo"): el estudiante mueve los controles hasta lograr lo que pide la consigna.
// Todo funciona con toques (celular) y con teclado; no depende del mouse.
import { esc, md } from './estado.js';
import { montarSim } from './simulaciones.js';

const coma = (v, dec) => v.toFixed(dec).replace('.', ',');
const decimalesDe = paso => { const s = String(paso); return s.includes('.') ? s.split('.')[1].length : 0; };
const cerca = (a, b) => Math.abs(a - b) < 1e-9;

/* ---------------- Recta numérica ---------------- */
export function bRecta(w, b, resuelto, marcar) {
  return b.modo === 'acotar' ? rectaAcotar(w, b, resuelto, marcar) : rectaUbicar(w, b, resuelto, marcar);
}

function marcasHTML(b, { botones = false } = {}) {
  const dec = decimalesDe(b.paso), n = Math.round((b.max - b.min) / b.paso);
  const cada = b.rotulos_cada || 1;   // cada cuántas marcas se escribe el número
  let h = '';
  for (let k = 0; k <= n; k++) {
    const v = b.min + k * b.paso, x = (k / n) * 100;
    const rot = k % cada === 0 || k === n ? `<span class="rn-rot ${k === 0 || k === n ? 'ext' : ''}">${coma(v, dec)}</span>` : '';
    h += botones
      ? `<button type="button" class="rn-marca rn-boton" data-k="${k}" style="left:${x}%" aria-label="${coma(v, dec)}"><i></i>${rot}</button>`
      : `<span class="rn-marca" style="left:${x}%"><i></i>${rot}</span>`;
  }
  return h;
}

function rectaUbicar(w, b, resuelto, marcar) {
  const sub = b.sub || b.paso / 4;
  const pos = {};            // ficha → valor donde quedó
  let elegida = null, fallos = 0, bloqueado = !!resuelto;
  w.innerHTML = `<div class="interactivo rn ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || '📍 Ubicá en la recta')}</div><div class="consigna">${md(b.consigna)}</div>
    <p class="instr-act">👆 Arrastrá cada número hasta su lugar en la recta, en el orden que quieras. También podés tocar el número y después la recta.</p>
    <div class="rn-fichas banco-fichas"></div>
    <div class="rn-zona" tabindex="0" aria-label="Recta numérica de ${esc(String(b.min))} a ${esc(String(b.max))}"><div class="rn-pines"></div><div class="rn-linea"></div>${marcasHTML(b)}</div>
    <div class="acciones"><button class="btn chico" id="cmp">Comprobar</button></div><div class="fbz"></div></div>`;
  const zona = w.querySelector('.rn-zona'), fichasEl = w.querySelector('.rn-fichas'), pines = w.querySelector('.rn-pines'), fb = w.querySelector('.fbz');
  const valorEn = clientX => {
    const r = zona.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    return Math.round((b.min + f * (b.max - b.min)) / sub) * sub;
  };
  const sobreLaRecta = (x, y) => { const r = zona.getBoundingClientRect(); return x >= r.left - 20 && x <= r.right + 20 && y >= r.top && y <= r.bottom + 10; };
  // Arrastrar con el dedo o el mouse. Si casi no se mueve, cuenta como un toque (elegir).
  const arrastrable = (el, i) => {
    el.addEventListener('pointerdown', ev => {
      if (bloqueado) return;
      const x0 = ev.clientX, y0 = ev.clientY; let fantasma = null;
      el.setPointerCapture?.(ev.pointerId);
      const mover = e => {
        if (!fantasma && Math.hypot(e.clientX - x0, e.clientY - y0) < 6) return;
        if (!fantasma) { fantasma = el.cloneNode(true); fantasma.className = 'ficha ficha-fantasma'; document.body.appendChild(fantasma); el.classList.add('arrastrando'); }
        fantasma.style.left = e.clientX + 'px'; fantasma.style.top = e.clientY + 'px';
      };
      const soltar = e => {
        el.removeEventListener('pointermove', mover); el.removeEventListener('pointerup', soltar); el.removeEventListener('pointercancel', soltar);
        if (!fantasma) { elegida = elegida === i ? null : i; fb.innerHTML = ''; pintar(); return; }   // fue un toque
        fantasma.remove(); el.classList.remove('arrastrando');
        if (sobreLaRecta(e.clientX, e.clientY)) pos[i] = valorEn(e.clientX);
        else delete pos[i];                       // soltado fuera de la recta: vuelve arriba
        elegida = null; fb.innerHTML = ''; pintar();
      };
      el.addEventListener('pointermove', mover); el.addEventListener('pointerup', soltar); el.addEventListener('pointercancel', soltar);
    });
  };
  const pintar = (marcas = {}) => {
    const libres = b.items.map((_, i) => i).filter(i => pos[i] === undefined);
    fichasEl.innerHTML = libres.map(i => `<button type="button" class="ficha rn-ficha ${elegida === i ? 'elegida' : ''}" data-i="${i}">${esc(b.items[i].texto)}</button>`).join('')
      || (bloqueado ? '' : '<span class="ayuda" style="padding:6px">¡Ubicaste todos! Ahora tocá "Comprobar".</span>');
    fichasEl.style.display = bloqueado && !libres.length ? 'none' : '';
    // pines: cada uno va en el renglón más bajo donde no se pisa con otro (hasta 3 renglones)
    const orden = Object.keys(pos).map(Number).sort((a, c) => pos[a] - pos[c]);
    const ancho = zona.clientWidth || 600, finDe = [-1e9, -1e9, -1e9];
    pines.innerHTML = orden.map(i => {
      const x = (pos[i] - b.min) / (b.max - b.min) * 100, px = x / 100 * ancho;
      const medio = (b.items[i].texto.length * 10 + 30) / 2 + 4;
      let nivel = finDe.findIndex(f => px - medio > f); if (nivel === -1) nivel = 2;
      finDe[nivel] = px + medio;
      return `<button type="button" class="rn-pin n${nivel} ${marcas[i] || ''} ${elegida === i ? 'elegida' : ''}" data-i="${i}" style="left:${x}%" ${bloqueado ? 'disabled' : ''}>${esc(b.items[i].texto)}</button>`;
    }).join('');
    fichasEl.querySelectorAll('.rn-ficha').forEach(f => arrastrable(f, +f.dataset.i));
    pines.querySelectorAll('.rn-pin').forEach(p => { p.addEventListener('click', ev => ev.stopPropagation()); arrastrable(p, +p.dataset.i); });
  };
  zona.addEventListener('click', ev => {
    if (bloqueado) return;
    if (elegida === null) { fb.innerHTML = '<div class="fb aviso">Arrastrá un número hasta la recta, o tocalo y después tocá la recta.</div>'; return; }
    pos[elegida] = valorEn(ev.clientX); elegida = null; fb.innerHTML = ''; pintar();
  });
  // teclado: con un número elegido, las flechas lo mueven sobre la recta
  zona.addEventListener('keydown', ev => {
    if (bloqueado || elegida === null || !['ArrowLeft', 'ArrowRight'].includes(ev.key)) return;
    ev.preventDefault();
    const v = pos[elegida] ?? (b.min + b.max) / 2;
    pos[elegida] = Math.min(b.max, Math.max(b.min, v + (ev.key === 'ArrowRight' ? sub : -sub))); pintar();
  });
  w.querySelector('#cmp').onclick = () => {
    if (b.items.some((_, i) => pos[i] === undefined)) { fb.innerHTML = '<div class="fb aviso">Todavía faltan números por ubicar: ponelos todos antes de comprobar.</div>'; return; }
    const marcas = {}; let bien = 0;
    b.items.forEach((it, i) => { const ok = pos[i] > it.entre[0] + 1e-9 && pos[i] < it.entre[1] - 1e-9; marcas[i] = ok ? 'bien' : 'mal'; if (ok) bien++; });
    if (bien === b.items.length) {
      bloqueado = true; elegida = null; pintar(marcas); w.querySelector('#cmp').disabled = true; w.firstChild.classList.add('resuelto');
      fb.innerHTML = `<div class="fb ok"><b>¡Bien!</b> ${md(b.explicacion || '')}</div>`; marcar();
    } else {
      fallos++; pintar(marcas);
      fb.innerHTML = `<div class="fb mal"><b>Ya ubicaste ${bien} de ${b.items.length}.</b> Los marcados en rojo van en otro tramo de la recta: arrastralos a su lugar. ${fallos >= 2 && b.pista ? md(b.pista) : md(b.pista1 || 'Volvé a leer el material y probá de nuevo.')}</div>`;
    }
  };
  if (resuelto) {
    b.items.forEach((it, i) => { pos[i] = (it.entre[0] + it.entre[1]) / 2; });
    pintar(Object.fromEntries(b.items.map((_, i) => [i, 'bien']))); w.querySelector('#cmp').disabled = true;
    fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`;
  } else pintar();
  return true;
}

function rectaAcotar(w, b, resuelto, marcar) {
  const dec = decimalesDe(b.paso), n = Math.round((b.max - b.min) / b.paso);
  const kAbajo = Math.floor((b.valor - b.min) / b.paso + 1e-9);
  const sel = new Set(); let fallos = 0;
  w.innerHTML = `<div class="interactivo rn ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || '📍 Acotá en la recta')}</div><div class="consigna">${md(b.consigna)}</div>
    <p class="instr-act">👆 Tocá las dos marcas de la recta entre las que está el número. Para cambiar una, tocala otra vez.</p>
    <div class="rn-zona rn-acotar"><div class="rn-linea"></div><div class="rn-tramo" hidden></div><div class="rn-punto" hidden><span>${esc(b.nombre || '')}</span></div>${marcasHTML(b, { botones: true })}</div>
    <p class="ayuda rn-elegidas"></p>
    <div class="acciones"><button class="btn chico" id="cmp">Comprobar</button></div><div class="fbz"></div></div>`;
  const zona = w.querySelector('.rn-zona'), fb = w.querySelector('.fbz'), info = w.querySelector('.rn-elegidas');
  const valor = k => coma(b.min + k * b.paso, dec);
  const pintar = () => {
    zona.querySelectorAll('.rn-boton').forEach(x => x.classList.toggle('elegida', sel.has(+x.dataset.k)));
    const ks = [...sel].sort((a, c) => a - c);
    info.textContent = ks.length ? `Elegiste: ${ks.map(valor).join(' y ')}.` : '';
  };
  const mostrarSolucion = () => {
    const x0 = kAbajo / n * 100, xv = (b.valor - b.min) / (b.max - b.min) * 100;
    const tramo = zona.querySelector('.rn-tramo'), punto = zona.querySelector('.rn-punto');
    tramo.hidden = false; tramo.style.left = x0 + '%'; tramo.style.width = (xv - x0) + '%';
    punto.hidden = false; punto.style.left = xv + '%';
    zona.querySelectorAll('.rn-boton').forEach(x => { x.disabled = true; x.classList.toggle('bien', +x.dataset.k === kAbajo || +x.dataset.k === kAbajo + 1); x.classList.remove('elegida', 'mal'); });
    info.textContent = '';
  };
  zona.querySelectorAll('.rn-boton').forEach(x => x.onclick = () => {
    const k = +x.dataset.k; fb.innerHTML = '';
    zona.querySelectorAll('.rn-boton.mal').forEach(m => m.classList.remove('mal'));
    if (sel.has(k)) sel.delete(k); else { if (sel.size === 2) sel.delete([...sel][0]); sel.add(k); }
    pintar();
  });
  w.querySelector('#cmp').onclick = () => {
    if (sel.size < 2) { fb.innerHTML = '<div class="fb aviso">Elegí dos marcas antes de comprobar.</div>'; return; }
    const [a, c] = [...sel].sort((x, y) => x - y);
    if (a === kAbajo && c === kAbajo + 1) {
      mostrarSolucion(); w.querySelector('#cmp').disabled = true; w.firstChild.classList.add('resuelto');
      fb.innerHTML = `<div class="fb ok"><b>¡Bien!</b> ${md(b.explicacion || '')}</div>`; marcar();
    } else {
      fallos++;
      zona.querySelectorAll('.rn-boton.elegida').forEach(m => m.classList.add('mal'));
      const msg = c - a !== 1 ? 'Las dos marcas tienen que estar una al lado de la otra.' : (fallos >= 2 && b.pista ? md(b.pista) : md(b.pista1 || 'Mirá otra vez las cifras del número.'));
      fb.innerHTML = `<div class="fb mal"><b>Seguí buscando.</b> ${msg}</div>`;
    }
  };
  if (resuelto) { mostrarSolucion(); w.querySelector('#cmp').disabled = true; fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`; }
  return true;
}

/* ---------------- Simulador con objetivo ---------------- */
// objetivo: { cumple: {clave: valor}, cerca: {clave: valor}, mensaje_cerca, tolerancia }
// Cada simulador informa su estado (números, textos o verdadero/falso). Un valor puede ser un número,
// un texto, un booleano o un rango [mínimo, máximo]. Se logra cuando el estado cumple todo lo de "cumple".
// Si cumple lo de "cerca" (pero no el objetivo), se muestra mensaje_cerca para orientar.
const coincide = (est, cond, tol) => Object.entries(cond || {}).every(([k, v]) => {
  const x = est[k];
  if (Array.isArray(v)) return typeof x === 'number' && x >= v[0] - tol && x <= v[1] + tol;
  if (typeof v === 'number') return typeof x === 'number' && Math.abs(x - v) <= tol;
  return x === v;
});
export function bSimObjetivo(w, b, resuelto, marcar) {
  const o = b.objetivo, tol = o.tolerancia ?? 1e-6;
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || '🎛️ Probá y descubrí')}</div><div class="consigna">${md(b.consigna)}</div>
    <div class="sim-host"></div><div class="fbz"></div></div>`;
  const fb = w.querySelector('.fbz');
  let logrado = !!resuelto;
  if (resuelto) fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`;
  let primera = true;   // el primer aviso es el dibujo inicial: no cuenta como intento
  montarSim(w.querySelector('.sim-host'), { ...b, alCambiar: est => {
    if (primera) { primera = false; return; }
    if (logrado) return;
    if (coincide(est, o.cumple, tol)) {
      logrado = true; w.firstChild.classList.add('resuelto');
      fb.innerHTML = `<div class="fb ok"><b>¡Bien!</b> ${md(b.explicacion || '')}</div>`; marcar();
    } else if (o.cerca && coincide(est, o.cerca, tol)) fb.innerHTML = `<div class="fb aviso">${md(o.mensaje_cerca || 'Vas por buen camino. Seguí moviendo los controles.')}</div>`;
    else fb.innerHTML = '';
  } });
  return true;
}
