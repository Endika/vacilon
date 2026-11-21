import re
import unicodedata

WORD_RE = re.compile(r"[a-záéíóúüñ]+")

STOPWORDS = frozenset(
    """a al algo algun alguna algunas alguno algunos ante antes aqui asi aun aunque bien
    cada casi como con contigo cual cuales cuando cuanto cuantos cuantas de del demasiado
    desde donde dos el ella ellas ello ellos en entre era eran eres es esa esas ese eso esos
    esta estaba estan estar estas este esto estos estoy fue ha habia han hace hacer hacia hasta
    hay he hoy la las le les lo los mas me mi mis mucho muchos muy nada ni no nos nosotros
    nuestra nuestro o os otra otras otro otros para pero poco por porque pues que quien quienes
    se sea ser si sido sin sobre solo son soy su sus tambien tan tanto te ti tiene tienen tengo
    tienes todo todos tu tus un una unas uno unos usted va vamos van vas ver voy vosotros vuestro
    y ya yo quiero quieres puedo puedes puede dime dice digo di eh oh uf bip""".split()
)

_SUFFIXES = (
    "amientos", "imientos", "aciones", "amente", "mente", "amiento", "imiento", "acion",
    "ando", "iendo", "adas", "idas", "ados", "idos", "ito", "ita", "itos", "itas",
    "ada", "ida", "ado", "ido", "ar", "er", "ir", "es", "as", "os", "a", "o", "e", "s",
)  # fmt: skip
_MIN_STEM = 3


def strip_accents(text: str) -> str:
    folded = unicodedata.normalize("NFKD", text.replace("ñ", "\0").replace("Ñ", "\0"))
    return "".join(c for c in folded if not unicodedata.combining(c)).replace("\0", "ñ")


def words(text: str) -> list[str]:
    return WORD_RE.findall(text.lower())


def stem(word: str) -> str:
    base = strip_accents(word)
    for suffix in _SUFFIXES:
        if base.endswith(suffix) and len(base) - len(suffix) >= _MIN_STEM:
            return base[: -len(suffix)]
    return base


def content_stems(text: str) -> set[str]:
    return {stem(w) for w in words(text) if len(w) > 2 and strip_accents(w) not in STOPWORDS}
