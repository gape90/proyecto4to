# Tutorías Virtuales · Piloto 4.º año (Escuela Secundaria Orientada)

Plataforma para que estudiantes que se llevan espacios curriculares a febrero se preparen en diciembre, enero y febrero. Piloto con **Matemática** e **Historia** (4 contenidos cada una) basado en el Diseño Curricular de Santa Fe (Res. 2630/14, Anexo III).

## Qué hace
1. **Ingreso en una sola página**: nombre (alcanza con el nombre), y modalidad, curso y espacio curricular en listas desplegables; después, los contenidos con casillas (eje y desglose). Solo está habilitado 4.º año orientada; lo demás aparece como «próximamente».
2. **Recorrido**: una clase por contenido elegido y, al final, «Mi trabajo práctico y la defensa». Cada materia tiene su propio TP y su propio avance.
3. **Clases con cápsulas**: cada cápsula enseña y hace practicar con actividades que obligan a releer (sin datos regalados): clasificar **arrastrando** las fichas, ordenar, elegir, resolver. Un aviso visible indica cuántas actividades faltan para desbloquear la **carpeta**. La consigna de la carpeta tiene la idea principal en negrita y una guía en preguntas. Se corrige en pantalla (señala tildes faltantes y rechaza copias textuales de la cápsula) y después se marca «Ya lo copié en mi carpeta». En Matemática no se pide un mínimo de palabras. Tras 2 intentos se puede marcar una **duda** y seguir.
4. **Juegos** al terminar cada cápsula: 3 por cápsula, que van rotando entre 7 (verdadero/falso, múltiple choice, básquet, carrera de autos, palabra oculta, memotest y «atrapá la verdadera»). Ventana de tamaño fijo, instrucciones arriba, zona de respuesta y botón «Siguiente» siempre visibles (inactivo hasta responder); al terminar, solo «Cerrar». Las preguntas salen únicamente de lo que dicen los textos.
5. **TP y defensa**: cómo es un buen TP, introducción, desarrollo por contenido (muestra lo que cada estudiante escribió en su carpeta en esa clase), integración **solo entre los contenidos elegidos** (preguntas preparadas para cada par de contenidos), relación con la realidad (una pregunta por contenido), conclusión, consejos para presentar y defender (el orden del TP es el orden de la exposición), simulacro de preguntas (detecta si se copia la respuesta orientadora) y vista final con «Antes de presentar el Trabajo Práctico» y botón «Finalizar». En Matemática e Inglés, además, ejercicios del tipo que se piden al presentar.
6. **Asistente**: explica y orienta con la información de la clase; **nunca resuelve consignas ni escribe el TP**.
7. **Materias cargadas**: Historia, Matemática, Lengua y Literatura e Inglés (4.º orientada). En Inglés, el texto marcado como `[[palabra]]` muestra un botón 🔊 que la pronuncia con la voz en inglés del navegador (`js/voz.js`).

## Criterios de redacción (para todo contenido nuevo)
- Lenguaje inclusivo: la plataforma les habla a varones y mujeres. No usar adjetivos con género para referirse a quien estudia («si no estás seguro» → «si tenés dudas»; «preparado» → «preparado o preparada», o reformular). Preferir palabras neutras: «estudiantes», «personas», «quien te escucha». La IA tiene la misma regla en sus instrucciones.
- Nunca usar «cápsula» en pantalla (decir «material» o «parte»), ni «mesa» o «tribunal» (decir presentar y defender el trabajo práctico).

**Nada se envía al docente**: todo el avance queda en el navegador del estudiante (localStorage).

## Cómo probarlo
- **Local (Windows)**: doble clic en `iniciar.bat`. Levanta un servidor con PowerShell (viene con Windows, no hace falta instalar nada), busca un puerto libre desde el 8765 y abre el navegador. No cerrar la ventana negra mientras se usa. No abrir `index.html` con doble clic: necesita un servidor web.
- **GitHub Pages**: subir esta carpeta tal cual a un repositorio y activar Pages (rama principal, raíz). Ya incluye `.nojekyll`.

## IA
La IA funciona sola, sin pedir clave: la plataforma le habla al **intermediario de LumAI** (Cloudflare Worker `https://lumai-ia.gape90.workers.dev`, configurado en `js/config.js` → `URL_INTERMEDIARIO`). El intermediario guarda la clave de Gemini en secreto y solo acepta pedidos desde `https://gape90.github.io` y desde la compu (`http://localhost:8765`, el puerto que usa `iniciar.bat`).
- Si la IA no responde, la corrección sigue funcionando comparando con los conceptos clave, y el asistente responde con el vocabulario de la clase.
- Si en el futuro se publica en otro sitio (por ejemplo, el Moodle del Ministerio), hay que agregar esa dirección a la lista `PERMITIDOS` del intermediario en Cloudflare.
- Tutorías Virtuales y LumAI comparten la misma clave y el mismo cupo de uso de Gemini.

## Ajustes (`js/config.js`)
| Ajuste | Valor piloto | Para producción |
|---|---|---|
| `TP_LIBRE` | `true` (el TP se abre sin terminar las clases, para poder mostrarlo) | `false` |
| `PERMITIR_SIN_IA` | `true` | según política |
| `INTENTOS_PARA_DUDA` | 2 | a criterio pedagógico |
| `AUTOS_RIVAL_SEG` | 7 (dificultad de la carrera) | a criterio |

## Identidad visual y Moodle
Todo está incluido en el paquete (la fuente Plus Jakarta Sans está en `fonts/`, con licencia OFL): no se usan servicios externos salvo la IA, que en producción irá por el proxy.

## Identidad visual (logos)
Colores institucionales de Santa Fe (naranja, rojo, magenta, violeta, azul) en `css/potenciar.css`. Falta colocar los **logos oficiales** en `img/` (ver `img/LEEME.txt`); mientras tanto la cabecera muestra el texto «Santa Fe · Provincia».

## Contenidos
- `contenidos/catalogo.json`: espacios, ejes, contenidos y desglose (activo/inactivo).
- `contenidos/clases/*.json`: una clase por contenido (formato abajo).
- `contenidos/tp/<espacio>.json`: TP de cada espacio: `portada`, `desarrollo` por contenido, `claves_contenido`, `integracion` (`pares` «h1|h3», `individual`, `generales`), `realidad.por_contenido`, `conclusion`, `practica` (solo Matemática) y `preguntas` del simulacro.
- `contenidos/tp/oral.json`: consejos para presentar y defender y la lista «Antes de presentar el Trabajo Práctico» (común a todos).

### Formato de una clase
```
{ id, espacio, eje, titulo, intro, tp_aporte,
  capsulas: [ { id, titulo, tiempo,
     bloques: [...],
     carpeta: { titulo, instruccion, guia:["preguntas"], claves:[{k:[sinónimos],p:"pista"}], referencia, minPalabras },
     juegos: [ {tipo:"vf", texto, respuesta, explicacion}, {tipo:"mc", pregunta, opciones, correcta, explicacion} ],
     palabras: [ {palabra, pista} ] } ],
  vocabulario, errores_frecuentes, para_ir_mas_alla }
```
Bloques: `texto`, `destacado`, `ejemplo`, `dato`, `cita`, `ecuacion`, `comparar`, `linea`, `sim` (aproximador, sucesion, aureo, radical), y los que **bloquean** la carpeta hasta resolverse: `pasos`, `revelar`, `opcion`, `verificar` (respuesta numérica o de texto, con `tolerancia`/`acepta`), `clasificar`, `ordenar`.
Las `claves` se comparan sin acentos ni mayúsculas; cada clave puede tener varios sinónimos. Con ≥60 % de las claves y el mínimo de palabras, la respuesta se aprueba.

## Moodle
La plataforma final irá en Moodle. Este piloto es HTML estático, que se puede **empaquetar como SCORM 1.2/2004** (un `imsmanifest.xml` que apunte a `index.html`, con la API SCORM reemplazando el `localStorage` de `js/estado.js` para registrar avance y aprobación). Eso queda para la etapa de implementación.

## Verificación hecha
Prueba automática en navegador de punta a punta: ingreso, 8 clases (todas las actividades, carpeta, casilla de papel, juegos), recorrido y los 2 TP completos con el simulacro. Chequeo estructural de todo el contenido (opciones correctas, categorías, bancos de juegos ≥ 5 V/F y ≥ 5 múltiple choice por cápsula).
