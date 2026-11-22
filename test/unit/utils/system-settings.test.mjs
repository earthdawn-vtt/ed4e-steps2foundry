import { describe, expect, it } from "vitest";
import { getMatrixEdid } from "../../../module/utils/system-settings.mjs";
import { mockSettingsGetValue } from "../../mocks/foundry.mjs";

describe( "getMatrixEdid", () => {

  it( "returns the EDID the system is configured with", () => {
    mockSettingsGetValue( "spell-matrix" );

    expect( getMatrixEdid() ).toBe( "spell-matrix" );
  } );

  it( "asks the setting of the system for the matrix EDID", () => {
    mockSettingsGetValue( "spell-matrix" );

    getMatrixEdid();

    expect( globalThis.game.settings.get ).toHaveBeenCalledWith( "ed4e", "edidSpellMatrix" );
  } );

  it.each( [
    [ "empty", "" ],
    [ "undefined", undefined ],
    [ "null", null ],
  ] )( "falls back to the default EDID if the setting is %s", ( label, value ) => {
    mockSettingsGetValue( value );

    expect( getMatrixEdid() ).toBe( "matrix" );
  } );

} );
