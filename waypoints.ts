export interface Waypoint {
  id: string;
  name: string;
  distanceLabel: string;
  lookbackLabel: string;
  lookbackYears: number;
  anchor: string;
  /**
   * One factual "what is this" line — the object's identity, not a
   * relatable-time comparison. Always shown ungated where it renders.
   */
  whatIsIt?: string;
}

// Figures fact-checked 13 Aug 2026 — sources in PLAN.md. Anchor copy is the
// final wording for the slice; the rest gets tightened during the content
// pass in later build-order stages.
export const WAYPOINTS: Waypoint[] = [
  {
    id: "moon",
    name: "The Moon",
    distanceLabel: "384,400 km away",
    lookbackLabel: "1.3 seconds ago",
    lookbackYears: 1.3 / (365.25 * 24 * 3600),
    anchor: "Before you finished reading this sentence.",
    whatIsIt: "Earth's only natural satellite, about a quarter its diameter.",
  },
  {
    id: "sun",
    name: "The Sun",
    distanceLabel: "149.6 million km away",
    lookbackLabel: "8.3 minutes ago",
    lookbackYears: (8.3 * 60) / (365.25 * 24 * 3600),
    anchor: "Long enough to boil an egg.",
    whatIsIt: "A fairly ordinary star. One of roughly 200 billion in the Milky Way.",
  },
  {
    id: "proxima-centauri",
    name: "Proxima Centauri",
    distanceLabel: "4.2 light-years away",
    lookbackLabel: "4.2 years ago",
    lookbackYears: 4.2,
    anchor: "About as long as a university degree.",
    whatIsIt: "The nearest star to the Sun — small, faint, and red.",
  },
  {
    id: "vega",
    name: "Vega",
    distanceLabel: "25 light-years away",
    lookbackLabel: "25 years ago",
    lookbackYears: 25,
    anchor: "About a generation ago.",
    whatIsIt: "A hot, blue-white star, about twice the Sun's mass.",
  },
  {
    id: "sagittarius-a",
    name: "The Milky Way's Core",
    distanceLabel: "26,000 light-years away",
    lookbackLabel: "26,000 years ago",
    lookbackYears: 26_000,
    anchor: "The last Ice Age. Woolly mammoths were still common.",
    whatIsIt: "A supermassive black hole, ~4 million times the Sun's mass, at our galaxy's centre.",
  },
  {
    id: "andromeda",
    name: "The Andromeda Galaxy",
    distanceLabel: "2.5 million light-years away",
    lookbackLabel: "2.5 million years ago",
    lookbackYears: 2.5e6,
    anchor: "Around when our own genus, Homo, first appears in the fossil record.",
    whatIsIt: "The nearest large galaxy to ours — over a trillion stars, slowly falling toward us.",
  },
  {
    id: "virgo-cluster",
    name: "The Virgo Cluster",
    distanceLabel: "54 million light-years away",
    lookbackLabel: "54 million years ago",
    lookbackYears: 54e6,
    anchor: "Not long after the dinosaurs died out. Early primates were spreading.",
    whatIsIt: "Over a thousand galaxies bound together — the nearest big cluster to home.",
  },
  {
    id: "3c273",
    name: "Quasar 3C 273",
    distanceLabel: "2.4 billion light-years away",
    lookbackLabel: "2.4 billion years ago",
    lookbackYears: 2.4e9,
    anchor: "Around when Earth's atmosphere first gained oxygen.",
    whatIsIt:
      "A quasar: a black hole devouring matter so violently it outshines its whole galaxy. The first one ever identified, in 1963.",
  },
  {
    id: "gn-z11",
    name: "GN-z11",
    distanceLabel: "13.4 billion light-years away",
    lookbackLabel: "13.4 billion years ago",
    lookbackYears: 13.4e9,
    anchor: "Before Earth existed at all.",
    whatIsIt: "One of the most distant galaxies ever confirmed, from a few hundred million years after the Big Bang.",
  },
  {
    id: "jades-gs-z14-0",
    name: "JADES-GS-z14-0",
    distanceLabel: "13.5 billion light-years away",
    lookbackLabel: "13.5 billion years ago",
    lookbackYears: 13.5e9,
    anchor: "About 300 million years after the Big Bang — before there was an Earth, a Sun, or anything else familiar.",
    whatIsIt: "Currently the most distant galaxy ever confirmed — one of the very first to form.",
  },
  {
    id: "reionization-fog",
    name: "The Reionization Fog",
    distanceLabel: "past every galaxy any telescope could ever resolve",
    lookbackLabel: "~13.6 billion years ago",
    lookbackYears: 13.6e9,
    anchor: "Not a limit of telescopes. The universe itself was still too foggy to see through.",
    whatIsIt:
      "Neutral hydrogen gas that filled the early universe, scattering light until the first stars and galaxies ionized it clear.",
  },
  {
    id: "cmb",
    name: "The Cosmic Microwave Background",
    distanceLabel: "the edge of the observable universe",
    lookbackLabel: "13.8 billion years ago",
    lookbackYears: 13.8e9,
    anchor: "There is no anchor older than this. Before this moment, no light existed to see.",
    whatIsIt: "The afterglow of the Big Bang itself — released the instant the universe first became transparent to light.",
  },
];
