/**
 * Setup for vitest unit setup. Installs a minimal stub of the Foundry VTT globals this module's source code expects
 * at runtime (`fromUuid`, `foundry.utils.mergeObject`, `game.ed4e...`, `fetch`) before every test, and
 * tears them down afterward.
 */

import { afterEach, beforeEach, vi } from "vitest";
import { clearLookupTableCache } from "../../module/resolvers/lookup-tables.mjs";
import { mockLookupTable } from "../mocks/browser.mjs";

// region Helpers

function stubGlobals() {
  vi.stubGlobal( "ED4E_CONSTANTS", {
    SYSTEM_ID: "ed4e",
  } );

  vi.stubGlobal( "_loc", vi.fn( key => key ) );

  vi.stubGlobal( "fetch", vi.fn() );

  vi.stubGlobal( "foundry", {
    utils: {
      mergeObject: ( target, source ) => Object.assign( target, source )
    }
  } );

  vi.stubGlobal( "fromUuid", vi.fn() );

  vi.stubGlobal( "game", {
    ed4e: {
      helpers: {
        document: {
          getSingleGlobalItemByEdid: vi.fn()
        }
      }
    },
    settings: {
      get: vi.fn(),
    },
    user: {
      can: vi.fn( () => true )
    },
  } );
}

function prepareLookupTables() {
  clearLookupTableCache();
  // Nothing is resolvable unless a test says otherwise.
  mockLookupTable( {} );
}

// endregion

// region setup

beforeEach( () => {
  stubGlobals();
  prepareLookupTables();
} );

afterEach( () => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
} );

// endregion
