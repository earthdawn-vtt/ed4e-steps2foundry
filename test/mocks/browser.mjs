/**
 * Stubs the `fetch()` call made by `getLookupTable()` to resolve with the given table.
 * @param {object} table - The lookup table content to resolve with, keyed by SecondStep ID.
 */
export function mockLookupTable( table ) {
  globalThis.fetch.mockResolvedValue( { ok: true, json: async () => table } );
}

/**
 * Stubs the `fetch()` call made by `getLookupTables()` to resolve with the given tables.
 * @param {object} tables - The lookup tables content to resolve with, keyed by item type.
 */
export function mockLookupTables( tables ) {
  globalThis.fetch.mockImplementation( async ( input ) => {
    const url = input instanceof Request ? input.url : String( input );
    const itemType = url.match( /lookup-tables\/(.+)\.json/ )?.[ 1 ];
    const table = tables[ itemType ];
    return { ok: true, json: async () => table };
  } );
}