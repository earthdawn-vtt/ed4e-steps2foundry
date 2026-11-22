/**
 * Generate a parsed source ID for a SecondStep ID.
 * @param {string} secondStepId
 * @param {string} sourcePrefix
 * @returns {ParsedIdSource}
 */
export function idSource( secondStepId, sourcePrefix = "ED4" ) {
  return { id: secondStepId.replace( sourcePrefix, "" ), source: sourcePrefix, secondStepId };
}

/**
 * Creates a stand-in for an item document, as `fromUuid()` or the EDID search return it. `toObject()` returns a fresh
 * deep copy on every call, like the real one.
 * @param {string} type - The item type.
 * @param {object} [data] - More data of the item, like `name` and `system`.
 * @returns {{ type: string, toObject: () => object }} The document.
 */
export function itemDocument( type, data = {} ) {
  const source = { name: "Test Item", system: {}, ...data, type };
  return { type, toObject: () => structuredClone( source ) };
}

/**
 * Creates a resolved item, as the resolver returns it.
 * @param {string} secondStepId - The Second Step ID.
 * @param {string} itemType - The item type.
 * @param {object} [overrides] - Properties of the resolved item to replace, like `data` or `resolution`.
 * @returns {ResolvedItem} The resolved item. Its name is the Second Step ID.
 */
export function resolvedItem( secondStepId, itemType, overrides = {} ) {
  return {
    data:       { name: secondStepId, type: itemType, system: {} },
    resolution: "uuid",
    secondStepId,
    itemType,
    ...overrides,
  };
}

/**
 * Creates an adapted equipment item.
 * @param {string} secondStepId - The Second Step ID.
 * @param {string} [itemType] - The item type.
 * @param {object} [system] - The `system` data of the item.
 * @returns {AdaptedEquipment} The adapted equipment.
 */
export function adaptedEquipment( secondStepId, itemType = "equipment", system = {} ) {
  return {
    resolved: resolvedItem( secondStepId, itemType, { data: { name: secondStepId, type: itemType, system } } ),
  };
}

/**
 * Creates a parsed knack.
 * @param {object} [overrides] - Properties to replace.
 * @returns {ParsedKnack} The knack.
 */
export function parsedKnack( overrides = {} ) {
  return { id: idSource( "ED4TestKnack" ), attribute: "per", ...overrides };
}

/**
 * Creates a matrix grant.
 * @param {object} [overrides] - Properties to replace.
 * @returns {MatrixGrant} The grant.
 */
export function matrixGrant( overrides = {} ) {
  return {
    equipmentSecondStepId: "ED4TestStaff",
    spellSecondStepId:     "ED4WCatchSpell",
    level:                 6,
    matrixId:              "StandardMatrix",
    ...overrides,
  };
}