// TUTORÍAS VIRTUALES · motor de cápsulas
// Cada cápsula: enseña, hace practicar, pide hacer la actividad en la carpeta de papel (la corrige el docente)
// y, al terminar, habilita los juegos de práctica. Nada se envía al docente.
import { leer, guardar, capsula, capHecha, progresoClase, esc, md, norm, consignaHTML, plano, hayLMS, revelarDe } from './estado.js';
import { AJUSTES } from './config.js';
import { montarSim } from './simulaciones.js';
import { bPronunciar, bDictado } from './pronunciar.js';
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
    (b.pares || []).forEach(x => out.push(`${x.a} ${x.b}`));
  }
  return out;
}

// Guía de preguntas de la carpeta (o el modelo viejo, si no hay preguntas)
export const NOTA_DOCENTE = `<p class="nota-docente">✍️ Recordá copiar esta actividad en tu carpeta para que la corrija tu docente. La revisión de esta página te ayuda a mejorar tu texto, pero quien te va a confirmar si está correcto es tu profesor o profesora.</p>`;

export function guiaHTML(cfg) {
  if (cfg.guia?.length) return `<div class="guia"><b>Preguntas que te ayudan a armar tu texto:</b><ul>${cfg.guia.map(q => `<li>${md(q)}</li>`).join('')}</ul>
    <p class="guia-nota">Las preguntas son una guía: no las contestes una por una. Escribí un texto con oraciones completas, que se conecten entre sí y se entiendan de principio a fin.</p></div>`;
  if (cfg.modelo) return `<div class="guia"><b>Cómo podés organizarlo:</b><br>${md(cfg.modelo)}</div>`;
  return '';
}

// Inglés: cuando la consigna la da el personaje, se muestra su carita y su nombre al lado
function hablaPersonaje(w, p) {
  const c = w.querySelector('.consigna, h3, .pregunta, .titulo, b') || w.firstElementChild;
  if (!c) return;
  const cara = document.createElement('span'); cara.className = 'pj-dice';
  cara.innerHTML = `<img src="${p.img}" alt=""><span>${esc(p.nombre)}</span>`;
  w.classList.add('habla-pj');
  c.parentNode.insertBefore(cara, c);
}
export function montarClase(root, clase, { personaje = null } = {}) {
  let e = leer();
  let actual = 0;
  const ultimaPendiente = clase.capsulas.findIndex(c => !capHecha(e, clase.id, c.id));
  actual = ultimaPendiente === -1 ? 0 : ultimaPendiente;
  // partes terminadas pero falta la autoevaluación: se abre directo en el cierre, donde está
  { const p0 = progresoClase(e, clase); if (p0.partesListas && p0.conAutoev && !p0.autoev) actual = 'cierre'; }
  const esMate = clase.espacio === 'matematica';

  const guardarE = () => guardar(e);
  // Avisa al asistente qué parte se ve en pantalla, para que solo ofrezca los temas de esa parte
  const contexto = parte => { document.body.dataset.capsula = `${clase.id}|${parte}`; document.dispatchEvent(new Event('capsula')); };
  const disponible = i => i === 0 || AJUSTES.MODO_PRUEBA || capHecha(e, clase.id, clase.capsulas[i - 1].id);

  function pintar() {
    e = leer();
    const p = progresoClase(e, clase);
    root.innerHTML = `
      <div class="clase-cab"><div class="eje-nombre">${esc(clase.eje)}</div>
        <h1>${esc(clase.titulo)}</h1><p>${esc(clase.intro || '')}</p>
        ${personaje && clase.personaje_intro ? `<div class="pj-banda"><img src="${personaje.img}" alt="${esc(personaje.alt || personaje.nombre)}"><p>${md(clase.personaje_intro.texto || clase.personaje_intro)}</p></div>` : ''}
        ${(clase.objetivos || []).length ? `<div class="objetivos"><b>Al terminar esta clase vas a poder:</b><ul>${clase.objetivos.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>` : ''}
        <div class="barra" style="background:rgba(255,255,255,.35);max-width:100%"><i style="width:${p.pct}%;background:#fff"></i></div></div>
      <div class="tabs-caps" role="tablist">${clase.capsulas.map((c, i) => {
        const h = capHecha(e, clase.id, c.id), d = disponible(i);
        return `<button class="tab-cap ${i === actual ? 'activa' : ''} ${h ? 'hecha' : ''} ${d ? '' : 'bloq'}" data-i="${i}" ${d ? '' : 'disabled'} role="tab">${h ? '✓' : d ? (i + 1) : '🔒'} ${esc(c.titulo)}</button>`;
      }).join('')}${(p.partesListas || AJUSTES.MODO_PRUEBA) ? `<button class="tab-cap ${actual === 'cierre' ? 'activa' : ''} ${p.autoev ? 'hecha' : ''}" data-i="cierre">${p.autoev ? '✓' : '🎓'} Cierre</button>` : ''}</div>
      <div id="cap"></div>`;
    root.querySelectorAll('.tab-cap').forEach(b => b.onclick = () => { actual = b.dataset.i === 'cierre' ? 'cierre' : +b.dataset.i; pintar(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    if (actual === 'cierre') cierre(root.querySelector('#cap')); else capsulaUI(root.querySelector('#cap'), actual);
  }

  /* ---------- una cápsula ---------- */
  function capsulaUI(host, i) {
    const cap = clase.capsulas[i];
    contexto(cap.id);
    const est = capsula(e, clase.id, cap.id);
    host.innerHTML = `<div class="tarjeta">
      <div class="capsula-titulo"><div class="chip-icono">${i + 1}</div><div><h2 style="margin:0">${esc(cap.titulo)}</h2><span class="tiempo">${esc(cap.tiempo || '')}</span></div></div>
      <div class="subrayado"></div>
      <div class="bloques"></div>
      <div class="carpeta-zona"></div></div>
      <div class="juegos-zona"></div><div class="nav-zona"></div>`;
    const bh = host.querySelector('.bloques');
    const interactivos = [];
    (cap.bloques || []).forEach((b, i) => {
      const w = document.createElement('div'); w.className = 'bloque'; bh.appendChild(w);
      // El avance se guarda con una clave propia de cada actividad (tipo + su texto), no con su posición:
      // así, si se agrega o se mueve una actividad, el avance guardado no se le pasa a otra.
      const k = claveBloque(b, i);
      const resuelto = !!est.bloques?.[k];
      const marcar = () => {
        e = leer(); const c2 = capsula(e, clase.id, cap.id);
        if (c2.bloques[k]) return;
        c2.bloques[k] = true; guardarE();
        actualizarCandado();
      };
      const cuenta = renderBloque(w, b, { resuelto, marcar });
      if (b.habla && personaje) hablaPersonaje(w, personaje);
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
      const libre = hecha || AJUSTES.MODO_PRUEBA;
      juegosUI(host.querySelector('.juegos-zona'), cap, i, libre);
      const nav = host.querySelector('.nav-zona');
      if (libre) {
        const ult = i === clase.capsulas.length - 1;
        nav.innerHTML = `<div class="acciones no-print">${ult
          ? `<button class="btn" id="sig">Ir al cierre de la clase →</button>`
          : `<button class="btn" id="sig">Siguiente parte →</button>`}</div>`;
        nav.querySelector('#sig').onclick = () => { actual = ult ? 'cierre' : i + 1; pintar(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
        const tabs = root.querySelectorAll('.tab-cap');
        tabs.forEach((t, n) => { if (n === i && hecha) { t.classList.add('hecha'); t.textContent = '✓ ' + cap.titulo; } if (n === i + 1 && !ult) { t.disabled = false; t.classList.remove('bloq'); if (!capHecha(e2, clase.id, clase.capsulas[n].id)) t.textContent = (n + 1) + ' ' + clase.capsulas[n].titulo; } });
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
  // La actividad de la carpeta se hace en la carpeta de papel y la corrige el docente: acá solo se muestra la consigna.
  function carpetaUI(host, cap, falta, alCambiar) {
    const cp = cap.carpeta; if (!cp) { host.innerHTML = ''; return; }
    e = leer(); const est = capsula(e, clase.id, cap.id);
    if (falta > 0 && !AJUSTES.MODO_PRUEBA) {
      host.innerHTML = `<div class="carpeta bloqueada"><p class="aviso-bloqueo"><span>🔒</span><span>Para desbloquear la última sección, "Tu carpeta", resolvé las actividades propuestas.<small>Te ${falta === 1 ? 'falta 1 actividad' : `faltan ${falta} actividades`}: están arriba, con fondo blanco. Las que ya resolviste quedan en verde.</small></span></p></div>`;
      return;
    }
    host.innerHTML = `<div class="carpeta">
      <h3>📒 Tu carpeta</h3>
      <p class="carpeta-intro">Esta actividad la hacés en tu carpeta, con tus palabras. Tu profesor o profesora la va a corregir.</p>
      ${cp.habla && personaje ? `<span class="pj-dice"><img src="${personaje.img}" alt=""><span>${esc(personaje.nombre)}</span></span>` : ''}
      ${consignaHTML(cp.instruccion)}
      ${guiaHTML(cp)}
      <div class="copiado" id="cop"><input type="checkbox" id="chk" ${est.copiado ? 'checked' : ''}><label for="chk">Ya lo escribí en mi carpeta</label></div></div>`;
    host.querySelector('#chk').onchange = ev => { e = leer(); capsula(e, clase.id, cap.id).copiado = ev.target.checked; guardarE(); alCambiar(); };
  }

  /* ---------- juegos ---------- */
  function juegosUI(host, cap, i, hecha) {
    const lista = juegosPara(cap, clase.id, i);
    if (!lista.length) { host.innerHTML = ''; return; }
    host.innerHTML = `<div class="juegos-panel ${hecha ? '' : 'bloq'}"><h3>🎮 Practicá con juegos</h3>
      <p class="ayuda" style="margin:0">${hecha ? 'Terminaste esta parte: jugá para fijar lo aprendido. No es obligatorio, pero ayuda mucho.' : 'Los juegos se habilitan cuando terminás esta parte: actividades resueltas y la casilla "Ya lo escribí en mi carpeta" marcada.'}</p>
      <div class="juegos-grid">${lista.map(j => `<button class="juego-card" data-j="${j.id}" ${hecha ? '' : 'disabled'}><span class="ic">${hecha ? j.icono : '🔒'}</span>${j.nombre}<small>${j.desc}</small></button>`).join('')}</div></div>`;
    host.querySelectorAll('.juego-card').forEach(b => b.onclick = () => {
      abrirJuego(b.dataset.j, cap, {
        onFin: (t, p) => { e = leer(); const c = capsula(e, clase.id, cap.id); c.juegos ??= {}; c.juegos[t] = Math.max(c.juegos[t] || 0, p); guardarE(); },
      });
    });
  }

  /* ---------- cierre de la clase ---------- */
  function cierre(host) {
    contexto('cierre');
    e = leer();
    host.innerHTML = `<div class="tarjeta"><div class="titulo-seccion"><div class="chip-icono">🎓</div><h2>Cierre de la clase</h2></div><div class="subrayado"></div>
      <p><b>¡Terminaste "${esc(clase.titulo)}"!</b> ${esc(clase.tp_aporte || '')}</p>
      ${(clase.vocabulario || []).length ? `<h3>🔑 Mis palabras clave</h3><p class="ayuda">Copialas en tu carpeta, con su significado.</p><div class="tabla-wrap"><table class="tabla-comp"><tr><th>Palabra</th><th>Qué significa</th></tr>${clase.vocabulario.map(v => `<tr><td><b>${md(v.palabra)}</b></td><td>${md(v.definicion)}</td></tr>`).join('')}</table></div>` : ''}
      ${(clase.errores_frecuentes || []).length ? `<h3 style="margin-top:20px">Errores frecuentes</h3>${clase.errores_frecuentes.map(x => `<div class="fb mal" style="margin-bottom:8px"><b>✗ ${md(x.error)}</b><br>✓ ${md(x.aclaracion)}</div>`).join('')}` : ''}
    </div>
    <div class="tarjeta"><h3>📒 Revisá tu carpeta</h3><p class="ayuda">Antes de seguir, fijate que en tu carpeta tengas:</p>
      <ul class="lista-carpeta">${clase.capsulas.map(c => `<li><b>${esc(c.titulo)}</b>${c.carpeta?.instruccion ? ` <span class="consigna-carpeta">(${esc(c.carpeta.instruccion)})</span>` : ''}</li>`).join('')}
        ${(clase.vocabulario || []).length ? '<li><b>Mis palabras clave</b> <span class="consigna-carpeta">(las palabras de esta clase, cada una con su significado)</span></li>' : ''}</ul></div>
    ${(clase.objetivos || []).length ? `<div class="tarjeta no-print"><h3>🎯 ¿Lograste los objetivos de esta clase?</h3><p class="ayuda">Marcá lo que ya podés hacer. Si algo todavía no te sale, volvé a esa parte de la clase.</p>
      <ul class="check-lista">${clase.objetivos.map((o, k) => `<li><input type="checkbox" id="obj${k}" ${e.clases[clase.id]?.objetivos?.[k] ? 'checked' : ''}><label for="obj${k}">${esc(o)}</label></li>`).join('')}</ul></div>` : ''}
    <div class="tarjeta no-print" id="autoev"></div>
    <div class="tarjeta no-print siguiente-paso"><h3>👉 ¿Y ahora?</h3><div id="y-ahora"></div>
      ${hayLMS() ? '<p>Para salir de la clase, tocá el botón <b>"Salir de la actividad"</b>, arriba a la derecha de la pantalla. Tu avance queda guardado.</p>' : ''}</div>
    <div class="acciones no-print"><a class="btn" href="recorrido.html">Volver a mi recorrido →</a></div>`;
    yAhora(host.querySelector('#y-ahora'), clase);
    host.querySelectorAll('[id^="obj"]').forEach((x, k) => x.onchange = () => { e = leer(); e.clases[clase.id] ??= { caps: {} }; (e.clases[clase.id].objetivos ??= {})[k] = x.checked; guardarE(); });
    const mejor = e.clases[clase.id]?.autoev;
    montarAutoevaluacion(host.querySelector('#autoev'), clase.capsulas.flatMap(c => (c.autoevaluacion || []).map(q => ({ ...q, parte: c.titulo }))),
      { intro: 'Comprobá cuánto aprendiste en esta clase. No tiene nota y la podés hacer todas las veces que quieras. Después de cada respuesta vas a ver una explicación: leela, que ahí también se aprende.'
          + (mejor ? ` Ya la hiciste: tu mejor resultado es ${mejor.bien} de ${mejor.total}.` : ' Al terminarla, la clase queda completa en "Mi recorrido".'),
        // se guarda el mejor resultado: así la clase queda completa en el recorrido y se ve el avance
        onFin: (bien, total) => {
          e = leer(); e.clases[clase.id] ??= { caps: {} }; const m = e.clases[clase.id].autoev;
          if (!m || bien / total >= m.bien / m.total) e.clases[clase.id].autoev = { bien, total };
          guardarE();
          const p2 = progresoClase(e, clase); root.querySelector('.clase-cab .barra i').style.width = p2.pct + '%';
          yAhora(host.querySelector('#y-ahora'), clase);
          const t = root.querySelector('.tab-cap[data-i="cierre"]'); if (t) { t.classList.add('hecha'); t.textContent = '✓ Cierre'; }
        } });
  }



  pintar();
}

/* ---------- autoevaluación: en el cierre de cada clase y en la general; se puede repetir sin límite ---------- */
export function montarAutoevaluacion(host, preguntas, { titulo = 'Autoevaluación', intro = '', onFin } = {}) {
  if (!preguntas.length) { host.remove(); return; }
  const preparar = q => {
    const ops = q.tipo === 'vf' ? ['Verdadero', 'Falso'] : q.opciones;
    const correcta = q.tipo === 'vf' ? (q.respuesta ? 0 : 1) : q.correcta;
    const orden = q.tipo === 'vf' ? [0, 1] : mezclar(ops.map((_, i) => i));
    return { ...q, texto: q.tipo === 'vf' ? q.texto : q.pregunta, ops: orden.map(i => ops[i]), ok: orden.indexOf(correcta) };
  };
  const pintar = () => {
    const qs = preguntas.map(preparar);
    let respondidas = 0, bien = 0;
    host.innerHTML = `<div class="titulo-seccion"><div class="chip-icono">✅</div><h2>${esc(titulo)}</h2></div><div class="subrayado"></div>
      <p>${esc(intro)}</p>
      ${qs.map((q, n) => `<div class="autoev-q" data-n="${n}"><div class="nivel">${esc(q.parte)} · ${q.tipo === 'vf' ? 'Verdadero o falso' : 'Elegí la correcta'}</div>
        <div class="q">${n + 1}. ${md(q.texto)}</div><div class="opc-lista">${q.ops.map((o, k) => `<button class="opc-btn" data-k="${k}">${md(o)}</button>`).join('')}</div><div class="fbz"></div></div>`).join('')}
      <div class="fb info oculto" id="autoev-res"></div>
      <div class="acciones"><button class="btn sec chico" id="autoev-otra">Volver a hacer la autoevaluación</button></div>`;
    host.querySelectorAll('.autoev-q').forEach(d => {
      const q = qs[+d.dataset.n];
      d.querySelectorAll('.opc-btn').forEach(bt => bt.onclick = () => {
        const k = +bt.dataset.k, acierto = k === q.ok;
        d.querySelectorAll('.opc-btn').forEach(x => { x.disabled = true; if (+x.dataset.k === q.ok) x.classList.add('bien'); });
        if (!acierto) bt.classList.add('mal');
        d.querySelector('.fbz').innerHTML = acierto
          ? `<div class="fb ok"><b>¡Bien respondido!</b> ${md(q.explicacion || '')}</div>`
          : `<div class="fb mal"><b>Repasemos esta.</b> La respuesta es "${md(q.ops[q.ok])}". ${md(q.explicacion || '')}</div>`;
        respondidas++; if (acierto) bien++;
        if (respondidas === qs.length) {
          const r = host.querySelector('#autoev-res'); r.classList.remove('oculto'); try { onFin?.(bien, qs.length); } catch {}
          r.innerHTML = `<b>Respondiste bien ${bien} de ${qs.length}.</b> ${bien === qs.length ? '¡Excelente! Tenés muy claros estos temas.' : bien >= qs.length * 0.7 ? '¡Muy bien! Para afianzar lo que sabés, leé otra vez las explicaciones de las demás preguntas.' : 'Te quedan temas para repasar. Leé las explicaciones, volvé a esos temas en el material y hacé la autoevaluación otra vez: cada vuelta suma.'}`;
        }
      });
    });
    host.querySelector('#autoev-otra').onclick = () => { pintar(); host.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  };
  pintar();
}

/* ---------- bloques ---------- */
// devuelve true si el bloque es interactivo y cuenta para habilitar la carpeta
// Clave estable de una actividad: tipo + un resumen numérico de su contenido principal
function claveBloque(b, i) {
  if (b.id) return b.id;
  const base = b.t + '|' + (b.consigna || b.pregunta || b.texto || b.titulo || '') + '|' + JSON.stringify(b.items || b.opciones || b.pares || b.afirmaciones || b.huecos || '');
  let h = 0; for (let j = 0; j < base.length; j++) h = (h * 31 + base.charCodeAt(j)) | 0;
  return b.t + '-' + (h >>> 0).toString(36);
}

export function renderBloque(w, b, { resuelto, marcar }) {
  switch (b.t) {
    case 'texto': w.innerHTML = (b.titulo ? `<h3>${esc(b.titulo)}</h3>` : '') + parr(b.texto); return false;
    case 'destacado': w.innerHTML = `<div class="destacado"><h4>${esc(b.titulo || 'Para recordar')}</h4>${parr(b.texto)}</div>`; return false;
    case 'ejemplo': w.innerHTML = `<div class="ejemplo"><h4 style="margin:0 0 4px">${esc(b.titulo || 'Ejemplo')}</h4>${parr(b.texto)}</div>`; return false;
    case 'dato': w.innerHTML = `<div class="dato"><span class="ic">💡</span><div><b>${esc(b.titulo || 'Dato curioso')}</b><br>${md(b.texto)}</div></div>`; return false;
    case 'cita': w.innerHTML = `<div class="cita"><div class="etq">${esc(b.etiqueta || 'Fuente')}</div><blockquote>"${md(b.texto)}"</blockquote><cite>${md(b.autor || '')}${b.contexto ? ' · ' + md(b.contexto) : ''}</cite></div>`; return false;
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
    case 'unir': return bUnir(w, b, resuelto, marcar);
    case 'completar': return bCompletar(w, b, resuelto, marcar);
    case 'imagen': w.innerHTML = figuraHTML(b); activarFiguras(w); return false;
    case 'observar': return bObservar(w, b, resuelto, marcar);
    case 'esquema': return bEsquema(w, b, resuelto, marcar);
    case 'vf': return bVF(w, b, resuelto, marcar);
    case 'pronunciar': return bPronunciar(w, b, resuelto, marcar);
    case 'dictado': return bDictado(w, b, resuelto, marcar);
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
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || 'Pensalo antes de mirar')}</div><div class="consigna">${md(b.pregunta)}</div>
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
    else { x.classList.add('mal'); x.disabled = true; fb.innerHTML = `<div class="fb mal"><b>Seguí buscando.</b> ${md(b.pista || 'Volvé a leer el material y probá con otra opción.')}</div>`; }
  });
  return true;
}
// Cómo tiene que escribir la respuesta (se arma solo según el tipo de respuesta)
function formatoDe(b) {
  if (b.formato) return b.formato;
  const r = String(b.respuesta);
  if (r.includes('√')) return 'Escribí el resultado como número y raíz, por ejemplo 3√5. Para la raíz usá el botón √.';
  if (/^-?\d+$/.test(r)) return 'Escribí solo el número, con cifras (por ejemplo: 12).';
  if (/^-?\d*\.\d+$/.test(r)) return 'Escribí solo el número; usá coma para los decimales (por ejemplo: 0,25).';
  return 'Escribí solo la respuesta, sin oraciones.';
}
// Lee lo que escribió el alumno con flexibilidad: "4", "4 años", "cuatro", "4 anos", "0,5"…
const NUM_PAL = { cero: 0, uno: 1, una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100 };
function numeroEn(v) {
  const t = String(v).trim().replace(/[−–]/g, '-').replace(/(\d)\s+(?=\d{3}\b)/g, '$1');
  const m = t.match(/-?\d+(?:[.,]\d+)?/g);
  if (m && m.length === 1) return Number(m[0].replace(',', '.'));
  if (m) return NaN;
  const pal = norm(t).split(/\s+/).filter(w => w in NUM_PAL);
  if (pal.length === 1) return NUM_PAL[pal[0]];
  if (pal.length === 2 && NUM_PAL[pal[0]] >= 30 && NUM_PAL[pal[1]] < 10) return NUM_PAL[pal[0]] + NUM_PAL[pal[1]];
  return NaN;
}
const compacto = s => norm(s).replace(/raiz\s*(cuadrada\s*)?(de\s*)?/g, '√').replace(/\s/g, '').replace(/[·*.]/g, '');
function bVerificar(w, b, resuelto, marcar) {
  let fallos = 0;
  const esRadical = String(b.respuesta).includes('√');
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || 'Resolvé')}</div><div class="consigna">${md(b.consigna)}</div>
    <p class="formato-resp">✏️ ${esc(formatoDe(b))}</p>
    <div class="inline">${esRadical ? '<button class="btn chico suave" id="raiz" type="button" title="Escribir el símbolo de raíz">√</button>' : ''}<input type="text" id="r" placeholder="${esc(b.placeholder || 'Tu respuesta')}" autocomplete="off" ${resuelto ? 'disabled' : ''}><button class="btn chico" id="ok" ${resuelto ? 'disabled' : ''}>Comprobar</button></div><div class="fbz"></div></div>`;
  const fb = w.querySelector('.fbz'), inp = w.querySelector('#r');
  w.querySelector('#raiz')?.addEventListener('click', () => { const p = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, p) + '√' + inp.value.slice(p); inp.focus(); inp.setSelectionRange(p + 1, p + 1); });
  if (resuelto) { inp.value = String(b.acepta?.[0] && isNaN(num(b.respuesta)) ? b.respuesta : b.respuesta).replace(/^(-?\d+)\.(\d+)$/, '$1,$2'); fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`; w.querySelector('#raiz')?.setAttribute('disabled', ''); }
  const comprobar = () => {
    const v = inp.value.trim(); if (!v) return;
    const tol = b.tolerancia ?? 1e-6;
    const acepta = (b.acepta ?? [b.respuesta]).map(String);
    const ok = acepta.some(a => {
      const na = num(a);
      if (!isNaN(na) && !a.includes('√')) { const nv = numeroEn(v); return !isNaN(nv) && Math.abs(na - nv) <= tol; }
      const cv = compacto(v), ca = compacto(a);
      return cv === ca || (ca.length >= 4 && cv.includes(ca));
    });
    if (ok) { inp.disabled = true; w.querySelector('#ok').disabled = true; w.querySelector('#raiz')?.setAttribute('disabled', ''); w.firstChild.classList.add('resuelto'); fb.innerHTML = `<div class="fb ok"><b>¡Correcto!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else {
      fallos++;
      // 1.er error: dónde buscar. Después, cada error revela una letra más (o una palabra, si es una frase), hasta la respuesta completa.
      const donde = fallos >= 2 && b.pista ? md(b.pista) : (b.pista1 ? md(b.pista1) : 'Volvé a leer el material y probá de nuevo.');
      if (fallos === 1 || !isNaN(num(b.respuesta))) { fb.innerHTML = `<div class="fb mal"><b>Seguí intentando.</b> ${donde}</div>`; return; }
      const r = revelarDe(b.respuesta, fallos - 1);
      fb.innerHTML = r.completo
        ? `<div class="fb mal"><b>La respuesta es:</b> ${r.html}. Escribila para seguir, y fijate por qué es así: ${donde}</div>`
        : `<div class="fb mal"><b>Seguí intentando.</b> ${donde} <br>Empieza así: ${r.html}</div>`;
    }
  };
  w.querySelector('#ok').onclick = comprobar; inp.onkeydown = ev => { if (ev.key === 'Enter') comprobar(); };
  return true;
}

/* Arrastrar con mouse o con el dedo (pointer events: funciona en compu, celular y dentro de Moodle) */
function arrastrable(el, { alSoltar, alTocar, zonas }) {
  el.addEventListener('pointerdown', ev => {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    ev.preventDefault();
    const x0 = ev.clientX, y0 = ev.clientY;
    const fant = el.cloneNode(true); fant.classList.add('ficha-fantasma'); fant.style.width = el.offsetWidth + 'px';
    document.body.appendChild(fant); el.classList.add('arrastrando');
    let sobre = null;
    const zonaEn = (x, y) => document.elementFromPoint(x, y)?.closest('[data-drop]');
    const mover = e2 => {
      fant.style.left = e2.clientX + 'px'; fant.style.top = e2.clientY + 'px';
      const z = zonaEn(e2.clientX, e2.clientY);
      if (z !== sobre) { sobre?.classList.remove('sobre'); z?.classList.add('sobre'); sobre = z; }
      // borde de la parte visible (dentro de Moodle la página no tiene barra propia y se ve solo una parte)
      const cs = getComputedStyle(document.documentElement);
      const vt = parseFloat(cs.getPropertyValue('--vis-top')) || 0, vh = parseFloat(cs.getPropertyValue('--vis-h')) || window.innerHeight;
      if (e2.clientY < vt + 50) window.scrollBy(0, -12); else if (e2.clientY > vt + vh - 50) window.scrollBy(0, 12);
    };
    const fin = e2 => {
      window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', fin); window.removeEventListener('pointercancel', fin);
      fant.remove(); el.classList.remove('arrastrando'); sobre?.classList.remove('sobre');
      // si casi no se movió fue un toque, no un arrastre
      if (alTocar && e2.type !== 'pointercancel' && Math.hypot(e2.clientX - x0, e2.clientY - y0) < 8) { alTocar(); return; }
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
    <p class="instr-act">✋ Arrastrá cada ficha hasta el recuadro que corresponde. Podés cambiar una ficha de recuadro todas las veces que quieras.</p>
    <div class="banco-fichas" data-drop="banco"></div><div class="clasif">${b.categorias.map((c, k) => `<div class="zona" data-drop="${k}"><h5>${esc(c)}</h5><div class="cont"></div></div>`).join('')}</div>
    <div class="acciones"><button class="btn chico" id="cmp">Comprobar</button></div><div class="fbz"></div></div>`;
  const banco = w.querySelector('.banco-fichas'), fb = w.querySelector('.fbz');
  let bloqueado = !!resuelto;
  const pintar = (marcas = {}) => {
    banco.innerHTML = ''; w.querySelectorAll('.zona .cont').forEach(z => z.innerHTML = '');
    fichas.forEach(f => {
      const s = document.createElement('span'); s.className = 'ficha' + (marcas[f.i] ? ' ' + marcas[f.i] : ''); s.textContent = plano(f.texto); s.tabIndex = 0;
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
    if (!banco.children.length && !bloqueado) banco.innerHTML = '<span class="ayuda" style="padding:6px">¡Ubicaste todas! Ahora tocá "Comprobar".</span>';
  };
  w.querySelector('#cmp').onclick = () => {
    if (Object.keys(asign).length < fichas.length) { fb.innerHTML = '<div class="fb aviso">Todavía quedan fichas arriba: arrastralas todas a un recuadro antes de comprobar.</div>'; return; }
    const marcas = {}; let mal = 0;
    fichas.forEach(f => { const ok = b.categorias[asign[f.i]] === f.cat; marcas[f.i] = ok ? 'bien' : 'mal'; if (!ok) mal++; });
    if (!mal) { bloqueado = true; pintar(marcas); w.firstChild.classList.add('resuelto'); w.querySelector('#cmp').disabled = true; fb.innerHTML = `<div class="fb ok"><b>¡Todo bien!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else { pintar(marcas); fb.innerHTML = `<div class="fb mal"><b>Ya ubicaste ${fichas.length - mal} de ${fichas.length}.</b> Las marcadas en rojo van en otro recuadro: buscá en el material dónde corresponden y movelas.</div>`; }
  };
  if (resuelto) { fichas.forEach(f => asign[f.i] = b.categorias.indexOf(f.cat)); pintar(); w.querySelector('#cmp').disabled = true; fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`; }
  else pintar();
  return true;
}
function bOrdenar(w, b, resuelto, marcar) {
  let lista = b.items.map((t, i) => ({ t, i }));
  if (!resuelto) { do lista = mezclar(lista); while (lista.every((x, k) => x.i === k) && lista.length > 1); }
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">Ordená</div><div class="consigna">${md(b.consigna)}</div>
    <p class="instr-act">↕ Movés cada elemento con las flechas ↑ y ↓. Si no te acordás, volvé a leer el material.</p><div class="lista"></div>
    <div class="acciones"><button class="btn chico" id="cmp" ${resuelto ? 'disabled' : ''}>Comprobar orden</button></div><div class="fbz"></div></div>`;
  const cont = w.querySelector('.lista'), fb = w.querySelector('.fbz');
  let fallos = 0, marcas = null;   // marcas: después de comprobar, true/false según si cada posición está bien ubicada
  const pintar = () => {
    cont.innerHTML = lista.map((x, k) => {
      const m = resuelto ? true : marcas ? marcas[k] : null;
      const cls = m === true ? ' bien' : m === false ? ' mal' : '';
      const etiqueta = marcas && !resuelto ? (m ? '<em class="ord-marca">✓ En su lugar</em>' : '<em class="ord-marca">↕ Probá otro lugar</em>') : '';
      return `<div class="ordenar-item${cls}"><span>${md(x.t)}</span>${etiqueta}${resuelto ? '' : `<button data-a="${k}" data-d="-1" aria-label="Subir">↑</button><button data-a="${k}" data-d="1" aria-label="Bajar">↓</button>`}</div>`;
    }).join('');
    cont.querySelectorAll('button[data-a]').forEach(bt => bt.onclick = () => {
      const k = +bt.dataset.a, d = +bt.dataset.d, j = k + d; if (j < 0 || j >= lista.length) return;
      [lista[k], lista[j]] = [lista[j], lista[k]]; marcas = null; pintar();
    });
  };
  pintar();
  w.querySelector('#cmp').onclick = () => {
    const ok = lista.every((x, k) => x.i === k);
    if (ok) { resuelto = true; pintar(); w.querySelector('#cmp').disabled = true; w.firstChild.classList.add('resuelto'); fb.innerHTML = `<div class="fb ok"><b>¡Orden correcto!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else { fallos++; marcas = lista.map((x, k) => x.i === k); pintar(); const bien = marcas.filter(Boolean).length; fb.innerHTML = `<div class="fb mal"><b>Ya tenés ${bien} de ${lista.length} en su lugar.</b> Las de contorno verde están bien ubicadas; movés solo las de contorno rojo. ${fallos >= 2 && b.pista ? md(b.pista) : 'Volvé a leer el material y probá de nuevo.'}</div>`; }
  };
  if (resuelto) { lista = b.items.map((t, i) => ({ t, i })); pintar(); fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`; }
  return true;
}

/* Unir con flechas: cada elemento de la izquierda con su pareja de la derecha (se elige de una lista) */
function bUnir(w, b, resuelto, marcar) {
  const derecha = mezclar(b.pares.map((x, i) => ({ t: x.b, i })));
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || 'Uní')}</div><div class="consigna">${md(b.consigna)}</div>
    <p class="instr-act">🔗 Para cada elemento de la izquierda, elegí en la lista de la derecha el que le corresponde.</p>
    <div class="unir">${b.pares.map((x, i) => `<div class="unir-fila" data-i="${i}"><div class="unir-a">${md(x.a)}</div><div class="unir-flecha" aria-hidden="true">→</div>
      <select aria-label="Pareja de ${esc(plano(x.a))}" ${resuelto ? 'disabled' : ''}><option value="">Elegí…</option>${derecha.map(d => `<option value="${d.i}" ${resuelto && d.i === i ? 'selected' : ''}>${esc(plano(d.t))}</option>`).join('')}</select></div>`).join('')}</div>
    <div class="acciones"><button class="btn chico" id="cmp" ${resuelto ? 'disabled' : ''}>Comprobar</button></div><div class="fbz"></div></div>`;
  const fb = w.querySelector('.fbz'); let fallos = 0;
  w.querySelectorAll('.unir select').forEach(sel => sel.onchange = () => sel.closest('.unir-fila').classList.remove('bien', 'mal'));
  w.querySelector('#cmp').onclick = () => {
    const filas = [...w.querySelectorAll('.unir-fila')];
    if (filas.some(f => f.querySelector('select').value === '')) { fb.innerHTML = '<div class="fb aviso">Elegí una pareja para cada elemento antes de comprobar.</div>'; return; }
    let mal = 0;
    filas.forEach(f => { const ok = +f.querySelector('select').value === +f.dataset.i; f.classList.toggle('bien', ok); f.classList.toggle('mal', !ok); if (!ok) mal++; });
    if (!mal) { w.querySelectorAll('.unir select').forEach(x => x.disabled = true); w.querySelector('#cmp').disabled = true; w.firstChild.classList.add('resuelto'); fb.innerHTML = `<div class="fb ok"><b>¡Todo unido!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else { fallos++; fb.innerHTML = `<div class="fb mal"><b>Ya uniste ${filas.length - mal} de ${filas.length}.</b> En las marcadas en rojo, probá con otra opción. ${fallos >= 2 && b.pista ? md(b.pista) : 'Volvé a leer el material y probá de nuevo.'}</div>`; }
  };
  if (resuelto) { w.querySelectorAll('.unir-fila').forEach(f => f.classList.add('bien')); fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`; }
  return true;
}

/* Completar: un texto con huecos [[palabra]]; cada hueco se completa eligiendo de una lista (con palabras de más para pensar) */
function bCompletar(w, b, resuelto, marcar) {
  const huecos = [...b.texto.matchAll(/\[\[(.+?)\]\]/g)].map(m => m[1]);
  const opciones = mezclar([...new Set([...huecos, ...(b.distractores || [])])]);
  let n = 0;
  const html = esc(b.texto).replace(/\[\[(.+?)\]\]/g, () => { const k = n++; return `<select class="hueco" data-k="${k}" aria-label="Espacio ${k + 1}" ${resuelto ? 'disabled' : ''}><option value="">…</option>${opciones.map(o => `<option ${resuelto && o === huecos[k] ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`; })
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n\n+/).map(x => `<p>${x}</p>`).join('');
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || 'Completá')}</div><div class="consigna">${md(b.consigna)}</div>
    <p class="instr-act">✍️ En cada espacio, elegí la palabra que corresponde. Ojo: sobran algunas.</p><div class="completar">${html}</div>
    <div class="acciones"><button class="btn chico" id="cmp" ${resuelto ? 'disabled' : ''}>Comprobar</button></div><div class="fbz"></div></div>`;
  const fb = w.querySelector('.fbz'); let fallos = 0;
  w.querySelectorAll('.hueco').forEach(sel => sel.onchange = () => sel.classList.remove('bien', 'mal'));
  w.querySelector('#cmp').onclick = () => {
    const sels = [...w.querySelectorAll('.hueco')];
    if (sels.some(x => !x.value)) { fb.innerHTML = '<div class="fb aviso">Completá todos los espacios antes de comprobar.</div>'; return; }
    let mal = 0;
    sels.forEach(x => { const ok = x.value === huecos[+x.dataset.k]; x.classList.toggle('bien', ok); x.classList.toggle('mal', !ok); if (!ok) mal++; });
    if (!mal) { sels.forEach(x => x.disabled = true); w.querySelector('#cmp').disabled = true; w.firstChild.classList.add('resuelto'); fb.innerHTML = `<div class="fb ok"><b>¡Texto completo!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else { fallos++; fb.innerHTML = `<div class="fb mal"><b>Ya completaste ${sels.length - mal} de ${sels.length}.</b> En los espacios marcados en rojo, probá con otra palabra. ${fallos >= 2 && b.pista ? md(b.pista) : 'Volvé a leer el material y probá de nuevo.'}</div>`; }
  };
  if (resuelto) fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`;
  return true;
}

/* ---------- imágenes ----------
   Una imagen lleva siempre epígrafe y fuente. tipo: 'foto' (fotografía de la época), 'recreada' (ilustración hecha hoy,
   se aclara que no es de la época) o 'grafico' (esquemas, gráficos y mapas hechos para la clase).
   Los .svg se insertan en la página para que usen la tipografía de la plataforma. Tocando la imagen se ve más grande. */
const AVISO_RECREADA = 'Ilustración recreada: no es una fotografía de la época.';
// En pantallas angostas (celular) se usa la versión vertical del esquema o gráfico, si existe
const angosto = () => window.innerWidth < 560;
function figuraHTML(f, { zoom = true } = {}) {
  const src = (angosto() && f.src_movil) || f.src || '';
  const svg = /\.svg$/i.test(src);
  const media = svg ? `<div class="fig-svg" data-svg="${esc(src)}" role="img" aria-label="${esc(f.alt || '')}"></div>`
    : `<img src="${esc(src)}" alt="${esc(f.alt || '')}" loading="lazy">`;
  const pie = [f.epigrafe ? md(f.epigrafe) : '', f.tipo === 'recreada' ? `<span class="fig-aviso-recreada">🎨 ${AVISO_RECREADA}</span>` : '', f.fuente ? `<span class="fig-fuente">Fuente: ${md(f.fuente)}</span>` : ''].filter(Boolean).join(' ');
  return `${f.titulo ? `<h3>${esc(f.titulo)}</h3>` : ''}<figure class="fig fig-${esc(f.tipo || 'grafico')}" data-alt="${esc(f.alt || '')}">
    <div class="fig-media ${zoom ? 'zoomable' : ''} ${f.animacion ? (svg ? 'anim anim-svg' : `anim anim-${esc(f.animacion)}`) : ''}" ${zoom ? 'tabindex="0" title="Tocá para ver la imagen más grande"' : ''}>${media}${zoom ? '<span class="fig-lupa" aria-hidden="true">🔍</span>' : ''}</div>
    ${pie ? `<figcaption>${pie}</figcaption>` : ''}</figure>`;
}
// Si la imagen todavía no está en la carpeta img/, se muestra un recuadro que lo avisa (no se rompe la clase)
function pendiente(media, alt) {
  media.classList.remove('zoomable'); media.removeAttribute('tabindex');
  media.innerHTML = `<div class="fig-pendiente"><b>🖼️ Imagen en preparación</b><span>${esc(alt || '')}</span></div>`;
}
/* Fotos de archivo con un movimiento de cámara muy breve (acercar, alejar, recorrer, subir): empieza cuando la foto
   se ve en pantalla, dura unos segundos y queda quieta. No cambia la foto: solo cómo se la mira. */
const pendientesAnim = new Set();
let relojAnim = null;
function zonaVista() {
  const cs = getComputedStyle(document.documentElement);
  const vt = parseFloat(cs.getPropertyValue('--vis-top')), vh = parseFloat(cs.getPropertyValue('--vis-h'));
  return isNaN(vt) || isNaN(vh) ? [0, window.innerHeight] : [vt, vt + vh];   // dentro de Moodle, la parte de la página que se ve
}
function revisarAnim() {
  const [arriba, abajo] = zonaVista();
  for (const m of pendientesAnim) {
    if (!m.isConnected) { pendientesAnim.delete(m); continue; }
    const img = m.querySelector('img');
    if (img ? (!img.complete || !img.naturalWidth) : !m.querySelector('.fig-svg svg')) continue;   // foto cargada o dibujo ya insertado
    const r = m.getBoundingClientRect();
    const visto = Math.min(r.bottom, abajo) - Math.max(r.top, arriba);
    if (r.height && visto >= r.height * 0.6) { m.classList.add('animar'); pendientesAnim.delete(m); }
  }
  if (!pendientesAnim.size) { clearInterval(relojAnim); relojAnim = null; }
}
function activarAnim(m) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  pendientesAnim.add(m);
  if (!relojAnim) relojAnim = setInterval(revisarAnim, 250);
}
function activarFiguras(w) {
  w.querySelectorAll('.fig-media.anim').forEach(activarAnim);
  w.querySelectorAll('.fig').forEach(fig => {
    const media = fig.querySelector('.fig-media'), alt = fig.dataset.alt;
    const img = media.querySelector('img');
    if (img) img.addEventListener('error', () => pendiente(media, alt), { once: true });
    const caja = media.querySelector('.fig-svg');
    if (caja) fetch(caja.dataset.svg).then(r => { if (!r.ok) throw 0; return r.text(); })
      .then(t => { caja.innerHTML = t; caja.dispatchEvent(new Event('svg-listo', { bubbles: true })); }).catch(() => pendiente(media, alt));
    if (media.classList.contains('zoomable')) {
      const abrir = () => { if (media.querySelector('.fig-pendiente')) return; ampliar(media, fig.querySelector('figcaption')?.innerHTML || '', alt); };
      media.addEventListener('click', abrir);
      media.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(); } });
    }
  });
}
function ampliar(media, pie, alt) {
  const fondo = document.createElement('div'); fondo.className = 'modal-fondo';
  const cont = media.querySelector('img')?.outerHTML || media.querySelector('.fig-svg')?.innerHTML || '';
  fondo.innerHTML = `<div class="modal modal-imagen" role="dialog" aria-modal="true" aria-label="${esc(alt || 'Imagen ampliada')}">
    <div class="modal-cab"><h3>🔍 Imagen ampliada</h3><button class="cerrar" aria-label="Cerrar">✕</button></div>
    <div class="ampliada">${cont}</div>${pie ? `<p class="ayuda" style="margin:10px 0 0">${pie}</p>` : ''}</div>`;
  const cerrar = () => { fondo.remove(); document.removeEventListener('keydown', esc_); media.focus?.(); };
  const esc_ = ev => { if (ev.key === 'Escape') cerrar(); };
  fondo.addEventListener('click', ev => { if (ev.target === fondo) cerrar(); });
  fondo.querySelector('.cerrar').onclick = cerrar; document.addEventListener('keydown', esc_);
  document.body.appendChild(fondo); fondo.querySelector('.cerrar').focus();
}

/* Mirá como historiador/a: una imagen y preguntas para leerla como fuente, una por vez */
function bObservar(w, b, resuelto, marcar) {
  const qs = b.preguntas;
  w.innerHTML = `<div class="interactivo observar ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || '🔎 Mirá como historiador/a')}</div>
    ${b.consigna ? `<div class="consigna">${md(b.consigna)}</div>` : ''}${figuraHTML(b.imagen)}<div class="obs-qs"></div></div>`;
  activarFiguras(w);
  const cont = w.querySelector('.obs-qs');
  const pregunta = (n, ya) => {
    const q = qs[n];
    const orden = q.fijo ? q.opciones.map((_, i) => i) : mezclar(q.opciones.map((_, i) => i));
    const d = document.createElement('div'); d.className = 'obs-q';
    d.innerHTML = `<div class="obs-num">Pregunta ${n + 1} de ${qs.length}</div><div class="consigna">${md(q.pregunta)}</div>
      <div class="opc-lista">${orden.map(i => `<button class="opc-btn" data-i="${i}">${md(q.opciones[i])}</button>`).join('')}</div><div class="fbz"></div>`;
    cont.appendChild(d);
    const fb = d.querySelector('.fbz');
    const bien = () => d.querySelectorAll('.opc-btn').forEach(x => { x.disabled = true; if (+x.dataset.i === q.correcta) x.classList.add('bien'); });
    if (ya) { bien(); fb.innerHTML = `<div class="fb ok">${md(q.explicacion || '')}</div>`; return; }
    d.querySelectorAll('.opc-btn').forEach(x => x.onclick = () => {
      if (+x.dataset.i === q.correcta) {
        bien(); fb.innerHTML = `<div class="fb ok"><b>¡Bien observado!</b> ${md(q.explicacion || '')}</div>`;
        if (n + 1 < qs.length) pregunta(n + 1, false);
        else { w.firstChild.classList.add('resuelto'); marcar(); }
      } else { x.classList.add('mal'); x.disabled = true; fb.innerHTML = `<div class="fb mal"><b>Mirá de nuevo.</b> ${md(q.pista || 'Observá la imagen con atención y volvé a leer el epígrafe.')}</div>`; }
    });
  };
  if (resuelto) qs.forEach((_, n) => pregunta(n, true)); else pregunta(0, false);
  return true;
}

/* Completá el esquema: etiquetas que se ubican en los casilleros de un esquema (se tocan o se arrastran).
   Cada casillero: x, y, w, h en % del esquema y la respuesta que va ahí. */
function bEsquema(w, b, resuelto, marcar) {
  const fichas = mezclar([...b.huecos.map(h => h.respuesta), ...(b.distractores || [])].map((t, i) => ({ t, i })));
  const asign = {};   // casillero → ficha
  let elegida = null, bloqueado = !!resuelto, fallos = 0;
  w.innerHTML = `<div class="interactivo ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || '🧩 Completá el esquema')}</div><div class="consigna">${md(b.consigna)}</div>
    <p class="instr-act">👆 Tocá una etiqueta y después el casillero donde va. También podés arrastrarla. ${b.distractores?.length ? 'Ojo: sobran algunas.' : ''}</p>
    ${figuraHTML({ ...b.imagen, tipo: b.imagen.tipo || 'grafico' }, { zoom: false })}
    <div class="banco-fichas esq-banco" data-drop="banco"></div>
    <div class="acciones"><button class="btn chico" id="cmp">Comprobar</button></div><div class="fbz"></div></div>`;
  const media = w.querySelector('.fig-media'), banco = w.querySelector('.esq-banco'), fb = w.querySelector('.fbz');
  media.classList.add('esq');
  const lugar = h => (angosto() && h.movil) || h;
  media.insertAdjacentHTML('beforeend', b.huecos.map((h0, k) => { const h = lugar(h0); return `<div class="esq-hueco" data-drop="${k}" role="button" tabindex="0" aria-label="Casillero ${k + 1}" style="left:${h.x}%;top:${h.y}%;width:${h.w}%;height:${h.h}%"></div>`; }).join(''));
  activarFiguras(w);
  const huecos = [...media.querySelectorAll('.esq-hueco')];
  const ubicar = (fi, k) => { for (const j in asign) if (asign[j] === fi) delete asign[j]; if (k !== null && k !== undefined) asign[k] = fi; elegida = null; fb.innerHTML = ''; pintar(); };
  const pintar = (marcas = {}) => {
    banco.innerHTML = ''; huecos.forEach(h => { h.innerHTML = ''; h.classList.remove('bien', 'mal', 'lleno'); });
    fichas.forEach(f => {
      const s = document.createElement('span'); s.className = 'ficha' + (elegida === f.i ? ' elegida' : ''); s.textContent = plano(f.t); s.tabIndex = 0;
      const k = Object.keys(asign).find(j => asign[j] === f.i);
      if (!bloqueado) {
        arrastrable(s, { alTocar: () => {
          // si ya había otra etiqueta elegida y esta está en un casillero, la elegida ocupa ese lugar
          if (k !== undefined && elegida !== null && elegida !== f.i) { ubicar(elegida, +k); return; }
          elegida = elegida === f.i ? null : f.i; pintar();
        }, alSoltar: z => {
          if (z === 'siguiente') { const libre = huecos.findIndex((_, j) => asign[j] === undefined); ubicar(f.i, libre === -1 ? null : libre); return; }
          if (!z) return; ubicar(f.i, z.dataset.drop === 'banco' ? null : +z.dataset.drop);
        } });
      }
      if (k === undefined) banco.appendChild(s);
      else { const h = huecos[+k]; h.appendChild(s); h.classList.add('lleno'); if (marcas[k]) h.classList.add(marcas[k]); }
    });
    if (!banco.children.length && !bloqueado) banco.innerHTML = '<span class="ayuda" style="padding:6px">¡Ubicaste todas! Ahora tocá "Comprobar".</span>';
    banco.style.display = bloqueado && !banco.children.length ? 'none' : '';   // resuelto y sin etiquetas de más: no queda una caja vacía
  };
  huecos.forEach((h, k) => {
    const poner = () => { if (bloqueado || elegida === null) return; ubicar(elegida, k); };   // la ficha de adentro se elige tocándola
    h.addEventListener('click', poner);
    h.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); poner(); } });
  });
  banco.addEventListener('click', ev => { if (ev.target !== banco) return; if (!bloqueado && elegida !== null && Object.values(asign).includes(elegida)) ubicar(elegida, null); });
  w.querySelector('#cmp').onclick = () => {
    if (Object.keys(asign).length < huecos.length) { fb.innerHTML = '<div class="fb aviso">Todavía hay casilleros vacíos: completalos todos antes de comprobar.</div>'; return; }
    const marcas = {}; let mal = 0;
    b.huecos.forEach((h, k) => { const ok = fichas.find(f => f.i === asign[k]).t === h.respuesta; marcas[k] = ok ? 'bien' : 'mal'; if (!ok) mal++; });
    if (!mal) { bloqueado = true; pintar(marcas); w.querySelector('#cmp').disabled = true; w.firstChild.classList.add('resuelto'); fb.innerHTML = `<div class="fb ok"><b>¡Esquema completo!</b> ${md(b.explicacion || '')}</div>`; marcar(); }
    else { fallos++; pintar(marcas); fb.innerHTML = `<div class="fb mal"><b>Ya ubicaste ${b.huecos.length - mal} de ${b.huecos.length}.</b> Las etiquetas marcadas en rojo van en otro casillero. ${fallos >= 2 && b.pista ? md(b.pista) : 'Buscá en el material dónde va cada una.'}</div>`; }
  };
  if (resuelto) { b.huecos.forEach((h, k) => { asign[k] = fichas.find(f => f.t === h.respuesta).i; }); pintar(Object.fromEntries(b.huecos.map((_, k) => [k, 'bien']))); w.querySelector('#cmp').disabled = true; fb.innerHTML = `<div class="fb ok">${md(b.explicacion || '')}</div>`; }
  else pintar();
  return true;
}

/* Verdadero o falso: varias afirmaciones; cada una se marca y se corrige en el momento, con su explicación */
function bVF(w, b, resuelto, marcar) {
  const n = b.afirmaciones.length;
  w.innerHTML = `<div class="interactivo vf ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || '✔️ Verdadero o falso')}</div><div class="consigna">${md(b.consigna || 'Leé cada afirmación y marcá si es verdadera o falsa.')}</div>
    <div class="vf-lista">${b.afirmaciones.map((a, i) => `<div class="vf-item" data-i="${i}"><p class="vf-txt">${md(a.texto)}</p>
      <div class="vf-btns"><button class="opc-btn chico" data-v="1">Verdadero</button><button class="opc-btn chico" data-v="0">Falso</button></div><div class="fbz"></div></div>`).join('')}</div>
    <p class="ayuda vf-prog"></p></div>`;
  const ok = new Set();
  const prog = () => { w.querySelector('.vf-prog').textContent = ok.size < n ? `Llevás ${ok.size} de ${n}.` : ''; };
  const cerrar = (it, a) => { it.querySelectorAll('button').forEach(x => { x.disabled = true; if (+x.dataset.v === (a.v ? 1 : 0)) x.classList.add('bien'); }); it.classList.add('hecho'); };
  w.querySelectorAll('.vf-item').forEach(it => {
    const a = b.afirmaciones[+it.dataset.i], fb = it.querySelector('.fbz');
    if (resuelto) { cerrar(it, a); fb.innerHTML = `<div class="fb ok">${md(a.explicacion || '')}</div>`; ok.add(+it.dataset.i); return; }
    it.querySelectorAll('button').forEach(bt => bt.onclick = () => {
      if (+bt.dataset.v === (a.v ? 1 : 0)) {
        cerrar(it, a); fb.innerHTML = `<div class="fb ok"><b>¡Bien!</b> ${md(a.explicacion || '')}</div>`; ok.add(+it.dataset.i);
        if (ok.size === n) { w.firstChild.classList.add('resuelto'); marcar(); }
      } else { bt.classList.add('mal'); bt.disabled = true; fb.innerHTML = `<div class="fb mal"><b>Pensalo otra vez.</b> ${md(a.pista || 'Volvé a leer el material y probá con la otra opción.')}</div>`; }
      prog();
    });
  });
  prog();
  return true;
}

/* "¿Y ahora?" del cierre: según lo que le falta al estudiante, lo manda a la clase que sigue o al trabajo práctico */
async function yAhora(caja, clase) {
  if (!caja) return;
  const e = leer();
  let pendientes = [];
  try {
    const cat = await (await fetch('contenidos/catalogo.json')).json();
    const elegidos = (cat.contenidos[e.espacio] || []).filter(c => (e.seleccion || []).includes(c.id) && c.clase);
    for (const c of elegidos) {
      const cl = c.clase === clase.id ? clase : await (await fetch(`contenidos/clases/${c.clase}.json`)).json();
      if (progresoClase(e, cl).pct < 100) pendientes.push({ id: c.clase, titulo: cl.titulo });
    }
  } catch { pendientes = null; }
  const estaPendiente = pendientes && pendientes.some(p => p.id === clase.id);
  const otras = pendientes ? pendientes.filter(p => p.id !== clase.id) : [];
  let html;
  if (pendientes === null) html = '<p>Volvé a "Mi recorrido" para ver qué te falta.</p>';
  else if (!pendientes.length) html = '<p><b>¡Terminaste todas las clases que elegiste!</b> Ya se habilitaron la <b>autoevaluación general</b> y <b>"Mi trabajo práctico y la defensa"</b>: ahí armás el trabajo que vas a presentar y te preparás para defenderlo.</p><div class="acciones"><a class="btn" href="recorrido.html">Ir a mi trabajo práctico →</a></div>';
  else {
    html = estaPendiente ? '<p>Antes de seguir, terminá esta clase: revisá que tengas todas las partes hechas y hacé la autoevaluación de arriba.</p>' : '';
    if (otras.length) html += `<p>${estaPendiente ? 'Después te' : 'Te'} ${otras.length === 1 ? 'queda una clase' : `quedan ${otras.length} clases`}: ${otras.map(p => `<b>${esc(p.titulo)}</b>`).join(', ')}. Seguí desde "Mi recorrido".</p>`;
    html += '<p class="ayuda">El trabajo práctico se habilita cuando termines todas las clases que elegiste.</p>';
  }
  caja.innerHTML = html;
}
