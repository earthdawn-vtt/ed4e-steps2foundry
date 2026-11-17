import { File } from "node:buffer";
import { describe, expect, it } from "vitest";
import { readSecondStepFile } from "../../../module/importers/read-export-file.mjs";
import { SecondStepFormatError } from "../../../module/parsers/errors.mjs";

const fileOf = ( text, name = "export.json" ) => new File( [ text ], name, { type: "application/json" } );

describe( "readSecondStepFile", () => {

  it( "returns the parsed JSON object", async () => {
    const result = await readSecondStepFile( fileOf( JSON.stringify( { StepsVersion: 1250, Basic: { Name: "Test" } } ) ) );

    expect( result ).toEqual( { StepsVersion: 1250, Basic: { Name: "Test" } } );
  } );

  it( "does not check whether the object is a Second Step export, which is the job of the parser", async () => {
    const result = await readSecondStepFile( fileOf( "{ \"anything\": 1 }" ) );

    expect( result ).toEqual( { anything: 1 } );
  } );

  it( "reads characters that are not ASCII correctly", async () => {
    const result = await readSecondStepFile( fileOf( JSON.stringify( { Name: "Jörg Müller" } ) ) );

    expect( result.Name ).toBe( "Jörg Müller" );
  } );

  it( "throws a format error with the syntax error as cause if the file is not valid JSON", async () => {
    const failure = await readSecondStepFile( fileOf( "{ this is not json" ) ).catch( thrown => thrown );

    expect( failure ).toBeInstanceOf( SecondStepFormatError );
    expect( failure.cause ).toBeInstanceOf( SyntaxError );
  } );

  it( "throws a format error for an empty file", async () => {
    const failure = await readSecondStepFile( fileOf( "" ) ).catch( thrown => thrown );

    expect( failure ).toBeInstanceOf( SecondStepFormatError );
  } );

  it.each( [
    [ "an array", "[ 1, 2, 3 ]" ],
    [ "a string", "\"text\"" ],
    [ "a number", "42" ],
    [ "null", "null" ],
  ] )( "throws a format error if the JSON is %s instead of an object", async ( label, text ) => {
    const failure = await readSecondStepFile( fileOf( text ) ).catch( thrown => thrown );

    expect( failure ).toBeInstanceOf( SecondStepFormatError );
  } );

} );
