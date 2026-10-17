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
 * Stubs `game.settings.get()` to return the given value.
 * @param {any} value - The value that `game.settings.get()` should return.
 */
export function mockSettingsGetValue( value ) {
  globalThis.game.settings.get.mockReturnValue( value );
}
