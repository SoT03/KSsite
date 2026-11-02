// lib/marvel-survey-data.ts
//
// The Marvel survey ("Ankieta"): its questions and the hand-picked answer
// lists for the questions TMDB can't answer (duos, ships, villains, songs...).
// Imported by both the client survey component and the /api/survey route, so
// the server can validate answers against the same option ids.
//
// Spoiler rule: an option only shows up once the viewer has watched at least
// one of the items in its `from` list. Answers other people gave that point at
// an option the viewer hasn't unlocked yet are hidden in the results too.

export interface SurveyOption {
  id: string;
  label: string;
  /** watchlist item ids — the option is visible once ANY of them is watched */
  from: string[];
}

export type SurveyQuestionKind =
  /** pick one watched movie; suggested from the tier list */
  | "movie"
  /** pick one watched series; suggested from the tier list */
  | "series"
  /** pick a character from lib/marvel-characters.ts, filtered by gender */
  | "character-m"
  | "character-f"
  /** pick from this question's own `options` list */
  | "options";

export interface SurveyQuestion {
  id: string;
  label: string;
  kind: SurveyQuestionKind;
  options?: SurveyOption[];
  /** lets people type their own answer when nothing in the list fits */
  allowCustom?: boolean;
}

/** Answers typed by hand are stored with this prefix, e.g. "custom:Thunderstruck". */
export const CUSTOM_PREFIX = "custom:";
export const CUSTOM_MAX_LENGTH = 80;

const opt = (id: string, label: string, ...from: string[]): SurveyOption => ({ id, label, from });

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  { id: "fav-movie", label: "Ulubiony film", kind: "movie" },
  { id: "fav-series", label: "Ulubiony serial", kind: "series" },
  { id: "fav-male-character", label: "Ulubiona postać męska", kind: "character-m" },
  { id: "fav-female-character", label: "Ulubiona postać żeńska", kind: "character-f" },
  {
    id: "fav-duo",
    label: "Ulubiony duet",
    kind: "options",
    options: [
      opt("cap-bucky", "Steve & Bucky", "mcu-cap-america-1"),
      opt("rocket-groot", "Rocket & Groot", "mcu-gotg-1"),
      opt("thor-hulk", "Thor & Hulk", "mcu-thor-ragnarok"),
      opt("tony-peter", "Tony & Peter", "mcu-cap-america-civil-war", "mcu-spiderman-homecoming"),
      opt("sam-bucky", "Sam & Bucky", "mcu-falcon-winter-soldier"),
      opt("loki-mobius", "Loki & Mobius", "mcu-loki-s1"),
      opt("deadpool-wolverine", "Deadpool & Wolverine", "mcu-deadpool-wolverine"),
      opt("natasha-clint", "Natasha & Clint", "mcu-avengers-1"),
      opt("strange-wong", "Strange & Wong", "mcu-doctor-strange-1"),
      opt("peter-ned", "Peter & Ned", "mcu-spiderman-homecoming"),
      opt("clint-kate", "Clint & Kate", "mcu-hawkeye"),
      opt("drax-mantis", "Drax & Mantis", "mcu-gotg-2"),
      opt("matt-foggy", "Matt & Foggy", "disney-extras-daredevil-s1"),
      opt("luke-danny", "Luke & Danny", "disney-extras-defenders-s1"),
      opt("tony-rhodey", "Tony & Rhodey", "mcu-iron-man-1"),
      opt("eddie-venom", "Eddie & Venom", "sony-verse-venom"),
      opt("charles-erik", "Charles & Erik", "fox-xmen-first-class", "fox-xmen"),
      opt("okoye-shuri", "Okoye & Shuri", "mcu-black-panther-1"),
    ],
  },
  {
    id: "civil-war-team",
    label: "Wojna bohaterów: kto miał rację w sprawie Porozumień z Sokovii?",
    kind: "options",
    options: [
      opt("iron-man", "Drużyna Iron Mana — podpisać Porozumienia", "mcu-cap-america-civil-war"),
      opt("cap", "Drużyna Kapitana — odrzucić Porozumienia", "mcu-cap-america-civil-war"),
    ],
  },
  {
    id: "fav-siblings",
    label: "Ulubione rodzeństwo",
    kind: "options",
    options: [
      opt("thor-loki", "Thor & Loki", "mcu-thor-1"),
      opt("gamora-nebula", "Gamora & Nebula", "mcu-gotg-1"),
      opt("wanda-pietro", "Wanda & Pietro", "mcu-avengers-age-of-ultron"),
      opt("tchalla-shuri", "T'Challa & Shuri", "mcu-black-panther-1"),
      opt("natasha-yelena", "Natasha & Yelena", "mcu-black-widow"),
      opt("thor-hela", "Thor & Hela", "mcu-thor-ragnarok"),
      opt("billy-tommy", "Billy & Tommy", "mcu-wandavision"),
      opt("sue-johnny", "Sue & Johnny Storm", "mcu-fantastic-four-first-steps"),
      opt("kamala-aamir", "Kamala & Aamir", "mcu-ms-marvel"),
      opt("shang-chi-xialing", "Shang-Chi & Xialing", "mcu-shang-chi"),
    ],
  },
  {
    id: "best-villain",
    label: "Najlepszy złoczyńca",
    kind: "options",
    options: [
      opt("loki", "Loki", "mcu-thor-1"),
      opt("red-skull", "Red Skull", "mcu-cap-america-1"),
      opt("ultron", "Ultron", "mcu-avengers-age-of-ultron"),
      opt("thanos", "Thanos", "mcu-infinity-war"),
      opt("killmonger", "Killmonger", "mcu-black-panther-1"),
      opt("vulture", "Vulture", "mcu-spiderman-homecoming"),
      opt("hela", "Hela", "mcu-thor-ragnarok"),
      opt("zemo", "Zemo", "mcu-cap-america-civil-war"),
      opt("ego", "Ego", "mcu-gotg-2"),
      opt("mysterio", "Mysterio", "mcu-spiderman-far-from-home"),
      opt("green-goblin", "Green Goblin", "sony-spiderman-1", "mcu-spiderman-no-way-home"),
      opt("doc-ock", "Doctor Octopus", "sony-spiderman-2", "mcu-spiderman-no-way-home"),
      opt("scarlet-witch", "Scarlet Witch", "mcu-doctor-strange-multiverse-madness"),
      opt("kang", "Kang / He Who Remains", "mcu-loki-s1"),
      opt("agatha", "Agatha Harkness", "mcu-wandavision"),
      opt("pierce", "Alexander Pierce", "mcu-cap-america-winter-soldier"),
      opt("wenwu", "Wenwu", "mcu-shang-chi"),
      opt("gorr", "Gorr", "mcu-thor-love-thunder"),
      opt("high-evolutionary", "High Evolutionary", "mcu-gotg-3"),
      opt("kingpin", "Kingpin", "disney-extras-daredevil-s1"),
      opt("kilgrave", "Kilgrave", "disney-extras-jessica-jones-s1"),
      opt("magneto", "Magneto", "fox-xmen", "fox-xmen-first-class"),
      opt("stryker", "William Stryker", "fox-xmen-2"),
      opt("galactus", "Galactus", "mcu-fantastic-four-first-steps"),
      opt("doom", "Doctor Doom", "mcu-avengers-doomsday"),
    ],
  },
  {
    id: "fav-guardian",
    label: "Ulubiony Strażnik Galaktyki",
    kind: "options",
    options: [
      opt("star-lord", "Star-Lord", "mcu-gotg-1"),
      opt("gamora", "Gamora", "mcu-gotg-1"),
      opt("drax", "Drax", "mcu-gotg-1"),
      opt("rocket", "Rocket", "mcu-gotg-1"),
      opt("groot", "Groot", "mcu-gotg-1"),
      opt("yondu", "Yondu", "mcu-gotg-1"),
      opt("kraglin", "Kraglin", "mcu-gotg-1"),
      opt("nebula", "Nebula", "mcu-gotg-2"),
      opt("mantis", "Mantis", "mcu-gotg-2"),
      opt("cosmo", "Cosmo", "mcu-gotg-holiday-special", "mcu-gotg-3"),
      opt("adam-warlock", "Adam Warlock", "mcu-gotg-3"),
    ],
  },
  {
    id: "fav-power",
    label: "Ulubiona moc",
    kind: "options",
    options: [
      opt("mjolnir", "Mjolnir i błyskawice", "mcu-thor-1"),
      opt("mystic-arts", "Sztuki mistyczne", "mcu-doctor-strange-1"),
      opt("super-soldier", "Serum superżołnierza", "mcu-cap-america-1"),
      opt("iron-suit", "Zbroja Iron Mana", "mcu-iron-man-1"),
      opt("spider-powers", "Pajęczy zmysł i sieci", "mcu-spiderman-homecoming", "sony-spiderman-1", "sony-amazing-spiderman-1"),
      opt("hulk-strength", "Siła Hulka", "mcu-hulk"),
      opt("chaos-magic", "Magia chaosu", "mcu-wandavision"),
      opt("telepathy", "Telepatia", "fox-xmen", "fox-xmen-first-class"),
      opt("magnetism", "Kontrola magnetyzmu", "fox-xmen", "fox-xmen-first-class"),
      opt("healing-factor", "Regeneracja", "fox-xmen-origins-wolverine", "fox-xmen-deadpool"),
      opt("shrinking", "Zmniejszanie (cząsteczki Pyma)", "mcu-ant-man-1"),
      opt("cosmic-energy", "Kosmiczna energia Kapitan Marvel", "mcu-captain-marvel"),
      opt("speed", "Superszybkość", "mcu-avengers-age-of-ultron"),
      opt("phasing", "Przenikanie przez ściany", "mcu-avengers-age-of-ultron"),
      opt("ten-rings", "Dziesięć Pierścieni", "mcu-shang-chi"),
      opt("time-stone", "Kamień Czasu", "mcu-doctor-strange-1"),
      opt("invisibility", "Niewidzialność", "mcu-fantastic-four-first-steps"),
      opt("shapeshifting", "Zmiana kształtu", "mcu-captain-marvel"),
      opt("vibranium-suit", "Kostium z vibranium", "mcu-black-panther-1"),
      opt("symbiote", "Symbiont", "sony-verse-venom"),
    ],
  },
  {
    id: "best-og6",
    label: "Najlepszy z pierwszej szóstki Avengers",
    kind: "options",
    options: [
      opt("iron-man", "Iron Man", "mcu-avengers-1"),
      opt("captain-america", "Kapitan Ameryka", "mcu-avengers-1"),
      opt("thor", "Thor", "mcu-avengers-1"),
      opt("hulk", "Hulk", "mcu-avengers-1"),
      opt("black-widow", "Czarna Wdowa", "mcu-avengers-1"),
      opt("hawkeye", "Hawkeye", "mcu-avengers-1"),
    ],
  },
  {
    id: "fav-ship",
    label: "Ulubiony ship",
    kind: "options",
    options: [
      opt("tony-pepper", "Tony & Pepper", "mcu-iron-man-1"),
      opt("steve-peggy", "Steve & Peggy", "mcu-cap-america-1"),
      opt("wanda-vision", "Wanda & Vision", "mcu-avengers-age-of-ultron"),
      opt("peter-mj", "Peter & MJ", "mcu-spiderman-homecoming", "sony-spiderman-1"),
      opt("peter-gwen", "Peter & Gwen", "sony-amazing-spiderman-1"),
      opt("quill-gamora", "Quill & Gamora", "mcu-gotg-1"),
      opt("thor-jane", "Thor & Jane", "mcu-thor-1"),
      opt("scott-hope", "Scott & Hope", "mcu-ant-man-1"),
      opt("tchalla-nakia", "T'Challa & Nakia", "mcu-black-panther-1"),
      opt("loki-sylvie", "Loki & Sylvie", "mcu-loki-s1"),
      opt("natasha-bruce", "Natasha & Bruce", "mcu-avengers-age-of-ultron"),
      opt("strange-christine", "Strange & Christine", "mcu-doctor-strange-1"),
      opt("clint-laura", "Clint & Laura", "mcu-avengers-age-of-ultron"),
      opt("matt-karen", "Matt & Karen", "disney-extras-daredevil-s1"),
      opt("jessica-luke", "Jessica & Luke", "disney-extras-jessica-jones-s1"),
      opt("logan-jean", "Logan & Jean", "fox-xmen"),
      opt("wade-vanessa", "Wade & Vanessa", "fox-xmen-deadpool"),
      opt("agatha-rio", "Agatha & Rio", "mcu-agatha-all-along"),
    ],
  },
  {
    id: "fav-song",
    label: "Ulubiona piosenka",
    kind: "options",
    allowCustom: true,
    options: [
      opt("hooked-on-a-feeling", "Hooked on a Feeling — Blue Swede", "mcu-gotg-1"),
      opt("come-and-get-your-love", "Come and Get Your Love — Redbone", "mcu-gotg-1"),
      opt("aint-no-mountain", "Ain't No Mountain High Enough — Marvin Gaye & Tammi Terrell", "mcu-gotg-1"),
      opt("cherry-bomb", "Cherry Bomb — The Runaways", "mcu-gotg-1"),
      opt("mr-blue-sky", "Mr. Blue Sky — ELO", "mcu-gotg-2"),
      opt("the-chain", "The Chain — Fleetwood Mac", "mcu-gotg-2"),
      opt("brandy", "Brandy — Looking Glass", "mcu-gotg-2"),
      opt("father-and-son", "Father and Son — Cat Stevens", "mcu-gotg-2"),
      opt("dog-days", "Dog Days Are Over — Florence + The Machine", "mcu-gotg-3"),
      opt("creep", "Creep (akustycznie) — Radiohead", "mcu-gotg-3"),
      opt("immigrant-song", "Immigrant Song — Led Zeppelin", "mcu-thor-ragnarok"),
      opt("back-in-black", "Back in Black — AC/DC", "mcu-iron-man-1"),
      opt("shoot-to-thrill", "Shoot to Thrill — AC/DC", "mcu-iron-man-2"),
      opt("sweet-child", "Sweet Child o' Mine — Guns N' Roses", "mcu-thor-love-thunder"),
      opt("agatha-all-along-song", "Agatha All Along", "mcu-wandavision"),
      opt("witches-road", "The Ballad of the Witches' Road", "mcu-agatha-all-along"),
      opt("bye-bye-bye", "Bye Bye Bye — *NSYNC", "mcu-deadpool-wolverine"),
      opt("like-a-prayer", "Like a Prayer — Madonna", "mcu-deadpool-wolverine"),
      opt("take-on-me", "Take On Me — a-ha", "fox-xmen-deadpool-2"),
      opt("portals", "Portals — Alan Silvestri", "mcu-endgame"),
      opt("avengers-theme", "The Avengers — Alan Silvestri", "mcu-avengers-1"),
      opt("sunflower", "Sunflower — Post Malone & Swae Lee", "sony-spiderman-1"),
    ],
  },
  {
    id: "saddest-death",
    label: "Najsmutniejsza śmierć",
    kind: "options",
    options: [
      opt("tony", "Tony Stark", "mcu-endgame"),
      opt("natasha", "Natasha Romanoff", "mcu-endgame"),
      opt("vision", "Vision", "mcu-infinity-war"),
      opt("loki-iw", "Loki", "mcu-infinity-war"),
      opt("gamora", "Gamora", "mcu-infinity-war"),
      opt("heimdall", "Heimdall", "mcu-infinity-war"),
      opt("peter-snap", "Peter Parker („Nie czuję się najlepiej…”)", "mcu-infinity-war"),
      opt("yondu", "Yondu", "mcu-gotg-2"),
      opt("pietro", "Pietro Maximoff", "mcu-avengers-age-of-ultron"),
      opt("coulson", "Phil Coulson", "mcu-avengers-1"),
      opt("frigga", "Frigga", "mcu-thor-dark-world"),
      opt("odin", "Odin", "mcu-thor-ragnarok"),
      opt("peggy", "Peggy Carter", "mcu-cap-america-civil-war"),
      opt("killmonger", "Killmonger", "mcu-black-panther-1"),
      opt("tchalla", "T'Challa", "mcu-black-panther-wakanda-forever"),
      opt("aunt-may", "Ciocia May", "mcu-spiderman-no-way-home"),
      opt("uncle-ben", "Wujek Ben", "sony-spiderman-1"),
      opt("gwen", "Gwen Stacy", "sony-amazing-spiderman-2"),
      opt("jane", "Jane Foster", "mcu-thor-love-thunder"),
      opt("wanda", "Wanda Maximoff", "mcu-doctor-strange-multiverse-madness"),
      opt("logan", "Logan", "fox-xmen-logan"),
      opt("charles", "Charles Xavier", "fox-xmen-logan"),
      opt("venom", "Venom", "sony-verse-venom-last-dance"),
    ],
  },
];

export const SURVEY_QUESTION_MAP: Record<string, SurveyQuestion> = Object.fromEntries(
  SURVEY_QUESTIONS.map((q) => [q.id, q])
);
