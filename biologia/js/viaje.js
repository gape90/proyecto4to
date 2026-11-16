// El viaje del bocado: la vista acompaña a un bocado por el tubo digestivo y se detiene en cada órgano.
// En cada parada el estudiante dice dónde está; al acertar aparece lo que le pasa ahí al alimento.
import { esc, md } from './estado.js';
import { pantallaCompleta } from './pantalla.js';

const mezclar = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const quieto = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const suave = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

export function bViaje(w, b, resuelto, marcar) {
  const paradas = b.paradas;
  w.innerHTML = `<div class="interactivo modelo3d viaje ${resuelto ? 'resuelto' : ''}"><div class="etq">${esc(b.etiqueta || '🧭 De viaje')}</div>
    ${b.titulo ? `<h3>${esc(b.titulo)}</h3>` : ''}<div class="consigna">${md(b.consigna)}</div>
    <div class="m3d-cols"><div class="m3d-izq"><div class="m3d-caja"><div class="m3d-lienzo vj-lienzo" role="img" aria-label="${esc(b.alt || '')}"><div class="m3d-cargando">Cargando el dibujo…</div></div></div></div>
    <div class="m3d-der"><div class="vj-panel" aria-live="polite"></div></div></div>
    ${b.fuente ? `<p class="m3d-pie">${md(b.fuente)}</p>` : ''}</div>`;
  const raiz = w.firstElementChild, lienzo = raiz.querySelector('.vj-lienzo'), panel = raiz.querySelector('.vj-panel');
  pantallaCompleta(raiz);

  let sv, camino, bolo, cartel, total = 0, largos = [];
  let L = 0, cam = { x: 175, y: 410, h: 860 }, objCam = { h: 860 }, anim = null, n = -1;

  const punto = l => camino.getPointAtLength(Math.max(0, Math.min(total, l)));
  const ponerVista = () => {
    const r = lienzo.getBoundingClientRect(); const asp = r.width && r.height ? r.width / r.height : 1;
    const h = cam.h, ww = h * asp;
    sv.setAttribute('viewBox', `${(cam.x - ww / 2).toFixed(1)} ${(cam.y - h / 2).toFixed(1)} ${ww.toFixed(1)} ${h.toFixed(1)}`);
  };
  const ponerBolo = () => { const p = punto(L); bolo.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`); return p; };
  const centroGeneral = () => ({ x: 175, y: 430, h: 880 });

  // Mueve el bocado hasta el largo `hasta` y la cámara la acompaña; al terminar llama a `listo`.
  const viajar = (hasta, h, listo) => {
    cancelAnimationFrame(anim);
    const desde = L, c0 = { ...cam }, dur = quieto() ? 0 : Math.min(5000, Math.max(1400, Math.abs(hasta - desde) / 0.075));
    const t0 = performance.now();
    const paso = ahora => {
      const k = dur ? Math.min(1, (ahora - t0) / dur) : 1, e = suave(k);
      L = desde + (hasta - desde) * e;
      const p = ponerBolo();
      const kc = Math.min(1, k * 1.6);
      cam.h = c0.h + (h - c0.h) * suave(kc);
      cam.x = c0.x + (p.x - c0.x) * suave(kc); cam.y = c0.y + (p.y - c0.y) * suave(kc);
      ponerVista();
      if (k < 1) anim = requestAnimationFrame(paso); else listo?.();
    };
    anim = requestAnimationFrame(paso);
  };
  const alejar = listo => {
    cancelAnimationFrame(anim);
    const c0 = { ...cam }, c1 = centroGeneral(), dur = quieto() ? 0 : 1600, t0 = performance.now();
    const paso = ahora => {
      const k = dur ? Math.min(1, (ahora - t0) / dur) : 1, e = suave(k);
      cam.x = c0.x + (c1.x - c0.x) * e; cam.y = c0.y + (c1.y - c0.y) * e; cam.h = c0.h + (c1.h - c0.h) * e;
      ponerVista(); if (k < 1) anim = requestAnimationFrame(paso); else listo?.();
    };
    anim = requestAnimationFrame(paso);
  };
  const mostrarCartel = texto => {
    const p = punto(L); const t = cartel.querySelector('text');
    t.textContent = texto; t.setAttribute('x', p.x.toFixed(1)); t.setAttribute('y', (p.y - 18).toFixed(1));
    cartel.setAttribute('opacity', '1');
  };
  const ocultarCartel = () => cartel.setAttribute('opacity', '0');

  const contador = i => `<div class="vj-cont"><span>Parada ${i + 1} de ${paradas.length}</span><div class="vj-puntos">${paradas.map((_, k) => `<i class="${k < i ? 'ya' : k === i ? 'ahora' : ''}"></i>`).join('')}</div></div>`;

  const inicio = () => {
    n = -1; L = 0; ocultarCartel(); Object.assign(cam, centroGeneral()); ponerBolo(); ponerVista();
    panel.innerHTML = `<p class="vj-intro">${md(b.intro)}</p><button type="button" class="btn vj-ir">Empezar el viaje</button>`;
    panel.querySelector('.vj-ir').onclick = () => siguiente();
  };
  const siguiente = () => {
    n++; ocultarCartel();
    const par = paradas[n];
    panel.innerHTML = `${contador(n)}<p class="vj-viajando">${md(par.camino || 'Avanzás por el tubo digestivo…')}</p>`;
    viajar(largos[n], par.zoom || 300, () => preguntar());
  };
  const preguntar = () => {
    const par = paradas[n];
    const orden = mezclar(par.opciones.map((_, i) => i));
    panel.innerHTML = `${contador(n)}<div class="consigna">¿Dónde estás ahora?</div>
      <div class="opc-lista">${orden.map(i => `<button type="button" class="opc-btn" data-i="${i}">${esc(par.opciones[i])}</button>`).join('')}</div><div class="fbz"></div>`;
    const fb = panel.querySelector('.fbz');
    panel.querySelectorAll('.opc-btn').forEach(x => x.onclick = () => {
      if (+x.dataset.i === par.correcta) llegar();
      else { x.classList.add('mal'); x.disabled = true; fb.innerHTML = `<div class="fb mal"><b>Todavía no.</b> ${md(par.pista)}</div>`; }
    });
    panel.querySelector('.opc-btn')?.focus({ preventScroll: true });
  };
  const llegar = () => {
    const par = paradas[n], ultima = n === paradas.length - 1;
    mostrarCartel(par.opciones[par.correcta]);
    panel.innerHTML = `${contador(n)}<div class="vj-tarjeta"><div class="vj-lugar">📍 ${esc(par.titulo)}</div>${md(par.texto)}</div>
      <button type="button" class="btn vj-ir">${ultima ? 'Terminar el viaje' : 'Seguir el viaje'}</button>`;
    panel.querySelector('.vj-ir').onclick = () => ultima ? fin(true) : siguiente();
    panel.querySelector('.vj-ir').focus({ preventScroll: true });
  };
  const fin = nuevo => {
    ocultarCartel();
    if (!nuevo) { L = total; ponerBolo(); Object.assign(cam, centroGeneral()); ponerVista(); }
    else alejar();
    panel.innerHTML = `<div class="fb ok"><b>¡Llegaste al final del tubo digestivo!</b> ${md(b.cierre)}</div><button type="button" class="btn chico suave vj-otra">Hacer el viaje otra vez</button>`;
    panel.querySelector('.vj-otra').onclick = inicio;
    if (nuevo) { raiz.classList.add('resuelto'); marcar(); }
  };

  fetch(b.svg).then(r => { if (!r.ok) throw 0; return r.text(); }).then(t => {
    lienzo.innerHTML = t;
    sv = lienzo.querySelector('svg'); sv.setAttribute('preserveAspectRatio', 'xMidYMid meet'); sv.setAttribute('aria-hidden', 'true');
    camino = sv.querySelector('#vj-camino'); bolo = sv.querySelector('#vj-bolo'); cartel = sv.querySelector('#vj-cartel');
    total = camino.getTotalLength();
    // dónde queda cada parada sobre el recorrido: el punto más cercano a la marca, siempre después de la parada anterior
    let desde = 0;
    largos = paradas.map(par => {
      let mejor = desde, dmin = Infinity;
      for (let l = desde; l <= total; l += 2) { const p = camino.getPointAtLength(l); const d = Math.hypot(p.x - par.x, p.y - par.y); if (d < dmin) { dmin = d; mejor = l; } }
      desde = mejor + 4; return mejor;
    });
    if (window.ResizeObserver) new ResizeObserver(() => ponerVista()).observe(lienzo);
    resuelto ? fin(false) : inicio();
  }).catch(() => { lienzo.innerHTML = `<p class="ayuda" style="padding:14px">${md(b.alt || 'No se pudo cargar el dibujo.')}</p>`; });
  return true;
}
