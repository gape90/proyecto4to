// POTENCIAR · simulaciones interactivas de Matemática
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
const fmtE = x => x === 0 ? '0' : x.toExponential(2).replace('e', ' × 10^').replace('+', '');

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
    q('.t').textContent = t.toFixed(d); q('.r').textContent = r.toFixed(d);
    q('.et').textContent = fmtE(Math.abs(nv - t)); q('.er').textContent = fmtE(Math.abs(nv - r));
    q('#msg').textContent = d >= 10 ? 'Aunque agregues decimales, nunca llegás al valor exacto: un irracional tiene infinitos decimales sin período.' : 'Probá con más decimales: ¿qué pasa con el error?';
  };
  q('.n').onchange = act; q('.d').oninput = act; act();
}

function sucesion(host, cfg) {
  const geo = cfg.tipo === 'geometrica';
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || (geo ? 'Armá una sucesión geométrica' : 'Armá una sucesión aritmética'))}</h4>
    <div class="ctrl"><label>Primer término a₁: <b class="av"></b><br><input type="range" min="1" max="10" value="2" class="a"></label>
    <label>${geo ? 'Razón r' : 'Diferencia d'}: <b class="rv"></b><br><input type="range" min="${geo ? 1 : -5}" max="${geo ? 5 : 10}" value="${geo ? 2 : 3}" class="r"></label>
    <label>Posición n: <b class="nv"></b><br><input type="range" min="1" max="12" value="6" class="n"></label></div>
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
    const filas = f.slice(1).map((v, i) => `<tr><td>${v}</td><td>/</td><td>${f[i]}</td><td>=</td><td>${(v / f[i]).toFixed(6)}</td></tr>`);
    q('.tb').innerHTML = filas.slice(-6).join('');
    const ult = f[n - 1] / f[n - 2];
    q('.z').textContent = `Último cociente ≈ ${ult.toFixed(8)}   ·   φ ≈ ${FI.toFixed(8)}`;
    c.clearRect(0, 0, 640, 200);
    // rectángulo con lados en proporción del último cociente
    const h = 150, w = Math.min(600, h * ult);
    const g = c.createLinearGradient(0, 0, 640, 0); g.addColorStop(0, '#F0731E'); g.addColorStop(1, '#B83A7A');
    c.fillStyle = g; c.fillRect(20, 25, w, h);
    c.fillStyle = '#fff'; c.font = 'bold 16px sans-serif'; c.fillText(`${ult.toFixed(4)} : 1`, 30, 25 + h / 2);
  };
  q('.n').oninput = act; act();
}

function radical(host, cfg) {
  host.innerHTML = `<div class="sim"><h4>${esc(cfg.titulo || 'Probá la propiedad del producto de radicales')}</h4>
    <div class="ctrl"><label>a: <b class="av"></b><br><input type="range" min="1" max="50" value="4" class="a"></label>
    <label>b: <b class="bv"></b><br><input type="range" min="1" max="50" value="9" class="b"></label></div>
    <table><tr><td>√a · √b</td><td class="x"></td></tr><tr><td>√(a · b)</td><td class="y"></td></tr><tr><td>√a + √b</td><td class="z"></td></tr><tr><td>√(a + b)</td><td class="w"></td></tr></table>
    <p class="ayuda" id="msg" style="margin:8px 0 0"></p></div>`;
  const q = s => host.querySelector(s);
  const act = () => {
    const a = +q('.a').value, b = +q('.b').value;
    q('.av').textContent = a; q('.bv').textContent = b;
    q('.x').textContent = (Math.sqrt(a) * Math.sqrt(b)).toFixed(6); q('.y').textContent = Math.sqrt(a * b).toFixed(6);
    q('.z').textContent = (Math.sqrt(a) + Math.sqrt(b)).toFixed(6); q('.w').textContent = Math.sqrt(a + b).toFixed(6);
    q('#msg').textContent = 'Compará las dos primeras filas y las dos últimas. ¿Cuáles coinciden siempre?';
  };
  host.querySelectorAll('input').forEach(i => i.oninput = act); act();
}

export const SIMS = { aproximador, sucesion, aureo, radical };
export function montarSim(host, cfg) {
  const f = SIMS[cfg.sim];
  if (f) f(host, cfg); else host.innerHTML = '<p class="ayuda">Simulación no disponible.</p>';
}
