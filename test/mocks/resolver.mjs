import { itemDocument } from "../helpers/factories.mjs";
import { mockLookupTables } from "./browser.mjs";
import { mockEdidDocuments, mockUuidDocuments } from "./foundry.mjs";

/**
 * @typedef ResolvableItem
 * @property {string} secondStepId - The Second Step ID the item is found for.
 * @property {string} itemType - The item type of the document that is found.
 * @property {string} [name] - The name of the document. Defaults to the Second Step ID.
 * @property {object} [system] - The `system` data of the document.
 * @property {"uuid"|"edid"} [via] - Whether the item is found through the UUID or the EDID tier. Defaults to `uuid`.
 */

/**
 * Makes the given items resolvable through the lookup tables and the UUID or EDID search. Replaces whatever was
 * mocked before, so call it once per test with all the items. Everything not given is not resolvable.
 * @param {ResolvableItem[]} items - The items that can be resolved.
 */
export function mockResolvableItems( items ) {
  const tables = {};
  const uuidDocuments = {};
  const edidDocuments = {};

  items.forEach( ( item, index ) => {
    const { secondStepId, itemType, name = secondStepId, system = {}, via = "uuid" } = item;
    const document = itemDocument( itemType, { name, system } );
    tables[ itemType ] ??= {};

    if ( via === "uuid" ) {
      const uuid = `Compendium.test.Item.${ itemType }${ index }`;
      tables[ itemType ][ secondStepId ] = { uuid };
      uuidDocuments[ uuid ] = document;
    } else {
      const edid = `${ secondStepId }-edid`;
      tables[ itemType ][ secondStepId ] = { edid };
      edidDocuments[ `${ itemType }:${ edid }` ] = document;
    }
  } );

  mockLookupTables( tables );
  mockUuidDocuments( uuidDocuments );
  mockEdidDocuments( edidDocuments );
}
