# POTENCIAR · Piloto 4.º año (Escuela Secundaria Orientada)

Plataforma para que estudiantes que se llevan espacios curriculares a febrero se preparen en diciembre, enero y febrero. Piloto con **Matemática** e **Historia** (4 contenidos cada una) basado en el Diseño Curricular de Santa Fe (Res. 2630/14, Anexo III).

## Qué hace
1. **Ingreso en una sola página**: nombre (alcanza con el nombre), y modalidad, curso y espacio curricular en listas desplegables; después, los contenidos con casillas (eje y desglose). Solo está habilitado 4.º año orientada; lo demás aparece como «próximamente».
2. **Recorrido**: una clase por contenido elegido y, al final, «Mi trabajo práctico y la defensa». Cada materia tiene su propio TP y su propio avance.
3. **Clases con cápsulas**: cada cápsula enseña y hace practicar con actividades que obligan a releer (sin datos regalados): clasificar **arrastrando** las fichas, ordenar, elegir, resolver. Un aviso visible indica cuántas actividades faltan para desbloquear la **carpeta**. La consigna de la carpeta tiene la idea principal en negrita y una guía en preguntas. Se corrige en pantalla (señala tildes faltantes y rechaza copias textuales de la cápsula) y después se marca «Ya lo copié en mi carpeta». En Matemática no se pide un mínimo de palabras. Tras 2 intentos se puede marcar una **duda** y seguir.
4. **Juegos** al terminar cada cápsula: 3 por cápsula, que van rotando entre 7 (verdadero/falso, múltiple choice, básquet, carrera de autos, palabra oculta, memotest y «atrapá la verdadera»). Ventana de tamaño fijo, instrucciones arriba, zona de respuesta y botón «Siguiente» siempre visibles (inactivo hasta responder); al terminar, solo «Cerrar». Las preguntas salen únicamente de lo que dicen los textos.
5. **TP y defensa**: cómo es un buen TP, introducción, desarrollo por contenido (muestra lo que el alumno escribió en su carpeta en esa clase), integración **solo entre los contenidos elegidos** (preguntas preparadas para cada par de contenidos), relación con la realidad (una pregunta por contenido), conclusión, consejos para presentar y defender (el orden del TP es el orden de la exposición), simulacro de preguntas (detecta si se copia la respuesta orientadora) y vista final con «Antes de presentar el Trabajo Práctico» y botón «Finalizar». En Matemática, además, ejercicios del tipo que se piden al presentar.
6. **Asistente**: explica y orienta con la información de la clase; **nunca resuelve consignas ni escribe el TP**.

**Nada se envía al docente**: todo el avance queda en el navegador del estudiante (localStorage).

## Cómo probarlo
- **Local (Windows)**: doble clic en `iniciar.bat`. Levanta un servidor con PowerShell (viene con Windows, no hace falta instalar nada), busca un puerto libre desde el 8421 y abre el navegador. No cerrar la ventana negra mientras se usa. No abrir `index.html` con doble clic: necesita un servidor web.
- **GitHub Pages**: subir esta carpeta tal cual a un repositorio y activar Pages (rama principal, raíz). Ya incluye `.nojekyll`.

## Corrección con y sin IA
- **Sin IA** (modo piloto, `PERMITIR_SIN_IA: true`): se compara el texto con los **conceptos clave** de cada consigna y se pide un mínimo de palabras. Funciona sin conexión y sin clave.
- **Con IA** (Gemini): el estudiante pega su clave y la IA corrige, da pistas y orienta; si falla, vuelve a la corrección local.
- ⚠️ **Producción**: la clave de IA no puede quedar en el navegador. Hace falta un **proxy del Ministerio** que guarde la clave y reciba las consultas. Cambiar `llamarGemini` en `js/ia.js` para apuntar al proxy y poner `PERMITIR_SIN_IA: false` si se exige IA.

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
