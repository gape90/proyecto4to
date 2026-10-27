// TUTORÍAS VIRTUALES · motor de cápsulas
// Cada cápsula: enseña, hace practicar, pide registrar en la carpeta (primero en pantalla con aprobación, después en papel)
// y, al terminar, habilita los juegos de práctica. Nada se envía al docente.
import { leer, guardar, capsula, capHecha, progresoClase, esc, md, norm, consignaHTML, diccionarioTildes } from './estado.js';
import { corregir, hayIA, pedirClave } from './ia.js';
import { AJUSTES } from './config.js';
import { montarSim } from './simulaciones.js';
import { juegosPara, abrirJuego } from './juegos.js';

const parr = s => (s || '').split(/\n\n+/).map(p => `<p>${md(p)}</p>`).join('');
const mezclar = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const num = s => { const t = String(s).trim().replace(/\s+/g, '').replace(',', '.'); return /^-?\d*\.?\d+(e-?\d+)?$/i.test(t) ? Number(t) : NaN; };

// Textos que enseña la cápsula (sirven para detectar si el alumno copió textual en vez de escribir con sus palabras)
export function textosDe(bloques = []) {
  const out = [];
  for (const b of bloques) {
    ['texto', 'respuesta', 'explicacion'].forEach(k => b[k] && out.push(b[k]));
    (b.eventos || []).forEach(v => out.push(`${v.titulo}. ${v.texto}`));
    (b.pasos || []).forEach(p => out.push(p.texto));
    (b.filas || []).forEach(f => out.push(f.join(' ')));
  }
  return out;
}

// Guía de preguntas de la carpeta (o el modelo viejo, si no hay preguntas)
export function guiaHTML(cfg) {
  if (cfg.guia?.length) return `<div class="guia"><b>Preguntas que te ayudan a armar tu texto:</b><ul>${cfg.guia.map(q => `<li>${md(q)}</li>`).join('')}</ul></div>`;
  if (cfg.modelo) return `<div class="guia"><b>Cómo podés organizarlo:</b><br>${md(cfg.modelo)}</div>`;
  return '';
}

export function montarClase(root, clase) {
  let e = leer();
  let actual = 0;
  const ultimaPendiente = clase.capsulas.findIndex(c => !capHecha(e, clase.id, c.id));
  actual = ultimaPendiente === -1 ? 0 : ultimaPendiente;
  const diccionario = diccionarioTildes(clase);
  const esMate = clase.espacio === 'matematica';

  const guardarE = () => guardar(e);
  const disponible = i => i === 0 || capHecha(e, clase.id, clase.capsulas[i - 1].id);

  function pintar() {
    e = leer();
    const p = progresoClase(e, clase);
    root.innerHTML = `
      <div class="clase-cab"><div class="eje-nombre">${esc(clase.eje)}</div>
        <h1>${esc(clase.titulo)}</h1><p>${esc(clase.intro || '')}</p>
        <div class="barra" style="background:rgba(255,255,255,.35);max-width:100%"><i style="width:${p.pct}%;background:#fff"></i></div></div>
      <div class="tabs-caps" role="tablist">${clase.capsulas.map((c, i) => {
        const h = capHecha(e, clase.id, c.id), d = disponible(i);
        return `<button class="tab-cap ${i === actual ? 'activa' : ''} ${h ? 'hecha' : ''} ${d ? '' : 'bloq'}" data-i="${i}" ${d ? '' : 'disabled'} role="tab">${h ? '✓' : d ? (i + 1) : '🔒'} ${esc(c.titulo)}</button>`;
      }).join('')}${p.pct === 100 ? `<button class="tab-cap ${actual === 'cierre' ? 'activa' : ''}" data-i="cierre">🎓 Cierre</button>` : ''}</div>
      <div id="cap"></div>`;
    root.querySelectorAll('.tab-cap').forEach(b => b.onclick = () => { actual = b.dataset.i === 'cierre' ? 'cierre' : +b.dataset.i; pintar(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    if (actual === 'cierre') cierre(root.querySelector('#cap')); else capsulaUI(root.querySelector('#cap'), actual);
  }

  /* ---------- una cápsula ---------- */
  function capsulaUI(host, i) {
    const cap = clase.capsulas[i];
    const est = capsula(e, clase.id, cap.id);
    host.innerHTML = `<div class="tarjeta">
      <div class="capsula-titulo"><div class="chip-icono">${i + 1}</div><div><h2 style="margin:0">${esc(cap.titulo)}</h2><span class="tiempo">${esc(cap.tiempo || '')}</span></div></div>
      <div class="subrayado"></div><div class="bloques"></div>
      <div class="carpeta-zona"></div></div>
      <div class="juegos-zona"></div><div class="nav-zona"></div>`;
    const bh = host.querySelector('.bloques');
    const interactivos = [];
    (cap.bloques || []).forEach((b, k) => {
      const w = document.createElement('div'); w.className = 'bloque'; bh.appendChild(w);
      const resuelto = !!est.bloques?.[k];
      const marcar = () => {
        e = leer(); const c2 = capsula(e, clase.id, cap.id);
        if (c2.bloques[k]) return;
        c2.bloques[k] = true; guardarE();
        actualizarCandado();
      };
      const cuenta = renderBloque(w, b, { resuelto, marcar });
      if (cuenta) interactivos.push(k);
    });

    const carpetaHost = host.querySelector('.carpeta-zona');
    function actualizarCandado() {
      const e2 = leer(); const c2 = capsula(e2, clase.id, cap.id);
      const falta = interactivos.filter(k => !c2.bloques?.[k]).length;
      carpetaUI(carpetaHost, cap, falta, () => { pintarFinales(); });
    }
    function pintarFinales() {
      const e2 = leer();
      const hecha = capHecha(e2, clase.id, cap.id);
      juegosUI(host.querySelector('.juegos-zona'), cap, i, hecha);
      const nav = host.querySelector('.nav-zona');
      if (hecha) {
        const ult = i === clase.capsulas.length - 1;
        nav.innerHTML = `<div class="acciones no-print">${ult
          ? `<button class="btn" id="sig">Ir al cierre de la clase →</button>`
          : `<button class="btn" id="sig">Siguiente cápsula →</button>`}</div>`;
        nav.querySelector('#sig').onclick = () => { actual = ult ? 'cierre' : i + 1; pintar(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        const tabs = root.querySelectorAll('.tab-cap');
        tabs.forEach((t, n) => { if (n === i) { t.classList.add('hecha'); t.textContent = '✓ ' + cap.titulo; } if (n === i + 1 && !ult) { t.disabled = false; t.classList.remove('bloq'); t.textContent = (n + 1) + ' ' + clase.capsulas[n].titulo; } });
        const p = progresoClase(e2, clase); root.querySelector('.clase-cab .barra i').style.width = p.pct + '%';
        if (ult && !root.querySelector('[data-i="cierre"]')) {
          const b = document.createElement('button'); b.className = 'tab-cap'; b.dataset.i = 'cierre'; b.textContent = '🎓 Cierre';
          b.onclick = () => { actual = 'cierre'; pintar(); }; root.querySelector('.tabs-caps').appendChild(b);
        }
      } else nav.innerHTML = '';
    }
    actualizarCandado(); pintarFinales();
  }

  /* ---------- carpeta ---------- */
  function carpetaUI(host, cap, falta, alCambiar) {
    const cp = cap.carpeta; if (!cp) { host.innerHTML = ''; return; }
    e = leer(); const est = capsula(e, clase.id, cap.id);
    if (falta > 0) {
      host.innerHTML = `<div class="carpeta bloqueada"><p class="aviso-bloqueo"><span>🔒</span><span>Para desbloquear tu carpeta, resolvé las actividades de esta cápsula.<small>Te ${falta === 1 ? 'falta 1 actividad' : `faltan ${falta} actividades`}: están arriba, con fondo blanco. Las que ya resolviste quedan en verde.</small></span></p></div>`;
      return;
    }
    const aprobado = est.estado === 'ok' || est.estado === 'duda';
    host.innerHTML = `<div class="carpeta">
      <h3>📒 ${esc(cp.titulo || 'Anotá en tu carpeta')}</h3>
      ${consignaHTML(cp.instruccion)}
      ${guiaHTML(cp)}
      <textarea id="txt" placeholder="Escribilo con tus palabras…" ${aprobado ? 'readonly' : ''}>${esc(est.texto || '')}</textarea>
      <div class="acciones"><button class="btn" id="corr" ${aprobado ? 'disabled' : ''}>Corregir</button>
        <button class="btn sec chico oculto" id="duda">Tengo una duda: seguir igual</button></div>
      <div class="fb-zona" id="fbc"></div>
      <div class="copiado oculto" id="cop"><input type="checkbox" id="chk" ${est.copiado ? 'checked' : ''}><label for="chk">Ya lo copié en mi carpeta</label></div></div>`;
    const q = s => host.querySelector(s);
    const mostrarFin = () => {
      q('#cop').classList.remove('oculto');
      if (est.estado === 'duda') q('#fbc').innerHTML = `<div class="fb aviso"><span class="duda-tag">Duda para febrero</span> Anotá esta parte en tu carpeta como duda y consultala con tu docente en las clases de consulta.</div>`;
    };
    if (aprobado) {
      if (est.estado === 'ok') q('#fbc').innerHTML = `<div class="fb ok"><b>✔</b> ${esc(est.devolucion || 'Aprobado.')}</div>`;
      mostrarFin();
    } else if ((est.intentos || 0) >= AJUSTES.INTENTOS_PARA_DUDA) q('#duda').classList.remove('oculto');

    q('#chk').onchange = ev => { e = leer(); capsula(e, clase.id, cap.id).copiado = ev.target.checked; guardarE(); alCambiar(); };
    q('#corr').onclick = async () => {
      const t = q('#txt').value.trim();
      if (!t) { q('#fbc').innerHTML = '<div class="fb aviso">Escribí tu respuesta primero.</div>'; return; }
      q('#corr').disabled = true; q('#fbc').innerHTML = '<div class="fb info">Revisando…</div>';
      const r = await corregir({
        consigna: cp.instruccion, respuesta: t, referencia: cp.referencia || '', claves: cp.claves || [],
        contexto: `${clase.titulo} — ${cap.titulo}`, minPalabras: cp.minPalabras ?? (esMate ? 0 : AJUSTES.MIN_PALABRAS),
        diccionario, fuentes: textosDe(cap.bloques),
      });
      e = leer(); const c2 = capsula(e, clase.id, cap.id);
      c2.texto = t; c2.titulo = cap.titulo;
      if (r.ok) { c2.estado = 'ok'; c2.devolucion = r.mensaje; guardarE(); carpetaUI(host, cap, 0, alCambiar); alCambiar(); return; }
      c2.intentos = (c2.intentos || 0) + 1; guardarE();
      q('#fbc').innerHTML = `<div class="fb mal"><b>Todavía no.</b> ${esc(r.mensaje)}</div>`;
      q('#corr').disabled = false;
      if (c2.intentos >= AJUSTES.INTENTOS_PARA_DUDA) q('#duda').classList.remove('oculto');
    };
    q('#duda').onclick = () => {
      const t = q('#txt').value.trim();
      e = leer(); const c2 = capsula(e, clase.id, cap.id);
      c2.estado = 'duda'; c2.texto = t; c2.titulo = cap.titulo; c2.duda = 'Revisar con el docente'; guardarE();
      carpetaUI(host, cap, 0, alCambiar); alCambiar();
    };
  }

  /* ---------- juegos ---------- */
  function juegosUI(host, cap, i, hecha) {
    const lista = juegosPara(cap, clase.id, i);
    if (!lista.length) { host.innerHTML = ''; return; }
    host.innerHTML = `<div class="juegos-panel ${hecha ? '' : 'bloq'}"><h3>🎮 Practicá con juegos</h3>
      <p class="ayuda" style="margin:0">${hecha ? 'Terminaste la cápsula: jugá para fijar lo aprendido. No es obligatorio, pero ayuda mucho.' : 'Los juegos se habilitan cuando terminás esta cápsula: carpeta aprobada y la casilla «Ya lo copié en mi carpeta» marcada.'}</p>
      <div class="juegos-grid">${lista.map(j => `<button class="juego-card" data-j="${j.id}" ${hecha ? '' : 'disabled'}><span class="ic">${hecha ? j.icono : '🔒'}</span>${j.nombre}<small>${j.desc}</small></button>`).join('')}</div></div>`;
    host.querySelectorAll('.juego-card').forEach(b => b.onclick = () => {
      abrirJuego(b.dataset.j, cap, {
        onFin: (t, p) => { e = leer(); const c = capsula(e, clase.id, cap.id); c.juegos ??= {}; c.juegos[t] = Math.max(c.juegos[t] || 0, p); guardarE(); },
      });
    });
  }

  /* ---------- cierre de la clase ---------- */
  function cierre(host) {
    e = leer();
    const textos = clase.capsulas.map(c => ({ t: c.titulo, x: e.clases[clase.id]?.caps?.[c.id]?.texto, d: e.clases[clase.id]?.caps?.[c.id]?.estado === 'duda' }));
    host.innerHTML = `<div class="tarjeta"><div class="titulo-seccion"><div class="chip-icono">🎓</div><h2>Cierre de la clase</h2></div><div class="subrayado"></div>
      <p><b>¡Terminaste "${esc(clase.titulo)}"!</b> ${esc(clase.tp_aporte || '')}</p>
      ${(clase.vocabulario || []).length ? `<h3>Vocabulario para agregar en tu carpeta</h3><div class="tabla-wrap"><table class="tabla-comp"><tr><th>Palabra</th><th>Qué significa</th></tr>${clase.vocabulario.map(v => `<tr><td><b>${esc(v.palabra)}</b></td><td>${md(v.definicion)}</td></tr>`).join('')}</table></div>` : ''}
      ${(clase.errores_frecuentes || []).length ? `<h3 style="margin-top:20px">Errores frecuentes</h3>${clase.errores_frecuentes.map(x => `<div class="fb mal" style="margin-bottom:8px"><b>✗ ${md(x.error)}</b><br>✓ ${md(x.aclaracion)}</div>`).join('')}` : ''}
      ${clase.para_ir_mas_alla ? `<div class="destacado" style="margin-top:20px"><h4>Para ir más allá</h4><p>${md(clase.para_ir_mas_alla.pregunta)}</p>${clase.para_ir_mas_alla.conexion ? `<p class="ayuda">${md(clase.para_ir_mas_alla.conexion)}</p>` : ''}</div>` : ''}
    </div>
    <div class="tarjeta"><h3>📒 Lo que escribiste en esta clase</h3><p class="ayuda">Usalo para revisar que tengas todo en tu carpeta. Lo que quedó marcado como duda aparece en rojo: anotalo igual para consultarlo.</p>
      ${textos.map(t => `<div class="cierre-texto ${t.d ? 'duda' : ''}"><h4>${esc(t.t)} ${t.d ? '<span class="duda-tag">duda</span>' : ''}</h4><div style="white-space:pre-wrap">${esc(t.x || '')}</div></div>`).join('')}
      <div class="acciones no-print"><button class="btn sec" onclick="window.print()">🖨️ Imprimir</button><a class="btn" href="recorrido.html">Volver a mi recorrido →</a></div></div>`;
  }

  pintar();
}

/* ---------- bloques ---------- */
// devuelve true si el bloque es interactivo y cuenta para habilitar la carpeta
export function renderBloque(w, b, { resuelto, marcar }) {
  switch (b.t) {
    case 'texto': w.innerHTML = (b.titulo ? `<h3>${esc(b.titulo)}</h3>` : '') + parr(b.texto); return false;
    case 'destacado': w.innerHTML = `<div class="destacado"><h4>${esc(b.titulo || 'Para recordar')}</h4>${parr(b.texto)}</div>`; return false;
    case 'ejemplo': w.innerHTML = `<div class="ejemplo"><h4 style="margin:0 0 4px">${esc(b.titulo || 'Ejemplo')}</h4>${parr(b.texto)}</div>`; return false;
    case 'dato': w.innerHTML = `<div class="dato"><span class="ic">💡</span><div><b>${esc(b.titulo || 'Dato curioso')}</b><br>${md(b.texto)}</div></div>`; return false;
    case 'cita': w.innerHTML = `<div class="cita"><div class="etq">${esc(b.etiqueta || 'Fuente')}</div><blockquote>“${md(b.texto)}”</blockquote><cite>${md(b.autor || '')}${b.contexto ? ' · ' + md(b.contexto) : ''}</cite></div>`; return false;
    case 'ecuacion': w.innerHTML = `${b.titulo ? `<div class="etq">${esc(b.titulo)}</div>` : ''}<div class="ecuacion">${esc(b.formula)}</div>${b.texto ? `<p class="ayuda">${md(b.texto)}</p>` : ''}`; return false;
    case 'comparar': w.innerHTML = `${b.titulo ? `<h3>${esc(b.titulo)}</h3>` : ''}<div class="tabla-wrap"><table class="tabla-comp"><tr>${b.columnas.map(c => `<th>${esc(c)}</th>`).join('')}</tr>${b.filas.map(f => `<tr>${f.map(c => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</table></div>`; return false;
    case 'linea': w.innerHTML = `${b.titulo ? `<h3>${esc(b.titulo)}</h3>` : ''}<div class="linea">${b.eventos.map(v => `<div class="ev"><div class="anio">${esc(v.anio)}</div><h4>${esc(v.titulo)}</h4><p>${md(v.texto)}</p></div>`).join('')}</div>`; return false;
    case 'sim': w.innerHTML = ''; montarSim(w, b); return false;
    case 'pasos': return bPasos(w, b, resuelto, marcar);
    case 'revelar': return bRevelar(w, b, resuelto, marcar);
    case 'opcion': return bOpcion(w, b, resuelto, marcar);
    case 'verificar': return bVerificar(w, b, resuelto, marcar);
    case 'clasificar': return bClasificar(w, b, resuelto, marcar);
    case 'ordenar': return bOrdenar(w, b, resuelto, marcar);
    default: w.innerHTML = ''; return false;
  }
}

function bPasos(w, b, resuelto, marcar) {
  let n = resuelto ? b.pasos.length : 0;
  const pintar = () => {
    w.innerHTML = `<div class="interactivo ${n >= b.pasos.length ? 'resuelto' : ''}"><div class="etq">Paso a paso</div><h3>${esc(b.titulo || '')}</h3>
      ${b.pasos.slice(0, n).map((p, i) => `<div class="ejemplo" style="margin-bottom:8px"><b>${i + 1}. ${esc(p.titulo || '')}</b><br>${md(p.texto)}</div>`).join('')}
      ${n < b.pasos.length ? `<button class="btn chico" id="mas">${n ? 'Siguiente paso' : 'Ver el primer paso'}</button>` : ''}</div>`;
    w.querySelector('#mas')?.addEventListener('click', () => { n++; pintar(); if (n >= b.pasos.length) marcar(); });
  };
  pintar(); return true;
}
function bRevelar(w, b, resuelto, marcar) {
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">Pensalo antes de mirar</div><div class="consigna">${md(b.pregunta)}</div>
    <button class="btn chico suave" id="rv">${resuelto ? 'Ocultar respuesta' : 'Ya lo pensé: mostrar respuesta'}</button><div class="revelado ${resuelto ? '' : 'oculto'}">${md(b.respuesta)}</div></div>`;
  const r = w.querySelector('.revelado'), btn = w.querySelector('#rv');
  btn.onclick = () => { const v = r.classList.toggle('oculto'); btn.textContent = v ? 'Ya lo pensé: mostrar respuesta' : 'Ocultar respuesta'; if (!v) { w.firstChild.classList.add('resuelto'); marcar(); } };
  return true;
}
function bOpcion(w, b, resuelto, marcar) {
  const orden = b.fijo ? b.opciones.map((_, i) => i) : mezclar(b.opciones.map((_, i) => i));
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || 'Chequeá')}</div><div class="consigna">${md(b.pregunta)}</div>
    <div class="opc-lista">${orden.map(i => `<button class="opc-btn" data-i="${i}">${md(b.opciones[i])}</button>`).join('')}</div><div class="fbz"></div></div>`;
  const fb = w.querySelector('.fbz');
  const bien = () => { w.querySelectorAll('.opc-btn').forEach(x => { x.disabled = true; if (+x.dataset.i === b.correcta) x.classList.add('bien'); }); w.firstChild.classList.add('resuelto'); };
  if (resuelto) { bien(); fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`; }
  w.querySelectorAll('.opc-btn').forEach(x => x.onclick = () => {
    if (+x.dataset.i === b.correcta) { bien(); fb.innerHTML = `<div class="fb ok"><b>¡Eso es!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else { x.classList.add('mal'); x.disabled = true; fb.innerHTML = `<div class="fb mal"><b>Esa no.</b> ${md(b.pista || 'Releé la cápsula y probá con otra.')}</div>`; }
  });
  return true;
}
function bVerificar(w, b, resuelto, marcar) {
  let fallos = 0;
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || 'Resolvé')}</div><div class="consigna">${md(b.consigna)}</div>
    <div class="inline"><input type="text" id="r" placeholder="${esc(b.placeholder || 'Tu respuesta')}" autocomplete="off" ${resuelto ? 'disabled' : ''}><button class="btn chico" id="ok" ${resuelto ? 'disabled' : ''}>Comprobar</button></div><div class="fbz"></div></div>`;
  const fb = w.querySelector('.fbz'), inp = w.querySelector('#r');
  if (resuelto) fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`;
  const comprobar = () => {
    const v = inp.value.trim(); if (!v) return;
    const tol = b.tolerancia ?? 1e-6;
    const acepta = (b.acepta ?? [b.respuesta]).map(String);
    const nv = num(v);
    const ok = acepta.some(a => { const na = num(a); return !isNaN(na) && !isNaN(nv) ? Math.abs(na - nv) <= tol : norm(a).replace(/\s/g, '') === norm(v).replace(/\s/g, ''); });
    if (ok) { inp.disabled = true; w.querySelector('#ok').disabled = true; w.firstChild.classList.add('resuelto'); fb.innerHTML = `<div class="fb ok"><b>¡Correcto!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else { fallos++; fb.innerHTML = `<div class="fb mal"><b>No es eso.</b> ${fallos >= 2 && b.pista ? md(b.pista) : (b.pista1 ? md(b.pista1) : 'Releé la cápsula y probá otra vez.')}</div>`; }
  };
  w.querySelector('#ok').onclick = comprobar; inp.onkeydown = ev => { if (ev.key === 'Enter') comprobar(); };
  return true;
}

/* Arrastrar con mouse o con el dedo (pointer events: funciona en compu, celular y dentro de Moodle) */
function arrastrable(el, { alSoltar, zonas }) {
  el.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    ev.preventDefault();
    const fant = el.cloneNode(true); fant.classList.add('ficha-fantasma'); fant.style.width = el.offsetWidth + 'px';
    document.body.appendChild(fant); el.classList.add('arrastrando');
    let sobre = null;
    const zonaEn = (x, y) => document.elementFromPoint(x, y)?.closest('[data-drop]');
    const mover = e2 => {
      fant.style.left = e2.clientX + 'px'; fant.style.top = e2.clientY + 'px';
      const z = zonaEn(e2.clientX, e2.clientY);
      if (z !== sobre) { sobre?.classList.remove('sobre'); z?.classList.add('sobre'); sobre = z; }
      if (e2.clientY < 50) window.scrollBy(0, -12); else if (e2.clientY > window.innerHeight - 50) window.scrollBy(0, 12);
    };
    const fin = e2 => {
      window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', fin); window.removeEventListener('pointercancel', fin);
      fant.remove(); el.classList.remove('arrastrando'); sobre?.classList.remove('sobre');
      alSoltar(e2.type === 'pointercancel' ? null : zonaEn(e2.clientX, e2.clientY));
    };
    mover(ev);
    window.addEventListener('pointermove', mover); window.addEventListener('pointerup', fin); window.addEventListener('pointercancel', fin);
  });
  // Teclado: Enter o espacio lleva la ficha a la siguiente categoría
  el.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); alSoltar('siguiente'); } });
}

function bClasificar(w, b, resuelto, marcar) {
  const fichas = mezclar(b.items.map((it, i) => ({ ...it, i })));
  const asign = {};
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">Clasificá</div><div class="consigna">${md(b.consigna)}</div>
    <p class="instr-act">✋ Arrastrá cada ficha hasta el recuadro que corresponde. Si te equivocás, volvé a arrastrarla a otro recuadro.</p>
    <div class="banco-fichas" data-drop="banco"></div><div class="clasif">${b.categorias.map((c, k) => `<div class="zona" data-drop="${k}"><h5>${esc(c)}</h5><div class="cont"></div></div>`).join('')}</div>
    <div class="acciones"><button class="btn chico" id="cmp">Comprobar</button></div><div class="fbz"></div></div>`;
  const banco = w.querySelector('.banco-fichas'), fb = w.querySelector('.fbz');
  let bloqueado = !!resuelto;
  const pintar = (marcas = {}) => {
    banco.innerHTML = ''; w.querySelectorAll('.zona .cont').forEach(z => z.innerHTML = '');
    fichas.forEach(f => {
      const s = document.createElement('span'); s.className = 'ficha' + (marcas[f.i] ? ' ' + marcas[f.i] : ''); s.textContent = f.texto; s.tabIndex = 0;
      if (!bloqueado) arrastrable(s, {
        alSoltar: z => {
          if (z === 'siguiente') { const a = asign[f.i]; asign[f.i] = a === undefined ? 0 : a + 1; if (asign[f.i] >= b.categorias.length) delete asign[f.i]; }
          else if (!z) return;
          else if (z.dataset.drop === 'banco') delete asign[f.i];
          else asign[f.i] = +z.dataset.drop;
          fb.innerHTML = ''; pintar();
        },
      });
      (asign[f.i] === undefined ? banco : w.querySelector(`.zona[data-drop="${asign[f.i]}"] .cont`)).appendChild(s);
    });
    if (!banco.children.length && !bloqueado) banco.innerHTML = '<span class="ayuda" style="padding:6px">¡Ubicaste todas! Ahora tocá «Comprobar».</span>';
  };
  w.querySelector('#cmp').onclick = () => {
    if (Object.keys(asign).length < fichas.length) { fb.innerHTML = '<div class="fb aviso">Todavía quedan fichas arriba: arrastralas todas a un recuadro antes de comprobar.</div>'; return; }
    const marcas = {}; let mal = 0;
    fichas.forEach(f => { const ok = b.categorias[asign[f.i]] === f.cat; marcas[f.i] = ok ? 'bien' : 'mal'; if (!ok) mal++; });
    if (!mal) { bloqueado = true; pintar(marcas); w.firstChild.classList.add('resuelto'); w.querySelector('#cmp').disabled = true; fb.innerHTML = `<div class="fb ok"><b>¡Todo bien!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else { pintar(marcas); fb.innerHTML = `<div class="fb mal">Hay ${mal} ficha${mal > 1 ? 's' : ''} mal ubicada${mal > 1 ? 's' : ''} (en rojo). Releé la cápsula y arrastrala${mal > 1 ? 's' : ''} a otro recuadro.</div>`; }
  };
  if (resuelto) { fichas.forEach(f => asign[f.i] = b.categorias.indexOf(f.cat)); pintar(); w.querySelector('#cmp').disabled = true; fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`; }
  else pintar();
  return true;
}
function bOrdenar(w, b, resuelto, marcar) {
  let lista = b.items.map((t, i) => ({ t, i }));
  if (!resuelto) { do lista = mezclar(lista); while (lista.every((x, k) => x.i === k) && lista.length > 1); }
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">Ordená</div><div class="consigna">${md(b.consigna)}</div>
    <p class="instr-act">↕ Movés cada elemento con las flechas ↑ y ↓. Si no te acordás, volvé a leer la cápsula.</p><div class="lista"></div>
    <div class="acciones"><button class="btn chico" id="cmp" ${resuelto ? 'disabled' : ''}>Comprobar orden</button></div><div class="fbz"></div></div>`;
  const cont = w.querySelector('.lista'), fb = w.querySelector('.fbz');
  let fallos = 0;
  const pintar = () => {
    cont.innerHTML = lista.map((x, k) => `<div class="ordenar-item"><span>${md(x.t)}</span>${resuelto ? '' : `<button data-a="${k}" data-d="-1" aria-label="Subir">↑</button><button data-a="${k}" data-d="1" aria-label="Bajar">↓</button>`}</div>`).join('');
    cont.querySelectorAll('button').forEach(bt => bt.onclick = () => {
      const k = +bt.dataset.a, d = +bt.dataset.d, j = k + d; if (j < 0 || j >= lista.length) return;
      [lista[k], lista[j]] = [lista[j], lista[k]]; pintar();
    });
  };
  pintar();
  w.querySelector('#cmp').onclick = () => {
    const ok = lista.every((x, k) => x.i === k);
    if (ok) { resuelto = true; pintar(); w.querySelector('#cmp').disabled = true; w.firstChild.classList.add('resuelto'); fb.innerHTML = `<div class="fb ok"><b>¡Orden correcto!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else { fallos++; const bien = lista.filter((x, k) => x.i === k).length; fb.innerHTML = `<div class="fb mal">Hay ${bien} de ${lista.length} en su lugar. ${fallos >= 2 && b.pista ? md(b.pista) : 'Volvé a leer la cápsula y probá de nuevo.'}</div>`; }
  };
  if (resuelto) { lista = b.items.map((t, i) => ({ t, i })); pintar(); fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`; }
  return true;
}
