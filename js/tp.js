// TUTORÍAS VIRTUALES · Trabajo práctico y preparación para presentarlo y defenderlo
// El alumno arma el TP parte por parte (primero en pantalla con aprobación, después en su carpeta).
// Cada espacio curricular tiene su propio TP. Nada se envía al docente.
import { leer, guardar, esc, md, tpDe, consignaHTML, referenciaEscritura } from './estado.js';
import { corregir, corregirOral, hayIA } from './ia.js';
import { AJUSTES } from './config.js';
import { renderBloque, guiaHTML, textosDe, NOTA_DOCENTE } from './motor.js';

const parr = s => (s || '').split(/\n\n+/).map(p => `<p>${md(p)}</p>`).join('');
const CONECTORES = { k: ['porque', 'por eso', 'se relaciona', 'relacion', 'causa', 'consecuencia', 'gracias a', 'ambos', 'los dos', 'en cambio', 'mientras que', 'tambien', 'igual que', 'se conecta', 'lleva a', 'permite', 'sirve para', 'se usa'], p: 'cómo se relacionan (porque, por eso, en cambio, se relaciona con…)' };
const PRESENTE = { k: ['hoy', 'actual', 'en la actualidad', 'todavia', 'sigue', 'siguen', 'en mi', 'mi familia', 'mi ciudad', 'mi barrio', 'firmat', 'cotidian', 'por ejemplo', 'cuando'], p: 'un ejemplo concreto del presente' };

export function montarTP({ root, tp, oral, contenidos, clases = {}, espacio }) {
  let e = leer();
  const sel = contenidos.map(c => c.id);
  const esMate = espacio === 'matematica';
  const refEscritura = referenciaEscritura(tp, ...Object.values(clases));
  const fuentes = Object.values(clases).flatMap(c => c.capsulas.flatMap(k => textosDe(k.bloques)));
  const sec = [
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
    ({ info: seccionFormato, escribir: seccionEscribir, desarrollo: seccionDesarrollo, integracion: seccionIntegracion, realidad: seccionRealidad, practica: seccionPractica, consejos: seccionConsejos, simulacro: seccionSimulacro, final: seccionFinal }[s.tipo])(host, s);
  }
  const siguiente = () => {
    const i = sec.findIndex(s => s.id === actual); const n = sec[i + 1];
    return n ? `<div class="acciones no-print"><button class="btn" id="sigsec">Siguiente: ${esc(n.titulo)} →</button></div>` : '';
  };
  const enlazarSig = host => host.querySelector('#sigsec')?.addEventListener('click', () => { const i = sec.findIndex(s => s.id === actual); actual = sec[i + 1].id; pintar(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  const marcarMenu = (id, txt = '✓') => { const el = root.querySelector(`[data-id="${id}"] .estado`); if (el) el.textContent = txt; };
  const cab = s => `<div class="titulo-seccion"><div class="chip-icono">${s.icono}</div><h2>${esc(s.titulo)}</h2></div><div class="subrayado"></div>`;

  /* ---- bloque genérico: escribir → corregir → aprobar → copiar ---- */
  function escritura(host, id, titulo, cfg, { instruccion, guia, claves, umbral, extra = '' } = {}) {
    const st = ref(id); const aprobado = st.estado === 'ok' || st.estado === 'duda';
    const ins = instruccion ?? cfg.instruccion;
    host.innerHTML = `<div class="carpeta" style="margin-top:12px"><h3>📒 ${esc(titulo)}</h3>${consignaHTML(ins)}
      ${guiaHTML({ ...cfg, guia: guia ?? cfg.guia })}${extra}
      <textarea id="txt" style="min-height:190px" placeholder="Escribilo con tus palabras…" ${aprobado ? 'readonly' : ''}>${esc(st.texto || '')}</textarea>
      <div class="acciones"><button class="btn" id="corr" ${aprobado ? 'disabled' : ''}>Corregir</button><button class="btn sec chico oculto" id="duda">Tengo una duda: seguir igual</button></div>
      <div id="fbc"></div><div class="copiado ${aprobado ? '' : 'oculto'}" id="cop"><input type="checkbox" id="chk" ${st.copiado ? 'checked' : ''}><label for="chk">Ya lo copié en mi carpeta</label></div>${NOTA_DOCENTE}</div>`;
    const q = s => host.querySelector(s);
    if (st.estado === 'ok') q('#fbc').innerHTML = `<div class="fb ok"><b>✔</b> ${esc(st.devolucion || 'Aprobado.')}</div>`;
    if (st.estado === 'duda') q('#fbc').innerHTML = `<div class="fb aviso"><span class="duda-tag">Duda para febrero</span> Anotala en tu carpeta y consultala con tu docente antes de presentar el trabajo.</div>`;
    if (!aprobado && st.intentos >= AJUSTES.INTENTOS_PARA_DUDA) q('#duda').classList.remove('oculto');
    q('#chk').onchange = ev => { e = leer(); ref(id).copiado = ev.target.checked; guardarE(); };
    q('#corr').onclick = async () => {
      const t = q('#txt').value.trim();
      if (!t) { q('#fbc').innerHTML = '<div class="fb aviso">Escribí tu respuesta primero.</div>'; return; }
      q('#corr').disabled = true; q('#fbc').innerHTML = '<div class="fb info">Revisando…</div>';
      const r = await corregir({ consigna: ins, respuesta: t, referencia: cfg.referencia || '', claves: claves ?? cfg.claves ?? [], contexto: `${tp.titulo} — ${titulo}`, minPalabras: cfg.minPalabras, refEscritura, fuentes, umbral });
      e = leer(); const s2 = ref(id); s2.texto = t; s2.titulo = titulo;
      if (r.ok) { s2.estado = 'ok'; s2.devolucion = r.mensaje; guardarE(); pintar(); return; }
      s2.intentos = (s2.intentos || 0) + 1; guardarE();
      q('#fbc').innerHTML = `<div class="fb mal"><b>Todavía no.</b> ${esc(r.mensaje)}</div>`; q('#corr').disabled = false;
      if (s2.intentos >= AJUSTES.INTENTOS_PARA_DUDA) q('#duda').classList.remove('oculto');
    };
    q('#duda').onclick = () => { e = leer(); const s2 = ref(id); s2.estado = 'duda'; s2.texto = q('#txt').value.trim(); s2.titulo = titulo; guardarE(); pintar(); };
  }
  // Claves armadas a partir de los contenidos elegidos (exige nombrar al menos dos y relacionarlos)
  const clavesDe = (ids, extra, minimo) => {
    const cl = ids.map(id => ({ k: tp.claves_contenido?.[id] || [], p: 'ideas de «' + (contenidos.find(c => c.id === id)?.titulo || id) + '»' })).filter(c => c.k.length);
    const claves = [...cl, extra];
    const necesarios = Math.min(cl.length, minimo) + 1;
    return { claves, umbral: necesarios / claves.length - 1e-9 };
  };

  /* ---- secciones ---- */
  function seccionFormato(host) {
    const partes = sec.filter(s => s.texto);
    host.innerHTML = `<div class="tarjeta"><h2>🧭 Cómo es un buen trabajo práctico</h2><div class="subrayado"></div>
      <p>Tu trabajo práctico es lo que vas a <b>presentar y defender</b> en febrero. Se arma por partes: en cada una escribís primero en esta pantalla (te ayudamos a mejorarlo y lo aprobamos) y después lo pasás a mano a tu carpeta.</p>
      <h3>Las partes de tu trabajo (y el orden en que lo vas a presentar)</h3>
      <ol>${partes.map(s => `<li><b>${esc(s.titulo)}</b></li>`).join('')}</ol>
      ${esMate ? '<p>Además, vas a practicar <b>ejercicios</b> como los que te pueden pedir que resuelvas en el momento de presentar.</p>' : ''}
      <h3>Para que quede bien</h3>
      <ul><li>Escribilo con <b>tus palabras</b>: copiar no demuestra que entendiste.</li><li>Usá lo que ya escribiste en tu carpeta en cada clase: es la base de tu trabajo.</li><li>Poné <b>ejemplos propios</b> y mostrá cómo pensás.</li><li>Carpeta prolija: título en cada parte, letra clara y todo en orden.</li><li>Si algo no te sale después de intentarlo, marcalo como <b>duda</b> y consultalo con tu docente antes de presentar el trabajo.</li></ul>
      <h3>Qué suelen observar los docentes</h3><p class="ayuda">Es orientativo: quien te evalúa es tu docente.</p>
      <ul>${oral.que_observan.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <div class="fb info">Nada de lo que hagas acá se envía a tu docente. El trabajo lo presentás y lo defendés vos.</div></div>${siguiente()}`;
    enlazarSig(host);
    const st = ref('formato'); if (st.estado !== 'ok') { st.estado = 'ok'; guardarE(); marcarMenu('formato'); }
  }
  function seccionEscribir(host, s) {
    host.innerHTML = `<div class="tarjeta">${cab(s)}<div id="esc"></div></div>${siguiente()}`;
    escritura(host.querySelector('#esc'), s.id, s.titulo, s.cfg); enlazarSig(host);
  }
  function seccionDesarrollo(host, s) {
    const clase = clases[s.contenido.id];
    const caps = clase ? clase.capsulas.map(k => ({ t: k.titulo, x: e.clases?.[clase.id]?.caps?.[k.id]?.texto || '' })) : [];
    const carpeta = caps.length ? `<div class="destacado" style="margin:0 0 12px"><h4>📒 Lo que ya escribiste en tu carpeta en esta clase</h4>
      ${caps.map(k => `<p style="margin:0 0 8px"><b>${esc(k.t)}:</b> ${k.x ? esc(k.x) : '<span class="ayuda">(todavía no hiciste esta parte)</span>'}</p>`).join('')}
      <p class="ayuda" style="margin:0">Usalo como base: ahora lo vas a unir en un solo texto ordenado, que se entienda de principio a fin.</p></div>` : '';
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
    const { claves, umbral } = clavesDe(sel, CONECTORES, 2);
    host.innerHTML = `<div class="tarjeta">${cab(s)}${parr(sel.length >= 2 ? g.intro : g.intro_uno)}
      <div class="consejo" style="margin-bottom:6px"><h4>Preguntas para integrar ${sel.length >= 2 ? 'los contenidos que elegiste' : 'las partes de tu contenido'}</h4><ul>${preguntas.map(q => `<li>${md(q)}</li>`).join('')}</ul></div>
      <div class="consejo"><h4>Preguntas que sirven siempre</h4><ul>${g.generales.map(q => `<li>${md(q)}</li>`).join('')}</ul></div>
      <div id="esc"></div></div>${siguiente()}`;
    escritura(host.querySelector('#esc'), 'integracion', s.titulo, g, {
      instruccion: sel.length >= 2
        ? 'Escribí un texto que conecte tus contenidos: elegí al menos dos de las preguntas de arriba y respondelas en un solo texto, mostrando qué relación hay entre los temas (causas, consecuencias, semejanzas o en qué se usa uno para entender el otro).'
        : 'Escribí un texto que conecte las partes de tu contenido: elegí al menos dos de las preguntas de arriba y respondelas en un solo texto, mostrando cómo se relacionan.',
      guia: [], claves, umbral,
    });
    enlazarSig(host);
  }
  function seccionRealidad(host, s) {
    const r = tp.realidad;
    const items = sel.map(id => ({ c: contenidos.find(c => c.id === id), q: r.por_contenido[id] })).filter(x => x.q);
    const { claves, umbral } = clavesDe(sel, PRESENTE, Math.max(1, sel.length - 1));
    host.innerHTML = `<div class="tarjeta">${cab(s)}${parr(r.intro)}
      <div class="consejo-grid" style="margin-bottom:6px">${items.map(x => `<div class="consejo"><h4>${esc(x.c.titulo)}</h4><p style="margin:0 0 6px;font-weight:700">${md(x.q.pregunta)}</p><ul>${x.q.ideas.map(i => `<li>${md(i)}</li>`).join('')}</ul></div>`).join('')}</div>
      <div id="esc"></div></div>${siguiente()}`;
    escritura(host.querySelector('#esc'), 'realidad', s.titulo, { ...r, minPalabras: (r.minPalabras_por_contenido || 15) * items.length }, {
      instruccion: items.length > 1
        ? 'Escribí cómo aparecen hoy los temas de tu trabajo: respondé la pregunta de cada contenido que elegiste (un párrafo por contenido), con un ejemplo concreto del presente.'
        : 'Escribí cómo aparece hoy el tema de tu trabajo: respondé la pregunta de arriba con un ejemplo concreto del presente.',
      guia: [], claves, umbral,
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
    const partes = sec.filter(x => x.texto);
    host.innerHTML = `<div class="tarjeta">${cab(s)}
      <p>Presentar y defender tu trabajo es una habilidad que se entrena. La buena noticia: <b>tu trabajo ya tiene el orden de tu exposición</b>. No hace falta armar nada nuevo: presentalo en el mismo orden en que lo escribiste.</p>
      <div class="destacado" style="margin-bottom:16px"><h4>El orden de tu presentación</h4><ol style="margin:0">${partes.map(x => `<li>${esc(x.titulo)}</li>`).join('')}</ol></div>
      <div class="consejo-grid">${oral.consejos.map(c => `<div class="consejo"><h4>${c.icono} ${esc(c.titulo)}</h4><ul>${c.items.map(i => `<li>${md(i)}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="copiado"><input type="checkbox" id="leido" ${ref('consejos').estado === 'ok' ? 'checked' : ''}><label for="leido">Ya leí los consejos</label></div></div>${siguiente()}`;
    host.querySelector('#leido').onchange = ev => { e = leer(); ref('consejos').estado = ev.target.checked ? 'ok' : 'pendiente'; guardarE(); marcarMenu('consejos', ev.target.checked ? '✓' : ''); };
    enlazarSig(host);
  }
  function seccionSimulacro(host, s) {
    const preguntas = tp.preguntas.filter(p => p.contenido === 'general' || sel.includes(p.contenido));
    const sim = () => T().simulacro;
    const hechas = () => preguntas.filter(p => sim()[p.id]?.hecha).length;
    host.innerHTML = `<div class="tarjeta">${cab(s)}
      <p>Estas son preguntas del tipo que pueden hacerte cuando defiendas tu trabajo. Respondé como si estuvieras hablando: podés escribir o dictar con el micrófono. Cuando la revises, vas a poder ver una respuesta orientadora para comparar. Una pregunta queda ensayada cuando tu respuesta, <b>escrita con tus palabras</b>, tiene las ideas importantes.</p>
      <p class="ayuda" id="prog"></p><div id="lista"></div></div>${siguiente()}`;
    const prog = () => { host.querySelector('#prog').innerHTML = `<b>Ensayaste ${hechas()} de ${preguntas.length} preguntas.</b>`; };
    const lista = host.querySelector('#lista');
    preguntas.forEach(p => {
      const d = document.createElement('div'); const est = sim()[p.id] || {};
      d.className = 'pregunta-trib' + (est.hecha ? ' hecha' : '');
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      d.innerHTML = `<div class="nivel">${esc(p.nivel)}</div><div class="q">${md(p.pregunta)}</div>
        <textarea placeholder="Tu respuesta, con tus palabras…" style="min-height:90px">${esc(est.texto || '')}</textarea>
        <div class="acciones" style="margin-top:8px">${SR ? '<button class="btn suave chico" data-a="mic">🎤 Dictar</button>' : ''}<button class="btn chico" data-a="rev">Revisar mi respuesta</button><button class="btn sec chico ${est.intento || est.hecha ? '' : 'oculto'}" data-a="ver">Ver respuesta orientadora</button></div>
        <div class="fz"></div><div class="oz"></div>`;
      lista.appendChild(d);
      const ta = d.querySelector('textarea'), fz = d.querySelector('.fz'), oz = d.querySelector('.oz');
      const guardarSim = (cambios) => { e = leer(); sim()[p.id] = { ...(sim()[p.id] || {}), ...cambios }; guardarE(); };
      d.querySelector('[data-a=ver]').onclick = () => {
        oz.innerHTML = oz.innerHTML ? '' : `<div class="fb info"><b>Respuesta orientadora:</b> ${md(p.orientacion)}<br><span class="ayuda">No la copies: compará qué ideas te faltaron y decilo de nuevo con tus palabras, en voz alta.</span></div>`;
      };
      d.querySelector('[data-a=rev]').onclick = async () => {
        if (!ta.value.trim()) { fz.innerHTML = '<div class="fb aviso">Escribí o dictá tu respuesta primero.</div>'; return; }
        fz.innerHTML = '<div class="fb info">Revisando…</div>';
        const r = await corregirOral({ pregunta: p.pregunta, respuesta: ta.value, modelo: p.orientacion, contexto: tp.titulo, refEscritura });
        fz.innerHTML = `<div class="fb ${r.ok ? 'ok' : 'mal'}">${esc(r.mensaje)}</div>`;
        guardarSim({ intento: true, texto: ta.value });
        d.querySelector('[data-a=ver]').classList.remove('oculto');
        if (r.ok) {
          guardarSim({ hecha: true }); d.classList.add('hecha'); prog();
          if (hechas() >= preguntas.length) { e = leer(); ref('simulacro').estado = 'ok'; guardarE(); marcarMenu('simulacro'); }
        } else if (r.copia) { guardarSim({ hecha: false }); d.classList.remove('hecha'); prog(); }
      };
      const mic = d.querySelector('[data-a=mic]');
      if (mic) mic.onclick = () => {
        const rec = new SR(); rec.lang = 'es-AR'; rec.interimResults = false; rec.continuous = false;
        mic.textContent = '🔴 Escuchando…';
        rec.onresult = ev => { ta.value = (ta.value + ' ' + ev.results[0][0].transcript).trim(); };
        rec.onend = () => { mic.textContent = '🎤 Dictar'; }; rec.onerror = () => { mic.textContent = '🎤 Dictar'; };
        try { rec.start(); } catch { mic.textContent = '🎤 Dictar'; }
      };
    });
    prog(); enlazarSig(host);
  }
  function seccionFinal(host) {
    e = leer();
    const partes = sec.filter(s => s.texto);
    const chk = ref('final'); chk.check ??= {};
    host.innerHTML = `<div class="tarjeta"><h2>📒 Mi trabajo completo</h2><div class="subrayado"></div>
      <p class="ayuda no-print">Esto es lo que escribiste en pantalla, en el orden en que lo vas a presentar. Revisá que esté todo en tu carpeta. Lo marcado como duda, consultalo con tu docente antes de presentar el trabajo.</p>
      <div class="hoja-tp"><h2 style="margin-top:0">${esc(tp.titulo)}</h2><p><b>Estudiante:</b> ${esc(e.alumno.nombre)}</p>
      ${partes.map(s => { const st = T().secciones[s.id]; return `<div class="sec"><h3>${esc(s.titulo)} ${st?.estado === 'duda' ? '<span class="duda-tag">duda</span>' : ''}</h3><pre>${esc(st?.texto || '(todavía no lo escribiste)')}</pre></div>`; }).join('')}</div>
      <div class="acciones no-print"><button class="btn sec" id="impr">🖨️ Imprimir o guardar en PDF</button></div></div>
      <div class="tarjeta no-print"><h3>✅ Antes de presentar el Trabajo Práctico</h3><ul class="check-lista">${oral.antes_de_presentar.map((t, i) => `<li><input type="checkbox" id="pm${i}" ${chk.check[i] ? 'checked' : ''}><label for="pm${i}">${esc(t)}</label></li>`).join('')}</ul>
      <p class="ayuda">Nada de esto se envía a tu docente. ¡Mucha suerte en febrero!</p>
      <div class="acciones"><a class="btn" href="index.html" id="fin">Finalizar</a></div></div>`;
    host.querySelector('#impr').onclick = () => window.print();
    host.querySelectorAll('.check-lista input').forEach((i, k) => i.onchange = ev => { e = leer(); ref('final').check[k] = ev.target.checked; guardarE(); });
  }

  pintar();
}
