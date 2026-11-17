import { describe, expect, it } from "vitest";
import { describeImportError, getImportErrorMessage } from "../../../module/importers/import-error.mjs";
import { SecondStepImportError } from "../../../module/importers/errors.mjs";
import { SecondStepFormatError } from "../../../module/parsers/errors.mjs";

describe( "getImportErrorMessage", () => {

  it( "tells the user that the file is not a valid Second Step file for a format error", () => {
    expect( getImportErrorMessage( new SecondStepFormatError( "no StepsVersion" ) ) ).toBe( "S2F.Error.invalidFile" );
  } );

  it( "uses the message of an import error, which already is localized and specific", () => {
    expect( getImportErrorMessage( new SecondStepImportError( "You may not create actors." ) ) )
      .toBe( "You may not create actors." );
  } );

  it( "falls back to a general message for any other error", () => {
    expect( getImportErrorMessage( new TypeError( "Cannot read properties of undefined" ) ) )
      .toBe( "S2F.Error.unexpected" );
  } );

  it.each( [
    [ "a string", "boom" ],
    [ "undefined", undefined ],
    [ "null", null ],
    [ "an object", { reason: "boom" } ],
  ] )( "does not throw for something that is not an error: %s", ( label, thrown ) => {
    expect( getImportErrorMessage( thrown ) ).toBe( "S2F.Error.unexpected" );
  } );

} );

describe( "describeImportError", () => {

  it( "describes an import error with its message and the message of its cause", () => {
    const error = new SecondStepImportError( "Import failed.", { cause: new Error( "invalid field" ) } );

    expect( describeImportError( error ) ).toEqual( { message: "Import failed.", cause: "invalid field" } );
  } );

  it( "has no cause if there is none to tell", () => {
    expect( describeImportError( new SecondStepImportError( "You may not create actors." ) ) )
      .toEqual( { message: "You may not create actors.", cause: null } );
  } );

  it( "uses a cause that is not an error as it is", () => {
    const error = new SecondStepImportError( "Import failed.", { cause: "something went wrong" } );

    expect( describeImportError( error ).cause ).toBe( "something went wrong" );
  } );

  it( "tells what the syntax error was if a file is not valid JSON", () => {
    const error = new SecondStepFormatError( "not json", { cause: new SyntaxError( "Unexpected token" ) } );

    expect( describeImportError( error ) ).toEqual( { message: "S2F.Error.invalidFile", cause: "Unexpected token" } );
  } );

  it( "tells the message of an unexpected error, because the general message does not tell what happened", () => {
    expect( describeImportError( new TypeError( "Cannot read properties of undefined" ) ) ).toEqual( {
      message: "S2F.Error.unexpected",
      cause:   "Cannot read properties of undefined",
    } );
  } );

  it( "does not throw for something that is not an error", () => {
    expect( describeImportError( "boom" ) ).toEqual( { message: "S2F.Error.unexpected", cause: null } );
  } );

} );
