// Pantalla completa para actividades grandes en celulares y tabletas angostas: la figura arriba, las opciones abajo, todo a la vista.
// En compu el mismo bloque se acomoda en dos columnas con CSS y este botón no se muestra.
export function pantallaCompleta(raiz) {
  if (raiz.querySelector('.pant-abrir')) return;
  const abrir = document.createElement('button');
  abrir.type = 'button'; abrir.className = 'btn chico pant-abrir'; abrir.textContent = '⤢ Resolver en pantalla completa';
  const cerrar = document.createElement('button');
  cerrar.type = 'button'; cerrar.className = 'btn chico sec pant-cerrar'; cerrar.textContent = '✕ Volver a la clase';
  const cons = raiz.querySelector('.consigna');
  (cons ? cons : raiz.querySelector('.etq')).after(abrir);
  raiz.prepend(cerrar);
  // en un esquema, la figura se achica para que entre entera en el alto que queda (sin pasar de cierto tamaño mínimo)
  const izq = raiz.querySelector('.esq-izq'), media = raiz.querySelector('.esq-izq .fig-media');
  const ajustar = () => {
    if (!media) return;
    if (!raiz.classList.contains('pant')) { media.style.width = ''; media.style.margin = ''; return; }
    const sv = media.querySelector('svg'); const vb = sv && sv.viewBox && sv.viewBox.baseVal;
    if (!vb || !vb.width) return;
    const ancho = izq.clientWidth, alto = izq.clientHeight, ratio = vb.width / vb.height;
    media.style.width = Math.round(Math.max(ancho * 0.64, Math.min(ancho, alto * ratio))) + 'px'; media.style.margin = '0 auto';
  };
  if (izq && window.ResizeObserver) new ResizeObserver(ajustar).observe(izq);
  const poner = on => {
    raiz.classList.toggle('pant', on);
    document.documentElement.classList.toggle('pant-abierta', on);
    if (on) cerrar.focus(); else abrir.focus({ preventScroll: true });
    window.dispatchEvent(new Event('resize'));
    ajustar(); setTimeout(ajustar, 150);
  };
  abrir.addEventListener('click', () => poner(true));
  cerrar.addEventListener('click', () => poner(false));
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && raiz.classList.contains('pant')) poner(false); });
}
