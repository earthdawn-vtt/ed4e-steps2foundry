/**
 * @import { ParsedQuestor } from "../_types.mjs";
 * @import { ResolvedItem } from "../resolvers/item-resolver.mjs";
 */

/**
 * @typedef AdaptedQuestor
 * @property {ResolvedItem} resolved - The resolved questor item, with `system.level` applied.
 * @property {string} secondStepId - The SecondStep ID (the passion/doctrine) this questor was resolved from.
 */

/**
 * @typedef AdaptedQuestorDevotion
 * @property {ResolvedItem} resolved - The resolved questor devotion item.
 * @property {string} secondStepId - The SecondStep ID (the passion/doctrine) this questor devotion was resolved from.
 */

import { resolveItem } from "../resolvers/item-resolver.mjs";

/**
 * @typedef AdaptedQuestorResult
 * @property {AdaptedQuestor} questor - The adapted questor item.
 * @property {AdaptedQuestorDevotion} devotion - The synthesized questor devotion item.
 */

const DEVOTION_ITEM_TYPE = "devotion";
const DEFAULT_QUESTOR_DEVOTION_IMG = "icons/svg/angel.svg";

/**
 * Builds a minimal questor item data object to use as the last-resort fallback if the questor cannot be resolved
 * via lookup tables or edid.
 * @param {ParsedQuestor} questor - The parsed questor to synthesize a fallback for.
 * @returns {object} The synthesized questor item data.
 */
function synthesizeQuestor( questor ) {
  return {
    name:   questor.passionId.id,
    type:   "questor",
    img:    DEFAULT_QUESTOR_DEVOTION_IMG,
    system: {},
  };
}

/**
 * Builds the last-resort fallback data for the questor devotion, used only if the dedicated per-passion lookup in
 * {@link adaptQuestor} found neither a UUID nor an edid match.
 * @param {ParsedQuestor} questor - The parsed questor data.
 * @returns {object} The questor devotion item data to use.
 */
function synthesizeQuestorDevotion( questor ) {
  return {
    name:   questor.passionId.id || _loc( "S2F.Synthesized.Name.questorDevotion" ),
    type:   DEVOTION_ITEM_TYPE,
    img:    DEFAULT_QUESTOR_DEVOTION_IMG,
    system: {
      edid:  game.settings.get( ED4E_CONSTANTS.SYSTEM_ID, "edidQuestorDevotion" ),
      level: questor.rank,
      tier:  "journeyman",
    },
  };
}

/**
 * Adapts the parsed questor data into Foundry item data: resolves the questor item itself, and the questor devotion
 * it implies. Both ar keyed by {@link SecondStepExportQuestor#Doctrine}, since the questor devotion is not explicitly
 * exported by Second Step.
 *
 * The questor devotion is resolved via the devotion lookup table, and as the last resort fallback synthesized if a
 * generic questor devotion could not be found (see {@link synthesizeQuestorDevotion}).
 * @param {ParsedQuestor} questor - The parsed questor data from {@link parseSecondStepExport}.
 * @returns {Promise<AdaptedQuestorResult>} The adapted questor and questor devotion items.
 */
export async function adaptQuestor( questor ) {
  const resolvedQuestor = await resolveItem(
    questor.passionId,
    "questor",
    () => synthesizeQuestor( questor ),
  );
  resolvedQuestor.data.system.level = questor.rank;

  const resolvedDevotion = await resolveItem(
    questor.passionId,
    DEVOTION_ITEM_TYPE,
    () => synthesizeQuestorDevotion( questor ),
  );
  resolvedDevotion.data.system.level = questor.rank;

  return {
    questor:  { resolved: resolvedQuestor, secondStepId: questor.passionId.secondStepId, },
    devotion: { resolved: resolvedDevotion, secondStepId: questor.passionId.secondStepId, },
  };
}
