export const MODULE_ID = "ed4e-steps2foundry";

/**
 * @typedef { string } PlaceholderSentinel
 * A sentinel value representing a non-existent property value.
 */
export const PLACEHOLDER_SENTINELS = new Set( [
  "",
  "-",
  "&nbsp;",
  "Empty",
] );

/**
 * The official sources of the Second Step character sheets.
 * @type {string[]}
 */
const SECOND_STEP_EXPORT_SOURCES_OFFICIAL = [
  "ED4",
  "ElvenNations",
  "Travar",
  "Questors",
  "MysticPaths",
  "Iopos",
  "LegendsOfBarsaive",
  "Vasgothia",
  "GrandBazaar",
  "MagicDeeperSecrets",
];

/**
 * The unofficial sources of the Second Step character sheets.
 * @type {string[]}
 */
const SECOND_STEP_EXPORT_SOURCES_UNOFFICIAL = [
  "DaughteroftheForest",
  "Infected",
  "MistsofBetrayal",
  "ED2",
  "Sebastian",
  "LarsGottlieb",
  "InsaniacsItemImports",
  "ChristopherWoldridge",
  "BTL",
  "SkunkD",
  "JoelFowler",
  "CoryGilman",
  "StephenAtkins",
  "Ranson",
  "MatthewHoltz",
  "TheKerrins",
  "Westmarches",
  "Manu",
  "dariko74",
  "Zirnike",
  "Fable",
];

/**
 * The available sources of the Second Step character sheets.
 * @type {Readonly<{all: string[], official: string[], unofficial: string[]}>}
 */
export const SECOND_STEP_EXPORT_SOURCES = Object.freeze( {
  all: [
    ...SECOND_STEP_EXPORT_SOURCES_OFFICIAL,
    ...SECOND_STEP_EXPORT_SOURCES_UNOFFICIAL,
  ],
  official: SECOND_STEP_EXPORT_SOURCES_OFFICIAL,
  unofficial: SECOND_STEP_EXPORT_SOURCES_UNOFFICIAL,
} );

/**
 * @typedef { string } SecondStepExportSourceTag
 * An option tag describing the available sources for entities in the character sheet.
 */
export const SECOND_STEP_EXPORT_SOURCE_TAG = new Set( [
  "All",
  "Unofficial",
  "Official",
  ...SECOND_STEP_EXPORT_SOURCES.all,
] );

/**
 * @typedef { string } AttributeAbbreviation
 * An abbreviation for an attribute.
 */
export const ATTRIBUTE_ABBREVIATION = new Set( [
  "dex",
  "str",
  "tou",
  "per",
  "wil",
  "cha",
] );

/**
 * @typedef { string } QuestorDevotionTier
 * A tier of a questor devotion.
 */
export const QUESTOR_DEVOTION_TIER = new Set( [
  "follower",
  "adherent",
  "exemplar",
] );