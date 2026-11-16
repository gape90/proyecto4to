// TUTORÍAS VIRTUALES · asistente de Geografía (sin IA).
// Funciona con un listado fijo (contenidos/asistente.json): palabras y temas.
//  · «Entender una palabra»: la persona escribe una palabra; se busca en el listado, se tolera algún error de escritura y se sugiere la parecida.
//  · «Repasar un tema»: botones con los temas de la PARTE que se ve en pantalla; cada uno explica lo que dice la clase, dicho de otra manera.
//  · Lo que no está en el listado se dice con claridad; no se inventa nada.
import { cargarJSON, esc, md, norm } from './estado.js';

const RUTA = 'contenidos/asistente.json';

// ---------- Búsqueda ----------
const limpiar = s => norm(s).replace(/[.,/^=+\-]/g, ' ').replace(/\s+/g, ' ').trim();
const tokens = s => limpiar(s).split(' ').filter(Boolean);
// Posibles raíces de una palabra (plural simple): «partidos» → partido, «nacionalizaciones» → nacionalizacion
const raices = t => { const r = new Set([t]); if (t.length > 3 && t.endsWith('s')) r.add(t.slice(0, -1)); if (t.length > 4 && t.endsWith('es')) r.add(t.slice(0, -2)); return r; };
const coincide = (a, b) => { const ra = raices(a); for (const x of raices(b)) if (ra.has(x)) return true; return false; };

const RELLENO = new Set(('a al algo ante aca ahi alguien asi aun como con cual cuales cuando cuanto de del desde donde el ella ellos en entiendo entender es eso esa ese esto esta estan estoy fue ha hay la las le les lo los me mi mis no nos o para por porque pregunta que quien quiero quiere quise saber se si significa significado sin sobre son su sus te tema temas ti tiene tu tus un una uno unos unas ver y ya yo nose explicame explicar explica explicas explicarme decime decir dice dicen palabra palabras concepto conceptos dudas duda ayuda ayudame necesito pasa paso fueron era eran ser').split(' '));
const sustantivos = s => tokens(s).filter(t => !RELLENO.has(t));

function distancia(a, b, tope) {
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let min = i;
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      cur.push(v); if (v < min) min = v;
    }
    if (min > tope) return tope + 1;
    prev = cur;
  }
  return prev[b.length];
}
const toleranciaDe = t => (t.length >= 8 ? 2 : t.length >= 4 ? 1 : 0);

function indexar(palabras) {
  return palabras.map(p => {
    const textos = [p.palabra, ...(p.formas || []), ...(p.titulos || [])];
    const claves = [...new Set(textos.map(limpiar).filter(c => c.length >= 2))].map(c => ({ texto: c, toks: c.split(' ') }));
    return { p, claves };
  });
}

function buscarPalabra(idx, q) {
  const qt = tokens(q);
  const acierto = [];
  // 1) La palabra (o frase) aparece completa en lo que escribió
  idx.forEach((e, i) => {
    let mejor = 0, ini = 0, fin = 0;
    for (const c of e.claves) {
      for (let s = 0; s + c.toks.length <= qt.length; s++) {
        if (c.toks.every((ct, k) => coincide(qt[s + k], ct)) && c.texto.length > mejor) { mejor = c.texto.length; ini = s; fin = s + c.toks.length; }
      }
    }
    if (mejor) acierto.push({ i, peso: mejor, ini, fin });
  });
  if (acierto.length) {
    acierto.sort((a, b) => b.peso - a.peso);
    const [m, ...resto] = acierto;
    // las demás solo se ofrecen si salen de otra parte de lo que escribió (no si están dentro de la misma frase)
    const otras = resto.filter(a => a.fin <= m.ini || a.ini >= m.fin).map(a => ({ p: idx[a.i].p, etiqueta: idx[a.i].p.palabra }));
    return { tipo: 'exacta', entradas: [{ p: idx[m.i].p, etiqueta: idx[m.i].p.palabra }, ...otras], tramo: [m.ini, m.fin] };
  }

  const buenos = qt.filter(t => t.length >= 4 && !RELLENO.has(t) && !/^\d+$/.test(t));
  const sig = sustantivos(q);
  const cantidad = sig.length;      // en frases largas no se buscan parecidos: probablemente no sea una palabra de la lista
  if (cantidad > 3) return { tipo: 'ninguna', entradas: [] };

  // 2) Error de escritura: una palabra escrita se parece mucho a una del listado
  const parecidas = new Map();
  for (const t of buenos) {
    const tol = toleranciaDe(t);
    idx.forEach(e => {
      for (const c of e.claves) for (const ct of c.toks) {
        if (ct.length < 4) continue;
        let d = distancia(t, ct, tol);
        if (d > tol && t.length >= 5 && ct.length > t.length && ct.startsWith(t)) d = 1;   // escribió el comienzo de la palabra
        if (d >= 1 && d <= tol && !qt.some(x => coincide(x, ct))) {
          const previo = parecidas.get(e.p.palabra);
          if (!previo || d < previo.d) parecidas.set(e.p.palabra, { p: e.p, etiqueta: e.p.palabra, d });
        }
      }
    });
  }
  if (parecidas.size) return { tipo: 'parecida', entradas: [...parecidas.values()].sort((a, b) => a.d - b.d).slice(0, 3) };

  // 3) Una palabra suelta que forma parte de varias entradas (por ejemplo «régimen» o «voto»).
  //    Las opciones se muestran como aparecen en el texto («Régimen oligárquico», «Régimen conservador»…).
  const parciales = new Map();
  if (sig.length && cantidad <= 2) idx.forEach(e => {
    const cubre = toks => toks.length > 1 && sig.every(t => toks.some(ct => coincide(t, ct)));
    if (!e.claves.some(c => cubre(c.toks))) return;
    const titulo = (e.p.titulos || []).find(ti => cubre(limpiar(ti).split(' ')));
    parciales.set(e.p.palabra, { p: e.p, etiqueta: titulo || e.p.palabra });
  });
  if (parciales.size) return { tipo: 'parcial', entradas: [...parciales.values()].slice(0, 6) };
  return { tipo: 'ninguna', entradas: [] };
}

function pistasDeTema(temas, q) {
  const qt = tokens(q);
  const hallados = [];
  for (const t of temas) {
    let mejor = 0;
    for (const c of (t.claves || []).map(limpiar)) {
      const ct = c.split(' ');
      for (let s = 0; s + ct.length <= qt.length; s++) if (ct.every((x, k) => coincide(qt[s + k], x))) mejor = Math.max(mejor, c.length);
    }
    if (mejor) hallados.push({ t, mejor });
  }
  return hallados.sort((a, b) => b.mejor - a.mejor).slice(0, 3).map(x => x.t);
}

const SALUDOS = new Set(['hola', 'holaa', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'ey', 'que tal']);
const AYUDA = new Set(['ayuda', 'ayudame', 'help', 'no entiendo', 'no entiendo nada', 'no se', 'no se nada', 'no entendi', 'no entendi nada', 'socorro']);
const GRACIAS = new Set(['gracias', 'muchas gracias', 'genial', 'ok', 'dale', 'listo', 'perfecto', 'buenisimo']);

// ---------- Interfaz ----------
export async function montarAsistente() {
  let datos, catalogo;
  try { [datos, catalogo] = await Promise.all([cargarJSON(RUTA), cargarJSON('contenidos/catalogo.json')]); } catch { return; }
  const idx = indexar(datos.palabras || []);
  const temas = datos.temas || [];
  const tituloClase = {};
  for (const c of Object.values(catalogo.contenidos || {}).flat()) if (c.clase) tituloClase[c.clase] = c.titulo;

  // Dónde está la persona: el motor de las clases anota la parte que se ve en pantalla («clase|parte» o «clase|cierre»)
  const contexto = () => { const [clase = '', parte = ''] = (document.body.dataset.capsula || '').split('|'); return { clase, parte }; };

  const boton = document.createElement('button');
  boton.type = 'button'; boton.className = 'asist-boton'; boton.setAttribute('aria-expanded', 'false'); boton.setAttribute('aria-controls', 'asist-panel');
  boton.title = '¿Tenés dudas? Abrí el asistente'; boton.setAttribute('aria-label', '¿Tenés dudas? Abrí el asistente');
  boton.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="currentColor"/></svg><span>¿Tenés dudas?</span>';
  const panel = document.createElement('section');
  panel.id = 'asist-panel'; panel.className = 'asist-panel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Asistente de Geografía');
  panel.innerHTML = `
    <div class="asist-cab"><div><b>Asistente de Geografía</b><small>Te ayudo con palabras y temas de la materia</small></div><button type="button" class="asist-x" aria-label="Cerrar">×</button></div>
    <div class="asist-modos" role="group" aria-label="¿Qué querés hacer?">
      <button type="button" data-modo="palabra" aria-pressed="false">Entender una palabra</button>
      <button type="button" data-modo="tema" aria-pressed="false">Repasar un tema</button>
    </div>
    <p class="asist-guia">¡Hola! Elegí una de las dos opciones de arriba para empezar: <b>entender una palabra</b> o <b>repasar un tema</b> de lo que estás viendo.</p>
    <div class="asist-log" aria-live="polite"></div>
    <form class="asist-form" autocomplete="off"><input type="text" maxlength="80" disabled placeholder="Primero elegí una opción de arriba" aria-label="Escribí la palabra"><button type="submit" disabled>Buscar</button></form>`;
  // Dentro de Moodle (una sola barra), el asistente se coloca sobre la página del aula: así queda realmente fijo
  // al desplazarse, sin reacomodarse. En cualquier otro caso, va en esta misma página.
  const raiz = document.createElement('div'); raiz.className = 'tv-asist'; raiz.append(boton, panel);
  let destino = document.body;
  try { const m = window.parent !== window ? window.parent.TV : null; const d = m && m.altoAuto && m.capaFlotante ? m.capaFlotante() : null; if (d && d.body) destino = d.body; } catch {}
  destino.appendChild(raiz);
  if (destino !== document.body) addEventListener('pagehide', () => raiz.remove());
  const log = panel.querySelector('.asist-log'), input = panel.querySelector('input'), enviar = panel.querySelector('.asist-form button');
  let modo = '', ultimaNoEncontrada = '';

  const abrir = () => { panel.hidden = false; boton.setAttribute('aria-expanded', 'true'); setTimeout(() => (input.disabled ? panel.querySelector('.asist-modos button').focus() : input.focus()), 30); };
  const cerrar = () => { panel.hidden = true; boton.setAttribute('aria-expanded', 'false'); boton.focus(); };
  boton.addEventListener('click', () => (panel.hidden ? abrir() : cerrar()));
  panel.querySelector('.asist-x').addEventListener('click', cerrar);
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });

  // --- mensajes ---
  const bajar = el => { log.scrollTo({ top: Math.max(0, el.offsetTop - 8), behavior: 'smooth' }); };
  function msg(html, { yo = false, opciones = [] } = {}) {
    const d = document.createElement('div');
    d.className = 'asist-msg ' + (yo ? 'yo' : 'bot');
    d.innerHTML = html;
    if (opciones.length) {
      const o = document.createElement('div'); o.className = 'asist-ops';
      for (const op of opciones) { const b = document.createElement('button'); b.type = 'button'; b.textContent = op.texto; b.addEventListener('click', op.fn); o.append(b); }
      d.append(o);
    }
    log.append(d); bajar(d); return d;
  }

  // --- modos ---
  function elegirModo(m) {
    modo = m; ultimaNoEncontrada = '';
    panel.querySelectorAll('.asist-modos button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modo === m)));
    const escribe = m === 'palabra';
    input.disabled = !escribe; enviar.disabled = !escribe;
    input.placeholder = escribe ? 'Escribí la palabra…' : 'Elegí un tema con los botones';
    if (escribe) { pedirPalabra(); input.focus(); } else mostrarTemas();
  }
  panel.querySelector('.asist-modos').addEventListener('click', e => { const m = e.target.closest('button')?.dataset.modo; if (m) elegirModo(m); });

  function pedirPalabra() {
    msg('Escribí la palabra que <b>no entendés</b> o sobre la que <b>tenés dudas</b>. Escribila sola, tal como aparece en el texto.');
  }
  // consultada: la palabra tal como la pidió el o la estudiante. Se aclara que el significado es el que tiene en este material.
  const verPalabra = (p, etiqueta, consultada) => {
    ultimaNoEncontrada = '';
    if (etiqueta) msg(esc(etiqueta), { yo: true });
    const pal = (consultada || etiqueta || p.palabra).trim();
    const otra = limpiar(pal) !== limpiar(p.palabra) ? `<small class="asist-rel">Está en el listado como "${esc(p.palabra)}".</small>` : '';
    msg(`<div class="asist-def"><b>${esc(pal)}</b><p>En este material, "${esc(pal)}" quiere decir:</p><p>${esc(p.definicion)}</p>${otra}</div>`);
  };

  // Temas de la parte que se ve en pantalla. Fuera de las clases (TP, autoevaluación) o en el cierre se muestran agrupados.
  function mostrarTemas() {
    const { clase, parte } = contexto();
    const grupos = new Map();  // título → temas
    let intro;
    if (clase && parte && parte !== 'cierre' && temas.some(t => t.clase === clase && t.capsula === parte)) {
      const lista = temas.filter(t => t.clase === clase && t.capsula === parte);
      grupos.set('', lista);
      intro = `<b>¿Sobre qué tema de esta parte te quedan dudas?</b><br><small>Parte: ${esc(lista[0].parte)}</small>`;
    } else {
      for (const t of temas.filter(x => !clase || x.clase === clase)) {
        const k = (clase ? '' : (tituloClase[t.clase] || t.clase) + ' · ') + t.parte;
        if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(t);
      }
      intro = clase ? '<b>¿Sobre qué tema te quedan dudas?</b> Elegí la parte y el tema.' : '<b>¿Sobre qué tema te quedan dudas?</b> Elegí la clase, la parte y el tema.';
    }
    if (!grupos.size) return msg('Todavía no tengo temas para repasar acá. Probá con "Entender una palabra".');
    const d = document.createElement('div'); d.className = 'asist-msg bot'; d.innerHTML = `<p>${intro}</p>`;
    for (const [titulo, lista] of grupos) {
      const cont = document.createElement(titulo ? 'details' : 'div'); cont.className = 'asist-grupo';
      if (titulo) cont.innerHTML = `<summary>${esc(titulo)}</summary>`;
      const ops = document.createElement('div'); ops.className = 'asist-ops';
      for (const t of lista) { const b = document.createElement('button'); b.type = 'button'; b.textContent = t.boton; b.addEventListener('click', () => verTema(t)); ops.append(b); }
      cont.append(ops); d.append(cont);
    }
    log.append(d); bajar(d);
  }
  function verTema(t) {
    msg(esc(t.boton), { yo: true });
    msg(`<div class="asist-tema"><h4>${esc(t.boton)}</h4>
      <div class="asist-sec">Dicho de otra manera</div><p>${md(t.otra_manera)}</p>
      ${t.vida_real ? `<div class="asist-sec">En la vida real</div><p>${md(t.vida_real)}</p>` : ''}</div>`);
  }
  // Si la parte cambia mientras se está repasando temas, se actualizan los botones
  document.addEventListener('capsula', () => { if (!panel.hidden && modo === 'tema') mostrarTemas(); });

  // --- lo que escribe el/la estudiante (solo en «Entender una palabra») ---
  function consulta(texto) {
    const q = texto.trim(); if (!q || modo !== 'palabra') return;
    msg(esc(q), { yo: true });
    const qn = limpiar(q);
    if (SALUDOS.has(qn) || (/^(hola|buenas|buenos|hey)\b/.test(qn) && qn.split(' ').length <= 4)) return msg('¡Hola! Escribí la palabra que no entendés.');
    if (AYUDA.has(qn)) return msg('Está bien no entender: vamos de a poco. Escribí una palabra que te haya generado dudas y te explico qué significa.');
    if (GRACIAS.has(qn)) return msg('¡De nada! Si te queda otra duda, escribila.');

    const r = buscarPalabra(idx, q);   // primero la frase completa: «uno a uno» está formada solo por palabras cortas
    if (r.tipo !== 'exacta' && !sustantivos(q).length) return msg('No llegué a entender lo que escribiste. Probá con una sola palabra, por ejemplo "fraude" o "huelga".');
    const opcionesDe = es => es.map(x => ({ texto: x.etiqueta, fn: () => verPalabra(x.p, x.etiqueta) }));
    if (r.tipo === 'exacta') {
      const [primera, ...otras] = r.entradas;
      // lo que escribió, palabra por palabra (si coincide con cómo se separó al buscar, se muestra tal cual)
      const orig = q.replace(/[.,;:¿?¡!()"«»'“”]/g, ' ').split(/\s+/).filter(Boolean);
      const todo = r.tramo[0] === 0 && r.tramo[1] === tokens(q).length;   // escribió solo la palabra: se muestra tal cual
      const consultada = todo ? q.trim().replace(/^[¿¡"«“]+|[?!.,;:"»”]+$/g, '')
        : orig.length === tokens(q).length ? orig.slice(r.tramo[0], r.tramo[1]).join(' ') : primera.p.palabra;
      verPalabra(primera.p, null, consultada);
      if (otras.length) msg('En lo que escribiste también encontré estas. ¿Querés ver alguna?', { opciones: opcionesDe(otras.slice(0, 3)) });
      return;
    }
    if (r.tipo === 'parecida') { ultimaNoEncontrada = ''; return msg('No encuentro eso tal cual. <b>Fijate si la escribiste bien</b>. ¿Será alguna de estas?', { opciones: opcionesDe(r.entradas) }); }
    if (r.tipo === 'parcial') {
      ultimaNoEncontrada = '';
      if (r.entradas.length === 1) { msg('Encontré esta palabra relacionada:'); return verPalabra(r.entradas[0].p); }
      return msg('Encontré varias que incluyen esa palabra. ¿Cuál es la que buscabas?', { opciones: opcionesDe(r.entradas) });
    }
    // No está en el listado
    const sig = sustantivos(q);
    if (sig.length <= 2) {
      const hallados = pistasDeTema(temas.filter(t => { const c = contexto(); return !c.clase || (t.clase === c.clase && (c.parte === 'cierre' || !c.parte || t.capsula === c.parte)); }), q);
      if (hallados.length) {
        ultimaNoEncontrada = '';
        return msg('Esa palabra no está en mi listado, pero parece que te interesa un tema de esta parte. Podés elegir "Repasar un tema" y buscarlo entre los botones.');
      }
      if (ultimaNoEncontrada === qn) {
        return msg('Esa palabra <b>no está en mi listado</b>. Anotala en tu carpeta para preguntarle después a tu docente.');
      }
      ultimaNoEncontrada = qn;
      return msg('Fijate cómo está escrita y escribila de nuevo para comprobarlo.');
    }
    ultimaNoEncontrada = '';
    msg('Con eso no te puedo ayudar. Lo que hago es <b>explicar palabras</b> de Geografía (por ejemplo "megalópolis" o "desertización") y <b>repasar temas</b> de la parte que estás viendo. Para lo demás, consultá con tu docente.');
  }

  panel.querySelector('.asist-form').addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; consulta(v); });
}
