// "Tocá en la imagen": sobre una lámina hay puntos marcados; en cada pregunta el estudiante toca el que corresponde.
import { esc, md } from './estado.js';
import { pantallaCompleta } from './pantalla.js';

export function bTocar(w, b, resuelto, marcar) {
  const preg = b.preguntas;
  w.innerHTML = `<div class="interactivo modelo3d tocar ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || '👆 Tocá en la imagen')}</div>
    ${b.titulo ? `<h3>${esc(b.titulo)}</h3>` : ''}<div class="consigna">${md(b.consigna)}</div>
    <div class="m3d-cols"><div class="m3d-izq"><div class="m3d-caja"><div class="m3d-lienzo tc-lienzo" role="group" aria-label="${esc(b.alt || '')}"><div class="m3d-cargando">Cargando el dibujo…</div></div></div></div>
    <div class="m3d-der"><div class="tc-panel" aria-live="polite"></div></div></div>
    ${b.fuente ? `<p class="m3d-pie">${md(b.fuente)}</p>` : ''}</div>`;
  const raiz = w.firstElementChild, lienzo = raiz.querySelector('.tc-lienzo'), panel = raiz.querySelector('.tc-panel');
  pantallaCompleta(raiz);
  let n = 0, puntos = {}, esperando = false;

  const contador = () => `<div class="vj-cont"><span>Pregunta ${Math.min(n + 1, preg.length)} de ${preg.length}</span><div class="vj-puntos">${preg.map((_, k) => `<i class="${k < n ? 'ya' : k === n ? 'ahora' : ''}"></i>`).join('')}</div></div>`;
  const limpiar = () => Object.values(puntos).forEach(p => p.g.classList.remove('bien', 'mal'));
  const preguntar = () => {
    esperando = true; limpiar();
    const q = preg[n];
    panel.innerHTML = `${contador()}<div class="consigna">${md(q.pregunta)}</div><p class="ayuda tc-ayuda">Tocá uno de los puntos del dibujo.</p><div class="fbz"></div>`;
  };
  const tocar = id => {
    if (!esperando) return;
    const q = preg[n], p = puntos[id], fb = panel.querySelector('.fbz');
    const ok = [].concat(q.correcta).includes(id);
    limpiar(); p.g.classList.add(ok ? 'bien' : 'mal');
    if (!ok) { fb.innerHTML = `<div class="fb mal"><b>Ese es ${esc(p.nombre_con_articulo)}.</b> ${md(q.pista)}</div>`; return; }
    esperando = false; p.g.classList.add('nombrado');
    const ultima = n === preg.length - 1;
    fb.innerHTML = `<div class="fb ok"><b>¡Bien! Es ${esc(p.nombre_con_articulo)}.</b> ${md(q.explicacion)}</div><button type="button" class="btn tc-sig">${ultima ? 'Terminar' : 'Siguiente pregunta'}</button>`;
    const sig = fb.querySelector('.tc-sig'); sig.focus({ preventScroll: true });
    sig.onclick = () => { n++; if (ultima) fin(true); else preguntar(); };
  };
  const fin = nuevo => {
    esperando = false; n = preg.length;
    Object.values(puntos).forEach(p => p.g.classList.add('nombrado'));
    panel.innerHTML = `${contador()}<div class="fb ok"><b>¡Listo!</b> ${md(b.cierre || 'Ya ubicaste todos los órganos.')}</div><button type="button" class="btn chico suave tc-otra">Hacerlo otra vez</button>`;
    panel.querySelector('.tc-otra').onclick = () => { n = 0; Object.values(puntos).forEach(p => p.g.classList.remove('nombrado')); preguntar(); };
    if (nuevo) { raiz.classList.add('resuelto'); marcar(); }
  };

  fetch(b.svg).then(r => { if (!r.ok) throw 0; return r.text(); }).then(t => {
    lienzo.innerHTML = t;
    const sv = lienzo.querySelector('svg'); sv.setAttribute('preserveAspectRatio', 'xMidYMid meet'); if (b.vista) sv.setAttribute('viewBox', b.vista);
    const NS = 'http://www.w3.org/2000/svg', capa = document.createElementNS(NS, 'g');
    b.puntos.forEach(pt => {
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'tc-punto'); g.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button'); g.setAttribute('aria-label', `Punto ${pt.orden || ''}`.trim());
      g.innerHTML = `<circle class="tc-area" r="${pt.r || 14}"/><circle class="tc-anillo" r="7"/><circle class="tc-centro" r="3.5"/>
        <text class="tc-nombre" y="${pt.arriba ? -12 : 19}" text-anchor="middle">${esc(pt.nombre)}</text>`;
      g.addEventListener('click', () => tocar(pt.id));
      g.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tocar(pt.id); } });
      capa.appendChild(g);
      puntos[pt.id] = { g, nombre: pt.nombre, nombre_con_articulo: pt.articulo || pt.nombre };
    });
    sv.appendChild(capa);
    resuelto ? fin(false) : preguntar();
  }).catch(() => { lienzo.innerHTML = `<p class="ayuda" style="padding:14px">${md(b.alt || 'No se pudo cargar el dibujo.')}</p>`; });
  return true;
}
