import { beforeEach, describe, expect, it, vi } from "vitest";
import { ensureImportMacro, IMPORT_MACRO_COMMAND } from "../../../module/importers/import-macro.mjs";
import { MODULE_ID } from "../../../module/constants/constants.mjs";

describe( "ensureImportMacro", () => {

  let create;

  beforeEach( () => {
    create = vi.fn( async data => data );
    vi.stubGlobal( "Macro", { create } );
    game.user.isGM = true;
    game.user.isSelf = true;
    game.users = { activeGM: game.user };
    game.macros = [];
  } );

  it( "creates a flagged script macro that calls the API if there is none", async () => {
    await ensureImportMacro();

    expect( create ).toHaveBeenCalledTimes( 1 );
    const data = create.mock.calls[ 0 ][ 0 ];
    expect( data.type ).toBe( "script" );
    expect( data.command ).toBe( IMPORT_MACRO_COMMAND );
    expect( data.command ).toContain( "api.runImport()" );
    expect( data.flags[ MODULE_ID ].importMacro ).toBe( true );
  } );

  it( "does not create it again if it exists", async () => {
    game.macros = [ { getFlag: ( scope, key ) => scope === MODULE_ID && key === "importMacro" } ];

    expect( await ensureImportMacro() ).toBeNull();
    expect( create ).not.toHaveBeenCalled();
  } );

  it( "does nothing for a user who is not a GM", async () => {
    game.user.isGM = false;

    await ensureImportMacro();

    expect( create ).not.toHaveBeenCalled();
  } );

  it( "does nothing for a GM who is not the active one", async () => {
    game.users = { activeGM: { isSelf: false } };

    await ensureImportMacro();

    expect( create ).not.toHaveBeenCalled();
  } );

  it( "does not throw if the creation fails", async () => {
    create.mockRejectedValue( new Error( "denied" ) );
    vi.spyOn( console, "warn" ).mockImplementation( () => {} );

    expect( await ensureImportMacro() ).toBeNull();
  } );

} );
