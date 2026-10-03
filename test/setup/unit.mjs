/**
 * Setup for vitest unit setup. Installs a minimal stub of the Foundry VTT globals this module's source code expects
 * at runtime (`fromUuid`, `foundry.utils.mergeObject`, `game.ed4e...`, `fetch`) before every test, and
 * tears them down afterward.
 */

import { afterEach, beforeEach, vi } from "vitest";
import { clearLookupTableCache } from "../../module/resolvers/lookup-tables.mjs";

beforeEach( () => {
  clearLookupTableCache();

  vi.stubGlobal( "fromUuid", vi.fn() );
  vi.stubGlobal( "foundry", {
    utils: {
      mergeObject: ( target, source ) => Object.assign( target, source )
    }
  } );
  vi.stubGlobal( "game", {
    ed4e: {
      helpers: {
        document: {
          getSingleGlobalItemByEdid: vi.fn()
        }
      }
    }
  } );
  vi.stubGlobal( "fetch", vi.fn() );
} );

afterEach( () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
} );