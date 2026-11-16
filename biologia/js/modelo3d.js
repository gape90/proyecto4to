// Bloque "modelo3d": un modelo 3D que se gira, se corta y se toca, con un desafío al final.
// Three.js se carga recién cuando el bloque aparece (carga diferida) y sin conexión externa: está en js/vendor/.
// Si el dispositivo no puede mostrar 3D, queda la lista de partes con sus explicaciones y el desafío se resuelve igual.
import { esc, md } from './estado.js';
import { pantallaCompleta } from './pantalla.js';

let promesaThree = null;
const cargarThree = () => promesaThree || (promesaThree = import('./vendor/three.module.min.js'));

const hayWebGL = () => {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
};
const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ modelos */
// Cada modelo devuelve { grupo, partes: { id: [mallas] }, radio }.
// Las mallas con userData.parte son las que se pueden tocar.
const MODELOS = {
  'celula-animal'(T) {
    const grupo = new T.Group();
    const partes = {}, flotan = [], focos = {};
    const reg = (id, m) => { m.userData.parte = id; (partes[id] ||= []).push(m); return m; };
    // material "orgánico": brillo suave, un velo de terciopelo (sheen) y una capa barnizada leve
    const mat = (color, o = {}) => new T.MeshPhysicalMaterial({ color, roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.45,
      sheen: 0.5, sheenColor: new T.Color(0xffffff), sheenRoughness: 0.55, transparent: true, ...o });
    // borde luminoso (efecto Fresnel): da volumen a las envolturas translúcidas
    const rim = (m, color, fuerza) => {
      const u = { value: fuerza }; m.userData.rim = u; m.userData.rim0 = fuerza;
      m.onBeforeCompile = sh => {
        sh.uniforms.uRim = { value: new T.Color(color) }; sh.uniforms.uRimF = u;
        sh.fragmentShader = 'uniform vec3 uRim;\nuniform float uRimF;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
          '#include <dithering_fragment>\n  float fr = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition))), 2.4);\n  gl_FragColor.rgb += uRim * fr * uRimF;\n  gl_FragColor.a = clamp(gl_FragColor.a + fr * 0.6 * uRimF, 0.0, 1.0);');
      };
      m.customProgramCacheKey = () => 'rim';
      return m;
    };
    let semilla = 7; const alea = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    // ondula una geometría para que no parezca una esfera perfecta
    const ondular = (geo, amp, f) => {
      const p = geo.attributes.position, v = new T.Vector3();
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i);
        const n = Math.sin(v.x * f + 1.3) * Math.sin(v.y * f * 1.13 + 0.7) * Math.sin(v.z * f * 0.91 + 2.1) + 0.5 * Math.sin(v.x * f * 2.3 + v.z * f * 1.7);
        v.multiplyScalar(1 + amp * n); p.setXYZ(i, v.x, v.y, v.z);
      }
      geo.computeVertexNormals(); return geo;
    };
    const flota = (g, amp, vel) => { g.userData.fase = alea() * 6.28; g.userData.amp = amp; g.userData.vel = vel; flotan.push(g); return g; };

    // Membrana y citoplasma
    const membrana = reg('membrana', new T.Mesh(ondular(new T.SphereGeometry(3, 96, 64), 0.022, 1.9),
      rim(mat(0xf4b0c6, { opacity: 0.14, side: T.DoubleSide, depthWrite: false, roughness: 0.25, clearcoat: 1 }), 0xff8fb3, 0.75)));
    membrana.scale.set(1.08, 0.92, 1); membrana.renderOrder = 3;
    const citoplasma = new T.Mesh(new T.SphereGeometry(2.92, 48, 32), new T.MeshBasicMaterial({ color: 0xfbe3ee, transparent: true, opacity: 0.16, side: T.BackSide, depthWrite: false }));
    citoplasma.scale.copy(membrana.scale);
    grupo.add(citoplasma, membrana);
    focos.membrana = { punto: new T.Vector3(2.2, 1.6, 1.4), acercar: false };

    // Núcleo (con poros, cromatina y nucléolo) y retículo rugoso pegado a él: se mueven juntos
    const nr = flota(new T.Group(), 0.035, 0.5);
    nr.position.set(-0.4, 0.25, -0.5);
    const env = reg('nucleo', new T.Mesh(ondular(new T.SphereGeometry(0.95, 64, 44), 0.03, 4),
      rim(mat(0x7d4fc0, { opacity: 0.5, depthWrite: false, roughness: 0.3 }), 0xc9a6ff, 0.9)));
    env.renderOrder = 2;
    const poros = [], v = new T.Vector3();
    for (let i = 0; i < 70; i++) { const y = 1 - 2 * (i + 0.5) / 70, r = Math.sqrt(1 - y * y), th = i * 2.39996; poros.push(v.set(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(0.955).clone()); }
    const poro = reg('nucleo', new T.InstancedMesh(new T.TorusGeometry(0.038, 0.014, 6, 12), mat(0x4a2380, { opacity: 0.9 }), poros.length));
    const m4 = new T.Matrix4(), q = new T.Quaternion(), uno = new T.Vector3(1, 1, 1), z = new T.Vector3(0, 0, 1);
    poros.forEach((p, i) => { q.setFromUnitVectors(z, p.clone().normalize()); m4.compose(p, q, uno); poro.setMatrixAt(i, m4); });
    const cromatina = [];
    for (let k = 0; k < 6; k++) {
      const pts = []; let c = new T.Vector3((alea() - 0.5) * 0.9, (alea() - 0.5) * 0.9, (alea() - 0.5) * 0.9);
      for (let n = 0; n < 6; n++) { c = c.clone().add(new T.Vector3((alea() - 0.5) * 0.45, (alea() - 0.5) * 0.45, (alea() - 0.5) * 0.45)); if (c.length() > 0.72) c.setLength(0.62); pts.push(c); }
      cromatina.push(reg('nucleo', new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.028, 6), mat(0x5b2a96, { opacity: 0.85 }))));
    }
    const nucleolo = reg('nucleo', new T.Mesh(ondular(new T.SphereGeometry(0.32, 32, 22), 0.08, 9), mat(0x3a1660, { roughness: 0.6 })));
    nucleolo.position.set(0.15, 0.1, 0.2);
    nr.add(env, poro, nucleolo, ...cromatina);
    grupo.add(nr);
    focos.nucleo = { punto: new T.Vector3(0, 0, 0), obj: nr, acercar: true };

    // Retículo rugoso: sacos curvos que envuelven al núcleo (siguen a su envoltura), cubiertos de ribosomas
    const ret = new T.Group(); nr.add(ret);
    const ribRet = [], PH0 = Math.PI - 0.75, PHL = 1.5, TH0 = 0.75, THL = 1.55;
    for (let i = 0; i < 4; i++) {
      const r = 1.16 + i * 0.2;
      const geo = new T.SphereGeometry(r, 56, 28, PH0 + 0.1 + i * 0.07, PHL - 0.2 - i * 0.14, TH0 + 0.12 + i * 0.07, THL - 0.24 - i * 0.14), p = geo.attributes.position, w = new T.Vector3();
      for (let k = 0; k < p.count; k++) { w.fromBufferAttribute(p, k); const a = Math.atan2(w.z, -w.x), b = Math.acos(w.y / w.length()); w.multiplyScalar(1 + 0.022 * Math.sin(a * 6 + i) * Math.sin(b * 5)); p.setXYZ(k, w.x, w.y, w.z); }
      geo.computeVertexNormals();
      const saco = reg('reticulo', new T.Mesh(geo, mat(0x5b66d6, { roughness: 0.36, side: T.DoubleSide, opacity: 0.72, depthWrite: false })));
      ret.add(saco);
      for (let n = 0; n < 22; n++) {
        const ph = PH0 + 0.2 + i * 0.07 + alea() * (PHL - 0.42 - i * 0.14), th = TH0 + 0.22 + i * 0.07 + alea() * (THL - 0.46 - i * 0.14), rr = r + (alea() > 0.5 ? 0.035 : -0.035);
        ribRet.push(new T.Vector3(-rr * Math.cos(ph) * Math.sin(th), rr * Math.cos(th), rr * Math.sin(ph) * Math.sin(th)));
      }
    }
    const rib2 = reg('ribosomas', new T.InstancedMesh(new T.SphereGeometry(0.05, 10, 8), mat(0xe8265a, { roughness: 0.35 }), ribRet.length));
    ribRet.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); rib2.setMatrixAt(i, m4); });
    rib2.userData.tambien = 'reticulo';   // al elegir el retículo, sus ribosomas siguen a la vista
    ret.add(rib2);
    focos.reticulo = { punto: new T.Vector3(1.45, 0.15, 0), obj: ret, acercar: true };

    // Mitocondrias: membrana externa translúcida, interna con crestas y matriz
    const mitos = [];
    const mito = (x, y, zz, rz, ry) => {
      const g = flota(new T.Group(), 0.05, 0.7);
      const ext = reg('mitocondria', new T.Mesh(ondular(new T.CapsuleGeometry(0.28, 0.74, 10, 28), 0.03, 6),
        rim(mat(0xf3792a, { opacity: 0.45, depthWrite: false, roughness: 0.28, clearcoat: 0.8 }), 0xffc08a, 0.8)));
      ext.renderOrder = 1;
      const matriz = reg('mitocondria', new T.Mesh(new T.CapsuleGeometry(0.2, 0.66, 8, 20), mat(0xffb67d, { opacity: 0.55, depthWrite: false })));
      g.add(ext, matriz);
      for (let k = 0; k < 6; k++) {
        const c = reg('mitocondria', new T.Mesh(new T.TorusGeometry(0.15, 0.022, 8, 24, Math.PI * 1.25), mat(0xc4510c, { roughness: 0.5 })));
        c.position.set(0, -0.36 + k * 0.145, 0); c.rotation.set(Math.PI / 2, 0, k % 2 ? 0.4 : Math.PI + 0.4);
        g.add(c);
      }
      // partículas de energía (se ven cuando se elige la mitocondria)
      const N = 26, pos = new Float32Array(N * 3), sem = [];
      for (let k = 0; k < N; k++) sem.push({ a: alea() * 6.28, h: (alea() - 0.5) * 0.9, f: alea() });
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      const chispas = new T.Points(geo, new T.PointsMaterial({ color: 0xffe066, size: 0.07, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
      chispas.userData.sem = sem; g.add(chispas);
      g.position.set(x, y, zz); g.rotation.set(0, ry, rz);
      grupo.add(g); mitos.push({ g, chispas });
    };
    mito(1.1, -1.05, -0.5, 1.0, 0.3);
    mito(-1.7, -0.95, -0.3, -0.5, 0.2);
    mito(0.0, -1.6, -1.0, 1.4, 0);
    mito(-1.3, 1.3, -1.0, 0.7, 0.4);
    mito(1.0, 1.25, 0.9, -0.8, 0.2);   // queda del lado que se recorta
    focos.mitocondria = { punto: new T.Vector3(0, 0, 0), obj: mitos[0].g, acercar: true };

    // Ribosomas libres en el citoplasma
    const pts = [];
    const nuc = nr.position;
    while (pts.length < 46) {
      const p = new T.Vector3((alea() - 0.5) * 5, (alea() - 0.5) * 4.4, (alea() - 0.5) * 5);
      if (p.length() > 2.4 || p.distanceTo(nuc) < 1.9) continue;
      pts.push(p);
    }
    const rib = reg('ribosomas', new T.InstancedMesh(new T.SphereGeometry(0.065, 10, 8), mat(0xe8265a, { roughness: 0.35 }), pts.length));
    pts.forEach((p, i) => { m4.makeTranslation(p.x, p.y, p.z); rib.setMatrixAt(i, m4); });
    grupo.add(rib);
    focos.ribosomas = { punto: new T.Vector3(1.6, 0.9, 0.2), acercar: false };

    // Vesículas decorativas (no se tocan)
    for (let i = 0; i < 9; i++) {
      const ve = flota(new T.Mesh(new T.SphereGeometry(0.1 + alea() * 0.08, 16, 12), mat(0xe2d6f2, { opacity: 0.75 })), 0.06, 0.9);
      ve.position.set((alea() - 0.5) * 4, (alea() - 0.5) * 3.6, (alea() - 0.5) * 2.4 - 0.8);
      if (ve.position.distanceTo(nuc) < 1.3) ve.position.y -= 1.6;
      grupo.add(ve);
    }

    // movimiento de "vida": flotar y chispas de energía
    const anim = (t, sel) => {
      flotan.forEach(g => { g.userData.base ??= g.position.clone(); const f = g.userData.fase + t * g.userData.vel; g.position.set(g.userData.base.x + Math.sin(f) * g.userData.amp, g.userData.base.y + Math.sin(f * 1.3) * g.userData.amp, g.userData.base.z + Math.cos(f * 0.8) * g.userData.amp); });
      const ver = sel === 'mitocondria';
      mitos.forEach(({ chispas }) => {
        const pm = chispas.material; pm.opacity += ((ver ? 0.95 : 0) - pm.opacity) * 0.08;
        if (pm.opacity < 0.01) { chispas.visible = false; return; }
        chispas.visible = true;
        const pos = chispas.geometry.attributes.position;
        chispas.userData.sem.forEach((s, k) => { const c = (s.f + t * 0.35) % 1, r = 0.12 + c * 0.55; pos.setXYZ(k, Math.cos(s.a + c * 2) * r, s.h * (0.6 + c), Math.sin(s.a + c * 2) * r); });
        pos.needsUpdate = true; pm.size = 0.07;
      });
    };
    return { grupo, partes, radio: 3.3, focos, anim };
  },
};

/* ------------------------------------------------------------------ bloque */
export function bModelo3d(w, b, resuelto, marcar) {
  const partes = b.partes, porId = Object.fromEntries(partes.map(p => [p.id, p]));
  const t = b.tarea;
  let fase = resuelto ? 'explorar' : 'explorar', terminado = !!resuelto, fallos = 0, elegida = null;
  w.innerHTML = `<div class="interactivo modelo3d ${resuelto ? 'resuelto' : ''}">
    <div class="etq">${esc(b.etiqueta || '🧬 Modelo 3D')}</div>
    ${b.titulo ? `<h3 class="m3d-titulo">${esc(b.titulo)}</h3>` : ''}
    <div class="consigna">${md(b.consigna)}</div>
    <div class="m3d-cols"><div class="m3d-izq"><div class="m3d-caja"><div class="m3d-lienzo" tabindex="0" role="img" aria-label="${esc(b.alt || b.titulo || 'Modelo 3D')}"><div class="m3d-cargando">Cargando el modelo…</div></div>
      <div class="m3d-barra" hidden>
        <button type="button" class="btn chico suave" data-a="mas" aria-label="Acercar" title="Acercar">+</button>
        <button type="button" class="btn chico suave" data-a="menos" aria-label="Alejar" title="Alejar">−</button>
      </div>
      <p class="ayuda m3d-ayuda" hidden>Arrastrá para girar · ${matchMedia('(pointer: coarse)').matches ? 'pellizcá o usá + y − para acercar' : 'usá los botones + y − para acercar'}</p>
    </div>
    <div class="m3d-sin3d" hidden><p class="ayuda">Tu dispositivo no puede mostrar el modelo en 3D. Podés trabajar igual con la lista de partes.</p><p>${md(b.alt || '')}</p></div></div>
    <div class="m3d-der"><p class="m3d-paso"><span>1</span>Elegí una parte</p><div class="chips m3d-chips" role="group" aria-label="Partes de la célula"></div>
    <div class="m3d-info" aria-live="polite"></div>
    <div class="m3d-desafio"></div></div></div>
    ${b.pie ? `<p class="m3d-pie">${esc(b.pie)}</p>` : ''}</div>`;
  const raiz = w.firstElementChild;
  const q = s => raiz.querySelector(s);
  pantallaCompleta(raiz);
  const chips = q('.m3d-chips'), info = q('.m3d-info'), desafio = q('.m3d-desafio');
  chips.innerHTML = partes.map(p => `<button type="button" class="chip" data-id="${p.id}" aria-pressed="false">${esc(p.nombre)}</button>`).join('');

  let vista = null;   // controlador 3D (o null si no hay)
  const resaltar = id => {
    chips.querySelectorAll('.chip').forEach(c => { const on = c.dataset.id === id; c.classList.toggle('sel', on); c.setAttribute('aria-pressed', on); });
    if (id) vista?.giro(false);   // sin botón de giro: al elegir una parte el modelo deja de girar solo
    vista?.resaltar(id);
  };
  const mostrarInfo = id => {
    const p = porId[id];
    info.innerHTML = p ? `<div class="m3d-card"><h4>${esc(p.nombre)}</h4><div class="m3d-texto">${md(p.texto)}</div></div>` : '';
  };
  const pintarDesafio = () => {
    if (terminado) {
      desafio.innerHTML = `<div class="fb ok"><b>¡Bien resuelto!</b> ${md(t.explicacion || '')}</div>`; return;
    }
    if (fase === 'explorar') {
      desafio.innerHTML = `<button type="button" class="btn" data-d="ir">Ya exploré: ir al desafío</button>`;
      desafio.querySelector('[data-d="ir"]').onclick = () => { fase = 'desafio'; elegida = null; resaltar(null); info.innerHTML = ''; pintarDesafio(); };
    } else {
      desafio.innerHTML = `<div class="m3d-reto"><p class="m3d-paso m3d-paso-reto"><span>2</span>Desafío</p><div class="m3d-reto-txt">${md(t.consigna)}</div><p class="m3d-reto-ayuda">Tocá la estructura en el modelo o elegila en la lista.</p></div><div class="fbz"></div>
        <button type="button" class="btn sec chico" data-d="volver">← Volver a explorar</button>`;
      desafio.querySelector('[data-d="volver"]').onclick = () => { fase = 'explorar'; pintarDesafio(); };
    }
  };
  const elegir = id => {
    if (!id) return;
    if (terminado || fase === 'explorar') { elegida = id; resaltar(id); mostrarInfo(id); return; }
    // desafío
    resaltar(id);
    const fb = desafio.querySelector('.fbz');
    if (id === t.correcta) {
      terminado = true; raiz.classList.add('resuelto'); fase = 'explorar';
      mostrarInfo(id); pintarDesafio(); marcar();
    } else {
      fallos++;
      const pistas = t.pistas || [];
      fb.innerHTML = `<div class="fb mal"><b>Esa no es.</b> ${md(pistas[Math.min(fallos - 1, pistas.length - 1)] || 'Explorá las partes del modelo: cada una explica qué hace.')}</div>`;
    }
  };
  chips.addEventListener('click', ev => { const c = ev.target.closest('.chip'); if (c) elegir(c.dataset.id); });
  info.innerHTML = '<p class="m3d-vacio">Tocá una parte del modelo, o elegila en la lista, para ver qué es y qué hace.</p>';
  pintarDesafio();

  // 3D
  const lienzo = q('.m3d-lienzo');
  const sin3d = () => { q('.m3d-caja').hidden = true; q('.m3d-sin3d').hidden = false; };
  if (!hayWebGL()) { sin3d(); return true; }
  cargarThree().then(T => {
    if (!raiz.isConnected) return;
    vista = montarVista(T, lienzo, MODELOS[b.modelo](T), { alElegir: elegir, partes });
    lienzo.querySelector('.m3d-cargando')?.remove();
    q('.m3d-barra').hidden = false; q('.m3d-ayuda').hidden = false;
    if (sinMovimiento()) vista.giro(false);
    q('.m3d-barra').addEventListener('click', ev => {
      const bt = ev.target.closest('[data-a]'); if (!bt) return;
      const a = bt.dataset.a;
      if (a === 'mas') vista.zoom(-1.2);
      else if (a === 'menos') vista.zoom(1.2);
    });
    if (elegida) vista.resaltar(elegida);
    lienzo.addEventListener('pointerdown', () => q('.m3d-ayuda').classList.add('visto'), { once: true });
  }).catch(() => sin3d());
  return true;
}

/* ------------------------------------------------------------------ vista */
function entorno(T, render) {
  // "estudio" de luz para los reflejos suaves: cúpula con degradé y dos paneles luminosos
  const es = new T.Scene();
  const geo = new T.SphereGeometry(10, 32, 16), col = [], p = geo.attributes.position;
  const arriba = new T.Color(0xe9e2f0), abajo = new T.Color(0x8f7fb8), c = new T.Color();
  for (let i = 0; i < p.count; i++) { const k = (p.getY(i) / 10 + 1) / 2; c.copy(abajo).lerp(arriba, k); col.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  es.add(new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
  const panel = (x, y, zz, w, h, f) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(1, 1, 1).multiplyScalar(f), side: T.DoubleSide })); m.position.set(x, y, zz); m.lookAt(0, 0, 0); es.add(m); };
  panel(4, 6, 6, 6, 3, 2.4); panel(-7, 1, 3, 3, 5, 1.2); panel(0, -3, -8, 8, 2, 0.9);
  const pm = new T.PMREMGenerator(render), tex = pm.fromScene(es, 0.03).texture;
  pm.dispose(); return tex;
}
function sombra(T) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 32, 2, 64, 32, 62);
  gr.addColorStop(0, 'rgba(70,40,110,.38)'); gr.addColorStop(1, 'rgba(70,40,110,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 64);
  const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }));
  return s;
}

function montarVista(T, cont, modelo, { alElegir, partes: info = [] }) {
  const { grupo, partes, radio, focos = {}, anim } = modelo;
  const render = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
  render.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  render.localClippingEnabled = true;
  render.toneMapping = T.ACESFilmicToneMapping; render.toneMappingExposure = 0.92;
  const canvas = render.domElement; canvas.className = 'm3d-canvas'; cont.appendChild(canvas);
  const etq = document.createElement('div'); etq.className = 'm3d-etq'; etq.hidden = true; cont.appendChild(etq);

  const escena = new T.Scene();
  try { escena.environment = entorno(T, render); } catch (e) { console.warn('modelo 3D: sin luz de entorno', e); }
  // respaldo: si la placa de video no puede compilar los materiales con efectos, se pasa a materiales simples
  let fallo = false;
  render.debug.onShaderError = () => { fallo = true; };
  if (window.__m3dSimple) fallo = true;   // solo para probar el respaldo
  const simplificar = () => {
    grupo.traverse(o => {
      if (!o.isMesh || o.material.isMeshBasicMaterial) return;
      const m0 = o.material;
      o.material = new T.MeshStandardMaterial({ color: m0.color, roughness: 0.5, metalness: 0, transparent: true, opacity: m0.opacity, side: m0.side, depthWrite: m0.depthWrite });
      delete o.userData.rim; m0.dispose();
    });
    escena.environment = null; sucio = true;
  };
  const cam = new T.PerspectiveCamera(38, 1, 0.1, 100);
  let DIST0 = radio * 2.95, DMIN = radio * 1.0, DMAX = radio * 4.4;
  let dist = DIST0, distObj = null; cam.position.set(0, 0, dist);
  escena.add(new T.HemisphereLight(0xffffff, 0xe6d9ff, 0.35));
  const luz = new T.DirectionalLight(0xffffff, 1.7); luz.position.set(3, 5, 7); escena.add(luz);
  const contra = new T.DirectionalLight(0xffc4dc, 1.1); contra.position.set(-5, 2, -6); escena.add(contra);
  const piso = sombra(T); piso.scale.set(radio * 2.4, radio * 0.5, 1); piso.position.set(0, -radio * 1.02, -0.5); escena.add(piso);
  const pivote = new T.Group(); pivote.add(grupo); escena.add(pivote);

  // plano de corte, fijo al modelo: saca la mitad que mira a la cámara
  const plano = new T.Plane(new T.Vector3(0, 0, -1), 0);
  const mallas = []; grupo.traverse(o => { if (o.isMesh || o.isPoints) mallas.push(o); });
  mallas.forEach(m => { m.userData.op0 = m.material.opacity; });
  const poner = on => mallas.forEach(m => { m.material.clippingPlanes = on ? [plano] : null; m.material.needsUpdate = true; });

  let yaw = -0.5, pitch = 0.18, girando = true, visible = true, sucio = true, sel = null, t0 = performance.now();
  const YAW0 = yaw, PITCH0 = pitch, quieto = sinMovimiento();
  const raycaster = new T.Raycaster(), ndc = new T.Vector2();
  const focoAct = new T.Vector3(), focoObj = new T.Vector3(), tmp = new T.Vector3();
  let objFoco = null, puntoEtq = null, ultimoToque = null, entrada = null, hover = null, ultHover = 0, simple = false;

  const medir = () => {
    const r = cont.getBoundingClientRect(); const w = Math.max(100, r.width), h = Math.max(100, r.height);
    render.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    const ajuste = Math.max(1, 1 / cam.aspect) * 1.02;   // en pantallas angostas se aleja para que entre toda la célula
    const nuevo = radio * 2.95 * ajuste, k = nuevo / DIST0;
    DIST0 = nuevo; DMIN = radio * 1.0 * ajuste; DMAX = radio * 4.4 * ajuste; dist = Math.min(DMAX, Math.max(DMIN, dist * k)); sucio = true;
  };
  const ro = new ResizeObserver(medir); ro.observe(cont); medir();
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) sucio = true; }, { threshold: 0.05 }); io.observe(cont);

  // punteros: arrastrar gira, pellizcar acerca, tocar elige
  const ptrs = new Map(); let inicio = null, pinch0 = 0, dist0 = 0;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', ev => {
    girando = false;
    canvas.setPointerCapture(ev.pointerId); ptrs.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (ptrs.size === 1) inicio = { x: ev.clientX, y: ev.clientY, t: performance.now(), mov: 0 };
    if (ptrs.size === 2) { const [a, b2] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b2.x, a.y - b2.y); dist0 = dist; distObj = null; if (inicio) inicio.mov = 99; }
  });
  canvas.addEventListener('pointermove', ev => {
    const p = ptrs.get(ev.pointerId); if (!p) return;
    const dx = ev.clientX - p.x, dy = ev.clientY - p.y; p.x = ev.clientX; p.y = ev.clientY;
    if (ptrs.size === 2) {
      const [a, b2] = [...ptrs.values()]; const d = Math.hypot(a.x - b2.x, a.y - b2.y);
      if (pinch0) { dist = Math.min(DMAX, Math.max(DMIN, dist0 * pinch0 / d)); sucio = true; }
      return;
    }
    if (inicio) inicio.mov += Math.abs(dx) + Math.abs(dy);
    if (inicio && inicio.mov > 6) { yaw += dx * 0.01; pitch = Math.max(-1.2, Math.min(1.2, pitch + dy * 0.01)); sucio = true; }
  });
  const soltar = ev => {
    if (!ptrs.has(ev.pointerId)) return;
    ptrs.delete(ev.pointerId);
    if (inicio && ptrs.size === 0 && inicio.mov <= 6 && performance.now() - inicio.t < 600) tocar(ev);
    if (ptrs.size === 0) { inicio = null; pinch0 = 0; }
  };
  canvas.addEventListener('pointermove', ev => {
    if (ev.pointerType !== 'mouse' || ptrs.size || performance.now() - ultHover < 60) return;
    ultHover = performance.now();
    const h = buscar(ev), id = h ? idDe(h.object) : null;
    canvas.style.cursor = id ? 'pointer' : 'grab';
    if (id === hover) return;
    hover = id;
    mallas.forEach(m => { if (!m.material.emissive || idDe(m) === sel) return; const on = id && idDe(m) === id; m.material.emissive.setHex(on ? 0xffffff : 0x000000); m.material.emissiveIntensity = on ? 0.12 : 0; });
    sucio = true;
  });
  canvas.addEventListener('pointerleave', () => { if (hover) { hover = null; mallas.forEach(m => { if (m.material.emissive && idDe(m) !== sel) { m.material.emissive.setHex(0); m.material.emissiveIntensity = 0; } }); sucio = true; } });
  canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
  cont.addEventListener('keydown', ev => {
    const k = ev.key, paso = 0.12; let usado = true;
    if (k === 'ArrowLeft') yaw -= paso; else if (k === 'ArrowRight') yaw += paso;
    else if (k === 'ArrowUp') pitch = Math.max(-1.2, pitch - paso); else if (k === 'ArrowDown') pitch = Math.min(1.2, pitch + paso);
    else if (k === '+') { dist = Math.max(DMIN, dist - 1); distObj = null; } else if (k === '-') { dist = Math.min(DMAX, dist + 1); distObj = null; } else usado = false;
    if (usado) { ev.preventDefault(); sucio = true; }
  });

  const idDe = o => o.userData.parte;
  const grupoDe = o => { let g = o; while (g.parent && g.parent !== grupo) g = g.parent; return g; };
  const buscar = ev => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, cam);
    const hits = raycaster.intersectObjects(mallas.filter(m => m.isMesh), false).filter(h => idDe(h.object));
    const visibles = hits.filter(h => !plano.__activo || plano.distanceToPoint(h.point) >= -1e-3);
    return visibles.find(h => idDe(h.object) !== 'membrana') || visibles[0];
  };
  const tocar = ev => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, cam);
    const hits = raycaster.intersectObjects(mallas.filter(m => m.isMesh), false).filter(h => idDe(h.object));
    // se prefiere cualquier estructura interna antes que la membrana; lo recortado no se toca
    const visibles = hits.filter(h => !plano.__activo || plano.distanceToPoint(h.point) >= -1e-3);
    const h = visibles.find(h => idDe(h.object) !== 'membrana') || visibles[0];
    if (h) { ultimoToque = h.object; alElegir(idDe(h.object)); }
  };

  // al elegir: se acerca suavemente, se atenúa el resto y aparece una etiqueta
  const resaltar = id => {
    sel = id;
    const f = focos[id];
    let obj = f?.obj || null;
    if (ultimoToque && idDe(ultimoToque) === id && id === 'mitocondria') obj = grupoDe(ultimoToque);
    ultimoToque = null;
    objFoco = f?.acercar ? obj : null;
    puntoEtq = f ? { obj, punto: f.punto } : null;
    if (!objFoco) focoObj.set(0, 0, 0);
    distObj = id && f?.acercar ? DIST0 * 0.6 : (id ? DIST0 : null);
    mallas.forEach(m => {
      const p = idDe(m), on = p && p === id, junto = id && m.userData.tambien === id;
      if (m.isPoints) return;
      if (junto) { m.material.opacity = m.userData.op0; m.material.emissive?.setHex(0x000000); return; }
      const op0 = m.userData.op0;
      m.material.opacity = !id ? op0 : on ? (id === 'membrana' ? Math.max(op0, 0.3) : Math.max(op0, 0.9)) : (p === 'membrana' ? op0 * 0.5 : op0 * 0.28);
      m.material.depthWrite = m.material.opacity > 0.95 && op0 > 0.95;
      if (m.userData.rim) m.userData.rim.value = m.userData.rim0 * (!id || on ? 1 : 0.35);
      if (m.material.emissive) { if (on) m.material.emissive.copy(m.material.color); else m.material.emissive.setHex(0x000000); m.material.emissiveIntensity = on ? 0.35 : 0; }
    });
    const n = info.find(x => x.id === id)?.nombre;
    etq.textContent = n || ''; etq.hidden = !n;
    if (quieto) { if (objFoco) { objFoco.getWorldPosition(tmp); grupo.worldToLocal(tmp); focoObj.copy(tmp); focoAct.copy(focoObj); } if (distObj) dist = distObj; distObj = null; }
    sucio = true;
  };

  let corteOn = false;
  const bucle = () => {
    if (!cont.isConnected) { io.disconnect(); ro.disconnect(); render.dispose(); render.forceContextLoss?.(); return; }
    requestAnimationFrame(bucle);
    if (!visible) return;
    if (entrada === null) sucio = true;
    const t = (performance.now() - t0) / 1000;
    if (girando && !ptrs.size) { yaw += 0.0035; sucio = true; }
    if (!quieto) { anim?.(t, sel); sucio = true; }
    if (sel && !quieto) { const k = 0.28 + 0.14 * Math.sin(t * 3.8); mallas.forEach(m => { if (idDe(m) === sel && m.material.emissive) m.material.emissiveIntensity = k; }); }
    if (objFoco) { objFoco.getWorldPosition(tmp); grupo.worldToLocal(tmp); focoObj.copy(tmp); }
    if (focoAct.distanceToSquared(focoObj) > 1e-6) { focoAct.lerp(focoObj, quieto ? 1 : 0.08); sucio = true; }
    if (distObj !== null) { dist += (distObj - dist) * 0.08; if (Math.abs(distObj - dist) < 0.01) { dist = distObj; distObj = null; } sucio = true; }
    if (!sucio) return;
    sucio = false;
    // entrada: el reloj arranca después del primer cuadro dibujado (en equipos lentos ese cuadro puede tardar), y al final la opacidad siempre vuelve a 1
    const ke = quieto || entrada === 'fin' ? 1 : entrada === null ? 0 : Math.min(1, (performance.now() - entrada) / 1100), ee = 1 - Math.pow(1 - ke, 3);
    if (ke < 1) { sucio = true; canvas.style.opacity = String(ee); } else { canvas.style.opacity = ''; entrada = 'fin'; }
    pivote.scale.setScalar(0.86 + 0.14 * ee);
    pivote.rotation.set(pitch, yaw - (1 - ee) * 0.6, 0);
    grupo.position.copy(focoAct).negate();
    pivote.updateMatrixWorld(true);
    if (corteOn) plano.set(new T.Vector3(0, 0, -1), 0).applyMatrix4(grupo.matrixWorld);
    piso.material.opacity = sel && objFoco ? 0.35 : 1;
    cam.position.z = dist;
    try { render.render(escena, cam); } catch (e) { console.warn('modelo 3D:', e); fallo = true; }
    if (fallo && !simple) { simple = true; fallo = false; simplificar(); return; }
    if (entrada === null) entrada = performance.now();
    // etiqueta pegada a la estructura elegida
    if (puntoEtq && !etq.hidden) {
      if (puntoEtq.obj) puntoEtq.obj.localToWorld(tmp.copy(puntoEtq.punto)); else grupo.localToWorld(tmp.copy(puntoEtq.punto));
      tmp.project(cam);
      const r = canvas.getBoundingClientRect();
      const x = (tmp.x + 1) / 2 * r.width, y = (1 - tmp.y) / 2 * r.height;
      etq.style.transform = `translate(${Math.round(Math.min(r.width - 20, Math.max(20, x)))}px, ${Math.round(Math.max(28, y - 18))}px) translate(-50%, -100%)`;
    }
  };
  requestAnimationFrame(bucle);

  return {
    resaltar,
    corte(on) { corteOn = on; plano.__activo = on; poner(on); if (on) { yaw = YAW0; pitch = PITCH0; } sucio = true; },
    giro(on) { girando = on; sucio = true; },
    zoom(d) { const v = Math.min(DMAX, Math.max(DMIN, (distObj ?? dist) + d)); if (quieto) { dist = v; distObj = null; } else distObj = v; girando = false; sucio = true; },
    inicio() { yaw = YAW0; pitch = PITCH0; dist = DIST0; distObj = null; sucio = true; },
  };
}
