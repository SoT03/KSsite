// lib/marvel-watchlist-data.ts
//
// Shared source of truth for the Marvel Multiverse Watchlist: the 105-item
// list, unlock graph, and universe metadata. Imported by both the client
// component and server-side code (poster fetch script, API routes) so the
// two never drift apart.

export type UniverseId =
  | "mcu"
  | "sony-spiderman"
  | "fox-xmen"
  | "sony-verse"
  | "disney-extras";

/** Significance pill shown top-left on the card: OS = one-shot short,
 *  M = crucial for the MCU throughline, R = recommended, D = must-watch
 *  before Avengers: Doomsday. */
export type SignificanceBadge = "OS" | "M" | "R" | "D";

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
  /** "together" = want to watch together, "skip" = not that important, "one-shot" = short bonus film */
  tag?: "together" | "skip" | "one-shot";
  /** significance markers rendered as pills on the poster; order in the array doesn't matter, display order is fixed */
  badges?: SignificanceBadge[];
}

export interface Universe {
  id: UniverseId;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Tier list bands                                                    */
/* ------------------------------------------------------------------ */

export interface TierDef {
  key: string;
  label: string;
  /** max number of items allowed in this tier; undefined = unlimited */
  max?: number;
}

// Ordered best to worst. "best" is a single reserved slot for a favorite —
// placing a second item there bumps the previous occupant back to Unranked.
export const TIERS: TierDef[] = [
  { key: "best", label: "BEST", max: 1 },
  { key: "10-9", label: "10 – 9" },
  { key: "8.5-7.5", label: "8.5 – 7.5" },
  { key: "7-6", label: "7 – 6" },
  { key: "5.5-4", label: "5.5 – 4" },
  { key: "3.5-2", label: "3.5 – 2" },
  { key: "1", label: "1" },
];

export const TIER_KEYS = TIERS.map((t) => t.key);

/* ------------------------------------------------------------------ */
/*  Universe metadata                                                  */
/* ------------------------------------------------------------------ */

export const UNIVERSES: Universe[] = [
  { id: "mcu", name: "MCU" },
  { id: "sony-spiderman", name: "Sony Spider-Verse" },
  { id: "fox-xmen", name: "Fox X-Men" },
  { id: "sony-verse", name: "Sony's Spider-Man Universe (SSU)" },
  { id: "disney-extras", name: "The Defenders Saga (Netflix)" },
];

/* ------------------------------------------------------------------ */
/*  Item data (106 entries)                                            */
/* ------------------------------------------------------------------ */

export const ITEMS: WatchItem[] = [
  /* ---------------------------- MCU — Phase 1 ---------------------------- */
  { id: "mcu-cap-america-1", title: "Captain America: The First Avenger", universe: "mcu", phase: "Phase 1", mediaType: "movie", tag: "together", badges: ["D", "M"] },
  { id: "mcu-agent-carter-s1", title: "Agent Carter Season 1", universe: "mcu", phase: "Phase 1", requires: ["mcu-cap-america-1"], episodes: 8, mediaType: "tv" },
  { id: "mcu-agent-carter-s2", title: "Agent Carter Season 2", universe: "mcu", phase: "Phase 1", requires: ["mcu-agent-carter-s1"], episodes: 10, mediaType: "tv" },
  { id: "mcu-captain-marvel", title: "Captain Marvel", universe: "mcu", phase: "Phase 1", requires: ["mcu-cap-america-1"], mediaType: "movie", badges: ["M"] },
  { id: "mcu-iron-man-1", title: "Iron Man", universe: "mcu", phase: "Phase 1", requires: ["mcu-cap-america-1"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-iron-man-2", title: "Iron Man 2", universe: "mcu", phase: "Phase 1", requires: ["mcu-iron-man-1"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-hulk", title: "The Incredible Hulk", universe: "mcu", phase: "Phase 1", requires: ["mcu-cap-america-1"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-thor-one-shot", title: "A Funny Thing Happened on the Way to Thor's Hammer", universe: "mcu", phase: "Phase 1", requires: ["mcu-thor-1"], mediaType: "movie", tag: "one-shot", badges: ["OS"] },
  { id: "mcu-thor-1", title: "Thor", universe: "mcu", phase: "Phase 1", requires: ["mcu-iron-man-1", "mcu-hulk"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-the-consultant", title: "The Consultant", universe: "mcu", phase: "Phase 1", requires: ["mcu-thor-1"], mediaType: "movie", tag: "one-shot", badges: ["OS"] },
  { id: "mcu-avengers-1", title: "The Avengers", universe: "mcu", phase: "Phase 1", requires: ["mcu-iron-man-2", "mcu-thor-1"], mediaType: "movie", tag: "together", badges: ["D", "M"] },
  { id: "mcu-item-47", title: "Item 47", universe: "mcu", phase: "Phase 1", requires: ["mcu-avengers-1"], mediaType: "movie", tag: "one-shot", badges: ["OS"] },

  /* ---------------------------- MCU — Phase 2 ---------------------------- */
  { id: "mcu-iron-man-3", title: "Iron Man 3", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-1"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-thor-dark-world", title: "Thor: The Dark World", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-1"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-cap-america-winter-soldier", title: "Captain America: The Winter Soldier", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-1"], mediaType: "movie", tag: "together", badges: ["M"] },
  {
    id: "mcu-agents-of-shield-s1",
    title: "Agents of S.H.I.E.L.D. Season 1",
    universe: "mcu",
    phase: "Phase 2",
    requires: ["mcu-thor-dark-world", "mcu-iron-man-3", "mcu-cap-america-winter-soldier"],
    episodes: 22,
    mediaType: "tv",
  },
  { id: "mcu-gotg-1", title: "Guardians of the Galaxy", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-1"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-gotg-2", title: "Guardians of the Galaxy Vol. 2", universe: "mcu", phase: "Phase 2", requires: ["mcu-gotg-1"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-avengers-age-of-ultron", title: "Avengers: Age of Ultron", universe: "mcu", phase: "Phase 2", requires: ["mcu-thor-dark-world", "mcu-iron-man-3", "mcu-cap-america-winter-soldier"], mediaType: "movie", tag: "together", badges: ["M"] },
  {
    id: "mcu-agents-of-shield-s2",
    title: "Agents of S.H.I.E.L.D. Season 2",
    universe: "mcu",
    phase: "Phase 2",
    requires: ["mcu-agents-of-shield-s1", "mcu-avengers-age-of-ultron"],
    episodes: 22,
    mediaType: "tv",
  },
  { id: "mcu-whih-newsfront-s1", title: "WHIH Newsfront Season 1", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-age-of-ultron"], mediaType: "tv" },
  { id: "mcu-ant-man-1", title: "Ant-Man", universe: "mcu", phase: "Phase 2", requires: ["mcu-avengers-age-of-ultron"], mediaType: "movie", tag: "together", badges: ["M"] },

  /* ---------------------------- MCU — Phase 3 ---------------------------- */
  {
    id: "mcu-cap-america-civil-war",
    title: "Captain America: Civil War",
    universe: "mcu",
    phase: "Phase 3",
    requires: ["mcu-ant-man-1"],
    mediaType: "movie",
    tag: "together",
    badges: ["M"],
  },
  { id: "mcu-black-widow", title: "Black Widow", universe: "mcu", phase: "Phase 3", requires: ["mcu-cap-america-civil-war"], mediaType: "movie", tag: "together", badges: ["M"] },
  {
    id: "mcu-agents-of-shield-s3",
    title: "Agents of S.H.I.E.L.D. Season 3",
    universe: "mcu",
    phase: "Phase 3",
    requires: ["mcu-black-widow", "mcu-agents-of-shield-s2"],
    episodes: 22,
    mediaType: "tv",
  },
  { id: "mcu-whih-newsfront-s2", title: "WHIH Newsfront Season 2", universe: "mcu", phase: "Phase 3", requires: ["mcu-agents-of-shield-s3"], mediaType: "tv" },
  {
    id: "mcu-black-panther-1",
    title: "Black Panther",
    universe: "mcu",
    phase: "Phase 3",
    requires: ["mcu-cap-america-civil-war"],
    recommended: ["mcu-eyes-of-wakanda"],
    mediaType: "movie",
    tag: "together",
    badges: ["M"],
  },
  { id: "mcu-spiderman-homecoming", title: "Spider-Man: Homecoming", universe: "mcu", phase: "Phase 3", requires: ["mcu-cap-america-civil-war"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-doctor-strange-1", title: "Doctor Strange", universe: "mcu", phase: "Phase 3", requires: ["mcu-black-widow", "mcu-black-panther-1", "mcu-spiderman-homecoming"], mediaType: "movie", tag: "together", badges: ["M"] },
  {
    id: "mcu-agents-of-shield-s4",
    title: "Agents of S.H.I.E.L.D. Season 4",
    universe: "mcu",
    phase: "Phase 3",
    requires: ["mcu-doctor-strange-1", "mcu-agents-of-shield-s3"],
    episodes: 22,
    mediaType: "tv",
  },
  { id: "mcu-thor-ragnarok", title: "Thor: Ragnarok", universe: "mcu", phase: "Phase 3", requires: ["mcu-doctor-strange-1"], mediaType: "movie", tag: "together", badges: ["M"] },
  { id: "mcu-ant-man-wasp", title: "Ant-Man and the Wasp", universe: "mcu", phase: "Phase 3", requires: ["mcu-doctor-strange-1"], mediaType: "movie", tag: "together", badges: ["M"] },
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
      "mcu-gotg-2",
    ],
    mediaType: "movie",
    tag: "together",
    badges: ["D", "M"],
  },
  {
    id: "mcu-endgame",
    title: "Avengers: Endgame",
    universe: "mcu",
    phase: "Phase 3",
    requires: ["mcu-infinity-war"],
    recommended: ["mcu-captain-marvel"],
    mediaType: "movie",
    tag: "together",
    badges: ["D", "M"],
  },
  { id: "mcu-loki-s1", title: "Loki Season 1", universe: "mcu", phase: "Phase 3", requires: ["mcu-endgame"], episodes: 6, mediaType: "tv", badges: ["D", "M"] },

  /* ---------------------------- MCU — Phase 4 ---------------------------- */
  { id: "mcu-wandavision", title: "WandaVision", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], episodes: 9, mediaType: "tv", badges: ["M"] },
  { id: "mcu-shang-chi", title: "Shang-Chi and the Legend of the Ten Rings", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "movie", tag: "together", badges: ["D", "R"] },
  { id: "mcu-falcon-winter-soldier", title: "The Falcon and the Winter Soldier", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], episodes: 6, mediaType: "tv", badges: ["M"] },
  { id: "mcu-eternals", title: "Eternals", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "movie", badges: ["M"] },
  {
    id: "mcu-spiderman-far-from-home",
    title: "Spider-Man: Far From Home",
    universe: "mcu",
    phase: "Phase 4",
    requires: ["mcu-endgame"],
    recommended: ["sony-verse-venom-let-there-be-carnage"],
    mediaType: "movie",
    tag: "together",
    badges: ["M"],
  },
  { id: "mcu-spiderman-no-way-home", title: "Spider-Man: No Way Home", universe: "mcu", phase: "Phase 4", requires: ["mcu-spiderman-far-from-home"], mediaType: "movie", tag: "together", badges: ["D", "M"] },
  { id: "mcu-hawkeye", title: "Hawkeye", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], episodes: 6, mediaType: "tv", tag: "together", badges: ["M"] },
  { id: "mcu-moon-knight", title: "Moon Knight", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], episodes: 6, mediaType: "tv", tag: "together" },
  { id: "mcu-doctor-strange-multiverse-madness", title: "Doctor Strange in the Multiverse of Madness", universe: "mcu", phase: "Phase 4", requires: ["mcu-spiderman-no-way-home", "mcu-wandavision"], mediaType: "movie", tag: "together", badges: ["D", "M"] },
  { id: "mcu-ms-marvel", title: "Ms. Marvel", universe: "mcu", phase: "Phase 4", requires: ["mcu-captain-marvel"], episodes: 6, mediaType: "tv", badges: ["R"] },
  { id: "mcu-she-hulk", title: "She-Hulk: Attorney at Law", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], episodes: 9, mediaType: "tv" },
  { id: "mcu-werewolf-by-night", title: "Werewolf by Night", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], episodes: 1, mediaType: "movie" },
  { id: "mcu-black-panther-wakanda-forever", title: "Black Panther: Wakanda Forever", universe: "mcu", phase: "Phase 4", requires: ["mcu-spiderman-far-from-home"], mediaType: "movie", tag: "together", badges: ["D", "R"] },
  { id: "mcu-gotg-holiday-special", title: "The Guardians of the Galaxy Holiday Special", universe: "mcu", phase: "Phase 4", requires: ["mcu-endgame"], mediaType: "movie" },

  /* ---------------------------- MCU — Phase 5 ---------------------------- */
  /* Phase 5 default gate: Doctor Strange in the Multiverse of Madness + Black
     Panther: Wakanda Forever. Items below only list their own requires when
     they diverge from that default. */
  {
    id: "mcu-ant-man-quantumania",
    title: "Ant-Man and the Wasp: Quantumania",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    recommended: ["mcu-loki-s1"],
    mediaType: "movie",
    tag: "together",
    badges: ["M"],
  },
  {
    id: "mcu-thor-love-thunder",
    title: "Thor: Love and Thunder",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    mediaType: "movie",
    tag: "together",
    badges: ["M"],
  },
  { id: "mcu-gotg-3", title: "Guardians of the Galaxy Vol. 3", universe: "mcu", phase: "Phase 5", requires: ["mcu-thor-love-thunder", "mcu-gotg-holiday-special"], mediaType: "movie", tag: "together", badges: ["M"] },
  {
    id: "mcu-secret-invasion",
    title: "Secret Invasion",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    episodes: 6,
    mediaType: "tv",
  },
  { id: "mcu-loki-s2", title: "Loki Season 2", universe: "mcu", phase: "Phase 5", requires: ["mcu-loki-s1"], episodes: 6, mediaType: "tv", tag: "together", badges: ["D", "M"] },
  {
    id: "mcu-echo-s1",
    title: "Echo Season 1",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-hawkeye", "disney-extras-daredevil-s3"],
    episodes: 5,
    mediaType: "tv",
  },
  { id: "mcu-deadpool-wolverine", title: "Deadpool & Wolverine", universe: "mcu", phase: "Phase 5", requires: ["fox-xmen-deadpool-2", "mcu-loki-s1"], mediaType: "movie", tag: "together", badges: ["D", "M"] },
  { id: "mcu-agatha-all-along", title: "Agatha All Along", universe: "mcu", phase: "Phase 5", requires: ["mcu-wandavision"], episodes: 9, mediaType: "tv", badges: ["R"] },
  {
    id: "mcu-your-friendly-neighborhood-spiderman",
    title: "Your Friendly Neighborhood Spider-Man Season 1",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-doctor-strange-multiverse-madness", "mcu-black-panther-wakanda-forever"],
    episodes: 10,
    mediaType: "tv",
  },
  {
    id: "mcu-captain-america-brave-new-world",
    title: "Captain America: Brave New World",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-falcon-winter-soldier"],
    mediaType: "movie",
    tag: "together",
    badges: ["D", "M"],
  },
  {
    id: "mcu-daredevil-born-again",
    title: "Daredevil: Born Again Season 1",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["disney-extras-daredevil-s3", "mcu-echo-s1"],
    episodes: 9,
    mediaType: "tv",
    tag: "together",
    badges: ["R"],
  },
  {
    id: "mcu-thunderbolts",
    title: "Thunderbolts*",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-black-widow", "mcu-falcon-winter-soldier", "mcu-hawkeye"],
    mediaType: "movie",
    tag: "together",
    badges: ["D", "M"],
  },
  {
    id: "mcu-ironheart-s1",
    title: "Ironheart Season 1",
    universe: "mcu",
    phase: "Phase 5",
    requires: ["mcu-black-panther-wakanda-forever"],
    episodes: 6,
    mediaType: "tv",
  },

  /* ---------------------------- MCU — Phase 6 ---------------------------- */
  {
    id: "mcu-fantastic-four-first-steps",
    title: "The Fantastic Four: First Steps",
    universe: "mcu",
    phase: "Phase 6",
    requires: ["mcu-doctor-strange-multiverse-madness"],
    mediaType: "movie",
    tag: "together",
    badges: ["D", "M"],
  },
  { id: "mcu-eyes-of-wakanda", title: "Eyes of Wakanda", universe: "mcu", phase: "Phase 6", requires: ["mcu-black-panther-1"], mediaType: "tv", tag: "together", badges: ["R"] },
  { id: "mcu-daredevil-born-again-2", title: "Daredevil: Born Again Season 2", universe: "mcu", phase: "Phase 6", requires: ["mcu-daredevil-born-again"], mediaType: "tv", badges: ["R"] },
  {
    id: "mcu-punisher-one-last-kill",
    title: "Punisher: One Last Kill",
    universe: "mcu",
    phase: "Phase 6",
    requires: ["mcu-daredevil-born-again-2"],
    recommended: ["disney-extras-punisher-s1", "disney-extras-punisher-s2"],
    mediaType: "movie",
    badges: ["R"],
  },
  { id: "mcu-spiderman-brand-new-day", title: "Spider-Man: Brand New Day", universe: "mcu", phase: "Phase 6", requires: ["mcu-spiderman-no-way-home"], mediaType: "movie", tag: "together", badges: ["M"] },
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
    tag: "together",
    badges: ["M"],
  },
  { id: "mcu-avengers-secret-wars", title: "Avengers: Secret Wars", universe: "mcu", phase: "Phase 6", requires: ["mcu-avengers-doomsday"], mediaType: "movie", tag: "together", badges: ["M"] },

  /* ---------------------------- Sony Spider-Verse ---------------------------- */
  { id: "sony-spiderman-1", title: "Spider-Man", universe: "sony-spiderman", phase: "Movies", mediaType: "movie", badges: ["R"] },
  { id: "sony-spiderman-2", title: "Spider-Man 2", universe: "sony-spiderman", phase: "Movies", requires: ["sony-spiderman-1"], mediaType: "movie", badges: ["R"] },
  { id: "sony-spiderman-3", title: "Spider-Man 3", universe: "sony-spiderman", phase: "Movies", requires: ["sony-spiderman-2"], mediaType: "movie", badges: ["R"] },
  { id: "sony-amazing-spiderman-1", title: "The Amazing Spider-Man", universe: "sony-spiderman", phase: "Movies", mediaType: "movie", badges: ["R"] },
  { id: "sony-amazing-spiderman-2", title: "The Amazing Spider-Man 2", universe: "sony-spiderman", phase: "Movies", requires: ["sony-amazing-spiderman-1"], mediaType: "movie", tag: "together", badges: ["R"] },

  /* ---------------------------- Fox X-Men ---------------------------- */
  { id: "fox-xmen-first-class", title: "X-Men: First Class", universe: "fox-xmen", phase: "Movies", mediaType: "movie", tag: "together", badges: ["R"] },
  { id: "fox-xmen-origins-wolverine", title: "X-Men Origins: Wolverine", universe: "fox-xmen", phase: "Movies", mediaType: "movie", tag: "together", badges: ["R"] },
  { id: "fox-xmen", title: "X-Men", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-first-class", "fox-xmen-origins-wolverine"], mediaType: "movie", tag: "together", badges: ["D", "R"] },
  { id: "fox-xmen-2", title: "X2: X-Men United", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen"], mediaType: "movie", tag: "together", badges: ["D", "R"] },
  { id: "fox-xmen-last-stand", title: "X-Men: The Last Stand", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-2"], mediaType: "movie", badges: ["R"] },
  { id: "fox-xmen-the-wolverine", title: "The Wolverine", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-last-stand"], mediaType: "movie", badges: ["R"] },
  {
    id: "fox-xmen-days-of-future-past",
    title: "X-Men: Days of Future Past",
    universe: "fox-xmen",
    phase: "Movies",
    requires: ["fox-xmen-last-stand", "fox-xmen-the-wolverine"],
    mediaType: "movie",
    tag: "together",
    badges: ["R"],
  },
  { id: "fox-xmen-apocalypse", title: "X-Men: Apocalypse", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-days-of-future-past"], mediaType: "movie", badges: ["R"] },
  { id: "fox-xmen-dark-phoenix", title: "Dark Phoenix", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-apocalypse"], mediaType: "movie", badges: ["R"] },
  {
    id: "fox-xmen-deadpool",
    title: "Deadpool",
    universe: "fox-xmen",
    phase: "Movies",
    requires: ["fox-xmen-origins-wolverine"],
    recommended: ["fox-xmen", "fox-xmen-2", "fox-xmen-last-stand", "fox-xmen-the-wolverine", "fox-xmen-days-of-future-past"],
    mediaType: "movie",
    tag: "together",
    badges: ["R"],
  },
  { id: "fox-xmen-deadpool-2", title: "Deadpool 2", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-deadpool"], mediaType: "movie", tag: "together", badges: ["R"] },
  { id: "fox-xmen-new-mutants", title: "The New Mutants", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-days-of-future-past"], mediaType: "movie", tag: "skip" },
  { id: "fox-xmen-logan", title: "Logan", universe: "fox-xmen", phase: "Movies", requires: ["fox-xmen-the-wolverine", "fox-xmen-days-of-future-past"], mediaType: "movie", tag: "together", badges: ["R"] },

  /* ---------------------------- Sony Venom-Verse ---------------------------- */
  {
    id: "sony-verse-venom",
    title: "Venom",
    universe: "sony-verse",
    phase: "Movies",
    requires: ["mcu-cap-america-civil-war"],
    recommended: ["sony-spiderman-3"],
    mediaType: "movie",
    tag: "together",
    badges: ["R"],
  },
  {
    id: "sony-verse-venom-let-there-be-carnage",
    title: "Venom: Let There Be Carnage",
    universe: "sony-verse",
    phase: "Movies",
    requires: ["sony-verse-venom"],
    mediaType: "movie",
    badges: ["R"],
  },
  { id: "sony-verse-morbius", title: "Morbius", universe: "sony-verse", phase: "Movies", requires: ["mcu-cap-america-civil-war"], mediaType: "movie", tag: "skip" },
  { id: "sony-verse-madame-web", title: "Madame Web", universe: "sony-verse", phase: "Movies", requires: ["mcu-cap-america-civil-war"], mediaType: "movie", tag: "skip" },
  { id: "sony-verse-kraven", title: "Kraven the Hunter", universe: "sony-verse", phase: "Movies", requires: ["mcu-cap-america-civil-war"], mediaType: "movie", tag: "skip" },
  { id: "sony-verse-venom-last-dance", title: "Venom: The Last Dance", universe: "sony-verse", phase: "Movies", requires: ["sony-verse-venom-let-there-be-carnage"], mediaType: "movie", tag: "together", badges: ["R"] },

  /* ---------------------------- The Defenders Saga (Netflix) ---------------------------- */
  { id: "disney-extras-daredevil-s1", title: "Daredevil Season 1", universe: "disney-extras", phase: "Netflix Marvel", episodes: 13, mediaType: "tv", badges: ["R"] },
  { id: "disney-extras-jessica-jones-s1", title: "Jessica Jones Season 1", universe: "disney-extras", phase: "Netflix Marvel", episodes: 13, mediaType: "tv", tag: "skip" },
  { id: "disney-extras-daredevil-s2", title: "Daredevil Season 2", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-daredevil-s1"], episodes: 13, mediaType: "tv", badges: ["R"] },
  { id: "disney-extras-luke-cage-s1", title: "Luke Cage Season 1", universe: "disney-extras", phase: "Netflix Marvel", episodes: 13, mediaType: "tv", tag: "skip" },
  { id: "disney-extras-iron-fist-s1", title: "Iron Fist Season 1", universe: "disney-extras", phase: "Netflix Marvel", episodes: 13, mediaType: "tv", tag: "skip" },
  {
    id: "disney-extras-defenders-s1",
    title: "The Defenders",
    universe: "disney-extras",
    phase: "Netflix Marvel",
    requires: ["disney-extras-daredevil-s2", "disney-extras-luke-cage-s1", "disney-extras-iron-fist-s1"],
    episodes: 8,
    mediaType: "tv",
  },
  { id: "disney-extras-punisher-s1", title: "The Punisher Season 1", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-daredevil-s2"], episodes: 13, mediaType: "tv", badges: ["R"] },
  { id: "disney-extras-jessica-jones-s2", title: "Jessica Jones Season 2", universe: "disney-extras", phase: "Netflix Marvel", episodes: 13, mediaType: "tv", tag: "skip" },
  { id: "disney-extras-luke-cage-s2", title: "Luke Cage Season 2", universe: "disney-extras", phase: "Netflix Marvel", episodes: 13, mediaType: "tv", tag: "skip" },
  { id: "disney-extras-iron-fist-s2", title: "Iron Fist Season 2", universe: "disney-extras", phase: "Netflix Marvel", episodes: 10, mediaType: "tv", tag: "skip" },
  { id: "disney-extras-daredevil-s3", title: "Daredevil Season 3", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-defenders-s1"], episodes: 13, mediaType: "tv" },
  { id: "disney-extras-punisher-s2", title: "The Punisher Season 2", universe: "disney-extras", phase: "Netflix Marvel", requires: ["disney-extras-punisher-s1"], episodes: 13, mediaType: "tv", badges: ["R"] },
  { id: "disney-extras-jessica-jones-s3", title: "Jessica Jones Season 3", universe: "disney-extras", phase: "Netflix Marvel", episodes: 13, mediaType: "tv", tag: "skip" },
];

export const ITEM_MAP: Record<string, WatchItem> = Object.fromEntries(ITEMS.map((item) => [item.id, item]));
