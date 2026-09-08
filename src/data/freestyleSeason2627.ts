export type FreestyleGender = "M" | "W" | "A";
export type FreestyleDisc =
  | "MO"
  | "DM"
  | "AE"
  | "AET"
  | "DMT"
  | "SX"
  | "SXT"
  | "HP"
  | "SS"
  | "BA";
export type FreestyleCat = "WC" | "WSC";

export type FreestylePlace =
  | "innsbruck"
  | "beijing"
  | "valthorens"
  | "secretgarden"
  | "breckenridge"
  | "ruka"
  | "arosa"
  | "innichen"
  | "copper"
  | "kreischberg"
  | "lacbeauport"
  | "laax"
  | "reiteralm"
  | "valstcome"
  | "lakeplacid"
  | "tignes"
  | "fassa"
  | "waterville"
  | "deervalley"
  | "veysonnaz"
  | "sarajevo"
  | "calgary"
  | "almaty"
  | "kopaonik"
  | "aspen"
  | "gallivare"
  | "shahdag"
  | "craigleith"
  | "silvaplana"
  | "montafon";

export type FreestyleRaceRow = [
  date: string,
  raceId: number,
  eventId: number,
  place: FreestylePlace,
  gender: FreestyleGender,
  disc: FreestyleDisc,
  cat: FreestyleCat,
];

export const FREESTYLE_RACES_2627: FreestyleRaceRow[] = [
  ["2026-11-27", 19701, 62853, "innsbruck", "M", "BA", "WC"],
  ["2026-11-27", 19548, 62853, "innsbruck", "W", "BA", "WC"],
  ["2026-12-05", 19554, 62854, "beijing", "M", "BA", "WC"],
  ["2026-12-05", 19553, 62854, "beijing", "W", "BA", "WC"],
  ["2026-12-10", 19528, 62830, "valthorens", "M", "SX", "WC"],
  ["2026-12-10", 19527, 62830, "valthorens", "W", "SX", "WC"],
  ["2026-12-11", 19530, 62830, "valthorens", "M", "SX", "WC"],
  ["2026-12-11", 19529, 62830, "valthorens", "W", "SX", "WC"],
  ["2026-12-12", 19702, 62855, "secretgarden", "M", "HP", "WC"],
  ["2026-12-12", 19557, 62855, "secretgarden", "W", "HP", "WC"],
  ["2026-12-12", 19561, 62856, "breckenridge", "M", "SS", "WC"],
  ["2026-12-12", 19560, 62856, "breckenridge", "W", "SS", "WC"],
  ["2026-12-12", 19478, 62792, "ruka", "M", "MO", "WC"],
  ["2026-12-12", 19477, 62792, "ruka", "W", "MO", "WC"],
  ["2026-12-15", 19534, 62831, "arosa", "M", "SX", "WC"],
  ["2026-12-15", 19533, 62831, "arosa", "W", "SX", "WC"],
  ["2026-12-19", 19541, 62833, "innichen", "M", "SX", "WC"],
  ["2026-12-19", 19540, 62833, "innichen", "W", "SX", "WC"],
  ["2026-12-20", 19543, 62833, "innichen", "M", "SX", "WC"],
  ["2026-12-20", 19542, 62833, "innichen", "W", "SX", "WC"],
  ["2026-12-20", 19565, 62857, "copper", "M", "HP", "WC"],
  ["2026-12-20", 19564, 62857, "copper", "W", "HP", "WC"],
  ["2027-01-08", 19568, 62858, "kreischberg", "M", "BA", "WC"],
  ["2027-01-08", 19569, 62858, "kreischberg", "W", "BA", "WC"],
  ["2027-01-09", 19483, 62794, "lacbeauport", "M", "AE", "WC"],
  ["2027-01-09", 19482, 62794, "lacbeauport", "W", "AE", "WC"],
  ["2027-01-10", 19484, 62794, "lacbeauport", "A", "AET", "WC"],
  ["2027-01-15", 19573, 62859, "laax", "M", "SS", "WC"],
  ["2027-01-15", 19572, 62859, "laax", "W", "SS", "WC"],
  ["2027-01-16", 19612, 62880, "reiteralm", "M", "SX", "WC"],
  ["2027-01-16", 19611, 62880, "reiteralm", "W", "SX", "WC"],
  ["2027-01-17", 19614, 62880, "reiteralm", "M", "SX", "WC"],
  ["2027-01-17", 19613, 62880, "reiteralm", "W", "SX", "WC"],
  ["2027-01-15", 19492, 62803, "valstcome", "M", "MO", "WC"],
  ["2027-01-15", 19491, 62803, "valstcome", "W", "MO", "WC"],
  ["2027-01-16", 19598, 62803, "valstcome", "M", "DM", "WC"],
  ["2027-01-16", 19493, 62803, "valstcome", "W", "DM", "WC"],
  ["2027-01-16", 19495, 62804, "lakeplacid", "M", "AE", "WC"],
  ["2027-01-16", 19494, 62804, "lakeplacid", "W", "AE", "WC"],
  ["2027-01-17", 19908, 62804, "lakeplacid", "A", "AET", "WC"],
  ["2027-01-21", 19577, 62860, "tignes", "M", "BA", "WC"],
  ["2027-01-21", 19576, 62860, "tignes", "W", "BA", "WC"],
  ["2027-01-22", 19620, 62881, "fassa", "M", "SX", "WC"],
  ["2027-01-22", 19619, 62881, "fassa", "W", "SX", "WC"],
  ["2027-01-23", 19622, 62881, "fassa", "M", "SX", "WC"],
  ["2027-01-23", 19621, 62881, "fassa", "W", "SX", "WC"],
  ["2027-01-22", 19498, 62805, "waterville", "M", "MO", "WC"],
  ["2027-01-22", 19497, 62805, "waterville", "W", "MO", "WC"],
  ["2027-01-23", 19500, 62805, "waterville", "M", "DM", "WC"],
  ["2027-01-23", 19499, 62805, "waterville", "W", "DM", "WC"],
  ["2027-01-28", 19502, 62806, "deervalley", "M", "MO", "WC"],
  ["2027-01-28", 19501, 62806, "deervalley", "W", "MO", "WC"],
  ["2027-01-29", 19506, 62806, "deervalley", "M", "AE", "WC"],
  ["2027-01-29", 19503, 62806, "deervalley", "W", "AE", "WC"],
  ["2027-01-30", 19505, 62806, "deervalley", "M", "DM", "WC"],
  ["2027-01-30", 19504, 62806, "deervalley", "W", "DM", "WC"],
  ["2027-01-30", 19628, 62882, "veysonnaz", "M", "SX", "WC"],
  ["2027-01-30", 19627, 62882, "veysonnaz", "W", "SX", "WC"],
  ["2027-01-31", 19630, 62882, "veysonnaz", "M", "SX", "WC"],
  ["2027-01-31", 19629, 62882, "veysonnaz", "W", "SX", "WC"],
  ["2027-02-04", 19480, 62793, "secretgarden", "M", "AE", "WC"],
  ["2027-02-04", 19479, 62793, "secretgarden", "W", "AE", "WC"],
  ["2027-02-05", 19481, 62793, "secretgarden", "A", "AET", "WC"],
  ["2027-02-06", 19636, 62883, "sarajevo", "M", "SX", "WC"],
  ["2027-02-06", 19635, 62883, "sarajevo", "W", "SX", "WC"],
  ["2027-02-07", 19638, 62883, "sarajevo", "M", "SX", "WC"],
  ["2027-02-07", 19637, 62883, "sarajevo", "W", "SX", "WC"],
  ["2027-02-18", 19581, 62861, "calgary", "M", "HP", "WC"],
  ["2027-02-18", 19580, 62861, "calgary", "W", "HP", "WC"],
  ["2027-02-19", 19508, 62807, "almaty", "M", "MO", "WC"],
  ["2027-02-19", 19507, 62807, "almaty", "W", "MO", "WC"],
  ["2027-02-20", 19510, 62807, "almaty", "M", "DM", "WC"],
  ["2027-02-20", 19509, 62807, "almaty", "W", "DM", "WC"],
  ["2027-02-21", 19512, 62807, "almaty", "M", "AE", "WC"],
  ["2027-02-21", 19511, 62807, "almaty", "W", "AE", "WC"],
  ["2027-02-26", 19668, 62887, "kopaonik", "M", "SX", "WC"],
  ["2027-02-26", 19667, 62887, "kopaonik", "W", "SX", "WC"],
  ["2027-02-27", 19670, 62887, "kopaonik", "M", "SX", "WC"],
  ["2027-02-27", 19669, 62887, "kopaonik", "W", "SX", "WC"],
  ["2027-02-27", 19589, 62862, "aspen", "M", "SS", "WC"],
  ["2027-02-27", 19588, 62862, "aspen", "W", "SS", "WC"],
  ["2027-02-28", 19587, 62862, "aspen", "M", "HP", "WC"],
  ["2027-02-28", 19586, 62862, "aspen", "W", "HP", "WC"],
  ["2027-03-05", 19652, 62885, "gallivare", "M", "SX", "WC"],
  ["2027-03-05", 19651, 62885, "gallivare", "W", "SX", "WC"],
  ["2027-03-06", 19654, 62885, "gallivare", "M", "SX", "WC"],
  ["2027-03-06", 19653, 62885, "gallivare", "W", "SX", "WC"],
  ["2027-03-05", 19604, 62878, "shahdag", "M", "AE", "WC"],
  ["2027-03-05", 19603, 62878, "shahdag", "W", "AE", "WC"],
  ["2027-03-06", 19600, 62878, "shahdag", "M", "MO", "WC"],
  ["2027-03-06", 19599, 62878, "shahdag", "W", "MO", "WC"],
  ["2027-03-07", 19602, 62878, "shahdag", "M", "DM", "WC"],
  ["2027-03-07", 19601, 62878, "shahdag", "W", "DM", "WC"],
  ["2027-03-20", 19676, 62888, "craigleith", "M", "SX", "WC"],
  ["2027-03-20", 19675, 62888, "craigleith", "W", "SX", "WC"],
  ["2027-03-21", 19678, 62888, "craigleith", "M", "SX", "WC"],
  ["2027-03-21", 19677, 62888, "craigleith", "W", "SX", "WC"],
  ["2027-04-03", 19595, 62863, "silvaplana", "M", "SS", "WC"],
  ["2027-04-03", 19594, 62863, "silvaplana", "W", "SS", "WC"],
  ["2027-04-04", 19597, 62863, "silvaplana", "M", "HP", "WC"],
  ["2027-04-04", 19596, 62863, "silvaplana", "W", "HP", "WC"],
  ["2027-03-09", 19706, 63000, "montafon", "M", "HP", "WSC"],
  ["2027-03-09", 19705, 63000, "montafon", "W", "HP", "WSC"],
  ["2027-03-13", 19723, 63000, "montafon", "M", "MO", "WSC"],
  ["2027-03-13", 19718, 63000, "montafon", "M", "SX", "WSC"],
  ["2027-03-13", 19710, 63000, "montafon", "M", "BA", "WSC"],
  ["2027-03-13", 19722, 63000, "montafon", "W", "MO", "WSC"],
  ["2027-03-13", 19717, 63000, "montafon", "W", "SX", "WSC"],
  ["2027-03-13", 19709, 63000, "montafon", "W", "BA", "WSC"],
  ["2027-03-14", 19719, 63000, "montafon", "A", "SXT", "WSC"],
  ["2027-03-15", 19725, 63000, "montafon", "M", "DM", "WSC"],
  ["2027-03-15", 19724, 63000, "montafon", "W", "DM", "WSC"],
  ["2027-03-16", 19726, 63000, "montafon", "A", "DMT", "WSC"],
  ["2027-03-19", 19730, 63000, "montafon", "M", "AE", "WSC"],
  ["2027-03-19", 19729, 63000, "montafon", "W", "AE", "WSC"],
  ["2027-03-20", 19731, 63000, "montafon", "A", "AET", "WSC"],
  ["2027-03-20", 19714, 63000, "montafon", "M", "SS", "WSC"],
  ["2027-03-20", 19713, 63000, "montafon", "W", "SS", "WSC"],
];
