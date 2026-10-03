/**
 * Stubs `getSingleGlobalItemByEdid()`.
 *
 * @param {object|null} document
 */
export function mockGlobalItemByEdid( document ) {
  globalThis.game.ed4e.helpers.document
    .getSingleGlobalItemByEdid
    .mockResolvedValue( document );
}