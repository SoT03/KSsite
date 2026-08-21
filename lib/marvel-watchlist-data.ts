// lib/marvel-watchlist-data.ts
//
// Shared source of truth for the Marvel Multiverse Watchlist: the 94-item
// list, unlock graph, and universe metadata. Imported by both the client
// component and server-side code (poster fetch script, API routes) so the
// two never drift apart.

export type UniverseId =
  | "mcu"
  | "sony-spiderman"
  | "fox-xmen"
  | "sony-verse"
  | "disney-extras";

export interface WatchItem {
  id: string;
  title: string;
  universe: UniverseId;
  phase: string;
  /** ids that must ALL be watched before this item unlocks */
  requires?: string[];
  /** ids that are suggested (but not required) viewing before/around this item */
  recommended?: string[];
  /** episode count, for TV seasons/specials only */
  episodes?: number;
  /** which TMDB endpoint to search (movie vs. tv) when resolving poster art */
  mediaType: "movie" | "tv";
}

export interface Universe {
  id: UniverseId;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Universe metadata                                                  */
/* ------------------------------------------------------------------ */

export const UNIVERSES: Universe[] = [
  { id: "mcu", name: "MCU" },
  { id: "sony-spiderman", name: "Sony Spider-Verse" },
  { id: "fox-xmen", name: "Fox X-Men" },
  { id: "sony-verse", name: "Sony Venom-Verse" },
  { id: "disney-extras", name: "Disney+ Extras" },
];

/* ------------------------------------------------------------------ */
/*  Item data (94 entries)                                             */
/* ------------------------------------------------------------------ */

export const ITEMS: WatchItem[] = [
  /* ---------------------------- MCU — Phase 1 ---------------------------- */
  { id: "mcu-cap-america-1", title: "Captain America: The First Avenger", universe: "mcu", phase: "Phase 1", mediaType: "movie" },
  { id: "mcu-captain-marvel", title: "Captain Marvel", universe: "mcu", phase: "Phase 1", requires: ["mcu-cap-america-1"], mediaType: "movie" },
  { id: "mcu-iron-man-1", title: "Iron Man", universe: "mcu", phase: "Phase 1", requires: ["mcu-cap-america-1"], mediaType: "movie" },
  { id: "mcu-iron-man-2", title: "Iron Man 2", universe: "mcu", phase: "Phase 1", requires: ["mcu-iron-man-1"], mediaType: "movie" },
  { id: "mcu-hulk", title: "The Incredible Hulk", universe: "mcu", phase: "Phase 1", requires: ["mcu-cap-america-1"], mediaType: "movie" },
  { id: "mcu-thor-1", title: "Thor", universe: "mcu", phase: "Phase 1", requires: ["mcu-iron-man-1", "mcu-hulk"], mediaType: "movie" },
  { id: "mcu-avengers-1", title: "The Avengers", universe: "mcu", phase: "Phase 1", requires: ["mcu-iron-man-2", "mcu-thor-1"], mediaType: "movie" },

  /* ---------------------------- MCU — Phase 2 ---------------------------- */
  { id: "mcu-thor-dark-world", title: "Thor: The Dark World", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-1"], mediaType: "movie" },
  { id: "mcu-iron-man-3", title: "Iron Man 3", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-1"], mediaType: "movie" },
  { id: "mcu-cap-america-winter-soldier", title: "Captain America: The Winter Soldier", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-1"], mediaType: "movie" },
  { id: "mcu-gotg-1", title: "Guardians of the Galaxy", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-1"], mediaType: "movie" },
  { id: "mcu-gotg-2", title: "Guardians of the Galaxy Vol. 2", universe: "mcu", phase: "Phase 2", requires: ["mcu-gotg-1"], mediaType: "movie" },
  { id: "mcu-avengers-age-of-ultron", title: "Avengers: Age of Ultron", universe: "mcu", phase: "Phase 2", requires: ["mcu-thor-dark-world", "mcu-iron-man-3", "mcu-cap-america-winter-soldier"], mediaType: "movie" },
  { id: "mcu-ant-man-1", title: "Ant-Man", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-age-of-ultron"], mediaType: "movie" },

  /* ---------------------------- MCU — Phase 3 ---------------------------- */
  {
    id: "mcu-cap-america-civil-war",
    title: "Captain America: Civil War",
    universe: "mcu",
    phase: "Phase 3",
    requires: [
      "mcu-thor-dark-world",
      "mcu-iron-man-3",
      "mcu-cap-america-winter-soldier",
      "mcu-gotg-1",
      "mcu-gotg-2",
      "mcu-avengers-age-of-ultron",
      "mcu-ant-man-1",
    ],
    mediaType: "movie",
  },
  { id: "mcu-black-widow", title: "Black Widow", universe: "mcu", phase: "Phase 3", requires: ["mcu-cap-america-civil-war"], mediaType: "movie" },
  { id: "mcu-black-panther-1", title: "Black Panther", universe: "mcu", phase: "Phase 3", requires: ["mcu-cap-america-civil-war"], mediaType: "movie" },
  { id: "mcu-spiderman-homecoming", title: "Spider-Man: Homecoming", universe: "mcu", phase: "Phase 3", requires: ["mcu-cap-america-civil-war"], mediaType: "movie" },
  { id: "mcu-doctor-strange-1", title: "Doctor Strange", universe: "mcu", phase: "Phase 3", requires: ["mcu-black-widow", "mcu-black-panther-1", "mcu-spiderman-homecoming"], mediaType: "movie" },
  { id: "mcu-thor-ragnarok", title: "Thor: Ragnarok", universe: "mcu", phase: "Phase 3", requires: ["mcu-doctor-strange-1"], mediaType: "movie" },
  { id: "mcu-ant-man-wasp", title: "Ant-Man and the Wasp", universe: "mcu", phase: "Phase 3", requires: ["mcu-doctor-strange-1"], mediaType: "movie" },
  {
    id: "mcu-infinity-war",
    title: "Avengers: Infinity War",
    universe: "mcu",
    phase: "Phase 3",
    requires: [
      "mcu-cap-america-civil-war",
      "mcu-black-widow",
      "mcu-black-panther-1",
      "mcu-spiderman-homecoming",
      "mcu-doctor-strange-1",
      "mcu-thor-ragnarok",
      "mcu-ant-man-wasp",
    ],
    recommended: ["mcu-captain-marvel"],
    mediaType: "movie",
  },
  { id: "mcu-endgame", title: "Avengers: Endgame", universe: "mcu", phase: "Phase 3", requires: ["mcu-infinity-war"], mediaType: "movie" },
  { id: "mcu-loki-s1", title: "Loki Season 1", universe: "mcu", phase: "Phase 3", requires: ["mcu-endgame"], mediaType: "tv" },

  /* ---------------------------- MCU — Phase 4 ---------------------------- */
  { id: "mcu-wandavision", title: "WandaVision", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "tv" },
  { id: "mcu-shang-chi", title: "Shang-Chi and the Legend of the Ten Rings", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "movie" },
  { id: "mcu-falcon-winter-soldier", title: "The Falcon and the Winter Soldier", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "tv" },
  { id: "mcu-eternals", title: "Eternals", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "movie" },
  {
    id: "mcu-spiderman-far-from-home",
    title: "Spider-Man: Far From Home",
    universe: "mcu",
    phase: "Phase 4",
    requires: ["mcu-endgame"],
    recommended: ["sony-verse-venom-let-there-be-carnage"],
    mediaType: "movie",
  },
  { id: "mcu-spiderman-no-way-home", title: "Spider-Man: No Way Home", universe: "mcu", phase: "Phase 4", requires: ["mcu-spiderman-far-from-home"], mediaType: "movie" },
  { id: "mcu-hawkeye", title: "Hawkeye", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "tv" },
  { id: "mcu-moon-knight", title: "Moon Knight", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "tv" },
  { id: "mcu-doctor-strange-multiverse-madness", title: "Doctor Strange in the Multiverse of Madness", universe: "mcu", phase: "Phase 4", requires: ["mcu-spiderman-no-way-home"], mediaType: "movie" },
  { id: "mcu-ms-marvel", title: "Ms. Marvel", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "tv" },
  { id: "mcu-she-hulk", title: "She-Hulk: Attorney at Law", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "tv" },
  { id: "mcu-werewolf-by-night", title: "Werewolf by Night", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "movie" },
  { id: "mcu-black-panther-wakanda-forever", title: "Black Panther: Wakanda Forever", universe: "mcu", phase: "Phase 4", requires: ["mcu-spiderman-far-from-home"], mediaType: "movie" },
  { id: "mcu-gotg-holiday-special", title: "The Guardians of the Galaxy Holiday Special", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "movie" },

  /* ---------------------------- MCU — Phase 5 ---------------------------- */
  {
    id: "mcu-ant-man-quantumania",
    title: "Ant-Man and the Wasp: Quantumania",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-spiderman-no-way-home", "mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    recommended: ["mcu-loki-s1"],
    mediaType: "movie",
  },
  {
    id: "mcu-thor-love-thunder",
    title: "Thor: Love and Thunder",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-spiderman-no-way-home", "mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    mediaType: "movie",
  },
  { id: "mcu-gotg-3", title: "Guardians of the Galaxy Vol. 3", universe: "mcu", phase: "Phase 5", requires: ["mcu-thor-love-thunder"], mediaType: "movie" },
  {
    id: "mcu-secret-invasion",
    title: "Secret Invasion",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-spiderman-no-way-home", "mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    episodes: 6,
    mediaType: "tv",
  },
  { id: "mcu-loki-s2", title: "Loki Season 2", universe: "mcu", phase: "Phase 5", requires: ["mcu-loki-s1"], episodes: 6, mediaType: "tv" },
  {
    id: "mcu-echo-s1",
    title: "Echo Season 1",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-spiderman-no-way-home", "mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    episodes: 5,
    mediaType: "tv",
  },
  {
    id: "mcu-ironheart-s1",
    title: "Ironheart Season 1",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-spiderman-no-way-home", "mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    episodes: 6,
    mediaType: "tv",
  },
  { id: "mcu-agatha-all-along", title: "Agatha All Along", universe: "mcu", phase: "Phase 5", requires: ["mcu-wandavision"], episodes: 9, mediaType: "tv" },
  { id: "mcu-deadpool-wolverine", title: "Deadpool & Wolverine", universe: "mcu", phase: "Phase 5", requires: ["fox-xmen-deadpool-2"], mediaType: "movie" },
  {
    id: "mcu-your-friendly-neighborhood-spiderman",
    title: "Your Friendly Neighborhood Spider-Man Season 1",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-spiderman-no-way-home", "mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    episodes: 10,
    mediaType: "tv",
  },
  {
    id: "mcu-daredevil-born-again",
    title: "Daredevil: Born Again",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["disney-extras-daredevil-s3"],
    recommended: ["disney-extras-punisher-s1", "disney-extras-punisher-s2"],
    episodes: 8,
    mediaType: "tv",
  },
  {
    id: "mcu-captain-america-brave-new-world",
    title: "Captain America: Brave New World",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-ant-man-quantumania", "mcu-gotg-3"],
    mediaType: "movie",
  },
  {
    id: "mcu-thunderbolts",
    title: "Thunderbolts*",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-ant-man-quantumania", "mcu-gotg-3", "mcu-hawkeye"],
    recommended: ["mcu-falcon-winter-soldier"],
    mediaType: "movie",
  },

  /* ---------------------------- MCU — Phase 6 ---------------------------- */
  { id: "mcu-fantastic-four-first-steps", title: "The Fantastic Four: First Steps", universe: "mcu", phase: "Phase 6", mediaType: "movie" },
  { id: "mcu-eyes-of-wakanda", title: "Eyes of Wakanda", universe: "mcu", phase: "Phase 6", requires: ["mcu-black-panther-wakanda-forever"], mediaType: "tv" },
  { id: "mcu-daredevil-born-again-2", title: "Daredevil: Born Again Season 2", universe: "mcu", phase: "Phase 6", requires: ["mcu-daredevil-born-again"], mediaType: "tv" },
  {
    id: "mcu-punisher-one-last-kill",
    title: "The Punisher: One Last Kill",
    universe: "mcu",
    phase: "Phase 6",
    recommended: ["disney-extras-punisher-s1", "disney-extras-punisher-s2"],
    mediaType: "movie",
  },
  { id: "mcu-spiderman-brand-new-day", title: "Spider-Man: Brand New Day", universe: "mcu", phase: "Phase 6", requires: ["mcu-spiderman-no-way-home"], mediaType: "movie" },
  {
    id: "mcu-avengers-doomsday",
    title: "Avengers: Doomsday",
    universe: "mcu",
    phase: "Phase 6",
    requires: ["mcu-endgame", "mcu-spiderman-brand-new-day", "mcu-fantastic-four-first-steps", "mcu-thunderbolts"],
    recommended: [
      "fox-xmen-first-class",
      "fox-xmen-origins-wolverine",
      "fox-xmen",
      "fox-xmen-2",
      "fox-xmen-last-stand",
      "fox-xmen-the-wolverine",
      "fox-xmen-days-of-future-past",
      "fox-xmen-apocalypse",
      "fox-xmen-dark-phoenix",
      "fox-xmen-deadpool",
      "fox-xmen-deadpool-2",
      "fox-xmen-new-mutants",
      "fox-xmen-logan",
      "sony-spiderman-1",
      "sony-spiderman-2",
      "sony-spiderman-3",
    ],
    mediaType: "movie",
  },

  /* ---------------------------- Sony Spider-Verse ---------------------------- */
  { id: "sony-spiderman-1", title: "Spider-Man", universe: "sony-spiderman", phase: "Movies", mediaType: "movie" },
  { id: "sony-spiderman-2", title: "Spider-Man 2", universe: "sony-spiderman", phase: "Movies", requires: ["sony-spiderman-1"], mediaType: "movie" },
  { id: "sony-spiderman-3", title: "Spider-Man 3", universe: "sony-spiderman", phase: "Movies", requires: ["sony-spiderman-2"], mediaType: "movie" },
  { id: "sony-amazing-spiderman-1", title: "The Amazing Spider-Man", universe: "sony-spiderman", phase: "Movies", mediaType: "movie" },
  { id: "sony-amazing-spiderman-2", title: "The Amazing Spider-Man 2", universe: "sony-spiderman", phase: "Movies", requires: ["sony-amazing-spiderman-1"], mediaType: "movie" },

  /* ---------------------------- Fox X-Men ---------------------------- */
  { id: "fox-xmen-first-class", title: "X-Men: First Class", universe: "fox-xmen", phase: "Movies", mediaType: "movie" },
  { id: "fox-xmen-origins-wolverine", title: "X-Men Origins: Wolverine", universe: "fox-xmen", phase: "Movies", mediaType: "movie" },
  { id: "fox-xmen", title: "X-Men", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-first-class", "fox-xmen-origins-wolverine"], mediaType: "movie" },
  { id: "fox-xmen-2", title: "X2: X-Men United", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen"], mediaType: "movie" },
  { id: "fox-xmen-last-stand", title: "X-Men: The Last Stand", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-2"], mediaType: "movie" },
  { id: "fox-xmen-the-wolverine", title: "The Wolverine", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-last-stand"], mediaType: "movie" },
  {
    id: "fox-xmen-days-of-future-past",
    title: "X-Men: Days of Future Past",
    universe: "fox-xmen",
    phase: "Movies",
    requires: ["fox-xmen-last-stand", "fox-xmen-the-wolverine"],
    mediaType: "movie",
  },
  { id: "fox-xmen-apocalypse", title: "X-Men: Apocalypse", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-days-of-future-past"], mediaType: "movie" },
  { id: "fox-xmen-dark-phoenix", title: "Dark Phoenix", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-apocalypse"], mediaType: "movie" },
  {
    id: "fox-xmen-deadpool",
    title: "Deadpool",
    universe: "fox-xmen",
    phase: "Movies",
    requires: ["fox-xmen-origins-wolverine"],
    recommended: ["fox-xmen", "fox-xmen-2", "fox-xmen-last-stand", "fox-xmen-the-wolverine", "fox-xmen-days-of-future-past"],
    mediaType: "movie",
  },
  { id: "fox-xmen-deadpool-2", title: "Deadpool 2", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-deadpool"], mediaType: "movie" },
  { id: "fox-xmen-new-mutants", title: "The New Mutants", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-days-of-future-past"], mediaType: "movie" },
  { id: "fox-xmen-logan", title: "Logan", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-the-wolverine", "fox-xmen-days-of-future-past"], mediaType: "movie" },

  /* ---------------------------- Sony Venom-Verse ---------------------------- */
  {
    id: "sony-verse-venom",
    title: "Venom",
    universe: "sony-verse",
    phase: "Movies",
    requires: ["mcu-cap-america-civil-war"],
    recommended: ["sony-spiderman-3"],
    mediaType: "movie",
  },
  {
    id: "sony-verse-venom-let-there-be-carnage",
    title: "Venom: Let There Be Carnage",
    universe: "sony-verse",
    phase: "Movies",
    requires: ["sony-verse-venom", "mcu-spiderman-far-from-home"],
    mediaType: "movie",
  },
  { id: "sony-verse-morbius", title: "Morbius", universe: "sony-verse", phase: "Movies", mediaType: "movie" },
  { id: "sony-verse-madame-web", title: "Madame Web", universe: "sony-verse", phase: "Movies", mediaType: "movie" },
  { id: "sony-verse-kraven", title: "Kraven the Hunter", universe: "sony-verse", phase: "Movies", mediaType: "movie" },
  { id: "sony-verse-venom-last-dance", title: "Venom: The Last Dance", universe: "sony-verse", phase: "Movies", requires: ["sony-verse-venom-let-there-be-carnage"], mediaType: "movie" },

  /* ---------------------------- Disney+ Extras (Netflix Marvel) ---------------------------- */
  {
    id: "disney-extras-daredevil-s1",
    title: "Daredevil Season 1",
    universe: "disney-extras",
    phase: "Netflix Marvel",
    requires: [
      "mcu-thor-dark-world",
      "mcu-iron-man-3",
      "mcu-cap-america-winter-soldier",
      "mcu-gotg-1",
      "mcu-gotg-2",
      "mcu-avengers-age-of-ultron",
      "mcu-ant-man-1",
    ],
    episodes: 13,
    mediaType: "tv",
  },
  { id: "disney-extras-jessica-jones-s1", title: "Jessica Jones Season 1", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-daredevil-s1"], episodes: 13, mediaType: "tv" },
  { id: "disney-extras-daredevil-s2", title: "Daredevil Season 2", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-daredevil-s1"], episodes: 13, mediaType: "tv" },
  { id: "disney-extras-luke-cage-s1", title: "Luke Cage Season 1", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-daredevil-s2"], episodes: 13, mediaType: "tv" },
  { id: "disney-extras-iron-fist-s1", title: "Iron Fist Season 1", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-daredevil-s2"], episodes: 13, mediaType: "tv" },
  {
    id: "disney-extras-defenders-s1",
    title: "The Defenders Season 1",
    universe: "disney-extras",
    phase: "Netflix Marvel",
    requires: ["disney-extras-daredevil-s2"],
    recommended: ["disney-extras-luke-cage-s1", "disney-extras-iron-fist-s1", "disney-extras-jessica-jones-s1"],
    episodes: 8,
    mediaType: "tv",
  },
  { id: "disney-extras-punisher-s1", title: "Punisher Season 1", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-daredevil-s2"], episodes: 13, mediaType: "tv" },
  {
    id: "disney-extras-jessica-jones-s2",
    title: "Jessica Jones Season 2",
    universe: "disney-extras",
    phase: "Netflix Marvel",
    requires: ["disney-extras-jessica-jones-s1"],
    recommended: ["disney-extras-defenders-s1"],
    episodes: 11,
    mediaType: "tv",
  },
  {
    id: "disney-extras-luke-cage-s2",
    title: "Luke Cage Season 2",
    universe: "disney-extras",
    phase: "Netflix Marvel",
    requires: ["disney-extras-luke-cage-s1"],
    recommended: ["disney-extras-defenders-s1"],
    episodes: 13,
    mediaType: "tv",
  },
  {
    id: "disney-extras-iron-fist-s2",
    title: "Iron Fist Season 2",
    universe: "disney-extras",
    phase: "Netflix Marvel",
    requires: ["disney-extras-iron-fist-s1"],
    recommended: ["disney-extras-defenders-s1"],
    episodes: 10,
    mediaType: "tv",
  },
  {
    id: "disney-extras-daredevil-s3",
    title: "Daredevil Season 3",
    universe: "disney-extras",
    phase: "Netflix Marvel",
    requires: ["disney-extras-daredevil-s2"],
    recommended: ["disney-extras-defenders-s1"],
    episodes: 10,
    mediaType: "tv",
  },
  { id: "disney-extras-punisher-s2", title: "Punisher Season 2", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-punisher-s1"], episodes: 13, mediaType: "tv" },
  { id: "disney-extras-jessica-jones-s3", title: "Jessica Jones Season 3", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-jessica-jones-s2"], episodes: 13, mediaType: "tv" },
];

export const ITEM_MAP: Record<string, WatchItem> = Object.fromEntries(ITEMS.map((item) => [item.id, item]));
