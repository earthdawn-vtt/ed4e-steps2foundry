/**
 * @import * from "../_types.mjs";
 * @import * from "../resolvers/item-resolver.mjs";
 */


/**
 * @typedef AdaptedEquipment
 * @property {ResolvedItem} resolved - The resolved item, with the item type appropriate data set.
 */

import { resolveItem } from "../resolvers/item-resolver.mjs";
import {
  DEFAULT_IMAGES,
  ED4E_SYSTEM_TYPES,
  EQUIPMENT_TYPE_FROM_SECOND_STEP_TYPE, IN_USE_ITEM_STATUS_BY_ITEM_TYPE,
  NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES,
  SECOND_STEP_COINAGE_IDS
} from "../constants/constants.mjs";

/**
 * Builds a minimal equipment item data object to use as the last-resort fallback if the equipment cannot be resolved
 * via the lookup tables or edid.
 * @param {ParsedEquipment} equipment - The parsed equipment to synthesize a fallback for.
 * @param {string} systemType - The ed4e system type of the equipment to synthesize.
 * @returns {object} The synthesized equipment item data.
 */
function synthesizeEquipment( equipment, systemType ) {
  return {
    name:   equipment.id.id,
    type:   systemType,
    img:    DEFAULT_IMAGES.Synthesized.equipment,
    system: {
      amount:     equipment.amount ?? 1,
      itemStatus: getItemStatus(
        systemType,
        equipment.inUse,
      ),
    },
  };
}

/**
 * Whether the parsed Second Step equipment counts as a coin.
 * @param {ParsedEquipment} equipment
 * @returns {boolean}
 */
function isCoin( equipment ) {
  return equipment.type === NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.valuable
    && Object.values( SECOND_STEP_COINAGE_IDS ).includes( equipment.id.id.toLowerCase() );
}

/**
 * Create an equipment representing the given coinage.
 * @param {ParsedEquipment} equipment
 * @returns {ResolvedItem}
 */
function buildCoin( equipment ) {
  const denomination = SECOND_STEP_COINAGE_IDS[ equipment.id?.id.toLowerCase() ];
  const data = {
    img:    "",
    name:   _loc( `S2F.Synthesized.Name.Coin.${ denomination }` ),
    system: {
      amount: equipment.amount,
      price:  {
        value: 1,
        denomination,
      },
    },
    type: ED4E_SYSTEM_TYPES.Item.equipment,
  };

  return {
    data,
    resolution:   "synthesized",
    secondStepId: equipment.id.secondStepId,
    itemType:     ED4E_SYSTEM_TYPES.Item.equipment,
  };
}

/**
 * Determine the item status for ed4e from the Second Step use status.
 * @param {string} itemType The system type of the item.
 * @param {boolean} inUse Whether the item is currently used, according to the parsed Second Step export.
 * @param {string} [wieldingType] The ed4e wielding type of the resolved item, if it is a weapon.
 * @returns {string} The appropriate item status for the type of equipment and use status.
 */
function getItemStatus( itemType, inUse, wieldingType ) {
  if ( !inUse ) return "carried";
  if ( itemType === ED4E_SYSTEM_TYPES.Item.weapon ) return wieldingType || "mainHand";
  return IN_USE_ITEM_STATUS_BY_ITEM_TYPE[ itemType ];
}

/**
 * Sets the forge bonuses in the resolved data based on the parsed data. Modifies `resolvedData` directly.
 * @param {object} resolvedData The {@link ResolvedItem#data} from the resolved equipment.
 * @param {string} itemType The system type of the equipment.
 * @param {ParsedEquipment} parsedEquipment The original parsed equipment.
 */
function applyForging( resolvedData, itemType, parsedEquipment ) {
  switch ( itemType ) {
    case ED4E_SYSTEM_TYPES.Item.armor: {
      const { system } = resolvedData;
      const physical = system.physical ??= {};
      const mystical= system.mystical ??= {};
      physical.forgeBonus = parsedEquipment.timesForgedPhysical ?? physical.forgeBonus;
      mystical.forgeBonus = parsedEquipment.timesForgedMystical ?? mystical.forgeBonus;
      break;
    }
    case ED4E_SYSTEM_TYPES.Item.weapon: {
      resolvedData.system.forgeBonus = parsedEquipment.timesForged ?? resolvedData.system.forgeBonus;
      break;
    }
  }
}

/**
 * Resolve every equipment from the parsed export into the different item types, excluding thread items.
 * @param {ParsedEquipment[]} equipments - The parsed equipment from {@link parseSecondStepExport}.
 * @returns {Promise<{ equipment: AdaptedEquipment[], threadItems: ParsedEquipment[] }>} The resolved equipment items,
 * and any thread items to be handled by the magic adapter later.
 */
export async function adaptEquipment( equipments ) {
  const realEquipments = [];
  const threadItems = [];
  for ( const equipment of equipments ) {
    if ( equipment.type === NORMALIZED_SECOND_STEP_EQUIPMENT_TYPES.threadItem ) {
      threadItems.push( equipment );
      continue;
    }
    realEquipments.push( equipment );
  }

  const adaptedEquipments = await Promise.all( realEquipments.map( async ( equipment ) => {
    if ( isCoin( equipment ) ) return { resolved: buildCoin( equipment ) };

    const systemType = EQUIPMENT_TYPE_FROM_SECOND_STEP_TYPE[ equipment.type ];
    const resolved = await resolveItem(
      equipment.id,
      systemType,
      () => synthesizeEquipment( equipment, systemType ),
    );

    resolved.data.system.amount = equipment.amount;
    resolved.data.system.itemStatus = getItemStatus(
      systemType,
      equipment.inUse,
      resolved.data.system?.wieldingType,
    );
    applyForging( resolved.data, systemType, equipment );

    return { resolved };
  } ), );

  return { equipment: adaptedEquipments, threadItems };
}