/**
 * Stubs the `fetch()` call made by `getLookupTable()` to resolve with the given table.
 * @param {object} table - The lookup table content to resolve with, keyed by SecondStep ID.
 */
export function mockLookupTable( table ) {
  globalThis.fetch.mockResolvedValue( { ok: true, json: async () => table } );
}