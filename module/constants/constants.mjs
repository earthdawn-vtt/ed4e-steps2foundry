/**
 * @import * from "../_types.mjs";
 */

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

// region ed4e System

export const ED4E_SYSTEM_TYPES = Object.freeze( {
  Item: Object.freeze( {
    armor:     "armor",
    equipment: "equipment",
    shield:    "shield",
    talent:    "talent",
    weapon:    "weapon",
  } ),
} );


// endregion

// region Second Step

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

// region Second Step Types

/**
 * The types of equipments in a Second Step Export, normalized to parsed types.
 * @type {Readonly<Record<string, NormalizedEquipmentType>>}
 */
export const NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES = Object.freeze( {
  accommodation:    "accomodation",
  adventuring:      "adventuring",
  armor:            "armor",
  bloodCharm:       "bloodCharm",
  bloodInk:         "bloodInk",
  clothing:         "clothing",
  healingAidPotion: "healingAidPotion",
  healingAid:       "healingAid",
  magic:            "magic",
  meleeWeapon:      "meleeWeapon",
  missileWeapon:    "missileWeapon",
  missile:          "missile",
  mount:            "mount",
  provender:        "provender",
  runeTattoo:       "runeTattoo",
  shield:           "shield",
  threadItem:       "threadItem",
  thrown:           "thrown",
  tradeServices:    "tradeServices",
  transport:        "transport",
  valuable:         "valuable",
} );

// endregion

// region Second Step IDs

/**
 * The IDs of coinage in Second Step.
 * @type {Readonly<{copper: string, gold: string, silver: string}>}
 */
export const SECOND_STEP_COINAGE_IDS = Object.freeze( {
  copper: "copper",
  gold:   "gold",
  silver: "silver",
} );

// endregion

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

/**
 * Maps a normalized SecondStep equipment type to an item system type in ed4e.
 * @satisfies {Readonly<Record<string, ED4E_SYSTEM_TYPES>>}
 */
export const EQUIPMENT_TYPE_FROM_SECOND_STEP_TYPE = Object.freeze( {
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.accommodation ]:    ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.adventuring ]:      ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.armor ]:            ED4E_SYSTEM_TYPES.Item.armor,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.bloodCharm ]:       ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.bloodInk ]:         ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.clothing ]:         ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.healingAidPotion ]: ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.healingAid ]:       ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.magic ]:            ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.meleeWeapon ]:      ED4E_SYSTEM_TYPES.Item.weapon,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.missileWeapon ]:    ED4E_SYSTEM_TYPES.Item.weapon,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.missile ]:          ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.mount ]:            ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.provender ]:        ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.runeTattoo ]:       ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.shield ]:           ED4E_SYSTEM_TYPES.Item.shield,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.threadItem ]:       ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.thrown ]:           ED4E_SYSTEM_TYPES.Item.weapon,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.tradeServices ]:    ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.transport ]:        ED4E_SYSTEM_TYPES.Item.equipment,
  [ NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.valuable ]:         ED4E_SYSTEM_TYPES.Item.equipment,
} );

const ED4E_ITEM_STATUS_EQUIPPED = "equipped";

/**
 * Maps a SecondStep item that is `inUse` to the `ed4e` `itemStatus`.
 * Weapons are left out since they use their own mapping because of their `wieldingType`.
 * @satisfies {Readonly<Record<ED4E_SYSTEM_TYPES, ED4E_ITEM_STATUS_EQUIPPED>>}
 */
export const IN_USE_ITEM_STATUS_BY_ITEM_TYPE = Object.freeze( {
  [ ED4E_SYSTEM_TYPES.Item.armor ]:     ED4E_ITEM_STATUS_EQUIPPED,
  [ ED4E_SYSTEM_TYPES.Item.equipment ]: ED4E_ITEM_STATUS_EQUIPPED,
  [ ED4E_SYSTEM_TYPES.Item.shield ]:    ED4E_ITEM_STATUS_EQUIPPED,
} );

// endregion

// region Document Creation

// region Default Images

export const DEFAULT_IMAGES = {
  Synthesized: {
    coin:      "icons/commodities/currency/coins-assorted-mix-silver.webp",
    equipment: "icons/containers/bags/sack-canvas-grey.webp",
    talent:    "icons/svg/book.svg",
  },
};

// endregion

// endregion
