// TUTORÍAS VIRTUALES · revisión de lo que escribe el estudiante (sin IA, sin conexión a ningún servicio)
// Compara con las ideas clave de cada consigna. Ayuda a mejorar el texto; quien lo confirma es el docente.
import { AJUSTES } from './config.js';
import { norm, esCopia, revisarEscritura } from './estado.js';

// Solo se marcan las palabras: el estudiante revisa cómo se escriben en el material
const textoAcentos = t => t.length
  ? ' Revisá cómo escribiste ' + t.slice(0, 5).map(x => `"${x}"`).join(', ') + ' (acentos y letras): fijate cómo aparece' + (t.length > 1 ? 'n' : '') + ' en el material.'
  : '';

export async function corregir({ respuesta, claves = [], minPalabras = AJUSTES.MIN_PALABRAS, umbral = 0.6, refEscritura: ref = null, fuentes = [], conReferencia = false }) {
  const t = norm(respuesta);
  const palabras = t ? t.split(' ').length : 0;
  const acentos = revisarEscritura(respuesta, ref);
  if (fuentes.length && esCopia(respuesta, fuentes))
    return { ok: false, copia: true, mensaje: 'Tu texto repite casi igual lo que dice el material. Escribilo con tus palabras: así se nota que lo entendiste.', acentos };
  const faltan = [];
  let aciertos = 0;
  for (const c of claves) {
    const k = c.k ?? c;
    const alts = Array.isArray(k) ? k : [k];
    const esta = alts.some(a => norm(a) && t.includes(norm(a)));
    if (esta) aciertos++; else faltan.push(c.p || '');
  }
  const pistas = faltan.filter(Boolean).slice(0, 3);
  if (minPalabras && palabras < minPalabras)
    return { ok: false, corta: true, faltan: pistas, mensaje: `Tu texto todavía es corto (${palabras} palabras).` + (pistas.length ? ' Para completarlo, agregá: ' + pistas.join(' · ') + '.' : ' Desarrollá un poco más cada idea, con ejemplos.') + textoAcentos(acentos), acentos };
  if (!claves.length) return { ok: true, mensaje: 'Tu texto está completo. Ahora pasalo a tu carpeta.' + textoAcentos(acentos), acentos };
  const necesarios = Math.ceil(claves.length * umbral);
  if (aciertos >= necesarios)
    return { ok: true, mensaje: (conReferencia
      ? 'Tu texto incluye las ideas principales. Comparalo con la respuesta orientadora para ver si te falta algo y, después, pasalo a tu carpeta.'
      : 'Tu texto incluye las ideas principales. Releelo para ver si está completo y, después, pasalo a tu carpeta.') + textoAcentos(acentos), acentos };
  return {
    ok: false,
    mensaje: 'Todavía falta algo. ' + (pistas.length ? 'Agregá a tu texto: ' + pistas.join(' · ') + '.' : 'Volvé a leer el material y reescribilo con más detalle.') + textoAcentos(acentos),
    acentos,
  };
}

/* ---------- Simulacro de la defensa ---------- */
const VACIAS = new Set('porque cuando entre sobre desde hasta durante tambien ademas aunque tiene tenia tenian puede pueden eran estaba estaban hacia otros otras todos todas mismo misma cada donde quien quienes despues antes ejemplo cosas mucho muchos'.split(' '));
export async function corregirOral({ respuesta, modelo, refEscritura = null }) {
  const acentos = revisarEscritura(respuesta, refEscritura);
  if (esCopia(respuesta, [modelo], { min: 8, prop: 0.5 }))
    return { ok: false, copia: true, mensaje: 'Esta respuesta es igual o casi igual a la respuesta orientadora. Cerrala, pensá y decilo con tus propias palabras: en la defensa no vas a tener el texto delante.' };
  const n = norm(respuesta).split(' ').filter(Boolean).length;
  if (n < 10) return { ok: false, mensaje: 'Para defender una idea hace falta desarrollar más. Probá explicar con un ejemplo.' + textoAcentos(acentos) };
  const clave = [...new Set(norm(modelo).replace(/[.,]/g, ' ').split(' ').filter(w => w.length >= 5 && !VACIAS.has(w)))];
  const t = norm(respuesta);
  const estan = clave.filter(w => t.includes(w.slice(0, Math.max(5, w.length - 2))));
  const ok = estan.length >= Math.min(3, Math.ceil(clave.length * 0.3));
  return ok
    ? { ok: true, mensaje: 'Tu respuesta tiene ideas importantes. Comparala con la respuesta orientadora y ensayala en voz alta, sin leer.' + textoAcentos(acentos) }
    : { ok: false, mensaje: 'Te faltan ideas centrales. Releé esa parte de tu trabajo y probá otra vez.' + textoAcentos(acentos) };
}
