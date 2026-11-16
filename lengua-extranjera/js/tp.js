// TUTORÍAS VIRTUALES · Trabajo práctico y preparación para presentarlo y defenderlo
// El alumno arma el TP parte por parte en su carpeta: en pantalla tiene la consigna, preguntas guía y un modelo con espacios.
// Cada espacio curricular tiene su propio TP. Nada se envía al docente.
import { leer, guardar, esc, md, tpDe, consignaHTML, hayLMS, nombreDelLMS, completarPaquete } from './estado.js';
import { renderBloque, guiaHTML } from './motor.js';
import { AJUSTES } from './config.js';

const parr = s => (s || '').split(/\n\n+/).map(p => `<p>${md(p)}</p>`).join('');

export function montarTP({ root, tp, oral, contenidos, clases = {}, espacio }) {
  let e = leer();
  const sel = contenidos.map(c => c.id);
  const esMate = espacio === 'matematica';
  // Inglés: el TP es una biografía corta del personaje, armada párrafo por párrafo (un párrafo por contenido elegido)
  const bio = tp.estructura === 'biografia';
  const ordenBio = bio ? (tp.orden || sel).filter(id => sel.includes(id) && tp.parrafos[id]) : [];
  const sec = bio ? [
    { id: 'formato', tipo: 'info', icono: '🧭', titulo: 'Cómo es tu trabajo práctico' },
    { id: 'plan', tipo: 'escribir', icono: '🗺️', titulo: 'El plan de la biografía', cfg: tp.plan, texto: true },
    ...ordenBio.map((id, k) => ({ id: 'des-' + id, tipo: 'parrafo', icono: '✍️', titulo: `Párrafo ${k + 1}: ${tp.parrafos[id].titulo}`, cfg: tp.parrafos[id], contenido: contenidos.find(c => c.id === id), texto: true })),
    { id: 'revision', tipo: 'escribir', icono: '🔍', titulo: 'Revisión de la biografía', cfg: tp.revision, texto: true },
    { id: 'version', tipo: 'escribir', icono: '📄', titulo: 'La versión final', cfg: tp.version_final, texto: true },
    { id: 'reglas', tipo: 'reglas', icono: '📚', titulo: 'Mis reglas: lo que usé y cómo se forma', cfg: tp.reglas, texto: true },
    ...(tp.practica ? [{ id: 'practica', tipo: 'practica', icono: '✏️', titulo: 'Ejercicios para resolver al presentar' }] : []),
    { id: 'consejos', tipo: 'consejos', icono: '🎤', titulo: 'Consejos para presentar y defender tu trabajo' },
    { id: 'simulacro', tipo: 'simulacro', icono: '🗣️', titulo: 'Simulacro de la defensa' },
    { id: 'final', tipo: 'final', icono: '📒', titulo: 'Mi trabajo completo' },
  ] : [
    { id: 'formato', tipo: 'info', icono: '🧭', titulo: 'Cómo es un buen trabajo práctico' },
    { id: 'portada', tipo: 'escribir', icono: '📄', titulo: 'Introducción', cfg: tp.portada, texto: true },
    ...contenidos.filter(c => tp.desarrollo[c.id]).map(c => ({ id: 'des-' + c.id, tipo: 'desarrollo', icono: '📚', titulo: 'Desarrollo: ' + c.titulo, cfg: tp.desarrollo[c.id], contenido: c, texto: true })),
    { id: 'integracion', tipo: 'integracion', icono: '🔗', titulo: 'Integrar los contenidos', texto: true },
    { id: 'realidad', tipo: 'realidad', icono: '🌎', titulo: 'Relacionar con la realidad', texto: true },
    { id: 'conclusion', tipo: 'escribir', icono: '🏁', titulo: 'Conclusión', cfg: tp.conclusion, texto: true },
    ...(tp.practica ? [{ id: 'practica', tipo: 'practica', icono: '✏️', titulo: 'Ejercicios para resolver al presentar' }] : []),
    { id: 'consejos', tipo: 'consejos', icono: '🎤', titulo: 'Consejos para presentar y defender tu trabajo' },
    { id: 'simulacro', tipo: 'simulacro', icono: '🗣️', titulo: 'Simulacro de la defensa' },
    { id: 'final', tipo: 'final', icono: '📒', titulo: 'Mi trabajo completo' },
  ];
  const T = () => tpDe(e, espacio);
  const hecho = id => { const s = T().secciones[id]; return !!s && (s.estado === 'ok' || s.estado === 'duda'); };
  let actual = sec.find(s => s.id !== 'final' && !hecho(s.id))?.id || 'final';
  const guardarE = () => guardar(e);
  const ref = id => (T().secciones[id] ??= { estado: 'pendiente', texto: '', copiado: false, intentos: 0 });

  function pintar() {
    e = leer();
    const total = sec.length - 1;
    const hechas = sec.filter(s => s.id !== 'final' && hecho(s.id)).length;
    root.innerHTML = `<div class="clase-cab"><div class="eje-nombre">Trabajo práctico · presentación y defensa</div><h1>${esc(tp.titulo)}</h1><p>${esc(tp.intro)}</p>
      <div class="barra" style="background:rgba(255,255,255,.35);max-width:100%"><i style="width:${Math.round(hechas / total * 100)}%;background:#fff"></i></div></div>
      <div class="tp-layout"><nav class="tp-menu no-print" aria-label="Partes del trabajo">${sec.map(s => {
        const h = hecho(s.id), d = T().secciones[s.id]?.estado === 'duda';
        return `<button data-id="${s.id}" class="${s.id === actual ? 'activo' : ''}"><span>${s.icono}</span><span>${esc(s.titulo)}</span><span class="estado">${d ? '⚑' : h ? '✓' : ''}</span></button>`;
      }).join('')}</nav><div id="secc"></div></div>`;
    root.querySelectorAll('.tp-menu button').forEach(b => b.onclick = () => { actual = b.dataset.id; pintar(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    const s = sec.find(x => x.id === actual);
    const host = root.querySelector('#secc');
    ({ info: bio ? seccionFormatoBio : seccionFormato, escribir: seccionEscribir, parrafo: seccionParrafo, reglas: seccionReglas, desarrollo: seccionDesarrollo, integracion: seccionIntegracion, realidad: seccionRealidad, practica: seccionPractica, consejos: seccionConsejos, simulacro: seccionSimulacro, final: seccionFinal }[s.tipo])(host, s);
  }
  const siguiente = () => {
    const i = sec.findIndex(s => s.id === actual); const n = sec[i + 1];
    return n ? `<div class="acciones no-print"><button class="btn" id="sigsec">Siguiente: ${esc(n.titulo)} →</button></div>` : '';
  };
  const enlazarSig = host => host.querySelector('#sigsec')?.addEventListener('click', () => { const i = sec.findIndex(s => s.id === actual); actual = sec[i + 1].id; pintar(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  const marcarMenu = (id, txt = '✓') => { const el = root.querySelector(`[data-id="${id}"] .estado`); if (el) el.textContent = txt; };
  const cab = s => `<div class="titulo-seccion"><div class="chip-icono">${s.icono}</div><h2>${esc(s.titulo)}</h2></div><div class="subrayado"></div>`;

  /* ---- bloque genérico: consigna + preguntas guía + modelo con espacios → se escribe en la carpeta ---- */
  const lista = xs => xs.length <= 1 ? (xs[0] || '') : xs.slice(0, -1).join(', ') + ' y ' + xs[xs.length - 1];
  function escritura(host, id, titulo, cfg, { instruccion, guia, extra = '', modelo } = {}) {
    const st = ref(id);
    const ins = instruccion ?? cfg.instruccion;
    const mod = (modelo ?? cfg.modelo ?? '').replace('{temas}', lista(contenidos.map(c => `"${c.titulo}"`)));
    host.innerHTML = `<div class="carpeta" style="margin-top:12px"><h3>📒 ${esc(titulo)}</h3>
      <p class="carpeta-intro">Esta parte la escribís en tu carpeta, con tus palabras. Tu profesor o profesora la va a corregir.</p>
      ${consignaHTML(ins)}
      ${guiaHTML({ ...cfg, guia: guia ?? cfg.guia, modelo: null })}${extra}
      ${mod ? `<div class="modelo-tp"><h4>📝 Un modelo para orientarte</h4><p class="ayuda">Así podría quedar tu texto. Donde hay una línea punteada va lo que vos sabés: completalo con tus palabras. Es solo una guía: podés armarlo a tu manera.</p>${parr(mod).replaceAll('……', '<span class="hueco-modelo" aria-label="espacio para completar"></span>')}</div>` : ''}
      <div class="copiado"><input type="checkbox" id="chk" ${st.estado === 'ok' ? 'checked' : ''}><label for="chk">Ya lo escribí en mi carpeta</label></div></div>`;
    // "Siguiente" se habilita recién cuando marca que ya lo escribió en la carpeta
    const sig = root.querySelector('#sigsec');
    if (sig) sig.closest('.acciones').insertAdjacentHTML('beforeend', '<p class="ayuda nota-sig" style="width:100%;margin:6px 0 0"></p>');
    const habilitar = ok => {
      if (!sig) return;
      sig.disabled = !ok && !AJUSTES.MODO_PRUEBA;
      sig.closest('.acciones').querySelector('.nota-sig').textContent = (ok || AJUSTES.MODO_PRUEBA) ? '' : 'Para seguir, escribí esta parte en tu carpeta y marcá "Ya lo escribí en mi carpeta".';
    };
    habilitar(st.estado === 'ok');
    host.querySelector('#chk').onchange = ev => {
      e = leer(); const s2 = ref(id); s2.estado = ev.target.checked ? 'ok' : 'pendiente'; s2.copiado = ev.target.checked; s2.titulo = titulo; guardarE();
      marcarMenu(id, ev.target.checked ? '✓' : ''); habilitar(ev.target.checked);
    };
  }

  /* ---- secciones ---- */
  function seccionFormato(host) {
    const partes = sec.filter(s => s.texto);
    host.innerHTML = `<div class="tarjeta"><h2>🧭 Cómo es un buen trabajo práctico</h2><div class="subrayado"></div>
      <p>Tu trabajo práctico es lo que vas a <b>presentar y defender</b> en febrero. Se arma por partes y se escribe en tu carpeta: en cada parte vas a tener la consigna, preguntas que te ayudan y un modelo para orientarte.</p>
      <h3>Las partes de tu trabajo (y el orden en que lo vas a presentar)</h3>
      <ol>${partes.map(s => `<li><b>${esc(s.titulo)}</b></li>`).join('')}</ol>
      ${tp.practica ? '<p>Además, vas a practicar <b>ejercicios</b> como los que te pueden pedir que resuelvas en el momento de presentar.</p>' : ''}
      <h3>Para que quede bien</h3>
      <ul><li>Escribilo con <b>tus palabras</b>: copiar no demuestra que entendiste.</li><li>Usá lo que ya escribiste en tu carpeta en cada clase: es la base de tu trabajo.</li><li>Poné <b>ejemplos propios</b> y mostrá cómo pensás.</li><li>Carpeta prolija: título en cada parte, letra clara y todo en orden.</li><li>Si algo no te sale después de intentarlo, anotalo como <b>duda</b> en tu carpeta y consultalo con tu docente antes de presentar el trabajo.</li></ul>
      <h3>Qué suelen observar los docentes</h3><p class="ayuda">Es orientativo: quien te evalúa es tu docente.</p>
      <ul>${oral.que_observan.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="fb info">Nada de lo que hagas acá se envía a tu docente. El trabajo lo presentás y lo defendés vos.</div></div>${siguiente()}`;
    enlazarSig(host);
    const st = ref('formato'); if (st.estado !== 'ok') { st.estado = 'ok'; guardarE(); marcarMenu('formato'); }
  }
  function seccionFormatoBio(host) {
    const partes = sec.filter(s => s.texto);
    host.innerHTML = `<div class="tarjeta"><h2>🧭 Cómo es tu trabajo práctico</h2><div class="subrayado"></div>
      ${parr(tp.intro)}
      <h3>Las partes de tu trabajo</h3>
      <ol>${partes.map(s => `<li><b>${esc(s.titulo)}</b></li>`).join('')}</ol>
      <p>Cada párrafo sale de una clase: en la parte 3 de cada clase ya escribiste en tu carpeta un párrafo de esta historia. Ahora lo pasás en limpio, lo mejorás y lo unís con los demás.</p>
      ${tp.practica ? '<p>Además, vas a practicar <b>ejercicios</b> como los que te pueden pedir que resuelvas en el momento de presentar.</p>' : ''}
      <h3>Para que quede bien</h3>
      <ul><li>Escribí la biografía en <b>tercera persona</b>: ${'<i>she lives…</i>, <i>he played…</i>'}.</li><li>Cada párrafo usa el tiempo verbal de su tema.</li><li>Agregá detalles que inventes vos: así el texto es tuyo.</li><li>Carpeta prolija: título en cada parte, letra clara y todo en orden.</li><li>Si algo no te sale después de intentarlo, anotalo como <b>duda</b> en tu carpeta y consultalo con tu docente antes de presentar el trabajo.</li></ul>
      <h3>Qué suelen observar los docentes</h3><p class="ayuda">Es orientativo: quien te evalúa es tu docente.</p>
      <ul>${oral.que_observan.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="fb info">Nada de lo que hagas acá se envía a tu docente. El trabajo lo presentás y lo defendés vos.</div></div>${siguiente()}`;
    enlazarSig(host);
    const st = ref('formato'); if (st.estado !== 'ok') { st.estado = 'ok'; guardarE(); marcarMenu('formato'); }
  }
  function seccionParrafo(host, s) {
    const clase = clases[s.contenido?.id];
    const c3 = clase?.capsulas?.[clase.capsulas.length - 1];
    const aviso = c3 ? `<div class="destacado" style="margin:0 0 12px"><h4>📒 Partí de lo que ya escribiste</h4>
      <p style="margin:0">Buscá en tu carpeta el párrafo de la parte <b>"${esc(c3.titulo)}"</b> de la clase <b>"${esc(clase.titulo)}"</b>. Pasalo en limpio y mejoralo con las preguntas de abajo.</p></div>` : '';
    host.innerHTML = `<div class="tarjeta">${cab(s)}${aviso}<div id="esc"></div></div>${siguiente()}`;
    escritura(host.querySelector('#esc'), s.id, s.titulo, s.cfg); enlazarSig(host);
  }
  function seccionReglas(host, s) {
    const guia = sel.filter(id => s.cfg.por_contenido[id]).sort((a, b) => ordenBio.indexOf(a) - ordenBio.indexOf(b)).map(id => s.cfg.por_contenido[id]);
    host.innerHTML = `<div class="tarjeta">${cab(s)}<div id="esc"></div></div>${siguiente()}`;
    escritura(host.querySelector('#esc'), s.id, s.titulo, s.cfg, { guia }); enlazarSig(host);
  }
  function seccionEscribir(host, s) {
    host.innerHTML = `<div class="tarjeta">${cab(s)}<div id="esc"></div></div>${siguiente()}`;
    escritura(host.querySelector('#esc'), s.id, s.titulo, s.cfg); enlazarSig(host);
  }
  function seccionDesarrollo(host, s) {
    const clase = clases[s.contenido.id];
    const carpeta = clase ? `<div class="destacado" style="margin:0 0 12px"><h4>📒 Usá lo que escribiste en tu carpeta</h4>
      <p style="margin:0">En cada parte de esta clase hiciste una actividad en tu carpeta. Usala como base: ahora vas a unir todo en un solo texto ordenado, que se entienda de principio a fin.</p></div>` : '';
    host.innerHTML = `<div class="tarjeta">${cab(s)}${carpeta}<div id="esc"></div></div>${siguiente()}`;
    escritura(host.querySelector('#esc'), s.id, s.titulo, s.cfg); enlazarSig(host);
  }
  function seccionIntegracion(host, s) {
    const g = tp.integracion;
    let preguntas;
    if (sel.length >= 2) {
      preguntas = [];
      for (let a = 0; a < sel.length; a++) for (let b = a + 1; b < sel.length; b++) {
        const q = g.pares[`${sel[a]}|${sel[b]}`] || g.pares[`${sel[b]}|${sel[a]}`];
        if (q) preguntas.push(q);
      }
    } else preguntas = g.individual[sel[0]] || [];
    host.innerHTML = `<div class="tarjeta">${cab(s)}${parr(sel.length >= 2 ? g.intro : g.intro_uno)}
      <div class="consejo" style="margin-bottom:6px"><h4>Preguntas para integrar ${sel.length >= 2 ? 'los contenidos que elegiste' : 'las partes de tu contenido'}</h4><ul>${preguntas.map(q => `<li>${md(q)}</li>`).join('')}</ul></div>
      <div class="consejo"><h4>Preguntas que sirven siempre</h4><ul>${g.generales.map(q => `<li>${md(q)}</li>`).join('')}</ul></div>
      <div id="esc"></div></div>${siguiente()}`;
    escritura(host.querySelector('#esc'), 'integracion', s.titulo, g, {
      instruccion: sel.length >= 2
        ? 'Escribí un texto que conecte tus contenidos: elegí al menos dos de las preguntas de arriba y respondelas en un solo texto, mostrando qué relación hay entre los temas (causas, consecuencias, semejanzas o en qué se usa uno para entender el otro).'
        : 'Escribí un texto que conecte las partes de tu contenido: elegí al menos dos de las preguntas de arriba y respondelas en un solo texto, mostrando cómo se relacionan.',
      guia: [], modelo: sel.length >= 2 ? g.modelo : g.modelo_uno,
    });
    enlazarSig(host);
  }
  function seccionRealidad(host, s) {
    const r = tp.realidad;
    const items = sel.map(id => ({ c: contenidos.find(c => c.id === id), q: r.por_contenido[id] })).filter(x => x.q);
    host.innerHTML = `<div class="tarjeta">${cab(s)}${parr(r.intro)}
      <div class="consejo-grid" style="margin-bottom:6px">${items.map(x => `<div class="consejo"><h4>${esc(x.c.titulo)}</h4><p style="margin:0 0 6px;font-weight:700">${md(x.q.pregunta)}</p><ul>${x.q.ideas.map(i => `<li>${md(i)}</li>`).join('')}</ul></div>`).join('')}</div>
      <div id="esc"></div></div>${siguiente()}`;
    escritura(host.querySelector('#esc'), 'realidad', s.titulo, r, {
      instruccion: items.length > 1
        ? 'Escribí cómo aparecen hoy los temas de tu trabajo: respondé la pregunta de cada contenido que elegiste (un párrafo por contenido), con un ejemplo concreto del presente. El modelo de abajo sirve para cada párrafo.'
        : 'Escribí cómo aparece hoy el tema de tu trabajo: respondé la pregunta de arriba con un ejemplo concreto del presente.',
      guia: [],
    });
    enlazarSig(host);
  }
  function seccionPractica(host, s) {
    const p = tp.practica;
    const bloques = sel.flatMap(id => (p.por_contenido[id] || []).map((b, k) => ({ b, key: `${id}-${k}`, c: contenidos.find(c => c.id === id) })));
    const st = ref('practica'); st.bloques ??= {};
    host.innerHTML = `<div class="tarjeta">${cab(s)}${parr(p.intro)}
      <div class="consejo" style="margin-bottom:16px"><h4>Cuando te pidan resolver un ejercicio</h4><ul>${p.consejos.map(x => `<li>${md(x)}</li>`).join('')}</ul></div>
      <p class="ayuda" id="pprog"></p><div id="ejs"></div></div>${siguiente()}`;
    const prog = () => {
      const n = bloques.filter(x => ref('practica').bloques[x.key]).length;
      host.querySelector('#pprog').innerHTML = `<b>Resolviste ${n} de ${bloques.length} ejercicios.</b> Hacelos también en tu carpeta, con el procedimiento completo.`;
      if (n === bloques.length && ref('practica').estado !== 'ok') { e = leer(); ref('practica').estado = 'ok'; guardarE(); marcarMenu('practica'); }
    };
    let ultimo = '';
    bloques.forEach(x => {
      if (x.c.titulo !== ultimo) { host.querySelector('#ejs').insertAdjacentHTML('beforeend', `<h3 style="margin-top:18px">${esc(x.c.titulo)}</h3>`); ultimo = x.c.titulo; }
      const w = document.createElement('div'); w.className = 'bloque'; host.querySelector('#ejs').appendChild(w);
      renderBloque(w, x.b, { resuelto: !!ref('practica').bloques[x.key], marcar: () => { e = leer(); ref('practica').bloques[x.key] = true; guardarE(); prog(); } });
    });
    prog(); enlazarSig(host);
  }
  function seccionConsejos(host, s) {
    const partes = bio ? sec.filter(x => x.id === 'version' || x.id === 'reglas') : sec.filter(x => x.texto);
    host.innerHTML = `<div class="tarjeta">${cab(s)}
      ${bio ? '<p>Presentar y defender tu trabajo es una habilidad que se entrena. Cuando presentes, primero <b>leé en voz alta la versión final de la biografía</b> y después <b>explicá en castellano las reglas</b> que usaste, con ejemplos de tu texto.</p>'
        : '<p>Presentar y defender tu trabajo es una habilidad que se entrena. La buena noticia: <b>tu trabajo ya tiene el orden de tu exposición</b>. No hace falta armar nada nuevo: presentalo en el mismo orden en que lo escribiste.</p>'}
      <div class="destacado" style="margin-bottom:16px"><h4>El orden de tu presentación</h4><ol style="margin:0">${partes.map(x => `<li>${esc(x.titulo)}</li>`).join('')}</ol></div>
      <div class="consejo-grid">${oral.consejos.map(c => `<div class="consejo"><h4>${c.icono} ${esc(c.titulo)}</h4><ul>${c.items.map(i => `<li>${md(i)}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="copiado"><input type="checkbox" id="leido" ${ref('consejos').estado === 'ok' ? 'checked' : ''}><label for="leido">Ya leí los consejos</label></div></div>${siguiente()}`;
    host.querySelector('#leido').onchange = ev => { e = leer(); ref('consejos').estado = ev.target.checked ? 'ok' : 'pendiente'; guardarE(); marcarMenu('consejos', ev.target.checked ? '✓' : ''); };
    enlazarSig(host);
  }
  function seccionSimulacro(host, s) {
    // Pocas preguntas, según cuántos contenidos eligió: de 2 a 5 sobre los contenidos y de 1 a 3 integradoras
    const n = sel.length;
    const deContenido = [], porNivel = ['Básica', 'Media'];
    if (bio) {
      // biografía: una pregunta por contenido, alternando una en inglés sobre el personaje y una sobre las reglas
      ordenBio.forEach((id, k) => { const qs = tp.preguntas.filter(p => p.contenido === id); const q = qs.find(p => p.nivel === porNivel[k % 2]) || qs[0]; if (q) deContenido.push(q); });
    } else for (const nivel of porNivel) for (const id of sel)
      deContenido.push(...tp.preguntas.filter(p => p.contenido === id && p.nivel === nivel));
    const cantC = Math.min(5, Math.max(2, n + 1)), cantI = Math.min(3, Math.max(1, n));
    const generales = tp.preguntas.filter(p => p.contenido === 'general');
    const propias = tp.preguntas.filter(p => sel.includes(p.contenido) && p.nivel === 'Integradora');
    // con un solo contenido no tiene sentido "elegí dos temas"
    const integradoras = n >= 2 ? [generales[0], ...propias, ...generales.slice(1)] : [...propias, ...generales.slice(1)];
    const preguntas = [...deContenido.slice(0, cantC), ...integradoras.filter(Boolean).slice(0, cantI)];
    const sim = () => T().simulacro;
    const hechas = () => preguntas.filter(p => sim()[p.id]?.hecha).length;
    host.innerHTML = `<div class="tarjeta">${cab(s)}
      <p>Estas son preguntas del tipo que pueden hacerte cuando defiendas tu trabajo. Para cada una: <b>respondé en voz alta</b>, como si estuvieras frente a tu docente. Después mirá la respuesta orientadora y fijate qué ideas te faltaron.</p>
      <p class="ayuda" id="prog"></p><div id="lista"></div></div>${siguiente()}`;
    const prog = () => { host.querySelector('#prog').innerHTML = `<b>Practicaste ${hechas()} de ${preguntas.length} preguntas.</b>`; };
    const lista = host.querySelector('#lista');
    preguntas.forEach(p => {
      const d = document.createElement('div'); const est = sim()[p.id] || {};
      d.className = 'pregunta-trib' + (est.hecha ? ' hecha' : '');
      d.innerHTML = `<div class="nivel">${esc(p.nivel)}</div><div class="q">${md(p.pregunta)}</div>
        <div class="acciones" style="margin-top:8px"><button class="btn sec chico" data-a="ver">Ver respuesta orientadora</button></div><div class="oz"></div>
        <div class="copiado"><input type="checkbox" id="sim-${esc(p.id)}" ${est.hecha ? 'checked' : ''}><label for="sim-${esc(p.id)}">Ya la practiqué en voz alta</label></div>`;
      lista.appendChild(d);
      const oz = d.querySelector('.oz');
      d.querySelector('[data-a=ver]').onclick = () => {
        oz.innerHTML = oz.innerHTML ? '' : `<div class="fb info"><b>Respuesta orientadora:</b> ${md(p.orientacion)}<br><span class="ayuda">No la memorices: compará qué ideas te faltaron y volvé a decirla con tus palabras, en voz alta.</span></div>`;
      };
      d.querySelector('input').onchange = ev => {
        e = leer(); sim()[p.id] = { ...(sim()[p.id] || {}), hecha: ev.target.checked }; d.classList.toggle('hecha', ev.target.checked);
        ref('simulacro').estado = hechas() >= preguntas.length ? 'ok' : 'pendiente'; guardarE(); prog();
        marcarMenu('simulacro', hechas() >= preguntas.length ? '✓' : '');
      };
    });
    prog(); enlazarSig(host);
  }
  function seccionFinal(host) {
    e = leer();
    const partes = sec.filter(s => s.texto);
    const chk = ref('final'); chk.check ??= {};
    host.innerHTML = `<div class="tarjeta"><h2>📒 Mi trabajo completo</h2><div class="subrayado"></div>
      <p class="ayuda no-print">Estas son las partes de tu trabajo, en el orden en que lo vas a presentar. Revisá que estén todas escritas en tu carpeta.</p>
      <div class="hoja-tp"><h2 style="margin-top:0">${esc(tp.titulo)}</h2><p><b>Estudiante:</b> ${hayLMS() && nombreDelLMS() ? esc(nombreDelLMS()) : '<span class="linea-hueco" style="min-width:min(260px,60%)"></span>'}</p>
      <ol class="indice-tp">${partes.map(s => `<li><b>${esc(s.titulo)}</b> ${hecho(s.id) ? '<span class="hecho-tag">✓ en mi carpeta</span>' : '<span class="falta-tag">todavía no la marcaste</span>'}</li>`).join('')}</ol></div></div>
      <div class="tarjeta no-print"><h3>✅ Antes de presentar el Trabajo Práctico</h3><ul class="check-lista">${oral.antes_de_presentar.map((t, i) => `<li><input type="checkbox" id="pm${i}" ${chk.check[i] ? 'checked' : ''}><label for="pm${i}">${esc(t)}</label></li>`).join('')}</ul>
      <p class="ayuda">${hayLMS() ? 'Tu trabajo queda guardado en tu cuenta del aula: podés volver cuando quieras.' : 'Nada de esto se envía a tu docente.'} ¡Mucha suerte en febrero!</p>
      <div class="acciones"><a class="btn" href="index.html" id="fin">Finalizar</a></div></div>`;
    host.querySelector('#fin').addEventListener('click', () => { completarPaquete(); });   // en Moodle: guarda el avance (sin cerrar el intento)
    host.querySelectorAll('.check-lista input').forEach((i, k) => i.onchange = ev => { e = leer(); ref('final').check[k] = ev.target.checked; guardarE(); });
  }

  pintar();
}
