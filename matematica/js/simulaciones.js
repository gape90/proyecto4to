// ACOMPAÑAMIENTO PEDAGÓGICO · simulaciones interactivas de Matemática
// alCambiar (opcional): avisa cada cambio de los controles, para las actividades con objetivo (js/practicas.js).
import { esc } from './estado.js';

const NUMS = {
  raiz2: { nombre: '√2', v: Math.SQRT2 },
  raiz3: { nombre: '√3', v: Math.sqrt(3) },
  raiz5: { nombre: '√5', v: Math.sqrt(5) },
  pi: { nombre: 'π', v: Math.PI },
  fi: { nombre: 'φ (número áureo)', v: (1 + Math.sqrt(5)) / 2 },
};

function trunc(v, d) { const f = 10 ** d; return Math.trunc(v * f) / f; }
function red(v, d) { return Number(v.toFixed(d)); }
// El error se muestra como número decimal con coma (0,0042…), como en las clases: sin notación científica
const coma = s => String(s).replace('.', ',');
const fmtE = x => { if (x < 1e-12) return '0'; const d = Math.min(12, Math.max(0, -Math.floor(Math.log10(x))) + 2); return coma(x.toFixed(d)) + '…'; };

function aproximador(host, cfg) {
  const claves = cfg.numeros || ['raiz2', 'pi', 'fi'];
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || 'Aproximá un número irracional')}</h4>
    <div class="ctrl"><label>Número: <select class="n">${claves.map(k => `<option value="${k}">${NUMS[k].nombre}</option>`).join('')}</select></label>
    <label style="flex:1">Decimales: <b class="dv">2</b><br><input type="range" min="0" max="10" value="2" class="d"></label></div>
    <table><tr><th></th><th>Valor</th><th>Error</th></tr>
    <tr><td>Truncado</td><td class="t"></td><td class="et"></td></tr>
    <tr><td>Redondeado</td><td class="r"></td><td class="er"></td></tr></table>
    <p class="ayuda" style="margin:10px 0 0" id="msg"></p></div>`;
  const q = s => host.querySelector(s);
  const act = () => {
    const nv = NUMS[q('.n').value].v, d = Number(q('.d').value);
    q('.dv').textContent = d;
    const t = trunc(nv, d), r = red(nv, d);
    q('.t').textContent = coma(t.toFixed(d)); q('.r').textContent = coma(r.toFixed(d));
    q('.et').textContent = fmtE(Math.abs(nv - t)); q('.er').textContent = fmtE(Math.abs(nv - r));
    cfg.alCambiar?.({ numero: q('.n').value, decimales: d, truncado: t, redondeado: r, distintos: t !== r });
    q('#msg').textContent = d >= 10 ? 'Aunque agregues decimales, nunca llegás al valor exacto: un irracional tiene infinitos decimales sin período.' : 'Probá con más decimales: ¿qué pasa con el error?';
  };
  q('.n').onchange = act; q('.d').oninput = act; act();
}

function sucesion(host, cfg) {
  const geo = cfg.tipo === 'geometrica';
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || (geo ? 'Armá una sucesión geométrica' : 'Armá una sucesión aritmética'))}</h4>
    <div class="ctrl"><label>Primer término a₁: <b class="av"></b><br><input type="range" min="1" max="10" value="${cfg.inicial?.a ?? 2}" class="a"></label>
    <label>${geo ? 'Razón r' : 'Diferencia d'}: <b class="rv"></b><br><input type="range" min="${geo ? 1 : -5}" max="${geo ? 5 : 10}" value="${cfg.inicial?.r ?? (geo ? 2 : 3)}" class="r"></label>
    <label>Posición n: <b class="nv"></b><br><input type="range" min="1" max="12" value="${cfg.inicial?.n ?? 6}" class="n"></label></div>
    <div class="num-grande f"></div><div class="num-grande g" style="font-size:1.1rem"></div>
    <canvas width="640" height="220"></canvas>
    <p class="ayuda" style="margin:8px 0 0">${geo ? 'En la geométrica se multiplica siempre por el mismo número.' : 'En la aritmética se suma siempre el mismo número.'}</p></div>`;
  const q = s => host.querySelector(s), cv = q('canvas'), c = cv.getContext('2d');
  const act = () => {
    const a = +q('.a').value, r = +q('.r').value, n = +q('.n').value;
    q('.av').textContent = a; q('.rv').textContent = r; q('.nv').textContent = n;
    const term = k => geo ? a * r ** (k - 1) : a + (k - 1) * r;
    const lista = Array.from({ length: n }, (_, i) => term(i + 1));
    q('.f').textContent = geo ? `aₙ = ${a} · ${r}^(n−1)` : `aₙ = ${a} + (n−1) · ${r}`;
    cfg.alCambiar?.({ a, r, n, termino: lista[n - 1] });
    q('.g').textContent = `a${n} = ${lista[n - 1]}   ·   términos: ${lista.slice(0, 8).join(', ')}${n > 8 ? ', …' : ''}`;
    c.clearRect(0, 0, 640, 220);
    const max = Math.max(...lista.map(Math.abs), 1), min = Math.min(0, ...lista);
    const rango = max - min || 1, w = 640 / 12;
    const y0 = 200 - (0 - min) / rango * 180;
    c.strokeStyle = '#B9B3CF'; c.beginPath(); c.moveTo(0, y0); c.lineTo(640, y0); c.stroke();
    lista.forEach((v, i) => {
      const h = Math.abs(v) / rango * 180;
      const grad = c.createLinearGradient(0, 0, 640, 0); grad.addColorStop(0, '#F0731E'); grad.addColorStop(1, '#5B2A86');
      c.fillStyle = grad; c.fillRect(i * w + 6, v >= 0 ? y0 - h : y0, w - 12, Math.max(h, 2));
      c.fillStyle = '#1B1A4A'; c.font = '12px sans-serif'; c.textAlign = 'center';
      c.fillText(String(v), i * w + w / 2, v >= 0 ? y0 - h - 4 : y0 + h + 12);
    });
  };
  host.querySelectorAll('input').forEach(i => i.oninput = act); act();
}

function aureo(host, cfg) {
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || 'Fibonacci y el número áureo')}</h4>
    <p class="ayuda" style="margin-top:0">Dividí cada término de la sucesión de Fibonacci por el anterior.</p>
    <label>Cantidad de términos: <b class="nv"></b><br><input type="range" min="3" max="20" value="6" class="n" style="width:100%"></label>
    <div class="tabla-wrap"><table class="tb"></table></div>
    <div class="num-grande z"></div>
    <canvas width="640" height="200"></canvas></div>`;
  const q = s => host.querySelector(s), c = q('canvas').getContext('2d');
  const FI = (1 + Math.sqrt(5)) / 2;
  const act = () => {
    const n = +q('.n').value; q('.nv').textContent = n;
    const f = [1, 1]; while (f.length < n) f.push(f[f.length - 1] + f[f.length - 2]);
    const filas = f.slice(1).map((v, i) => `<tr><td>${v}</td><td>/</td><td>${f[i]}</td><td>=</td><td>${coma((v / f[i]).toFixed(6))}</td></tr>`);
    q('.tb').innerHTML = filas.slice(-6).join('');
    const ult = f[n - 1] / f[n - 2];
    cfg.alCambiar?.({ n, cociente: ult });
    q('.z').textContent = `Último cociente ≈ ${coma(ult.toFixed(8))}   ·   φ ≈ ${coma(FI.toFixed(8))}`;
    c.clearRect(0, 0, 640, 200);
    // rectángulo con lados en proporción del último cociente
    const h = 150, w = Math.min(600, h * ult);
    const g = c.createLinearGradient(0, 0, 640, 0); g.addColorStop(0, '#F0731E'); g.addColorStop(1, '#B83A7A');
    c.fillStyle = g; c.fillRect(20, 25, w, h);
    c.fillStyle = '#fff'; c.font = 'bold 16px sans-serif'; c.fillText(`${coma(ult.toFixed(4))} : 1`, 30, 25 + h / 2);
  };
  q('.n').oninput = act; act();
}

function radical(host, cfg) {
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || 'Probá la propiedad del producto de radicales')}</h4>
    <div class="ctrl"><label>a: <b class="av"></b><br><input type="range" min="1" max="50" value="${cfg.inicial?.a ?? 4}" class="a"></label>
    <label>b: <b class="bv"></b><br><input type="range" min="1" max="50" value="${cfg.inicial?.b ?? 9}" class="b"></label></div>
    <table><tr><td>√a · √b</td><td class="x"></td></tr><tr><td>√(a · b)</td><td class="y"></td></tr><tr><td>√a + √b</td><td class="z"></td></tr><tr><td>√(a + b)</td><td class="w"></td></tr></table>
    <p class="ayuda" id="msg" style="margin:8px 0 0"></p></div>`;
  const q = s => host.querySelector(s);
  const act = () => {
    const a = +q('.a').value, b = +q('.b').value;
    q('.av').textContent = a; q('.bv').textContent = b;
    q('.x').textContent = coma((Math.sqrt(a) * Math.sqrt(b)).toFixed(6)); q('.y').textContent = coma(Math.sqrt(a * b).toFixed(6));
    q('.z').textContent = coma((Math.sqrt(a) + Math.sqrt(b)).toFixed(6)); q('.w').textContent = coma(Math.sqrt(a + b).toFixed(6));
    q('#msg').textContent = 'Compará las dos primeras filas y las dos últimas. ¿Cuáles coinciden siempre?';
    cfg.alCambiar?.({ a, b, producto: a * b, suma: a + b });
  };
  host.querySelectorAll('input').forEach(i => i.oninput = act); act();
}


/* ---------- Gráficos en SVG (para parábola, graficador y circunferencia) ---------- */
const C = { tinta: '#1B1A4A', suave: '#4A4870', grilla: '#E2DAF6', azul: '#4B4FA3', mag: '#B83A7A', nar: '#B26A00', ok: '#1F9D6B' };
const fx = (v, d = 2) => coma(String(Math.round(v * 10 ** d) / 10 ** d));
function ejes(W, H, X, Y, xr, yr) {
  let g = '';
  for (let x = Math.ceil(xr[0]); x <= xr[1]; x++) g += `<line x1="${X(x)}" y1="0" x2="${X(x)}" y2="${H}" stroke="${C.grilla}" stroke-width="1"/>`;
  for (let y = Math.ceil(yr[0]); y <= yr[1]; y++) g += `<line x1="0" y1="${Y(y)}" x2="${W}" y2="${Y(y)}" stroke="${C.grilla}" stroke-width="1"/>`;
  g += `<line x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}" stroke="${C.suave}" stroke-width="2"/><line x1="${X(0)}" y1="0" x2="${X(0)}" y2="${H}" stroke="${C.suave}" stroke-width="2"/>`;
  for (let x = Math.ceil(xr[0]); x <= xr[1]; x++) if (x && x % 2 === 0) g += `<text x="${X(x)}" y="${Y(0) + 16}" font-size="12" text-anchor="middle" fill="${C.suave}">${x}</text>`;
  for (let y = Math.ceil(yr[0]); y <= yr[1]; y++) if (y && y % 2 === 0) g += `<text x="${X(0) - 6}" y="${Y(y) + 4}" font-size="12" text-anchor="end" fill="${C.suave}">${y}</text>`;
  return g;
}
// Traza una función y corta el trazo donde la curva se va de la ventana (asíntotas)
function curva(f, X, Y, xr, yr, color) {
  let d = '', abierto = false;
  const N = 600;
  for (let i = 0; i <= N; i++) {
    const x = xr[0] + (xr[1] - xr[0]) * i / N, y = f(x);
    if (!isFinite(y) || y < yr[0] - 4 || y > yr[1] + 4) { abierto = false; continue; }
    d += `${abierto ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(y).toFixed(1)}`; abierto = true;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>`;
}
const control = (k, txt, min, max, paso, v) => `<label>${txt}: <b class="v-${k}"></b><br><input type="range" min="${min}" max="${max}" step="${paso}" value="${v}" data-k="${k}"></label>`;

// Parábola y = ax² + bx + c: discriminante y cantidad de raíces.
// cfg.inicial = {a, b, c}; cfg.fijos = ['a', 'b'] oculta esos controles.
function parabola(host, cfg) {
  const ini = { a: 1, b: 0, c: -4, ...(cfg.inicial || {}) }, fijos = cfg.fijos || [];
  const ctrls = [['a', 'a', -3, 3, 0.5], ['b', 'b', -6, 6, 1], ['c', 'c', -6, 6, 1]].filter(x => !fijos.includes(x[0]));
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || 'La parábola y sus raíces')}</h4>
    <div class="ctrl">${ctrls.map(([k, t, mi, ma, pa]) => control(k, t, mi, ma, pa, ini[k])).join('')}</div>
    <div class="num-grande f" style="font-size:1.15rem"></div>
    <div class="sim-svg"></div><p class="ayuda r" style="margin:6px 0 0"></p></div>`;
  const q = s => host.querySelector(s), v = { ...ini };
  const W = 640, H = 300, xr = [-7, 7], yr = [-8, 8];
  const X = x => (x - xr[0]) / (xr[1] - xr[0]) * W, Y = y => H - (y - yr[0]) / (yr[1] - yr[0]) * H;
  const act = () => {
    host.querySelectorAll('input[data-k]').forEach(i => { v[i.dataset.k] = +i.value; host.querySelector('.v-' + i.dataset.k).textContent = coma(i.value); });
    if (v.a === 0) v.a = 0.5;
    const { a, b, c } = v, D = b * b - 4 * a * c;
    const raices = D > 1e-9 ? 2 : Math.abs(D) <= 1e-9 ? 1 : 0;
    const xs = raices === 2 ? [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, r) => p - r) : raices === 1 ? [-b / (2 * a)] : [];
    const sg = n => n < 0 ? `− ${coma(String(-n))}` : `+ ${coma(String(n))}`;
    const ax = a === 1 ? '' : a === -1 ? '−' : coma(String(a));
    q('.f').textContent = `y = ${ax}x² ${sg(b)}x ${sg(c)}   ·   Δ = b² − 4ac = ${fx(D)}`;
    q('.r').textContent = raices === 2 ? `Δ > 0: dos raíces, x₁ ≈ ${fx(xs[0])} y x₂ ≈ ${fx(xs[1])}.` : raices === 1 ? `Δ = 0: una sola raíz, x = ${fx(xs[0])}. La parábola toca el eje x en un punto.` : 'Δ < 0: no tiene raíces reales. La parábola no corta el eje x.';
    q('.sim-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de la parábola">${ejes(W, H, X, Y, xr, yr)}${curva(x => a * x * x + b * x + c, X, Y, xr, yr, C.azul)}${xs.map(x => `<circle cx="${X(x)}" cy="${Y(0)}" r="7" fill="${C.mag}"/>`).join('')}</svg>`;
    cfg.alCambiar?.({ a, b, c, delta: D, raices });
  };
  host.querySelectorAll('input').forEach(i => i.oninput = act); act();
}

// Graficador de familias de funciones. cfg.familias: potencia, racional, exponencial, logaritmo.
const FAMILIAS = {
  potencia: { nombre: 'Polinómica y = a·xⁿ', ctrls: [['a', 'a', -3, 3, 0.5, 1], ['n', 'n', 2, 4, 1, 2]], f: v => x => v.a * x ** v.n, txt: v => `y = ${coma(String(v.a))} · x${['', '', '²', '³', '⁴'][v.n]}` },
  racional: { nombre: 'Racional y = k / (x − h)', ctrls: [['k', 'k', -6, 6, 1, 2], ['h', 'h', -4, 4, 1, 0]], f: v => x => v.k / (x - v.h), txt: v => `y = ${v.k} / (x ${v.h < 0 ? '+ ' + -v.h : '− ' + v.h})   ·   asíntotas: x = ${v.h} e y = 0` },
  exponencial: { nombre: 'Exponencial y = aˣ', ctrls: [['a', 'base a', 0.25, 4, 0.25, 2]], f: v => x => v.a ** x, txt: v => `y = ${coma(String(v.a))}ˣ   ·   ${v.a > 1 ? 'crece' : v.a < 1 ? 'decrece' : 'es constante'}` },
  logaritmo: { nombre: 'Logarítmica y = logₐ x', ctrls: [['a', 'base a', 0.25, 4, 0.25, 2]], f: v => x => (x > 0 && v.a !== 1 ? Math.log(x) / Math.log(v.a) : NaN), txt: v => `y = log de base ${coma(String(v.a))} de x   ·   ${v.a > 1 ? 'crece' : v.a < 1 ? 'decrece' : 'la base 1 no sirve'}` },
};
function graficador(host, cfg) {
  const fams = cfg.familias || ['potencia'];
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || 'Graficador')}</h4>
    ${fams.length > 1 ? `<label>Familia: <select class="fam">${fams.map(k => `<option value="${k}">${FAMILIAS[k].nombre}</option>`).join('')}</select></label>` : ''}
    <div class="ctrl"></div><div class="num-grande f" style="font-size:1.1rem"></div><div class="sim-svg"></div></div>`;
  const q = s => host.querySelector(s);
  const W = 640, H = 320, xr = [-7, 7], yr = [-7, 7];
  const X = x => (x - xr[0]) / (xr[1] - xr[0]) * W, Y = y => H - (y - yr[0]) / (yr[1] - yr[0]) * H;
  let fam = fams[0];
  const montar = () => {
    const F = FAMILIAS[fam], ini = { ...(cfg.inicial || {}) };
    q('.ctrl').innerHTML = F.ctrls.map(([k, t, mi, ma, pa, v]) => control(k, t, mi, ma, pa, ini[k] ?? v)).join('');
    q('.ctrl').querySelectorAll('input').forEach(i => i.oninput = act); act();
  };
  const act = () => {
    const F = FAMILIAS[fam], v = {};
    q('.ctrl').querySelectorAll('input').forEach(i => { v[i.dataset.k] = +i.value; host.querySelector('.v-' + i.dataset.k).textContent = coma(i.value); });
    q('.f').textContent = F.txt(v);
    let extra = '';
    if (fam === 'racional') extra = `<line x1="${X(v.h)}" y1="0" x2="${X(v.h)}" y2="${H}" stroke="${C.nar}" stroke-width="2" stroke-dasharray="7 6"/>`;
    if (fam === 'exponencial') extra = `<circle cx="${X(0)}" cy="${Y(1)}" r="6" fill="${C.mag}"/>`;
    if (fam === 'logaritmo') extra = `<circle cx="${X(1)}" cy="${Y(0)}" r="6" fill="${C.mag}"/>`;
    // punto que la consigna pide alcanzar (cfg.punto = [x, y]), marcado como objetivo
    const meta = cfg.punto ? `<circle cx="${X(cfg.punto[0])}" cy="${Y(cfg.punto[1])}" r="10" fill="none" stroke="${C.ok}" stroke-width="3" stroke-dasharray="4 3"/><text x="${X(cfg.punto[0]) + 14}" y="${Y(cfg.punto[1]) - 10}" font-size="14" font-weight="700" fill="${C.ok}">(${coma(String(cfg.punto[0]))}, ${coma(String(cfg.punto[1]))})</text>` : '';
    q('.sim-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de la función">${ejes(W, H, X, Y, xr, yr)}${extra}${meta}${curva(F.f(v), X, Y, xr, yr, C.azul)}</svg>`;
    cfg.alCambiar?.({ familia: fam, ...v, par: v.n !== undefined ? v.n % 2 === 0 : undefined, negativo: v.a < 0 });
  };
  q('.fam')?.addEventListener('change', e => { fam = e.target.value; montar(); });
  montar();
}

// Circunferencia trigonométrica: ángulo, seno y coseno.
function circulo(host, cfg) {
  const paso = cfg.paso || 15;
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || 'Circunferencia trigonométrica')}</h4>
    <label style="display:block">Ángulo: <b class="av"></b><br><input type="range" min="0" max="360" step="${paso}" value="${cfg.inicial ?? 30}" class="a" style="width:100%"></label>
    <div class="sim-svg"></div>
    <table><tr><td>seno</td><td class="s"></td></tr><tr><td>coseno</td><td class="c"></td></tr><tr><td>cuadrante</td><td class="q"></td></tr></table></div>`;
  const q = s => host.querySelector(s);
  const W = 360, H = 360, R = 140, cx = 180, cy = 180;
  const act = () => {
    const g = +q('.a').value, r = g * Math.PI / 180;
    const co = Math.abs(Math.cos(r)) < 1e-9 ? 0 : Math.cos(r), se = Math.abs(Math.sin(r)) < 1e-9 ? 0 : Math.sin(r);
    const px = cx + R * co, py = cy - R * se;
    const cuad = [0, 90, 180, 270, 360].includes(g) ? 'sobre un eje' : g < 90 ? 'primero' : g < 180 ? 'segundo' : g < 270 ? 'tercero' : 'cuarto';
    const grande = g > 180 ? 1 : 0, ar = 34;
    const arco = g === 0 ? '' : g === 360 ? `<circle cx="${cx}" cy="${cy}" r="${ar}" fill="none" stroke="${C.ok}" stroke-width="3"/>` : `<path d="M${cx + ar} ${cy} A${ar} ${ar} 0 ${grande} 0 ${cx + ar * co} ${cy - ar * se}" fill="none" stroke="${C.ok}" stroke-width="3"/>`;
    q('.av').textContent = g + '°';
    q('.s').textContent = fx(se, 3); q('.c').textContent = fx(co, 3); q('.q').textContent = cuad;
    q('.sim-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="max-width:360px;display:block;margin:auto" role="img" aria-label="Circunferencia trigonométrica con un ángulo de ${g} grados">
      <line x1="10" y1="${cy}" x2="${W - 10}" y2="${cy}" stroke="${C.suave}" stroke-width="2"/><line x1="${cx}" y1="10" x2="${cx}" y2="${H - 10}" stroke="${C.suave}" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${C.grilla}" stroke-width="3"/>
      <text x="${cx + R + 6}" y="${cy - 6}" font-size="14" fill="${C.suave}">1</text><text x="${cx + 6}" y="${cy - R - 4}" font-size="14" fill="${C.suave}">1</text>
      ${arco}<line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="${C.tinta}" stroke-width="3"/>
      <line x1="${cx}" y1="${cy}" x2="${px}" y2="${cy}" stroke="${C.nar}" stroke-width="6" stroke-linecap="round"/>
      <line x1="${px}" y1="${cy}" x2="${px}" y2="${py}" stroke="${C.mag}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="${px}" cy="${py}" r="8" fill="${C.azul}"/>
      <text x="${(cx + px) / 2}" y="${cy + (se >= 0 ? 22 : -10)}" font-size="15" font-weight="700" text-anchor="middle" fill="${C.nar}">cos</text>
      <text x="${px + (co >= 0 ? 10 : -10)}" y="${(cy + py) / 2 + 5}" font-size="15" font-weight="700" text-anchor="${co >= 0 ? 'start' : 'end'}" fill="${C.mag}">sen</text></svg>`;
    cfg.alCambiar?.({ angulo: g, seno: se, coseno: co, cuadrante: cuad });
  };
  q('.a').oninput = act; act();
}

// Dispersión: cinco datos entre 0 y 10 sobre una recta, con la media y la franja media ± desviación estándar.
function dispersion(host, cfg) {
  const ini = cfg.inicial || [4, 5, 5, 6, 5];
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || 'Cinco datos y su dispersión')}</h4>
    <div class="ctrl">${ini.map((v, i) => control('d' + i, 'Dato ' + (i + 1), 0, 10, 1, v)).join('')}</div>
    <div class="sim-svg"></div>
    <table><tr><td>media</td><td class="m"></td></tr><tr><td>varianza</td><td class="va"></td></tr><tr><td>desviación estándar</td><td class="de"></td></tr></table></div>`;
  const q = s => host.querySelector(s);
  const W = 640, H = 210, X = v => 40 + v * 56, base = 150;
  const act = () => {
    const d = [...host.querySelectorAll('input[data-k]')].map(i => { host.querySelector('.v-' + i.dataset.k).textContent = i.value; return +i.value; });
    const n = d.length, m = d.reduce((a, b) => a + b, 0) / n;
    const va = d.reduce((a, b) => a + (b - m) ** 2, 0) / n, de = Math.sqrt(va);
    q('.m').textContent = fx(m); q('.va').textContent = fx(va); q('.de').textContent = fx(de);
    const pila = {};
    const puntos = d.map(v => { pila[v] = (pila[v] || 0) + 1; return `<circle cx="${X(v)}" cy="${base - 16 - (pila[v] - 1) * 26}" r="11" fill="${C.azul}"/>`; }).join('');
    let ticks = '';
    for (let k = 0; k <= 10; k++) ticks += `<line x1="${X(k)}" y1="${base - 6}" x2="${X(k)}" y2="${base + 6}" stroke="${C.suave}" stroke-width="2"/><text x="${X(k)}" y="${base + 26}" font-size="14" text-anchor="middle" fill="${C.suave}">${k}</text>`;
    const banda = `<rect x="${X(Math.max(0, m - de))}" y="20" width="${X(Math.min(10, m + de)) - X(Math.max(0, m - de))}" height="${base - 20}" fill="${C.nar}" fill-opacity=".12"/>`;
    q('.sim-svg').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Los cinco datos sobre una recta del 0 al 10, con la media marcada">${banda}
      <line x1="20" y1="${base}" x2="${W - 20}" y2="${base}" stroke="${C.suave}" stroke-width="3"/>${ticks}${puntos}
      <line x1="${X(m)}" y1="14" x2="${X(m)}" y2="${base}" stroke="${C.mag}" stroke-width="3" stroke-dasharray="7 5"/>
      <text x="${X(m)}" y="${H - 8}" font-size="15" font-weight="700" text-anchor="middle" fill="${C.mag}">media ${fx(m)}</text></svg>`;
    cfg.alCambiar?.({ media: m, varianza: va, desvio: de });
  };
  host.querySelectorAll('input').forEach(i => i.oninput = act); act();
}

export const SIMS = { aproximador, sucesion, aureo, radical, parabola, graficador, circulo, dispersion };
export function montarSim(host, cfg) {
  const f = SIMS[cfg.sim];
  if (f) f(host, cfg); else host.innerHTML = '<p class="ayuda">Simulación no disponible.</p>';
}
