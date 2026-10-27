// TUTORÍAS VIRTUALES · pronunciación con la voz del navegador (sin servicios externos: funciona también en Moodle)
// En los textos, [[palabra o frase]] se muestra con un botón 🔊 que la pronuncia en inglés.
const vozIngles = () => {
  const voces = window.speechSynthesis?.getVoices() || [];
  return voces.find(v => v.lang === 'en-US') || voces.find(v => v.lang === 'en-GB') || voces.find(v => v.lang?.startsWith('en'));
};
export function hablar(texto, lang = 'en-US') {
  if (!('speechSynthesis' in window)) { alertaSinVoz(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = lang; u.rate = 0.85;
  const v = vozIngles(); if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}
function alertaSinVoz() {
  const d = document.createElement('div'); d.className = 'aviso-voz';
  d.textContent = 'Este navegador no puede pronunciar. Probá con Chrome o Edge actualizados.';
  document.body.appendChild(d); setTimeout(() => d.remove(), 4000);
}
if (typeof document !== 'undefined') {
  window.speechSynthesis?.getVoices(); // algunos navegadores cargan las voces recién después del primer pedido
  document.addEventListener('click', ev => {
    const b = ev.target.closest?.('.hablar'); if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    hablar(b.dataset.t, b.dataset.lang || 'en-US');
  });
}
