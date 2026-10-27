// TUTORÍAS VIRTUALES · Asistente: explica y orienta, nunca hace el trabajo. Sin robot: ícono neutro.
import { esc, norm } from './estado.js';
import { NOMBRE_ASISTENTE } from './config.js';
import { hayIA, preguntarAsistente } from './ia.js';

// Solo el material de enseñanza: nunca las respuestas de las actividades ni de la carpeta.
export function contextoDeClase(clase) {
  const out = [`Clase: ${clase.titulo} (${clase.eje})`];
  for (const c of clase.capsulas || []) {
    out.push(`\n## ${c.titulo}`);
    for (const b of c.bloques || []) {
      if (['texto', 'destacado', 'ejemplo', 'dato'].includes(b.t)) out.push(`${b.titulo ? b.titulo + ': ' : ''}${b.texto}`);
      if (b.t === 'ecuacion') out.push(`Fórmula: ${b.formula} ${b.texto || ''}`);
      if (b.t === 'pasos') out.push(`${b.titulo || ''}: ` + b.pasos.map(p => `${p.titulo}: ${p.texto}`).join(' | '));
      if (b.t === 'comparar') out.push(b.filas.map(f => f.join(' — ')).join(' | '));
      if (b.t === 'linea') out.push(b.eventos.map(v => `${v.anio}: ${v.titulo}. ${v.texto}`).join(' | '));
      if (b.t === 'cita') out.push(`Fuente: “${b.texto}” (${b.autor || ''})`);
      // Consignas de las actividades (sin respuestas): para poder explicar las palabras que aparecen en ellas
      if (b.t === 'opcion') out.push(`Actividad (sin respuesta): ${b.pregunta} Opciones: ${b.opciones.join(' / ')}`);
      if (b.t === 'verificar' || b.t === 'clasificar' || b.t === 'ordenar') out.push(`Actividad (sin respuesta): ${b.consigna}`);
      if (b.t === 'revelar') out.push(`Pregunta para pensar: ${b.pregunta}`);
    }
    if (c.carpeta) out.push(`Consigna de la carpeta: ${c.carpeta.instruccion} Preguntas guía: ${(c.carpeta.guia || []).join(' ')}`);
  }
  if (clase.vocabulario) out.push('\nVocabulario: ' + clase.vocabulario.map(v => `${v.palabra}: ${v.definicion}`).join(' | '));
  return out.join('\n');
}

export function montarAsistente({ contexto, vocabulario = [], sugerencias = [] }) {
  const boton = document.createElement('button');
  boton.className = 'asist-boton no-print'; boton.innerHTML = `💬 ${esc(NOMBRE_ASISTENTE)}`;
  const panel = document.createElement('div');
  panel.className = 'asist-panel oculto no-print';
  panel.innerHTML = `<div class="asist-cab"><div><b>${esc(NOMBRE_ASISTENTE)}</b><small>Te explica y te orienta. No hace tu trabajo.</small></div><button class="cerrar" aria-label="Cerrar">✕</button></div>
    <div class="asist-msgs"></div><div class="sugerencias"></div>
    <form class="asist-form"><input type="text" placeholder="Preguntá lo que no entendiste…" aria-label="Tu pregunta"><button>Enviar</button></form>`;
  document.body.append(boton, panel);
  const msgs = panel.querySelector('.asist-msgs'), hist = [];
  const agregar = (rol, texto) => { const d = document.createElement('div'); d.className = 'msg ' + (rol === 'yo' ? 'yo' : 'bot'); d.textContent = texto; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; hist.push({ rol, texto }); return d; };
  agregar('bot', 'Hola. Estoy para ayudarte: si no entendés un tema o una palabra que aparece en la página, preguntame y te lo explico con ejemplos. Las respuestas de las actividades las construís vos: así llegás bien preparado o preparada a febrero.');
  const sug = panel.querySelector('.sugerencias');
  sug.innerHTML = sugerencias.map(s => `<button type="button">${esc(s)}</button>`).join('');
  sug.querySelectorAll('button').forEach(b => b.onclick = () => enviar(b.textContent));

  boton.onclick = () => panel.classList.toggle('oculto');
  panel.querySelector('.cerrar').onclick = () => panel.classList.add('oculto');

  function local(q) {
    const nq = norm(q);
    const hit = vocabulario.find(v => nq.includes(norm(v.palabra)));
    if (hit) return `${hit.palabra}: ${hit.definicion}`;
    return 'Ahora no me puedo conectar. Mientras tanto te ayudo con el vocabulario de la clase: preguntame por una palabra del material, o probá de nuevo en un rato.';
  }
  async function enviar(q) {
    if (!q.trim()) return;
    agregar('yo', q);
    if (!hayIA()) { agregar('bot', local(q)); return; }
    const esp = agregar('bot', 'Pensando…');
    try { const r = await preguntarAsistente({ pregunta: q, historial: hist.slice(0, -2), contexto }); esp.textContent = r || 'No pude responder. Probá de nuevo.'; hist[hist.length - 1].texto = esp.textContent; }
    catch { esp.textContent = local(q); }
  }
  panel.querySelector('form').onsubmit = ev => { ev.preventDefault(); const i = panel.querySelector('input'); const v = i.value; i.value = ''; enviar(v); };
  return { enviar };
}
