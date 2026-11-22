/**
 * Stubs `fromUuid()` to resolve with the given document.
 * @param {object|null} document - The document `fromUuid()` should resolve with.
 */
export function mockUuidDocument( document ) {
  globalThis.fromUuid.mockResolvedValue( document );
}

/**
 * Stubs fromUuid() to resolve with different documents by UUID.
 * @param {Record<string, object|null>} documents
 */
export function mockUuidDocuments( documents ) {
  globalThis.fromUuid.mockImplementation( async ( uuid ) => {
    return documents[ uuid ] ?? null;
  } );
}

/**
 * Stubs `game.ed4e.helpers.document.getSingleGlobalItemByEdid()` to resolve with different documents by item type and
 * EDID. Anything that is not given is not found.
 * @param {Record<string, object|undefined>} documents - The documents, keyed by `"<itemType>:<edid>"`.
 */
export function mockEdidDocuments( documents ) {
  globalThis.game.ed4e.helpers.document.getSingleGlobalItemByEdid.mockImplementation(
    async ( edid, itemType ) => documents[ `${ itemType }:${ edid }` ],
  );
}

/**
 * Stubs `game.settings.get()` to return the given value.
 * @param {any} value - The value that `game.settings.get()` should return.
 */
export function mockSettingsGetValue( value ) {
  globalThis.game.settings.get.mockReturnValue( value );
}
