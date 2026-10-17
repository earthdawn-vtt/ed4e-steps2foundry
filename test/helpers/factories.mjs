/**
 * Generate a parsed source ID for a SecondStep ID.
 * @param {string} secondStepId
 * @param {string} sourcePrefix
 * @returns {ParsedIdSource}
 */
export function idSource( secondStepId, sourcePrefix = "ED4" ) {
  return { id: secondStepId.replace( sourcePrefix, "" ), source: sourcePrefix, secondStepId };
}