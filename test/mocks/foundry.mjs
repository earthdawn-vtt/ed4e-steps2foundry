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
