# Guía de Chispa

Todo se hace desde la carpeta del proyecto:

```bash
cd ~/workspace/vacilon
make            # lista todos los comandos
```

## Usar a Chispa

| Quiero… | Comando |
|---|---|
| Hablar con ella en el terminal | `make chat` (salir con `salir` o Ctrl+C) |
| Abrir la app en los móviles de casa | `make app` y en el móvil `https://192.168.100.100:4443` (aceptar el aviso del certificado) |
| Desarrollar viendo los cambios al momento | `make dev` y abrir `http://localhost:5173` (se recarga sola) |
| Probar la app en el PC (solo en este PC) | `make app-pc` y abrir `http://localhost:4173` |

## Instalar en un móvil

Chispa no se instala ni se guarda para usarla sin conexión por su cuenta. Solo si pulsas el botón pequeño de descargar («Instalar Chispa», abajo a la izquierda de la zona de Chispa) se guarda con el modelo y queda lista sin conexión. En Android sale el aviso del navegador; en iPhone o iPad aparece una ayuda: Compartir y luego «Añadir a pantalla de inicio».

Para parar un servidor: Ctrl+C en su terminal.

## La voz de Chispa

Chispa habla con una voz neuronal propia (Piper, la voz mexicana `es_MX-claude-high`, más aguda y con un toque robótico). Todo se ejecuta en el móvil, sin servidor. Pesa unos **76 MB** (63 MB el modelo y 13 MB el motor), mucho más que el resto de la app junta (9 MB).

- **La primera vez** Chispa habla con la voz del móvil. En cuanto se toca algo y ha despertado, descarga su voz en segundo plano (sale «preparando mi voz…» arriba a la izquierda de la zona de Chispa, en pequeño) y cuando está lista cambia sola, sin recargar. Si algo falla (poca memoria, navegador antiguo), se queda con la voz del móvil.
- Sin pulsar «Instalar Chispa» la voz no se guarda para usarla sin conexión: solo la caché normal del navegador. Al instalar se guarda con el modelo y el oído, y la instalación pasa a pesar unos 125 MB.
- El botón del altavoz silencia las dos voces.
- Licencias de la voz y de espeak-ng en `web/THIRD_PARTY.md` (la de la voz, pendiente de revisar).

## Mejorar a Chispa (ciclo completo)

1. **Cambiar lo que sabe decir**: edita los archivos de `data/corpus/` (uno por tema). Cada línea es
   `mensaje<TAB>respuesta`. Respuestas de 1-2 frases, máximo 140 caracteres, sin tacos.
2. **Validar y preparar el corpus**: `make corpus`. Si sale algún error (duplicados, líneas mal
   formadas), arréglalo y repite.
3. **Reentrenar**: `make finetune` (unos 2 minutos en la GTX 1070). Deja el modelo en
   `models/candidato.pt`. Opcional: `make finetune EPOCHS=20`.
4. **Examinarlo**: `make certify CANDIDATE=models/candidato.pt`. Tarda unos 6 minutos y crea una
   versión nueva (`v2`, `v3`…). Al final dice **APTO** o **NO APTO**.
5. **Leer el informe**: `make informe VERSION=v2`. Mira las cifras en rojo y lee las respuestas de
   ejemplo. Si algo suena raro, no lo instales.
6. **Instalarlo en la app**: `make promote VERSION=v2`. Solo funciona si es APTO.
7. **Si algo va mal después**: `make rollback` vuelve a la versión anterior.

Después de instalar una versión, vuelve a lanzar `make app` para que los móviles la reciban.

## El oído de Chispa

**Mantén pulsado el botón del micrófono** (o la barra espaciadora, en el PC, con el cursor fuera del
cuadro de texto), habla y **suelta**: lo que se ha dicho se escribe solo y se envía, con trucos y frases
fijas incluidos. Mientras escucha, a Chispa se le enciende la antena.

- Usa Vosk (modelo `vosk-model-small-es-0.42`, ~43 MB). Todo pasa en el dispositivo: el audio no sale
  nunca ni se guarda, y el texto tampoco. Nada del reconocimiento de Google o Apple.
- Se descarga la primera vez que se pulsa el micro («preparando mis orejas…»). Sin «Instalar Chispa» no se
  queda guardado; al instalar, sí, para usarlo sin conexión.
- Probarlo en el PC: `make dev` y abrir `http://localhost:5173` en el navegador de Windows (en
  `localhost` el navegador deja usar el micro).
- Si falta el modelo (copia nueva de la carpeta): `cd web && npm run ear`.
- Prueba automática con 40 frases grabadas: `cd web && node scripts/ear-eval.mjs` (error de palabras con voz
  normal ≈ 7 %, con voz aguda ≈ 20 %; con voces de niña de verdad será peor).

## Los nombres

Chispa pregunta «¿Cómo te llamas?» la primera vez y recuerda hasta 6 nombres **solo en ese móvil o
tableta** (nunca salen de ahí ni van al repo). Con varios nombres, al despertar pregunta «¿Quién eres hoy:
Mérida o Irune?» (vale «las dos»).

- Presentarse: «me llamo Irune» o «mi nombre es Irune»; cambiar: «ahora soy Mérida» (si ya la conoce).
- «¿cómo me llamo?» → «¡Eres Irune!». Al acertar una adivinanza también dice el nombre.
- Olvidar: «olvida mi nombre» o «olvida los nombres» (todos). También se borran al borrar los datos del
  navegador.
- No acepta nombres del filtro de palabras ni de broma («me llamo caca»).

## La memoria de Chispa

Antes de inventar, Chispa busca en el corpus (`data/corpus/`) un mensaje muy parecido al que le han
escrito (parecido ≥ 0,7). Si lo encuentra, contesta con una de vuestras respuestas para ese mensaje; si
no, inventa el cerebro pequeño. Orden: frases fijas → trucos → memoria → cerebro.

- **Añadir frases al corpus mejora a Chispa al momento**: edita `data/corpus/`, lanza `make corpus`
  (regenera `web/public/memory.json`) y vuelve a montar la app. Reentrenar sigue siendo opcional.
- Entiende cómo escriben las niñas: corrige palabras que el corpus no usa («muxo» → mucho, «tng» →
  tengo, «aburrooo» → aburro, «kiero» → quiero, «perrito» → perro, «cansadísima» → cansada) y no tiene en
  cuenta el relleno («chispa», «oye», «porfa», «muy», «mucho», «hoy»…). Chispa siempre contesta con buena
  ortografía, y el corpus también se escribe sin faltas: la memoria ya entiende las de las niñas.
- Umbral, relleno, abreviaturas (`aliases`) y palabras que no se tocan (`keep`):
  `web/src/domain/brain/memory-config.json`.
- Medido el 20-11 con 58 mensajes nuevos (cata a ciegas): 32 respuestas aceptables frente a 7 sin memoria.
- El reparto entre entrenar y validar es estable: cada frase va siempre al mismo lado según su texto, así
  la pérdida de validación del examen compara bien aunque cambie el corpus.

## Frases fijas (temas serios y quién es Chispa)

Antes de preguntar al modelo, Chispa mira si el mensaje habla de algo serio (miedo, tristeza, una
herida, una muerte, que alguien le pegue o le toque, un desconocido…) o de quién es ella (nombre,
si es una robot, quién la hizo). Si es así, contesta con una frase fija que siempre manda a mamá,
papá o un adulto. Están en `web/src/domain/conversation/guardrails.json`: cada tema tiene sus patrones (sobre el
texto en minúsculas, sin tildes, con la ñ como `ny`) y 2-3 respuestas; gana el primer tema que
coincide. Si tocas un patrón, añade la frase que debe saltar (o la que no) a
`web/test/fixtures/guardrails.json` y pasa `make test`. No hace falta reentrenar.

## Trucos

Chispa hace trucos cuando se lo piden por escrito:

| Truco | Se pide con… |
|---|---|
| Chiste | «cuéntame un chiste», «otro chiste», «¿sabes chistes?» |
| Bailar | «baila», «¿bailamos?», «¿puedes bailar?», «haz un baile» |
| Cantar | «canta», «cántame una canción», «¿sabes cantar?» |
| Adivinanza | «dime una adivinanza»; el siguiente mensaje es la respuesta («me rindo» da la solución) |
| Problemas de mates | «hazme un problema», «un reto de mates», «una suma», «una resta»; sube de nivel con la racha, da una pista al primer fallo y «otro» pide más |
| Datos curiosos | «cuéntame algo curioso», «un dato curioso», «dime algo que no sepa» (109 datos revisados) |
| Colores | «¿qué sale si mezclo azul y amarillo?» y el juego «juguemos a los colores» |
| Morse | «¿cómo se dice hola en Morse?» (lo escribe y lo pita), «enséñame Morse» (adivinar la palabra) |
| Idiomas | «¿cómo se dice perro en inglés?», «¿qué significa kaixo?», «¿cómo se dice cat en castellano?» (171 palabras, en inglés con cómo suena) |
| Concurso de idiomas | «juguemos al inglés», «juguemos al euskera», «juguemos a los idiomas», «¿hablas inglés?»; pregunta en los dos sentidos y en euskera vale sin el artículo («txakur») |

Solo se activan con peticiones: «me gusta bailar» va a la conversación normal. Los temas serios
ganan siempre a los trucos. Con la voz silenciada no suena la música, pero baila y canta igual
(la letra sale en el bocadillo).

- **Añadir chistes, adivinanzas o canciones**: `web/src/tricks/content/` (`jokes.ts`, `riddles.ts`,
  `songs.ts`). Las respuestas de las adivinanzas van en minúsculas, sin tildes y con la ñ como `ny`.
  Las notas de las canciones son `C5`, `D5`… (`-` es un silencio) con su duración en tiempos.
  Melodías siempre propias, nada de canciones conocidas.
- **Añadir palabras de idiomas**: `web/src/domain/tricks/content/words.ts`, una línea por palabra:
  `w('castellano|otra forma', 'inglés', 'cómo suena', 'euskera')` (deja `''` si el inglés se lee como se escribe).
- **Añadir un truco nuevo**: un archivo en `web/src/tricks/` (copia `joke.ts` como plantilla) y una
  línea en `createTricks` de `web/src/tricks/registry.ts`.
- Después, `make test`: comprueba que todo pasa el filtro de palabras y cabe en el bocadillo.

## Cuando las niñas digan "Chispa ha dicho algo raro"

Apunta lo que escribieron y lo que contestó, y añádelo como caso de regresión en
`eval/regresion.jsonl` (explicado en `eval/README.md`). A partir de ahí, ningún modelo que repita ese
fallo podrá instalarse.

## Comprobar que todo sigue bien

`make test` pasa todos los tests de Python y de la app.

## Qué es cada cosa

| Carpeta | Contenido |
|---|---|
| `data/corpus/` | Las frases de Chispa, por tema |
| `eval/` | El examen de la certificación |
| `models/registry/` | Cada versión de Chispa con su informe; `current` dice cuál está instalada |
| `web/` | La app |
| `src/`, `scripts/` | El código de entrenamiento y del examen |
