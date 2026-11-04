// TUTORÍAS VIRTUALES · ilustraciones animadas (SVG propio, sin recursos externos)
// Cada función devuelve el SVG como texto. Se usan desde un bloque { t: 'animacion', nombre: '...' }.
// Las animaciones son breves y suaves; con «reducir movimiento» activado en el dispositivo quedan quietas.

const C = { azul: '#4B4FA3', violeta: '#5B2A86', rojo: '#E5194F', naranja: '#F0731E', tinta: '#1B1A4A', suave: '#4A4870',
  agua: '#BFE0F5', aguaOsc: '#7FB8E6', tierra: '#E8D8B4', tierraOsc: '#B79A66', roca: '#8F8A9C', verde: '#6BBF8A', nube: '#D9DDF0', lav: '#EFEAFB' };

const ESTILO = `<style>
  svg text{font-family:inherit;fill:${C.tinta};font-size:12px}
  .b{font-weight:700}.s{font-size:11px;fill:${C.suave}}.c{text-anchor:middle}
  @keyframes fluir{to{stroke-dashoffset:-14}}
  @keyframes trazo{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
  @keyframes ola{0%,100%{transform:translateX(0)}50%{transform:translateX(-14px)}}
  @keyframes crecer{from{transform:scaleY(0)}to{transform:scaleY(1)}}
  @keyframes bajar{0%{transform:translateY(-8px);opacity:0}25%{opacity:1}100%{transform:translateY(18px);opacity:0}}
  @keyframes subir{0%{transform:translateY(14px);opacity:0}25%{opacity:1}100%{transform:translateY(-14px);opacity:0}}
  @keyframes llover{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(26px);opacity:0}}
  @keyframes aparecer{from{opacity:0}to{opacity:1}}
  @keyframes pulso{0%,100%{opacity:.45}50%{opacity:1}}
  @keyframes termo{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.35)}}
  .fl{stroke-dasharray:8 6;animation:fluir 1s linear infinite}
  .ola{animation:ola 3s ease-in-out infinite}
  .cr{transform-box:fill-box;transform-origin:bottom;animation:crecer 1s ease-out both}
  @media (prefers-reduced-motion:reduce){svg *{animation:none!important}svg animateMotion,svg animate{display:none}}
</style>`;
const svg = (w, h, inner, alt = '') => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${alt}" style="width:100%;height:auto;max-width:${w * 1.4}px;display:block;margin:auto">${ESTILO}${inner}</svg>`;

// flecha con punta: la línea "fluye" hacia la punta
function flecha(x1, y1, x2, y2, color, { fluir = true, ancho = 3, punta = 9 } = {}) {
  const a = Math.atan2(y2 - y1, x2 - x1), dx = Math.cos(a), dy = Math.sin(a);
  const bx = x2 - dx * punta, by = y2 - dy * punta;
  const p = [[x2, y2], [bx - dy * punta * .55, by + dx * punta * .55], [bx + dy * punta * .55, by - dx * punta * .55]].map(q => q.join(',')).join(' ');
  return `<line class="${fluir ? 'fl' : ''}" x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${color}" stroke-width="${ancho}" stroke-linecap="round"/><polygon points="${p}" fill="${color}"/>`;
}

/* ---------- silueta esquemática de la Argentina (sin escala, solo para ubicar) ---------- */
const X = lon => 100 + (lon + 75) * 8.5, Y = lat => 10 + (-lat - 20) * 10.2;
const pt = ([lon, lat]) => `${X(lon).toFixed(1)},${Y(lat).toFixed(1)}`;
const CONTINENTE = [[-66.3, -22.1], [-62.4, -22.3], [-60, -24.2], [-57.8, -25.3], [-58.6, -27.3], [-55.9, -27.4], [-54.6, -25.6], [-53.7, -26.3], [-53.8, -27.1], [-55.3, -28.2], [-57.1, -29.8], [-58, -31.4], [-58.5, -33], [-58.4, -34.5],
  [-56.8, -36.3], [-57.5, -38], [-58.7, -38.6], [-62.2, -38.8], [-63, -40.8], [-64.5, -41.2], [-63.5, -42.4], [-65, -42.8], [-65.3, -44.3], [-67.5, -45.9], [-65.9, -47.8], [-67.7, -49.3], [-69.2, -51.6], [-68.4, -52.3],
  [-69, -52.2], [-71.9, -50.5], [-72.4, -48], [-71.7, -46], [-71.8, -44], [-71.7, -42], [-71.7, -40], [-71, -38], [-70.3, -36], [-70, -34], [-70, -32.5], [-69.8, -30], [-68.3, -27], [-68.5, -25.5], [-67.2, -24], [-66.5, -22.9]];
const FUEGO = [[-68.6, -52.7], [-68, -53.3], [-67.7, -53.8], [-67.6, -54.1], [-65.2, -54.7], [-68.3, -54.8], [-68.6, -54.3]];
// costa atlántica, de Punta Rasa (cabo San Antonio) hasta la Isla Grande de Tierra del Fuego
const COSTA = [[-56.8, -36.3], [-57.5, -38], [-58.7, -38.6], [-62.2, -38.8], [-63, -40.8], [-64.5, -41.2], [-63.5, -42.4], [-65, -42.8], [-65.3, -44.3], [-67.5, -45.9], [-65.9, -47.8], [-67.7, -49.3], [-69.2, -51.6], [-68.4, -52.3]];
const COSTA_FUEGO = [[-68.6, -52.7], [-68, -53.3], [-67.7, -53.8], [-65.2, -54.7]];
const mapaBase = () => `<rect width="420" height="400" fill="${C.agua}" opacity=".35" rx="14"/>
  <polygon points="${CONTINENTE.map(pt).join(' ')}" fill="${C.tierra}" stroke="${C.tierraOsc}" stroke-width="1.5" stroke-linejoin="round"/>
  <polygon points="${FUEGO.map(pt).join(' ')}" fill="${C.tierra}" stroke="${C.tierraOsc}" stroke-width="1.5" stroke-linejoin="round"/>
  <text class="s" x="16" y="200">O. Pacífico</text><text class="s" x="318" y="150">O. Atlántico</text>
  <text class="s" x="16" y="388">Esquema sin escala</text>`;

export const ANIMACIONES = {
  /* ===== 1. la línea de costa, de Punta Rasa a Tierra del Fuego ===== */
  costa() {
    const ruta = COSTA.map(pt).join(' L'), fuego = COSTA_FUEGO.map(pt).join(' L');
    const [x0, y0] = pt(COSTA[0]).split(',').map(Number), [x1, y1] = pt(COSTA_FUEGO[3]).split(',').map(Number);
    return svg(420, 400, `${mapaBase()}
      <path d="M${ruta}" fill="none" stroke="${C.rojo}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" style="animation:trazo 4s ease-out both"/>
      <path d="M${fuego}" fill="none" stroke="${C.rojo}" stroke-width="4" stroke-linecap="round" pathLength="1" stroke-dasharray="1" style="animation:trazo 1s 3.8s ease-out both"/>
      <circle cx="${x0}" cy="${y0}" r="6" fill="${C.azul}" stroke="#fff" stroke-width="2"/>
      <g style="animation:aparecer .6s 0s both"><text class="b" x="${x0 + 14}" y="${y0 - 14}">Punta Rasa</text><text class="s" x="${x0 + 14}" y="${y0 - 1}">cabo San Antonio</text><text class="s" x="${x0 + 14}" y="${y0 + 12}">(Buenos Aires)</text></g>
      <circle cx="${x1}" cy="${y1}" r="6" fill="${C.azul}" stroke="#fff" stroke-width="2" style="animation:aparecer .4s 4.6s both"/>
      <g style="animation:aparecer .6s 4.6s both"><text class="b" x="${x1 + 12}" y="${y1 - 14}">Isla Grande de</text><text class="b" x="${x1 + 12}" y="${y1 - 1}">Tierra del Fuego</text></g>
      <text class="b c" x="338" y="250" fill="${C.rojo}" style="animation:aparecer .6s 4s both;fill:${C.rojo}">Más de</text>
      <text class="b c" x="338" y="266" style="animation:aparecer .6s 4s both;fill:${C.rojo}">4.000 km</text>`, 'Esquema de la Argentina con la línea de costa marítima que va de Punta Rasa hasta la Isla Grande de Tierra del Fuego');
  },

  /* ===== 2. perfil de las dos costas ===== */
  costas() {
    const olas = (y, x0, x1) => { let d = `M${x0 - 20},${y}`; for (let x = x0 - 20; x < x1 + 40; x += 28) d += ` q7,-7 14,0 t14,0`; return `<path class="ola" d="${d} L${x1 + 40},${y + 70} L${x0 - 20},${y + 70}Z" fill="${C.aguaOsc}" opacity=".75"/>`; };
    return svg(420, 350, `
      <svg x="0" y="0" width="420" height="170" viewBox="0 0 420 170"><text class="b" x="12" y="20" style="fill:${C.azul}">Litoral pampeano</text>
        <rect x="0" y="28" width="420" height="140" fill="${C.lav}" rx="10"/>
        <rect x="0" y="118" width="190" height="50" fill="${C.aguaOsc}" opacity=".5"/>${olas(116, 0, 150)}
        <polygon points="0,165 120,150 150,128 215,100 245,84 275,98 305,88 340,100 420,96 420,168 0,168" fill="${C.tierra}" stroke="${C.tierraOsc}" stroke-width="1.5"/>
        <text class="s" x="232" y="60">dunas de arena de origen marino</text>
        <text class="s" x="14" y="46">Costa baja, playas de</text><text class="s" x="14" y="60">pendiente suave</text></svg>
      <svg x="0" y="178" width="420" height="170" viewBox="0 0 420 170"><text class="b" x="12" y="20" style="fill:${C.rojo}">Litoral patagónico</text>
        <rect x="0" y="28" width="420" height="140" fill="${C.lav}" rx="10"/>
        <rect x="0" y="118" width="170" height="50" fill="${C.aguaOsc}" opacity=".5"/>${olas(116, 0, 130)}
        <polygon points="0,165 150,150 160,118 164,60 420,56 420,168 0,168" fill="${C.roca}" stroke="#6d687a" stroke-width="1.5"/>
        <path d="M164,60 L164,118" stroke="#6d687a" stroke-width="3"/>
        <g style="animation:pulso 2s ease-in-out infinite"><path d="M120,100 l22,-8 M122,118 l22,-4" stroke="${C.azul}" stroke-width="3" stroke-linecap="round"/><polygon points="146,90 138,87 140,96" fill="${C.azul}"/><polygon points="148,113 139,110 140,119" fill="${C.azul}"/></g>
        <text class="s" x="180" y="90" style="fill:#fff">acantilados de rocas blandas</text><text class="s" x="180" y="104" style="fill:#fff">que erosionan las olas y las mareas</text>
        <text class="s" x="14" y="46">Costa alta,</text><text class="s" x="14" y="60">de pendiente pronunciada</text></svg>`,
      'Perfil de dos costas: la pampeana con playas de pendiente suave y dunas, y la patagónica con acantilados');
  },

  /* ===== 3. plataforma continental ===== */
  plataforma() {
    let ola = 'M100,86'; for (let x = 100; x < 480; x += 28) ola += ' q7,-6 14,0 t14,0';
    return svg(420, 260, `
      <rect x="100" y="86" width="320" height="174" fill="${C.agua}"/>
      <path class="ola" d="${ola} L480,110 L100,110Z" fill="${C.aguaOsc}" opacity=".7"/>
      <path d="M0,86 L100,86 L290,112 L318,122 L372,214 L420,222 L420,260 L0,260Z" fill="${C.tierra}" stroke="${C.tierraOsc}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M318,122 L372,214 L420,222 L420,260 L330,260Z" fill="#CDBB91"/>
      <text class="b" x="12" y="130">Continente</text>
      <line x1="100" y1="86" x2="100" y2="72" stroke="${C.tinta}" stroke-width="1.5"/><text class="s" x="100" y="66" style="text-anchor:middle">Costa</text>
      <g style="animation:aparecer .8s 1s both"><path d="M100,78 L290,78" stroke="${C.rojo}" stroke-width="3" stroke-linecap="round"/><polygon points="100,78 110,73 110,83" fill="${C.rojo}"/><polygon points="290,78 280,73 280,83" fill="${C.rojo}"/>
        <text class="b" x="195" y="26" style="text-anchor:middle;fill:${C.rojo}">Plataforma continental</text><text class="s" x="195" y="42" style="text-anchor:middle">(fondo marino que continúa al continente)</text></g>
      <g style="animation:aparecer .8s 2s both"><line x1="318" y1="86" x2="318" y2="124" stroke="${C.azul}" stroke-width="2" stroke-dasharray="4 3"/><text class="b" x="326" y="104" style="fill:${C.azul}">≈ 200 m</text>
        <text class="s" x="326" y="118">de profundidad</text></g>
      <text class="s" x="338" y="150">Mar Argentino</text>
            <circle r="3" fill="#fff" opacity=".9"><animateMotion dur="5s" repeatCount="indefinite" path="M392,200 C398,170 386,140 392,112"/></circle>
      <circle r="2.5" fill="#fff" opacity=".9"><animateMotion dur="4s" begin="1s" repeatCount="indefinite" path="M404,206 C410,176 398,150 404,118"/></circle>
      <text class="s" x="12" y="250">Esquema sin escala</text>`, 'Corte del fondo marino: la plataforma continental es el fondo marino que continúa al continente, de unos 200 metros de profundidad');
  },

  /* ===== 4. tiempo y clima ===== */
  tiempo_clima() {
    const dias = ['L', 'M', 'M', 'J', 'V', 'S', 'D'], v = [86, 112, 62, 120, 100, 116, 76];
    return svg(420, 260, `
      <text class="b" x="12" y="22">El tiempo cambia día a día…</text>
      <line x1="30" y1="210" x2="408" y2="210" stroke="${C.suave}" stroke-width="2"/>
      ${v.map((h, i) => `<rect class="cr" x="${46 + i * 52}" y="${210 - h}" width="34" height="${h}" rx="6" fill="${[C.azul, C.naranja, C.violeta, C.rojo, C.azul, C.naranja, C.violeta][i]}" style="animation-delay:${i * .35}s"/><text class="s c" x="${63 + i * 52}" y="228">${dias[i]}</text>`).join('')}
      <g style="animation:aparecer .8s 3s both"><line x1="30" y1="${210 - 96}" x2="408" y2="${210 - 96}" stroke="${C.rojo}" stroke-width="3" stroke-dasharray="8 5"/>
        <rect x="170" y="30" width="236" height="40" rx="10" fill="#fff" stroke="${C.rojo}" stroke-width="1.5"/><text class="b" x="182" y="47" style="fill:${C.rojo}">…el clima es el promedio</text><text class="s" x="182" y="62">de muchos años en un lugar</text></g>
      <text class="s" x="12" y="248">Altura de cada barra: temperatura máxima (ejemplo inventado)</text>`, 'Siete barras de temperatura de distintos días y una línea de promedio que representa el clima');
  },

  /* ===== 5. latitud ===== */
  latitud() {
    const t = ['T', 'T − 1 °C', 'T − 2 °C', 'T − 3 °C'], k = ['0 km', '180 km', '360 km', '540 km'], h = [120, 100, 80, 60];
    return svg(420, 250, `
      <text class="b" x="12" y="22">Hacia el sur, la temperatura baja</text>
      ${flecha(24, 44, 396, 44, C.azul, { ancho: 3 })}<text class="s" x="24" y="62">Nos alejamos del Ecuador →</text>
      ${t.map((tt, i) => { const x = 60 + i * 100; return `<g><rect x="${x - 9}" y="80" width="18" height="130" rx="9" fill="#fff" stroke="${C.suave}" stroke-width="2"/>
        <rect class="cr" x="${x - 5}" y="${210 - h[i]}" width="10" height="${h[i]}" rx="5" fill="${C.rojo}" style="animation-delay:${i * .6}s"/>
        <circle cx="${x}" cy="218" r="13" fill="${C.rojo}" stroke="${C.suave}" stroke-width="2"/>
        <text class="b c" x="${x}" y="244" style="font-size:12px">${tt}</text><text class="s c" x="${x}" y="76">${k[i]}</text></g>`; }).join('')}`,
      'Cuatro termómetros: la temperatura baja un grado cada 180 kilómetros hacia el sur');
  },

  /* ===== 6. altitud ===== */
  altitud() {
    return svg(420, 270, `
      <polygon points="30,240 190,60 350,240" fill="${C.roca}" stroke="#6d687a" stroke-width="2" stroke-linejoin="round"/>
      <polygon points="190,60 160,100 178,92 192,108 206,92 224,102" fill="#fff"/>
      <rect x="0" y="240" width="420" height="30" fill="${C.verde}" opacity=".7"/>
      <text class="b" x="12" y="22">Cuanto más alto, menos temperatura</text>
      <circle r="7" fill="${C.naranja}" stroke="#fff" stroke-width="2"><animateMotion dur="6s" repeatCount="indefinite" path="M60,240 L190,92 L60,240" keyTimes="0;.5;1" calcMode="linear"/></circle>
      <g><rect x="372" y="80" width="16" height="150" rx="8" fill="#fff" stroke="${C.suave}" stroke-width="2"/>
        <rect x="376" y="84" width="8" height="142" rx="4" fill="${C.rojo}" style="transform-box:fill-box;transform-origin:bottom;animation:termo 6s ease-in-out infinite"/>
        <circle cx="380" cy="236" r="12" fill="${C.rojo}" stroke="${C.suave}" stroke-width="2"/></g>
      <text class="s" x="300" y="70">Abajo: más calor</text>
      <text class="s c" x="190" y="46">Arriba: más frío</text>
      `, 'Una montaña con un termómetro: a mayor altura, menor temperatura');
  },

  /* ===== 7. continentalidad ===== */
  continentalidad() {
    const panel = (x, titulo, sub, y1, y2, col, mar) => `<g transform="translate(${x},0)"><clipPath id="cp${x}"><rect x="0" y="34" width="200" height="214" rx="12"/></clipPath><rect x="0" y="34" width="200" height="214" rx="12" fill="${C.lav}"/><g clip-path="url(#cp${x})">
      <text class="b c" x="100" y="56">${titulo}</text>
      ${mar ? `<path class="ola" d="M-10,226 q10,-8 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 L210,250 L-10,250Z" fill="${C.aguaOsc}" opacity=".6"/>` : `<rect x="0" y="236" width="200" height="12" fill="${C.tierra}"/>`}</g>
      <text class="s" x="14" y="98">Verano</text><text class="s" x="14" y="216">Invierno</text>
      <line x1="100" y1="${y1}" x2="100" y2="${y2}" stroke="${col}" stroke-width="10" stroke-linecap="round" pathLength="1" stroke-dasharray="1" style="animation:trazo 1.6s .4s ease-out both"/>
      <circle cx="100" cy="${y1}" r="9" fill="${C.rojo}" stroke="#fff" stroke-width="2"/><circle cx="100" cy="${y2}" r="9" fill="${C.azul}" stroke="#fff" stroke-width="2"/>
      <text class="s c" x="100" y="72">${sub}</text></g>`;
    return svg(420, 262, `<text class="b" x="12" y="22">Amplitud térmica: distancia entre la máxima y la mínima</text>
      ${panel(6, 'Cerca del mar', 'amplitud chica', 120, 178, C.azul, true)}${panel(214, 'Lejos del mar', 'amplitud grande', 90, 208, C.violeta, false)}`,
      'Dos columnas: cerca del mar la amplitud térmica es chica y lejos del mar es grande');
  },

  /* ===== 8. anticiclón y ciclón ===== */
  presion() {
    const col = (x, a, color, tipo) => [0, 1, 2].map(i => `<g style="animation:${tipo === 'baja' ? 'bajar' : 'subir'} 2.4s ${i * .5}s ease-in-out infinite"><line x1="${x + (i - 1) * 34}" y1="${tipo === 'baja' ? 84 : 140}" x2="${x + (i - 1) * 34}" y2="${tipo === 'baja' ? 130 : 96}" stroke="${color}" stroke-width="4" stroke-linecap="round"/><polygon points="${tipo === 'baja' ? `${x + (i - 1) * 34 - 7},126 ${x + (i - 1) * 34 + 7},126 ${x + (i - 1) * 34},138` : `${x + (i - 1) * 34 - 7},100 ${x + (i - 1) * 34 + 7},100 ${x + (i - 1) * 34},88`}" fill="${color}"/></g>`).join('');
    return svg(420, 280, `
      <rect x="6" y="30" width="200" height="236" rx="12" fill="${C.lav}"/><rect x="214" y="30" width="200" height="236" rx="12" fill="${C.lav}"/>
      <text class="b c" x="106" y="52" style="fill:${C.naranja}">Anticiclón (alta presión)</text><text class="b c" x="314" y="52" style="fill:${C.azul}">Ciclón (baja presión)</text>
      <circle cx="170" cy="86" r="14" fill="${C.naranja}" opacity=".9"/>
      ${col(106, 0, C.naranja, 'baja')}
      <rect x="6" y="226" width="200" height="40" fill="${C.verde}" opacity=".6"/>
      <text class="s c" x="106" y="196">El aire baja</text><text class="b c" x="106" y="246" style="fill:${C.tinta}">Tiempo estable, cielo despejado</text>
      <g style="animation:pulso 2.4s ease-in-out infinite"><ellipse cx="300" cy="84" rx="46" ry="20" fill="${C.nube}" stroke="${C.roca}" stroke-width="1.5"/><ellipse cx="340" cy="90" rx="34" ry="16" fill="${C.nube}" stroke="${C.roca}" stroke-width="1.5"/></g>
      ${[0, 1, 2, 3].map(i => `<line x1="${286 + i * 18}" y1="112" x2="${282 + i * 18}" y2="124" stroke="${C.azul}" stroke-width="3" stroke-linecap="round" style="animation:llover 1.4s ${i * .25}s linear infinite"/>`).join('')}
      ${col(314, 0, C.azul, 'sube')}
      <rect x="214" y="226" width="200" height="40" fill="${C.verde}" opacity=".6"/>
      <text class="s c" x="314" y="196">El aire sube</text><text class="b c" x="314" y="246">Nubosidad y precipitaciones</text>`,
      'A la izquierda un anticiclón con aire que baja y cielo despejado; a la derecha un ciclón con aire que sube, nubes y lluvia');
  },

  /* ===== 9. lluvias orográficas ===== */
  orografica() {
    const seco = [0, 1, 2].map(i => `<circle r="4" fill="${C.naranja}"><animateMotion dur="3.2s" begin="${2 + i * .9}s" repeatCount="indefinite" path="M214,86 Q300,150 400,208"/></circle>`).join('');
    const humedo = [0, 1, 2, 3].map(i => `<circle r="4.5" fill="${C.azul}"><animateMotion dur="3.6s" begin="${i * .9}s" repeatCount="indefinite" path="M14,222 Q110,214 150,170 T214,86"/></circle>`).join('');
    return svg(420, 290, `
      <rect x="0" y="236" width="150" height="54" fill="${C.aguaOsc}" opacity=".55"/><path class="ola" d="M-14,236 q10,-8 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 L170,250 L-14,250Z" fill="${C.aguaOsc}" opacity=".7"/>
      <polygon points="130,262 214,80 300,262" fill="${C.roca}" stroke="#6d687a" stroke-width="2" stroke-linejoin="round"/><polygon points="214,80 196,118 208,112 216,124 226,110 236,118" fill="#fff"/>
      <rect x="130" y="262" width="290" height="28" fill="${C.tierra}"/><polygon points="300,262 420,262 420,236 340,240" fill="${C.tierra}"/>
      ${humedo}${seco}
      <g style="animation:pulso 3s ease-in-out infinite"><ellipse cx="156" cy="98" rx="38" ry="17" fill="${C.nube}" stroke="${C.roca}" stroke-width="1.5"/><ellipse cx="184" cy="106" rx="28" ry="13" fill="${C.nube}" stroke="${C.roca}" stroke-width="1.5"/></g>
      ${[0, 1, 2, 3].map(i => `<line x1="${150 + i * 14}" y1="124" x2="${146 + i * 14}" y2="136" stroke="${C.azul}" stroke-width="3" stroke-linecap="round" style="animation:llover 1.5s ${i * .3}s linear infinite"/>`).join('')}
      <text class="b" x="8" y="26" style="fill:${C.azul}">1. El viento húmedo choca</text><text class="b" x="8" y="42" style="fill:${C.azul}">    con la montaña y sube</text>
      <text class="b" x="232" y="26" style="fill:${C.azul}">2. Al subir se enfría</text><text class="b" x="232" y="42" style="fill:${C.azul}">    y deja las lluvias</text>
      <text class="b" x="262" y="66" style="fill:${C.naranja}">3. Baja como</text><text class="b" x="262" y="82" style="fill:${C.naranja}">    viento seco</text>
      <text class="s" x="8" y="278">Océano Pacífico</text><text class="s c" x="214" y="278" style="fill:#fff">Andes</text><text class="s" x="340" y="280">Meseta patagónica</text>`,
      'Esquema de las lluvias orográficas: el viento húmedo sube por la ladera, se enfría y llueve; del otro lado baja seco');
  },

  /* ===== 10. anticiclones que afectan al territorio ===== */
  anticiclones() {
    const colorado = [[-70, -37.2], [-68, -37.6], [-66, -38.3], [-64.5, -39], [-62.1, -39.6]].map(pt).join(' L');
    const [cx, cy] = pt([-67, -38]).split(',').map(Number);
    return svg(420, 400, `${mapaBase()}
      <path d="M${colorado}" fill="none" stroke="${C.azul}" stroke-width="3.5" stroke-linecap="round"/>
      <text class="b" x="${X(-62) - 6}" y="${Y(-39.6) - 8}" style="fill:${C.azul}">Río</text><text class="b" x="${X(-62) - 6}" y="${Y(-39.6) + 20}" style="fill:${C.azul}">Colorado</text>
      ${flecha(X(-52.5), Y(-30), X(-58.5), Y(-30), C.naranja)}${flecha(X(-52.5), Y(-34), X(-58.8), Y(-34), C.naranja)}${flecha(X(-52.5), Y(-27), X(-57.5), Y(-27), C.naranja)}
      ${flecha(X(-73.5), Y(-43), X(-71.2), Y(-43), C.violeta)}${flecha(X(-73.5), Y(-47), X(-71.5), Y(-47), C.violeta)}
      <text class="b" x="296" y="42" style="fill:${C.naranja}">Anticiclón</text><text class="b" x="296" y="58" style="fill:${C.naranja}">del Atlántico</text><text class="s" x="296" y="74">Al norte del río:</text><text class="s" x="296" y="88">descarga su humedad</text><text class="s" x="296" y="102">de este a oeste</text>
      <text class="b" x="262" y="262" style="fill:${C.violeta}">Anticiclón</text><text class="b" x="262" y="278" style="fill:${C.violeta}">del Pacífico Sur</text><text class="s" x="262" y="294">Al sur del río:</text><text class="s" x="262" y="308">descarga su humedad</text><text class="s" x="262" y="322">en la cordillera</text>`,
      'Esquema de la Argentina: al norte del río Colorado predominan los vientos del anticiclón del Atlántico y al sur los del anticiclón del Pacífico Sur');
  },

  /* ===== 11. vientos locales ===== */
  vientos() {
    return svg(420, 400, `${mapaBase()}
      ${flecha(X(-69), Y(-41), X(-60), Y(-32.5), C.azul, { ancho: 4, punta: 12 })}
      ${flecha(X(-52.8), Y(-39.5), X(-57.6), Y(-35.5), C.violeta, { ancho: 4, punta: 12 })}
      ${flecha(X(-71.2), Y(-31.8), X(-67.3), Y(-31.8), C.naranja, { ancho: 4, punta: 12 })}
      <g><rect x="270" y="30" width="146" height="62" rx="10" fill="#fff" opacity=".9"/><text class="b" x="280" y="48" style="fill:${C.azul}">Pampero</text><text class="s" x="280" y="62">del sudoeste al nordeste:</text><text class="s" x="280" y="76">frío, tormentas</text></g>
      <g><rect x="270" y="266" width="146" height="62" rx="10" fill="#fff" opacity=".9"/><text class="b" x="280" y="284" style="fill:${C.violeta}">Sudestada</text><text class="s" x="280" y="298">desde el sudeste atlántico:</text><text class="s" x="280" y="312">llovizna y frío</text></g>
      <g><rect x="6" y="40" width="130" height="62" rx="10" fill="#fff" opacity=".9"/><text class="b" x="14" y="58" style="fill:${C.naranja}">Zonda</text><text class="s" x="14" y="72">baja de la cordillera:</text><text class="s" x="14" y="86">viento seco</text></g>`,
      'Esquema de la Argentina con tres vientos locales: el pampero del sudoeste, la sudestada del Atlántico y el zonda de la cordillera');
  },
};
