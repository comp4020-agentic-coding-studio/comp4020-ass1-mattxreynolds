export interface Waypoint {
  id: string;
  name: string;
  distanceLabel: string;
  lookbackLabel: string;
  lookbackYears: number;
  anchor: string;
  /**
   * Scroll progress (0-1) within the zoom track at which this waypoint
   * becomes the current HUD state. Undefined until the waypoint is wired
   * into the zoom engine — see PLAN.md build order.
   */
  from?: number;
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
    from: 0,
  },
  {
    id: "sun",
    name: "The Sun",
    distanceLabel: "149.6 million km away",
    lookbackLabel: "8.3 minutes ago",
    lookbackYears: (8.3 * 60) / (365.25 * 24 * 3600),
    anchor: "Long enough to boil an egg.",
    from: 0.055,
  },
  {
    id: "proxima-centauri",
    name: "Proxima Centauri",
    distanceLabel: "4.2 light-years away",
    lookbackLabel: "4.2 years ago",
    lookbackYears: 4.2,
    anchor: "About as long as a university degree.",
    from: 0.138,
  },
  {
    id: "vega",
    name: "Vega",
    distanceLabel: "25 light-years away",
    lookbackLabel: "25 years ago",
    lookbackYears: 25,
    anchor: "About a generation ago.",
    from: 0.22,
  },
  {
    id: "sagittarius-a",
    name: "The Milky Way's Core",
    distanceLabel: "26,000 light-years away",
    lookbackLabel: "26,000 years ago",
    lookbackYears: 26_000,
    anchor: "The last Ice Age. Woolly mammoths were still common.",
    from: 0.312,
  },
  {
    id: "andromeda",
    name: "The Andromeda Galaxy",
    distanceLabel: "2.5 million light-years away",
    lookbackLabel: "2.5 million years ago",
    lookbackYears: 2.5e6,
    anchor: "Around when our own genus, Homo, first appears in the fossil record.",
    from: 0.403,
  },
  {
    id: "virgo-cluster",
    name: "The Virgo Cluster",
    distanceLabel: "54 million light-years away",
    lookbackLabel: "54 million years ago",
    lookbackYears: 54e6,
    anchor: "Not long after the dinosaurs died out. Early primates were spreading.",
    from: 0.495,
  },
  {
    id: "3c273",
    name: "Quasar 3C 273",
    distanceLabel: "2.4 billion light-years away",
    lookbackLabel: "2.4 billion years ago",
    lookbackYears: 2.4e9,
    anchor: "Around when Earth's atmosphere first gained oxygen.",
    from: 0.587,
  },
  {
    id: "gn-z11",
    name: "GN-z11",
    distanceLabel: "13.4 billion light-years away",
    lookbackLabel: "13.4 billion years ago",
    lookbackYears: 13.4e9,
    anchor: "Before Earth existed at all.",
    from: 0.669,
  },
  {
    id: "jades-gs-z14-0",
    name: "JADES-GS-z14-0",
    distanceLabel: "13.5 billion light-years away",
    lookbackLabel: "13.5 billion years ago",
    lookbackYears: 13.5e9,
    anchor: "About 300 million years after the Big Bang — one of the first galaxies to ever form.",
    from: 0.752,
  },
  {
    id: "reionization-fog",
    name: "The Reionization Fog",
    distanceLabel: "past every galaxy any telescope could ever resolve",
    lookbackLabel: "~13.6 billion years ago",
    lookbackYears: 13.6e9,
    anchor: "Not a limit of telescopes. The universe itself was still too foggy to see through.",
    from: 0.843,
  },
  {
    id: "cmb",
    name: "The Cosmic Microwave Background",
    distanceLabel: "the edge of the observable universe",
    lookbackLabel: "13.8 billion years ago",
    lookbackYears: 13.8e9,
    anchor: "There is no anchor older than this. Before this moment, no light existed to see.",
    from: 0.942,
  },
];
