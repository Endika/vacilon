export interface Animal {
  /** Normalized words that mean it. */
  words: string[];
  /** How she says it with its article: "un perro", "una tortuga". */
  withArticle: string;
}

const a = (withArticle: string, ...words: string[]): Animal => ({ withArticle, words });

export const ANIMALS: Animal[] = [
  a('un perro', 'perro', 'perrito', 'perra', 'perrita', 'cachorro'),
  a('un gato', 'gato', 'gatito', 'gata', 'gatita'),
  a('un pájaro', 'pajaro', 'pajarito'),
  a('un pez', 'pez', 'pececito', 'peces'),
  a('un caballo', 'caballo', 'yegua', 'poni', 'pony'),
  a('un conejo', 'conejo', 'conejito', 'coneja'),
  a('una tortuga', 'tortuga', 'tortuguita'),
  a('un hámster', 'hamster', 'hamsters'),
  a('un loro', 'loro', 'periquito'),
  a('un león', 'leon', 'leona'),
  a('un tigre', 'tigre'),
  a('un elefante', 'elefante'),
  a('una jirafa', 'jirafa'),
  a('un mono', 'mono', 'monito'),
  a('un oso', 'oso', 'osito', 'panda'),
  a('un delfín', 'delfin'),
  a('una ballena', 'ballena'),
  a('un tiburón', 'tiburon'),
  a('un pulpo', 'pulpo'),
  a('una vaca', 'vaca'),
  a('un cerdo', 'cerdo', 'cerdito'),
  a('una oveja', 'oveja', 'ovejita'),
  a('una gallina', 'gallina', 'pollito'),
  a('un pato', 'pato', 'patito'),
  a('un búho', 'buho'),
  a('un lobo', 'lobo'),
  a('un zorro', 'zorro'),
  a('una ardilla', 'ardilla'),
  a('un unicornio', 'unicornio'),
  a('un dinosaurio', 'dinosaurio'),
  a('una mariposa', 'mariposa'),
  a('una mariquita', 'mariquita'),
  a('un caracol', 'caracol'),
  a('una rana', 'rana'),
  a('una serpiente', 'serpiente'),
  a('un pingüino', 'pinguino'),
  a('un koala', 'koala'),
  a('un canguro', 'canguro'),
  a('una cebra', 'cebra'),
  a('un cocodrilo', 'cocodrilo'),
];

/** `{cuenta}` is the sum she asked, as said aloud ("7 menos 4"), and `{resultado}` its value. */
export const SUM_RIGHT = [
  '¡Correcto! {cuenta} son {resultado}. ¡Qué cabeza más rápida! ¿Me pones tú una a mí?',
  '¡Bien! {cuenta} son {resultado}. Se me ha encendido la antena de alegría. ¿Me pones tú una a mí?',
  '¡Exacto, {resultado}! Le has ganado a mis bips en velocidad. ¿Me pones tú una a mí?',
];

export const SUM_WRONG = [
  '¡Casi! {cuenta} son {resultado}. A mí también se me lían los números a veces. ¿Me pones tú una a mí?',
  'Uy, por poquito. {cuenta} son {resultado}. Cuenta despacito con los dedos y verás. ¿Me pones tú una a mí?',
];

/** `{color}` is the colour she heard. */
export const COLOR_REACTIONS = [
  '¡{color}! Qué color más chulo. Me pintaría la cáscara de {color} un ratito. ¿Qué cosas de color {color} tienes?',
  '¡{color}, me encanta! Si fuera un huevo de Pascua, me pintaría de {color}. ¿Y de qué color pintarías tu habitación?',
  '{color}... ¡apuntado en mi antena! Es un color con mucha chispa, como yo. ¿Qué más te gusta de ese color?',
];

/** `{number}` is the number she heard. */
export const NUMBER_REACTIONS = [
  '¡{number}! Anotado en mi cáscara de numeritos. ¿Y eso es mucho o poco?',
  '¡Hala, {number}! Lo he contado con mis bips y me sale lo mismo. ¿Me cuentas más?',
  '{number}, ¡qué buen número! Hoy brilla en mi pantalla. ¿Me cuentas más?',
];

export const ZERO_REACTIONS = [
  '¡Cero! Ni uno. Bueno, el cero es un número muy redondo, como yo. ¿Me cuentas más?',
];

/** `{animal}` comes with its article: "un perro". */
export const ANIMAL_REACTIONS = [
  '¡{animal}! Me encantan. Yo flotaría a su lado para hacerle compañía. ¿Qué sonido hace?',
  '¿{animal}? ¡Qué buena elección! Si yo fuera un animal, sería un caracol, por lo de la cáscara. ¿Qué es lo que más te gusta de ese animal?',
  '¡{animal}! Ahora me lo imagino con antena y mofletes rosas. ¿Sabes imitarlo?',
];

/** `{name}` is the name she heard and `{about}` what it names: "tu perro". */
export const NAME_REACTIONS_ABOUT = [
  '¡{name}! Qué nombre más bonito para {about}. ¿Cómo es?',
  '{name}... ¡me encanta! Dale un saludo de mi parte. ¿Qué os gusta hacer juntos?',
  '¡{name}! Ese nombre suena a aventura. ¿Me cuentas algo de {about}?',
];

/** For a name whose owner she did not say. */
export const NAME_REACTIONS = [
  '¡{name}! Me lo apunto en la antena para no olvidarlo. ¿Me cuentas más?',
  '{name}... ¡qué nombre más chulo! Suena a bip bonito. ¿Me cuentas más?',
];

/** `{value}` is the answer, `{about}` the thing and `{favourite}` "favorito" or "favorita". */
export const FAVOURITE_REACTIONS = [
  '¡Apuntado! Tu {about} {favourite} es {value}. Lo guardo dentro de mi cáscara. ¿Y por qué te gusta tanto?',
  '¡{value}! Buena elección. Ahora ya sé tu {about} {favourite}. ¿Qué es lo que más te gusta?',
  '{value}... ¡me encanta! Se me ha puesto la antena de colores. ¿Desde cuándo es tu {about} {favourite}?',
];

/** `{option}` is what was picked. */
export const CHOICE_REACTIONS = [
  '¡{option}! Yo también lo habría elegido. Bueno, o lo otro, que soy muy indecisa. ¿Por qué {option}?',
  '¡{option}, decidido! Me gusta que lo tengas tan claro. ¿Qué tiene de especial?',
  '¡Pues {option}! Buena elección, lo apunto en mi cáscara. ¿Me cuentas por qué?',
];
