export const MODULE_ID = "ed4e-steps2foundry";

/**
 * @typedef { string } PlaceholderSentinel
 * A sentinel value representing a non-existent property value.
 */
export const PLACEHOLDER_SENTINELS = Object.freeze( [
  "",
  "-",
  "&nbsp;",
  "Empty",
] );

/**
 * @typedef { string } AttributeAbbreviation
 * An abbreviation for an attribute.
 */
export const ATTRIBUTE_ABBREVIATION = Object.freeze( [
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
export const QUESTOR_DEVOTION_TIER = Object.freeze( [
  "follower",
  "adherent",
  "exemplar",
] );

// region Second Step Sources

/**
 * The official sources of the Second Step character sheets.
 * @type {string[]}
 */
const SECOND_STEP_EXPORT_SOURCES_OFFICIAL = Object.freeze( [
  "ElvenNations",
  "Travar",
  "Questors",
  "MysticPaths",
  "Iopos",
  "LegendsOfBarsaive",
  "Vasgothia",
  "GrandBazaar",
  "MagicDeeperSecrets",
] );

/**
 * The unofficial sources of the Second Step character sheets.
 * @type {string[]}
 */
const SECOND_STEP_EXPORT_SOURCES_UNOFFICIAL = Object.freeze( [
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
] );

/**
 * The available sources of the Second Step character sheets.
 * @type {Readonly<{all: string[], official: string[], unofficial: string[]}>}
 */
export const SECOND_STEP_EXPORT_SOURCES = Object.freeze( {
  all: [
    ...SECOND_STEP_EXPORT_SOURCES_OFFICIAL,
    ...SECOND_STEP_EXPORT_SOURCES_UNOFFICIAL,
  ],
  official:   SECOND_STEP_EXPORT_SOURCES_OFFICIAL,
  unofficial: SECOND_STEP_EXPORT_SOURCES_UNOFFICIAL,
} );

/**
 * @typedef { string } SecondStepExportSourceTag
 * An option tag describing the available sources for entities in the character sheet.
 */
export const SECOND_STEP_EXPORT_SOURCE_TAG = Object.freeze( [
  "All",
  "Unofficial",
  "Official",
  ...SECOND_STEP_EXPORT_SOURCES.all,
] );

/**
 * @typedef { string } SecondStepIdPrefix
 * A prefix for Second Step entity IDs. All official content IDs start with eiter "ED4" or have no suffix, since
 * they are considered 'core'.
 */
export const SECOND_STEP_ID_PREFIX = Object.freeze( [
  "ED4",
  ...SECOND_STEP_EXPORT_SOURCES_UNOFFICIAL,
] );

// endregion

// region Mappings

/**
 * Mapping of Second Step thread targets to EAE actor change keys.
 * @satisfies {Readonly<Record<string, string | null>>}
 */
export const SECOND_STEP_THREAD_TO_EAE_TARGET = Object.freeze( {
  "empty": null,
  "phdef": "system.characteristics.defenses.physical.value",
  "mydef": "system.characteristics.defenses.mystical.value",
  "sodef": "system.characteristics.defenses.social.value",
  "wndth": "system.characteristics.health.woundThreshold",
  "myarm": "system.characteristics.armor.mystical.value",
  "dur":   "system.durabilityBonus",
} );

/**
 * Maps a SecondStep attribute buildpoint/increase cost to the resulting attribute modifier.
 * Mirrors ed4e's `legend.mjs` `attributePointsCost` array (cost-by-modifier), inverted to
 * modifier-by-cost since that is the direction SecondStep's `Buildpoints`/`Increases` fields go.
 * @satisfies {Readonly<Record<string, number>>}
 */
export const ATTRIBUTE_MODIFIER_FROM_COST = Object.freeze( {
  "-2": -2,
  "-1": -1,
  "0":  0,
  "1":  1,
  "2":  2,
  "3":  3,
  "5":  4,
  "7":  5,
  "9":  6,
  "12": 7,
  "15": 8,
} );

/**
 * All values in {@link SECOND_STEP_THREAD_TO_EAE_TARGET}.
 * @typedef { typeof SECOND_STEP_THREAD_TO_EAE_TARGET[keyof typeof SECOND_STEP_THREAD_TO_EAE_TARGET] } MappedSecondStepThreadTarget
 */

/**
 * Maps a normalized SecondStep talent type to ed4e's `talentCategory` enum:
 * - `pathTalent`/`pathGrantedTalent` → `"other"` (no dedicated group for path-related talents)
 * - `effectRaisable` → `"other"` (no dedicated group for talents from Active Effects)
 * @satisfies {Readonly<Record<string, string>>}
 */
export const TALENT_CATEGORY_FROM_SECOND_STEP_TYPE = Object.freeze( {
  discipline:        "discipline",
  optional:          "optional",
  free:              "free",
  pathTalent:        "other",
  pathGrantedTalent: "other",
  effectRaisable:    "other",
} );

// endregion