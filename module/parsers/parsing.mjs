/**
 * @import * from "../_types.mjs";
 */

import { lowerCaseFirstLetter } from "../utils/string.mjs";
import { normalizeEnumToken, normalizeSentinel } from "./normalizers.mjs";
import { SecondStepFormatError } from "./errors.mjs";
import { SECOND_STEP_ID_PREFIX, SECOND_STEP_THREAD_TO_EAE_TARGET } from "../constants/constants.mjs";


// region Helper Functions

/**
 * Converts the given value to a number. If the conversion fails or the value is null,
 * it returns the provided fallback value.
 *
 * @param {any} value - The value to be converted to a number.
 * @param {number} [fallback=-1] - The fallback value to return if conversion is not possible.
 * @returns {number} The converted number or the fallback value.
 */
function toNumber( value, fallback = -1 ) {
  if ( value === null ) return fallback;
  const parsedNumber = Number( value );
  return Number.isNaN( parsedNumber ) ? fallback : parsedNumber;
}

/**
 * Converts the given value to a number unless it is `null` or `undefined`, in which case `undefined` is returned.
 * Unlike a plain truthiness check, this correctly preserves a legitimate `0` value.
 * @param {any} value - The value to be converted to a number.
 * @returns {number|undefined} The converted number, or `undefined` if the value is absent.
 */
function optionalNumber( value ) {
  return value == null ? undefined : toNumber( value );
}

/**
 * Tries to parse the given value according to the allowed options in {@link BooleanValue}. If the parsing fails,
 * an error is thrown.
 * @param {any} value
 * @returns {boolean} The parsed boolean value.
 * @throws {Error} If the value is not a valid boolean string.
 */
function parseBoolean( value ) {
  if ( typeof value === "boolean" ) return value;

  if ( typeof value === "string" ) {
    switch ( value.trim().toLowerCase() ) {
      case "true":
      case "yes":
        return true;
      case "false":
      case "no":
        return false;
    }
  }

  throw new Error( "Invalid boolean value" );
}

/**
 * Maps a given attribute name to its corresponding abbreviation.
 *
 * @param {string} attribute - The attribute name to map. Must be a non-empty string.
 * @returns {string|undefined} The abbreviation of the attribute if it exists, or undefined if no mapping is found.
 * @throws {Error} If the input is not a non-empty string.
 */
function mapAttributeToAbbreviation( attribute ) {
  if ( ( typeof attribute ) !== "string" || !attribute.length )
    throw new Error( "attribute must be a non-empty string" );

  return {
    "dexterity":  "dex",
    "strength":   "str",
    "toughness":  "tou",
    "perception": "per",
    "willpower":  "wil",
    "charisma":   "cha",
  }[ attribute.toLowerCase() ];
}

/**
 * Split a SecondStep ID into its source tag and the remaining canonical key.
 * Every ID is prefixed with whichever book/source cataloged it, either the official content with "ED4E" or
 * a community source from `Options.Books`, e.g. "Panda" or "Manu".
 * @param {string} id The SecondStep ID to split.
 * @param {SecondStepIdPrefix[]} [sourceTokens] Candidate prefixes. Defaults to all available.
 * @returns {ParsedIdSource}
 */
export function splitSourceId( id, sourceTokens ) {
  if ( !sourceTokens )
    sourceTokens = [ ...SECOND_STEP_ID_PREFIX ];
  // sort by token lengths so a token that happens to be a prefix on another doesn't win by accident
  const sortedSourceTokens = sourceTokens.toSorted(
    ( a, b ) => b.length - a.length
  );
  const match = sortedSourceTokens.find(
    token => id.startsWith( token )
  );

  return match
    ? { id: id.slice( match.length ), source: match, secondStepId: id, }
    : { id, source: null, secondStepId: id, };
}

// endregion

// region Parsing Data

/**
 * Camel-case every field in the `Basic` data of a SecondStep export and make sure "empty-ish" fields are `null`.
 * @param {SecondStepExportBasics} basic The `Basic` data of the SecondStep export.
 * @returns {ParsedBasics} The normalized basic data.
 */
function parseBasic( basic ) {
  const parsedBasic = {};
  for ( const [ key, value ] of Object.entries( basic ) ) {
    parsedBasic[ lowerCaseFirstLetter( key ) ] = normalizeSentinel( value );
  }
  return parsedBasic;
}

/**
 * Accepts only valid HTTP and HTTPS URLs.
 * @param {string} url The URL to normalize.
 * @returns {string|null} The normalized URL, or `null` if the URL is invalid.
 */
function parsePortraitUrl( url ) {
  try {
    const parsed = new URL( url );
    if ( parsed.protocol === "http:" || parsed.protocol === "https:" ) {
      return url;
    }
    return null;
  } catch ( e ) {
    return null;
  }
}

/**
 * Camel-case every field in the `Attributes` data of a SecondStep export and convert the `Buildpoints` and `Increases` values to numbers.
 * @param {SecondStepExportAttributes} attributes The `Attributes` data of the SecondStep export.
 * @returns {ParsedAttributes} The normalized attributes data.
 */
function parseAttributes( attributes ) {
  const parsedAttributes = {};
  for ( const [ key, value ] of Object.entries( attributes ) ) {
    parsedAttributes[ lowerCaseFirstLetter( key ) ] = {
      buildPoints: toNumber( value.Buildpoints ),
      increases:   toNumber( value.Increases ),
    };
  }
  return parsedAttributes;
}

/**
 * Parse a single discipline from a SecondStep export.
 * @param {SecondStepExportDiscipline} discipline
 * @returns {ParsedDiscipline}
 */
function parseDiscipline( discipline ) {
  return {
    id:                    splitSourceId( discipline.ID ),
    circle:                toNumber( discipline.Circle ),
    order:                 toNumber( discipline.Order ),
    startedAt:             toNumber( discipline.StartedAt ),
    optionalTalentsChosen: discipline.OptionalTalentsChosen.map( talent => parseOptionalTalent( talent ) ),
  };
}

/**
 * Parse an optional talent from the discipline data.
 * @param {SecondStepExportDisciplineOptionalTalentData} talent One of the `OptionalTalentsChosen` of the SecondStep export.
 * @returns {ParsedOptionalTalent}
 */
function parseOptionalTalent( talent ) {
  return {
    id:     splitSourceId( talent.ID ),
    circle: toNumber( talent.Circle ),
  };
}

/**
 * Parses provided talent rank data.
 * @param {SecondStepExportTalentRank} rank
 * @returns {ParsedTalentRank} The parsed talent rank data.
 */
function parseTalentRank( rank ) {
  return {
    rank:   toNumber( rank.Rank ),
    lpCost: toNumber( rank.Cost ),
  };
}

/**
 * Parses provided talent data.
 * @param {SecondStepExportTalent} talent One of the `Talent` data of the SecondStep export.
 * @returns {ParsedTalent} The parsed talent data.
 */
function parseTalent( talent ) {
  return {
    id:         splitSourceId( talent.ID ),
    order:      toNumber( talent.Order ),
    rank:       toNumber( talent.Rank ),
    freeRanks:  toNumber( talent.Freerank ),
    source:     talent.CurrentSource ? splitSourceId( talent.CurrentSource ) : null,
    type:       normalizeEnumToken( talent.Type ),
    lpCostTier: toNumber( talent.CurrentCost ),
    ranks:      talent.Ranks.map( rank => parseTalentRank( rank ) ),
    uid:        talent.UID ?? null,
    lpCost:     toNumber( talent.Cost ),
    spell:      talent.Spell ? splitSourceId( talent.Spell ) : undefined,
    path:       talent.PathID ? splitSourceId( talent.PathID ) : undefined,
    pathRank:   talent.PathRank !== null ? toNumber( talent.PathRank ) : undefined,
    bonusRank:  talent.BonusRank !== null ? toNumber( talent.BonusRank ) : undefined,
  };
}

/**
 * Parses provided knack data.
 * @param {SecondStepExportKnack} knack
 * @returns {ParsedKnack}
 */
function parseKnack( knack ) {
  return {
    id:        splitSourceId( knack.ID ),
    attribute: mapAttributeToAbbreviation( knack.Attribute ),
  };
}

/**
 * Parses provided skill data.
 * @param {SecondStepExportSkill} skill The skill data to be parsed.
 * @returns {ParsedSkill} The parsed skill data.
 */
function parseSkill( skill ) {
  return {
    id:        splitSourceId( skill.ID ),
    rank:      toNumber( skill.Rank ),
    freeRanks: toNumber( skill.Freerank ),
    category:  normalizeEnumToken( skill.Category ),
    uid:       skill.UID,
    attribute: mapAttributeToAbbreviation( skill.Attribute ) ?? null,
    name:      skill.Name ?? null,
  };
}

/**
 * Parses provided devotion data.
 * @param {SecondStepExportDevotion} devotion
 * @returns {ParsedDevotion}
 */
function parseDevotion( devotion ) {
  return {
    id:   splitSourceId( devotion.devotionID ),
    rank: toNumber( devotion.devotionRank ),
    tier: normalizeEnumToken( devotion.Cost ),
  };
}

/**
 * Parses provided questor data.
 * @param {SecondStepExportQuestor} questor
 * @returns {ParsedQuestor}
 */
function parseQuestor( questor ) {
  return {
    passionId:           splitSourceId( questor.Doctrine ),
    devotions:           ( questor.Ranks ?? [] ).map( devotion => parseDevotion( devotion ) ),
    rank:                toNumber( questor.Rank ),
    devotionPoints:      toNumber( questor.devotionPoints ),
    questorDevotionStep: toNumber( questor.questorDevotionStep ),
  };
}

/**
 * Parses provided spell data.
 * @param {SecondStepExportSpell} spell The spell data to be parsed.
 * @returns {ParsedSpell} The parsed spell data.
 */
function parseSpell( spell ) {
  return {
    id:    splitSourceId( spell.ID ),
    index: toNumber( spell.Index ),
  };
}

/**
 * Parses provided equipment data.
 * @param {SecondStepExportEquipment} equipment The equipment data to be parsed.
 * @returns {ParsedEquipment} The parsed equipment data.
 */
function parseEquipment( equipment ) {
  return {
    id:                  splitSourceId( equipment.ID ),
    amount:              toNumber( equipment.Count ),
    inUse:               parseBoolean( equipment.InUse ),
    type:                normalizeEnumToken( equipment.Type ),
    damageStep:          optionalNumber( equipment.DamageStep ),
    timesForgedPhysical: optionalNumber( equipment.PhForge ),
    timesForgedMystical: optionalNumber( equipment.MyForge ),
    timesForged:         optionalNumber( equipment.Forged ),
    rank:                optionalNumber( equipment.Rank ),
    lpCost:              optionalNumber( equipment.Cost ),
  };
}

/**
 * Parse provided path data.
 * @param {SecondStepExportPath} path The path data to be parsed.
 * @returns {ParsedPath} The parsed path data.
 */
function parsePath( path ) {
  return {
    id:             splitSourceId( path.ID ),
    rank:           toNumber( path.Rank ),
    linked:         splitSourceId( path.Linked ),
    grantedTalents: ( path.GrantedTalents ?? [] ).map( talentId => splitSourceId( talentId ) ),
  };
}

/**
 * Parse provided thread target data.
 * @param {string} target
 * @returns {MappedSecondStepThreadTarget}
 */
function parseThreadTarget( target ) {
  if ( !target ) {
    console.debug( "Empty target: ", target );
    return undefined;
  }
  return Object.hasOwn( SECOND_STEP_THREAD_TO_EAE_TARGET, target )
    ? SECOND_STEP_THREAD_TO_EAE_TARGET[ target ]
    : splitSourceId( target );
}

/**
 * Parse provided thread data.
 * @param {SecondStepExportThread} thread
 * @returns {ParsedThread}
 */
function parseThread( thread ) {
  return {
    rank:   toNumber( thread.Rank ),
    target: parseThreadTarget( thread.Target ),
  };
}

/**
 * Parse provided magic data.
 * @param {SecondStepExportMagic} magic The magic data to be parsed.
 * @returns {ParsedMagic} The parsed magic data.
 */
function parseMagic( magic ) {
  return {
    id:      splitSourceId( magic.ID ),
    threads: magic.Threads?.map( thread => parseThread( thread ) ) ?? [],
    target:  parseThreadTarget( magic.Target ),
    active:  parseBoolean( magic.Applicable ),
  };
}

/**
 * Parse provided effect data.
 * @param {SecondStepExportEffectUIData} effect
 * @returns {ParsedEffect}
 */
function parseEffect( effect ) {
  return {
    id:       splitSourceId( effect.ID ),
    active:   parseBoolean( effect.Active ),
    lp:       optionalNumber( effect.LP ),
    extra:    toNumber( effect.Extra ),
    source:   normalizeEnumToken( effect.Source ),
    category: normalizeEnumToken( effect.Category ),
  };
}

/**
 * Parse provided effect modifier data.
 * @param {SecondStepExportEffectModifier} modifier
 * @returns {ParsedEffectModifier}
 */
function parseEffectModifier( modifier ) {
  return {
    category:     normalizeEnumToken( modifier.Category ),
    id:           modifier.ID,
    modifier:     toNumber( modifier.Modifier, undefined ) ?? modifier.Modifier,
    multipliable: parseBoolean( modifier.IsMultipliable ),
    raisable:     parseBoolean( modifier.IsRaisable ),
  };
}

/**
 * Parse provided homebrew effect data.
 * @param {SecondStepExportEffect} effect
 * @return {ParsedHomebrewEffect}
 */
function parseHomebrewEffect( effect ) {
  return {
    id:          splitSourceId( effect.ID ),
    name:        normalizeSentinel( effect.Name ),
    description: normalizeSentinel( effect.Description ),
    duration:    normalizeEnumToken( effect.Duration ),
    category:    normalizeEnumToken( effect.Category ),
    modifiers:   ( effect.Modifiers ?? [] ).map( modifier => parseEffectModifier( modifier ) ),
  };
}

// endregion

// region Secon Step Parser

/**
 *
 * @param {SecondStepExport} raw
 * @returns {ParsedExportData}
 */
export function parseSecondStepExport( raw ) {
  if ( !Object.hasOwn( raw, "StepsVersion" ) )
    throw new SecondStepFormatError( "Invalid SecondStep export" );

  const edition = raw.Options?.Edition ?? "";

  return {
    meta: {
      stepsVersion:    raw.StepsVersion,
      edition,
      language:        raw.Language,
      attributePoints: toNumber( raw.attributePoints ),
      options:         raw.Options,
    },
    basics:          parseBasic( raw.Basic ),
    portraitUrl:     parsePortraitUrl( raw.PortraitURL ),
    namegiver:       splitSourceId( raw.Race ),
    attributes:      parseAttributes( raw.Attributes ),
    disciplines:     ( raw.Disciplines ?? [] ).map( discipline => parseDiscipline( discipline ) ),
    paths:           ( raw.Paths ?? [] ).map( path => parsePath( path ) ),
    questor:         raw.Questor ? parseQuestor( raw.Questor ) : null,
    talents:         raw.Talents.map( talent => parseTalent( talent ) ),
    knacks:          raw.Knacks.map( knack => parseKnack( knack ) ),
    skills:          raw.Skills.map( skill => parseSkill( skill ) ),
    spells:          raw.Spells.map( spell => parseSpell( spell ) ),
    equipment:       raw.Equipment.map( equipment => parseEquipment( equipment ) ),
    magic:           ( raw.Magic ?? [] ).map( magic => parseMagic( magic ) ),
    effects:         ( raw.Effects ?? [] ).map( effect => parseEffect( effect ) ),
    homebrewEffects: ( raw.Homebrew?.Effects ?? [] ).map( effect => parseHomebrewEffect( effect ) ),
    damage:          toNumber( raw.Damage ),
    wounds:          toNumber( raw.Wounds ),
    legendPoints:    toNumber( raw.LegendPoints ),
  };
}

// endregion