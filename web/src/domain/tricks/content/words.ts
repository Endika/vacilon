export interface Word {
  /** Spanish forms as written; the first is how she says it. */
  es: string[];
  /** English forms; the first is how she says it, all are accepted. */
  en: string[];
  /** How the English word sounds, spelled the Spanish way, when it is not read as written. */
  sounds?: string;
  /** Basque forms with their article; the first is how she says it. */
  eu: string[];
  /** Said after the Basque word when it depends on who speaks. */
  euNote?: string;
}

const split = (forms: string): string[] => forms.split('|');

const w = (es: string, en: string, sounds: string, eu: string, euNote?: string): Word => ({
  es: split(es),
  en: split(en),
  ...(sounds ? { sounds } : {}),
  eu: split(eu),
  ...(euNote ? { euNote } : {}),
});

export const WORDS: Word[] = [
  // Animals
  w('perro|perrito', 'dog', '', 'txakurra'),
  w('gato|gatito', 'cat', 'cat', 'katua'),
  w('pájaro|pajarito', 'bird', 'berd', 'txoria'),
  w('pez|pececito', 'fish', '', 'arraina'),
  w('caballo', 'horse', 'jors', 'zaldia'),
  w('vaca', 'cow', 'cau', 'behia'),
  w('cerdo|cerdito', 'pig', '', 'txerria'),
  w('oveja', 'sheep', 'shiip', 'ardia'),
  w('gallina', 'hen|chicken', 'jen', 'oiloa'),
  w('pato|patito', 'duck', 'dac', 'ahatea'),
  w('ratón|ratoncito', 'mouse', 'maus', 'sagua'),
  w('conejo|conejito', 'rabbit|bunny', 'rábit', 'untxia'),
  w('león', 'lion', 'láion', 'lehoia'),
  w('tigre', 'tiger', 'táiguer', 'tigrea'),
  w('elefante', 'elephant', 'élefant', 'elefantea'),
  w('mono|monito', 'monkey', 'mánqui', 'tximinoa'),
  w('oso|osito', 'bear', 'ber', 'hartza'),
  w('lobo', 'wolf', 'gulf', 'otsoa'),
  w('rana', 'frog', '', 'igela'),
  w('serpiente', 'snake', 'sneik', 'sugea'),
  w('mariposa', 'butterfly', 'báterflai', 'tximeleta'),
  w('abeja', 'bee', 'bii', 'erlea'),
  w('hormiga', 'ant', '', 'inurria'),
  w('araña', 'spider', 'spáider', 'armiarma'),
  w('tortuga', 'turtle', 'tértel', 'dortoka'),
  w('ballena', 'whale', 'gueil', 'balea'),
  w('delfín', 'dolphin', 'dólfin', 'izurdea'),
  w('zorro', 'fox', '', 'azeria'),
  w('búho', 'owl', 'aul', 'hontza'),
  w('jirafa', 'giraffe', 'yiráf', 'jirafa'),
  w('burro', 'donkey', 'dónqui', 'astoa'),

  // Colours
  w('rojo|roja', 'red', '', 'gorria'),
  w('azul', 'blue', 'blu', 'urdina'),
  w('verde', 'green', 'griin', 'berdea'),
  w('amarillo|amarilla', 'yellow', 'iélou', 'horia'),
  w('blanco|blanca', 'white', 'guait', 'zuria'),
  w('negro|negra', 'black', 'blac', 'beltza'),
  w('rosa', 'pink', '', 'arrosa'),
  w('naranja', 'orange', 'óranch', 'laranja'),
  w('morado|morada', 'purple', 'pérpel', 'morea'),
  w('marrón', 'brown', 'braun', 'marroia'),
  w('gris', 'grey|gray', 'grei', 'grisa'),

  // Numbers
  w('uno', 'one', 'guan', 'bat'),
  w('dos', 'two', 'tu', 'bi'),
  w('tres', 'three', 'zrii', 'hiru'),
  w('cuatro', 'four', 'for', 'lau'),
  w('cinco', 'five', 'faiv', 'bost'),
  w('seis', 'six', 'six', 'sei'),
  w('siete', 'seven', 'séven', 'zazpi'),
  w('ocho', 'eight', 'eit', 'zortzi'),
  w('nueve', 'nine', 'nain', 'bederatzi'),
  w('diez', 'ten', '', 'hamar'),

  // Family
  w('mamá|madre', 'mum|mom|mother', 'mam', 'ama'),
  w('papá|padre', 'dad|father', '', 'aita'),
  w(
    'hermano',
    'brother',
    'bráder',
    'anaia|neba',
    'Si lo dice una chica, es «neba»; si lo dice un chico, «anaia».',
  ),
  w(
    'hermana',
    'sister',
    'síster',
    'arreba|ahizpa',
    'Si lo dice una chica, es «ahizpa»; si lo dice un chico, «arreba».',
  ),
  w('abuelo|abuelito', 'grandpa|grandfather', 'gránpa', 'aitona'),
  w('abuela|abuelita', 'grandma|grandmother', 'gránma', 'amona'),
  w('bebé', 'baby', 'béibi', 'haurtxoa'),
  w('amigo|amiga', 'friend', 'frend', 'laguna'),
  w('familia', 'family', 'fámili', 'familia'),
  w('tío', 'uncle', 'ánkel', 'osaba'),
  w('tía', 'aunt', 'ant', 'izeba'),

  // Food
  w('agua', 'water', 'guóter', 'ura'),
  w('leche', 'milk', '', 'esnea'),
  w('pan', 'bread', 'bred', 'ogia'),
  w('manzana', 'apple', 'ápel', 'sagarra'),
  w('plátano', 'banana', 'banána', 'platanoa'),
  w('fresa', 'strawberry', 'stróberi', 'marrubia'),
  w('queso', 'cheese', 'chiis', 'gazta'),
  w('huevo', 'egg', '', 'arrautza'),
  w('pastel|tarta', 'cake', 'keik', 'pastela|tarta'),
  w('helado', 'ice cream', 'áis criim', 'izozkia'),
  w('galleta', 'cookie|biscuit', 'cúqui', 'gaileta'),
  w('chocolate', 'chocolate', 'chóclet', 'txokolatea'),
  w('sopa', 'soup', 'sup', 'zopa'),
  w('caramelo|chuche', 'sweet|candy', 'suiit', 'goxokia'),
  w('zanahoria', 'carrot', 'cárot', 'azenarioa'),
  w('tomate', 'tomato', 'toméitou', 'tomatea'),
  w('patata', 'potato', 'potéitou', 'patata'),
  w('arroz', 'rice', 'rais', 'arroza'),
  w('uva', 'grape', 'greip', 'mahatsa'),
  w('pera', 'pear', 'per', 'udarea'),
  w('limón', 'lemon', 'lémon', 'limoia'),
  w('sandía', 'watermelon', 'guótermelon', 'angurria'),
  w('desayuno', 'breakfast', 'brékfast', 'gosaria'),
  w('comida', 'lunch', 'lanch', 'bazkaria'),
  w('cena', 'dinner', 'díner', 'afaria'),

  // Body
  w('cabeza', 'head', 'jed', 'burua'),
  w('mano', 'hand', 'jand', 'eskua'),
  w('pie', 'foot', 'fut', 'oina'),
  w('ojo', 'eye', 'ai', 'begia'),
  w('nariz', 'nose', 'nous', 'sudurra'),
  w('boca', 'mouth', 'mauz', 'ahoa'),
  w('oreja', 'ear', 'iar', 'belarria'),
  w('pelo', 'hair', 'jer', 'ilea'),
  w('diente', 'tooth', 'tuz', 'hortza'),
  w('brazo', 'arm', '', 'besoa'),
  w('pierna', 'leg', '', 'hanka'),
  w('dedo', 'finger', 'fínguer', 'hatza'),
  w('corazón', 'heart', 'jart', 'bihotza'),
  w('barriga|tripa', 'tummy', 'támi', 'sabela'),

  // Home and things
  w('casa', 'house', 'jaus', 'etxea'),
  w('puerta', 'door', 'dor', 'atea'),
  w('ventana', 'window', 'guíndou', 'leihoa'),
  w('cama', 'bed', '', 'ohea'),
  w('mesa', 'table', 'téibel', 'mahaia'),
  w('silla', 'chair', 'cher', 'aulkia'),
  w('libro', 'book', 'buc', 'liburua'),
  w('lápiz', 'pencil', 'pénsil', 'arkatza'),
  w('pelota|balón', 'ball', 'bol', 'pilota|baloia'),
  w('juguete', 'toy', 'toi', 'jostailua'),
  w('muñeca', 'doll', 'dol', 'panpina'),
  w('coche', 'car', '', 'autoa|kotxea'),
  w('bici|bicicleta', 'bike|bicycle', 'baik', 'bizikleta'),
  w('colegio|cole|escuela', 'school', 'scul', 'eskola|ikastola'),
  w('mochila', 'backpack|schoolbag', 'bácpac', 'motxila'),
  w('reloj', 'clock|watch', 'cloc', 'erlojua'),
  w('llave', 'key', 'ki', 'giltza'),
  w('cuchara', 'spoon', 'spuun', 'koilara'),
  w('tenedor', 'fork', 'forc', 'sardexka'),
  w('plato', 'plate', 'pleit', 'platera'),
  w('teléfono|móvil', 'phone', 'foun', 'telefonoa|mugikorra'),
  w('tren', 'train', 'trein', 'trena'),
  w('avión', 'plane', 'plein', 'hegazkina'),
  w('barco', 'boat|ship', 'bout', 'itsasontzia'),
  w('globo', 'balloon', 'balún', 'puxika'),

  // Nature
  w('sol', 'sun', 'san', 'eguzkia'),
  w('luna', 'moon', 'muun', 'ilargia'),
  w('estrella', 'star', '', 'izarra'),
  w('cielo', 'sky', 'scai', 'zerua'),
  w('nube', 'cloud', 'claud', 'hodeia'),
  w('lluvia', 'rain', 'rein', 'euria'),
  w('nieve', 'snow', 'snou', 'elurra'),
  w('viento', 'wind', 'guind', 'haizea'),
  w('árbol', 'tree', 'trii', 'zuhaitza'),
  w('flor', 'flower', 'fláuer', 'lorea'),
  w('mar', 'sea', 'sii', 'itsasoa'),
  w('playa', 'beach', 'biich', 'hondartza'),
  w('montaña|monte', 'mountain', 'máuntin', 'mendia'),
  w('río', 'river', 'ríver', 'ibaia'),
  w('fuego', 'fire', 'fáier', 'sua'),
  w('arcoíris', 'rainbow', 'réinbou', 'ostadarra|ortzadarra'),
  w('día', 'day', 'dei', 'eguna'),
  w('noche', 'night', 'nait', 'gaua'),
  w('piedra', 'stone|rock', 'stoun', 'harria'),
  w('hoja', 'leaf', 'liif', 'hostoa'),

  // Everyday words
  w('hola', 'hello|hi', 'jelóu', 'kaixo'),
  w('adiós', 'goodbye|bye', 'gudbái', 'agur'),
  w('gracias', 'thank you|thanks', 'zénk iu', 'eskerrik asko'),
  w('por favor', 'please', 'pliis', 'mesedez'),
  w('sí', 'yes', 'ies', 'bai'),
  w('no', 'no', 'nou', 'ez'),
  w('buenos días', 'good morning', 'gud mórnin', 'egun on'),
  w('buenas noches', 'good night', 'gud nait', 'gabon'),
  w('perdón|lo siento', 'sorry', 'sóri', 'barkatu'),
  w('te quiero', 'I love you', 'ai lav iu', 'maite zaitut'),
  w('feliz|contento|contenta', 'happy', 'jápi', 'pozik'),
  w('triste', 'sad', '', 'triste'),
  w('grande', 'big', '', 'handia'),
  w('pequeño|pequeña', 'small|little', 'smol', 'txikia'),
  w('cumpleaños', 'birthday', 'bérzdei', 'urtebetetzea'),
  w('felicidades|feliz cumpleaños', 'happy birthday', 'jápi bérzdei', 'zorionak'),
  w('fiesta', 'party', 'párti', 'jaia|festa'),
  w('juego', 'game', 'gueim', 'jolasa'),
  w('música', 'music', 'miúsic', 'musika'),
  w('canción', 'song', '', 'abestia|kanta'),
  w('baile', 'dance', 'dans', 'dantza'),
  w('robot', 'robot', 'róubot', 'robota'),
];

export type Language = 'en' | 'eu';

export const LANGUAGE_NAMES: Record<Language, string> = { en: 'inglés', eu: 'euskera' };

/** `{es}` is the Spanish word, `{word}` the translation and `{lang}` the language. */
export const SAY_WORD = ['«{Es}» en {lang} se dice «{word}».', 'En {lang}, «{es}» es «{word}».'];
/** `{word}` is the foreign word, `{es}` the Spanish one and `{lang}` the language. */
export const SAY_MEANING = '«{Word}» en {lang} significa «{es}».';
/** `{sounds}` is how it sounds. */
export const SAY_SOUNDS = 'Suena así: «{sounds}».';
export const WORD_HOOKS = [
  '¿Lo dices conmigo?',
  '¿Qué otra palabra traducimos?',
  '¿Me preguntas otra?',
  '¡Repítelo bien alto! ¿Otra?',
];
export const WORD_UNKNOWN = [
  '¡Uy, esa todavía no me la sé! Me sé animales, colores, números, comida… ¿Probamos con otra?',
  '¡Esa palabra aún no está en mi cajita! Prueba con un animal o un color. ¿Cuál?',
];

export const LANGUAGE_INTROS = [
  '¡A jugar con los idiomas!',
  '¡Concurso de palabras!',
  '¡Bip bip, modo profe de idiomas!',
];
/** `{es}` is the Spanish word and `{lang}` the language. */
export const ASK_WORD = '¿Cómo se dice «{es}» en {lang}?';
/** `{word}` is the foreign word and `{lang}` the language. */
export const ASK_MEANING = '¿Qué significa «{word}» en {lang}?';
export const LANGUAGE_AGAIN = ['¿Otra palabra?', '¿Vamos con otra?', '¿Te animas con otra?'];
