// TUTORÍAS VIRTUALES · estado del alumno (solo en su navegador; nada se envía al docente)
const CLAVE = 'potenciar4.estado.v1';

const base = () => ({
  alumno: { nombre: '', modalidad: '', curso: '' },
  espacio: '',
  seleccion: [],            // ids de contenidos elegidos
  clases: {},               // claseId -> { caps: { capId: {estado, texto, copiado, intentos} }, juegos: {capId: {...}} }
  tps: {},                  // espacio -> { secciones: { seccionId -> {estado, texto, copiado, intentos} }, simulacro: { preguntaId -> {hecha, texto} } }
});

export function leer() {
  try {
    const t = localStorage.getItem(CLAVE);
    if (!t) return base();
    const e = { ...base(), ...JSON.parse(t) };
    delete e.tp; delete e.simulacro; // formato anterior (un solo TP para todas las materias)
    return e;
  } catch { return base(); }
}
export function guardar(e) {
  try { localStorage.setItem(CLAVE, JSON.stringify(e)); } catch { /* modo privado */ }
}
export function actualizar(fn) {
  const e = leer(); fn(e); guardar(e); return e;
}
export function reiniciar() {
  try { localStorage.removeItem(CLAVE); } catch {}
}

export function capsula(e, claseId, capId) {
  e.clases[claseId] ??= { caps: {} };
  e.clases[claseId].caps[capId] ??= { estado: 'pendiente', texto: '', copiado: false, intentos: 0, bloques: {} };
  return e.clases[claseId].caps[capId];
}
export function capHecha(e, claseId, capId) {
  const c = e.clases?.[claseId]?.caps?.[capId];
  return !!c && (c.estado === 'ok' || c.estado === 'duda') && c.copiado;
}
export function progresoClase(e, clase) {
  const total = clase.capsulas.length;
  const hechas = clase.capsulas.filter(c => capHecha(e, clase.id, c.id)).length;
  return { total, hechas, pct: total ? Math.round(hechas / total * 100) : 0 };
}
// Trabajo práctico de un espacio curricular (cada materia tiene el suyo)
export function tpDe(e, espacio) {
  e.tps ??= {};
  e.tps[espacio] ??= { secciones: {}, simulacro: {} };
  e.tps[espacio].secciones ??= {}; e.tps[espacio].simulacro ??= {};
  return e.tps[espacio];
}
export function dudas(e) {
  const out = [];
  const pref = { matematica: 'mat-', historia: 'his-' }[e.espacio] || '';
  for (const [cid, cl] of Object.entries(e.clases)) if (cid.startsWith(pref))
    for (const [kid, c] of Object.entries(cl.caps))
      if (c.estado === 'duda') out.push({ clase: cid, cap: kid, nombre: c.titulo || kid, texto: '' });
  const t = e.tps?.[e.espacio]?.secciones || {};
  for (const [sid, s] of Object.entries(t))
    if (s.estado === 'duda') out.push({ clase: 'tp', cap: sid, nombre: 'Trabajo práctico: ' + (s.titulo || sid), texto: '' });
  return out;
}

// Utilidades comunes
export const norm = s => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñπφ²³√∛∜\s.,/^=+\-]/g, ' ').replace(/\s+/g, ' ').trim();
export const esc = s => (s ?? '').toString().replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// **negrita** y _cursiva_ mínimos, sobre texto ya escapado
export const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])_(.+?)_(?=[\s).,;:]|$)/g, '$1<i>$2</i>').replace(/\n/g, '<br>');

export async function cargarJSON(ruta) {
  const r = await fetch(ruta, { cache: 'no-cache' });
  if (!r.ok) throw new Error('No se pudo cargar ' + ruta);
  return r.json();
}

export function cabecera({ volver } = {}) {
  const e = leer();
  const alumno = e.alumno.nombre ? `<span class="alumno">${esc(e.alumno.nombre)}</span>` : '';
  const v = volver ? `<a class="volver" href="${volver.href}">← ${esc(volver.texto)}</a>` : '';
  return `<header class="cabecera">
    <div class="marca"><span class="titulo-app">Tutorías Virtuales</span></div>
    <div class="derecha">${alumno}${v}</div>
  </header>`;
}

// Consigna: la primera parte (hasta los dos puntos o el primer punto) va en negrita para que quede clara.
export function consignaHTML(t) {
  const s = (t || '').trim();
  const iC = s.indexOf(':'), iP = s.search(/[.?!](\s|$)/);
  let corte = -1;
  if (iC > 0 && (iP === -1 || iC < iP)) corte = iC + 1; else if (iP > 0) corte = iP + 1;
  if (corte <= 0 || corte >= s.length) return `<p class="consigna-principal"><b>${md(s)}</b></p>`;
  return `<p class="consigna-principal"><b>${md(s.slice(0, corte))}</b>${md(s.slice(corte))}</p>`;
}

/* ---------- Copia textual ---------- */
const palabrasDe = s => norm(s).replace(/[.,]/g, ' ').split(' ').filter(Boolean);
// Largo (en palabras) del tramo más largo copiado igual de la fuente
export function tramoCopiado(texto, fuente) {
  const a = palabrasDe(texto), b = palabrasDe(fuente);
  if (!a.length || !b.length) return 0;
  let mejor = 0, prev = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) if (a[i - 1] === b[j - 1]) { cur[j] = prev[j - 1] + 1; if (cur[j] > mejor) mejor = cur[j]; }
    prev = cur;
  }
  return mejor;
}
// ¿El texto es (casi) una copia de alguna fuente? min: tramo largo; prop: parte del texto copiada
export function esCopia(texto, fuentes = [], { min = 14, prop = 0.6 } = {}) {
  const n = palabrasDe(texto).length;
  if (!n) return false;
  return fuentes.filter(Boolean).some(f => {
    if (norm(f) === norm(texto)) return true;
    const t = tramoCopiado(texto, f);
    return t >= min || (t >= 5 && t / n >= prop);
  });
}

/* ---------- Tildes ---------- */
// Palabras que existen con y sin tilde (no se marcan: dependen del sentido)
const AMBIGUAS = new Set(('esta este estas estos esa ese aquel el tu mi si se de te mas solo que como cual cuales quien quienes donde cuando cuanto cuanta porque aun ' +
  'practica practico publico publica calculo critico critica limite termino numero deposito transito animo continuo continua ultimo valido ' +
  'varia varian envio guia rio sabana papa ingles hacia sera seria').split(' '));
// Diccionario: forma sin tilde -> forma correcta, a partir de los textos de la clase
export function diccionarioTildes(...objetos) {
  const dic = {};
  const recorrer = o => {
    if (typeof o === 'string') {
      for (const w of o.toLowerCase().match(/[a-záéíóúüñ]+/g) || []) {
        if (!/[áéíóú]/.test(w) || w.length < 4) continue;
        const sin = w.normalize('NFD').replace(/[̀-ͯ]/g, '');
        if (AMBIGUAS.has(sin)) continue;
        // agudas terminadas en vocal (llegó/llego, será…) suelen ser ambiguas, salvo -ción/-sión
        if (/[áéó]$/.test(w) && !/(ción|sión)$/.test(w)) continue;
        dic[sin] = w;
      }
    } else if (Array.isArray(o)) o.forEach(recorrer);
    else if (o && typeof o === 'object') Object.values(o).forEach(recorrer);
  };
  objetos.forEach(recorrer);
  return dic;
}
export function faltanTildes(texto, dic = {}) {
  const out = [], vistos = new Set();
  for (const w of (texto || '').match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g) || []) {
    const l = w.toLowerCase();
    if (/[áéíóú]/.test(l) || vistos.has(l)) continue;
    if (dic[l] && dic[l] !== l) {
      const ok = w[0] === w[0].toUpperCase() ? dic[l][0].toUpperCase() + dic[l].slice(1) : dic[l];
      out.push({ escrito: w, correcto: ok }); vistos.add(l);
    }
  }
  return out;
}

/* ---------- Escritura: palabras de la página mal escritas ---------- */
// Referencia armada con los textos de la página: nombres propios y términos con tilde, tal como aparecen en el material.
export function referenciaEscritura(...objetos) {
  const todas = [];
  const recorrer = o => {
    if (typeof o === 'string') todas.push(...(o.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g) || []));
    else if (Array.isArray(o)) o.forEach(recorrer);
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (!['claves', 'acepta', 'k', 'id', 't', 'claves_contenido'].includes(k)) recorrer(v); }
  };
  objetos.forEach(recorrer);
  const enMinuscula = new Set(todas.filter(w => w === w.toLowerCase()).map(w => w.toLowerCase()));
  const palabras = new Set(todas.map(w => norm(w)));
  const terminos = new Map();
  for (const w of todas) {
    if (w.length < 5) continue;
    const propio = w[0] !== w[0].toLowerCase() && w.slice(1) === w.slice(1).toLowerCase() && !enMinuscula.has(w.toLowerCase());
    if (propio || /[áéíóú]/.test(w)) terminos.set(norm(w), w);
  }
  return { palabras, terminos, dic: diccionarioTildes(...objetos) };
}
// Distancia entre dos palabras (cambiar, agregar, sacar o invertir dos letras seguidas)
function distancia(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 9;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
// Devuelve las palabras del alumno que hay que revisar (sin decir cómo se escriben)
export function revisarEscritura(texto, ref) {
  if (!ref) return [];
  const out = [], vistos = new Set();
  for (const w of (texto || '').match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g) || []) {
    const l = w.toLowerCase(), n = norm(w);
    if (vistos.has(l)) continue;
    // 1) le falta la tilde a una palabra que en el material la lleva
    if (!/[áéíóú]/.test(l) && ref.dic[l] && ref.dic[l] !== l) { out.push(w); vistos.add(l); continue; }
    // 2) se parece mucho a un nombre o término del material, pero está mal escrita
    if (n.length >= 5 && !ref.palabras.has(n)) {
      for (const [tn] of ref.terminos) if (tn[0] === n[0] && distancia(n, tn) === 1) { out.push(w); vistos.add(l); break; }
    }
  }
  return out;
}
