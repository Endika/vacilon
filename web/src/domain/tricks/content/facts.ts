import type { Fact } from './types';

const fact = (text: string, hook: string): Fact => ({ text, hook });

export const FACTS: Fact[] = [
  // Animals
  fact('Los pulpos tienen tres corazones y su sangre es azul.', '¿Y tú, cuántos corazones tienes?'),
  fact(
    'Las jirafas pueden limpiarse las orejas con su lengua, que mide unos 45 centímetros.',
    '¿Tú llegas a tocarte la nariz con la lengua?',
  ),
  fact('Los koalas duermen casi 20 horas al día.', '¿Cuántas horas duermes tú?'),
  fact(
    'Los delfines duermen con la mitad del cerebro despierta.',
    '¿A que tú no podrías dormir con medio cerebro?',
  ),
  fact(
    'Algunas hormigas pueden cargar cosas que pesan decenas de veces más que ellas.',
    '¿Qué cargarías tú con tanta fuerza?',
  ),
  fact(
    'Los caracoles tienen miles de dientes diminutos en la lengua.',
    '¿Cómo crees que se los cepillan?',
  ),
  fact('Las mariposas saborean con las patas.', '¿Y si tú probaras la comida con los pies?'),
  fact(
    'Los elefantes se reconocen en un espejo, como las personas.',
    '¿Tú pones caras raras delante del espejo?',
  ),
  fact(
    'Algunos colibríes baten las alas más de 50 veces por segundo.',
    '¿Puedes mover los brazos así de rápido?',
  ),
  fact(
    'Los pingüinos emperador cuidan su huevo sobre las patas para que no se enfríe.',
    '¿Dónde pondrías tú un huevo calentito?',
  ),
  fact('Los gatos tienen 18 dedos en total.', '¿Cuántos tienes tú entre manos y pies?'),
  fact(
    'Las estrellas de mar no tienen cerebro y pueden regenerar un brazo perdido.',
    '¿Te gustaría tener ese superpoder?',
  ),
  fact(
    'Las abejas bailan para contarse dónde hay flores.',
    '¿Bailamos tú y yo para contarnos algo?',
  ),
  fact(
    'Los búhos casi no pueden mover los ojos, por eso giran tanto la cabeza.',
    '¿Hasta dónde giras tú la cabeza?',
  ),
  fact(
    'Los perros huelen muchísimo mejor que las personas.',
    '¿Qué olor adivinarías tú con los ojos cerrados?',
  ),
  fact('Los camaleones pueden mover cada ojo por separado.', '¿Sabes mirar a dos sitios a la vez?'),
  fact(
    'La ballena azul es el animal más grande que ha existido: mide como dos autobuses y medio.',
    '¿Qué animal te gustaría ver así de grande?',
  ),
  fact(
    'Los murciélagos son los únicos mamíferos que vuelan de verdad.',
    '¿Y si pudieras volar de noche?',
  ),
  fact(
    'Cada cebra tiene sus propias rayas, como tus huellas de los dedos.',
    '¿Cómo serían tus rayas?',
  ),
  fact('Los cocodrilos no pueden sacar la lengua.', '¿Y tú? ¡A ver esa lengua!'),
  fact(
    'Al nacer, una cría de canguro mide menos que tu dedo pulgar.',
    '¿Sabes dónde se esconde para crecer?',
  ),
  fact(
    'Los osos polares tienen la piel negra debajo del pelo.',
    '¿De qué color dirías que es su pelo?',
  ),
  fact(
    'Los flamencos nacen grises y se vuelven rosas por lo que comen.',
    '¿De qué color te gustaría ser a ti?',
  ),
  fact(
    'Las orcas son en realidad la especie de delfín más grande.',
    '¿Cuál es tu animal marino favorito?',
  ),
  fact(
    'Los pulpos pueden cambiar de color para esconderse.',
    '¿Dónde te esconderías tú con colores?',
  ),
  fact(
    'El avestruz es la mayor ave del mundo y corre a unos 70 kilómetros por hora.',
    '¿Cuánto corres tú?',
  ),
  fact('Los leones duermen más de 15 horas al día.', '¿Te apuntas a una siesta de león?'),
  fact(
    'Las nutrias de mar duermen cogidas de la mano para no separarse.',
    '¿Con quién te cogerías tú de la mano?',
  ),
  fact(
    'Los antepasados de las libélulas ya volaban antes de que existieran los dinosaurios.',
    '¿Te imaginas una libélula como un halcón? ¡Las hubo!',
  ),
  fact(
    'Las tortugas marinas suelen volver a la playa donde nacieron para poner sus huevos.',
    '¿Cuál es tu lugar favorito al que volver?',
  ),
  fact('Los lobos aúllan para hablar con su manada.', '¿Aullamos juntos un ratito?'),
  fact(
    'Las mariquitas pasan el invierno en grupo, bien juntitas.',
    '¿Qué te pones tú para el frío?',
  ),
  fact(
    'Un caracol puede dormir durante años si hace mucho calor o mucho frío.',
    '¿Cuánto dormirías tú?',
  ),
  fact(
    'Los gorilas se hacen un nido nuevo con hojas y ramas cada noche.',
    '¿Cómo sería tu nido ideal?',
  ),
  // Space
  fact('En Venus, un día dura más que un año entero.', '¿Te quedarías a vivir allí?'),
  fact('Dentro de Júpiter cabrían más de mil planetas Tierra.', '¿Cuál es tu planeta favorito?'),
  fact(
    'El Sol es tan grande que cabrían más de un millón de Tierras dentro.',
    '¿Qué color le pondrías tú al Sol?',
  ),
  fact('La Luna se aleja de la Tierra unos 4 centímetros cada año.', '¿Qué le dirías a la Luna?'),
  fact(
    'En el espacio no se oye nada, porque allí no hay aire.',
    '¿Cómo crees que hablan los astronautas?',
  ),
  fact(
    'Los astronautas crecen un poquito en el espacio, porque la columna se estira.',
    '¿Te gustaría crecer flotando?',
  ),
  fact(
    'Saturno es tan ligero que flotaría en una bañera gigante llena de agua.',
    '¿Qué le pondrías a esa bañera, espuma o patitos?',
  ),
  fact(
    'Marte es rojo porque su suelo tiene óxido, como el hierro oxidado.',
    '¿De qué color se ve la Tierra desde el espacio?',
  ),
  fact(
    'La luz del Sol tarda unos 8 minutos en llegar a la Tierra.',
    '¿Qué puedes hacer tú en 8 minutos?',
  ),
  fact(
    'Hay más estrellas en el universo que granos de arena en todas las playas del mundo.',
    '¿Cuántas estrellas has contado tú?',
  ),
  fact(
    'Un año en Mercurio dura solo 88 días de los nuestros.',
    '¿Cuántos cumpleaños tendrías allí?',
  ),
  fact(
    'Las huellas de los astronautas en la Luna duran muchísimo, porque allí no hay viento.',
    '¿Dejarías tú una huella?',
  ),
  fact('Neptuno tarda 165 años en dar una vuelta al Sol.', '¿Qué harías con tanto tiempo?'),
  fact(
    'La Estación Espacial Internacional da la vuelta a la Tierra unas 16 veces al día.',
    '¿Cuántos amaneceres verías en un día?',
  ),
  fact('Un coche tardaría más de 150 años en llegar al Sol.', '¿Qué música pondrías en ese viaje?'),
  // Human body
  fact(
    'Tu corazón late unas 100.000 veces cada día.',
    '¿Notas el tuyo? ¡Ponte la mano en el pecho!',
  ),
  fact(
    'Los bebés nacen con unos 300 huesos, pero de mayores tenemos 206, porque algunos se unen.',
    '¿Cuál crees que es el hueso más largo?',
  ),
  fact(
    'El hueso más pequeño del cuerpo está dentro del oído y se llama estribo.',
    '¿Cómo te imaginas que se llama el más grande?',
  ),
  fact('Tu lengua tiene miles de botoncitos del gusto.', '¿Cuál es tu sabor favorito?'),
  fact('Parpadeamos más o menos 15 veces por minuto.', '¿A que ahora has parpadeado?'),
  fact(
    'Nadie tiene las mismas huellas de los dedos, ni siquiera los gemelos idénticos.',
    '¿Quieres mirarte la yema de un dedo?',
  ),
  fact(
    'El cuerpo humano tiene más de 600 músculos.',
    '¡A ver esa sonrisa! ¿Cuántos músculos estás usando?',
  ),
  fact(
    'Cuando tienes hambre, tu tripa hace ruido porque el aire y los jugos se mueven dentro.',
    '¿Qué te está contando tu tripa ahora?',
  ),
  fact(
    'El cerebro trabaja también mientras duermes: ordena lo que aprendiste durante el día.',
    '¿Qué has soñado últimamente?',
  ),
  fact('Respiramos más de 15.000 veces cada día.', '¿Respiramos hondo a la vez?'),
  fact(
    'La piel es el órgano más grande del cuerpo.',
    '¿Qué parte de tu piel tiene más cosquillas?',
  ),
  fact(
    'Las uñas crecen más rápido en las manos que en los pies.',
    '¿Cuántas uñas tienes? ¡Cuéntalas!',
  ),
  fact(
    'Los niños tienen 20 dientes de leche y los mayores, hasta 32.',
    '¿Cuántos te quedan por caer?',
  ),
  fact('Los ojos se mueven muy rápido cuando sueñas.', '¿Cierras los ojos para soñar mejor?'),
  fact(
    'El corazón de una persona es del tamaño aproximado de su puño.',
    '¡Cierra el puño! ¿A que es pequeño?',
  ),
  // The world
  fact(
    'El monte Everest mide casi 8.850 metros, la montaña más alta sobre el nivel del mar.',
    '¿Qué llevarías tú en la mochila?',
  ),
  fact(
    'El océano Pacífico es tan grande que ocupa más que todas las tierras juntas.',
    '¿Te gusta más el mar o la montaña?',
  ),
  fact(
    'La Antártida es el lugar más frío del mundo y casi no llueve: es un desierto de hielo.',
    '¿Te imaginabas un desierto de hielo?',
  ),
  fact(
    'El Amazonas es el río con más agua del mundo.',
    '¿Qué animales crees que viven en sus orillas?',
  ),
  fact(
    'Rusia es tan grande que tiene 11 husos horarios distintos.',
    '¿Te imaginas desayunar con sol mientras en otro sitio es de noche?',
  ),
  fact('El Vaticano es el país más pequeño del mundo.', '¿Qué país te gustaría visitar?'),
  fact('El Sáhara es el desierto cálido más grande del mundo.', '¿Te subirías a un camello?'),
  fact(
    'En Islandia hay volcanes y glaciares a la vez, por eso la llaman tierra de hielo y fuego.',
    '¿Preferirías ir a la nieve o a la playa?',
  ),
  fact(
    'El Teide, en Tenerife, es la montaña más alta de España.',
    '¿Has subido alguna vez a una montaña?',
  ),
  fact(
    'España tiene dos grandes archipiélagos: las islas Baleares y las islas Canarias.',
    '¿Has visitado alguna isla?',
  ),
  fact('Hay árboles que viven más de 4.000 años.', '¿Cuántas velas tendría su tarta?'),
  fact(
    'Un rayo es más caliente que la superficie del Sol.',
    '¿Cuentas los segundos entre el rayo y el trueno?',
  ),
  fact('Una nube normal pesa como cien elefantes.', '¿Qué forma tiene la nube que ves tú?'),
  fact(
    'El agua del mar es salada porque los ríos arrastran sales de las rocas.',
    '¿Has probado alguna vez el agua del mar?',
  ),
  fact(
    'Un arcoíris es en realidad un círculo, pero desde el suelo solo vemos la mitad.',
    '¿Cuántos colores le ves tú?',
  ),
  fact('Los copos de nieve tienen seis puntas.', '¿Hacemos un copo de papel?'),
  fact('La Tierra gira muy rápido, pero no lo notamos.', '¿Notas que giras ahora mismo?'),
  fact(
    'El hielo flota porque ocupa más espacio que el agua líquida.',
    '¿Qué le pasa a un cubito en tu vaso?',
  ),
  fact('Casi tres cuartas partes de la Tierra son agua.', '¿Cómo llamarías tú a este planeta?'),
  fact('El sonido viaja más rápido en el agua que en el aire.', '¿Has oído algo debajo del agua?'),
  // History and inventions
  fact('Las pirámides de Egipto tienen más de 4.500 años.', '¿Te imaginas construir una?'),
  fact(
    'Los dinosaurios desaparecieron hace unos 66 millones de años.',
    '¿Cuál es tu dinosaurio favorito?',
  ),
  fact(
    'Las aves de hoy son parientes vivos de los dinosaurios.',
    '¿Te imaginabas que un gorrión es un mini dino?',
  ),
  fact(
    'El tiranosaurio vivió más cerca de nosotros en el tiempo que del estegosaurio.',
    '¿Qué dinosaurio te cae mejor?',
  ),
  fact('Los Juegos Olímpicos nacieron en Grecia hace unos 2.800 años.', '¿Qué deporte harías tú?'),
  fact(
    'Los primeros ordenadores ocupaban una habitación entera.',
    '¿Qué harías con un ordenador tan grande?',
  ),
  fact('El papel se inventó en China hace unos 2.000 años.', '¿Hacemos un avión de papel?'),
  fact('El número cero llegó a Europa desde la India.', '¿Cuál es tu número favorito?'),
  fact('El ajedrez nació en la India hace más de 1.400 años.', '¿Jugamos a algo de pensar?'),
  fact(
    'Hace miles de años, los niños del antiguo Egipto ya jugaban con muñecas y pelotas.',
    '¿A qué juegas tú?',
  ),
  fact(
    'La Torre Eiffel crece unos centímetros en verano por el calor.',
    '¿Qué le pasa a tu helado con el calor?',
  ),
  // Science and nature
  fact(
    'La luz da siete vueltas a la Tierra en un solo segundo.',
    '¿A que tú no llegas tan rápido?',
  ),
  fact('El agua la vemos de tres formas: hielo, líquida y vapor.', '¿Dónde has visto vapor hoy?'),
  fact(
    'La Tierra es un imán gigante, por eso funcionan las brújulas.',
    '¿Qué cosas se pegan a un imán en tu casa?',
  ),
  fact('Los girasoles jóvenes giran para seguir al Sol.', '¿Hacia dónde girarías tú?'),
  fact(
    'Una gota de lluvia cae a unos 30 kilómetros por hora.',
    '¿Corres tú más rápido que la lluvia?',
  ),
  fact('Las plantas fabrican su comida con la luz del Sol.', '¿Qué planta tienes en casa?'),
  // Food
  fact(
    'Las palomitas explotan porque el agua de dentro se convierte en vapor.',
    '¿Las prefieres dulces o saladas?',
  ),
  fact('El chocolate se hace con las semillas del cacao.', '¿Con qué te gusta más?'),
  fact('Las patatas llegaron a Europa desde América.', '¿Tortilla con cebolla o sin cebolla?'),
  fact('Los plátanos son bayas, pero las fresas no.', '¿Cuál es tu fruta favorita?'),
  fact('La miel casi nunca se estropea.', '¿Te gusta con tostada?'),
  fact(
    'Antes había zanahorias moradas y amarillas, no solo naranjas.',
    '¿De qué color pedirías tú la zanahoria?',
  ),
  fact('Los tomates son frutas.', '¿Los pondrías en una macedonia?'),
  fact(
    'Los cacahuetes, aunque los llamemos frutos secos, son legumbres, como los garbanzos.',
    '¿Te lo esperabas?',
  ),
];

export const FACT_INTROS = [
  '¡Dato curioso!',
  '¡Atención, dato curioso!',
  '¿Sabías que…? ¡Mira esto!',
  '¡Bip, bip! Tengo un dato para ti.',
];
