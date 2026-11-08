import { describe, expect, it } from "vitest";
import { lowerCaseFirstLetter, splitCamelCase } from "../../../module/utils/string.mjs";

describe( "lowerCaseFirstLetter", () => {

  it( "converts the first character of a string to lowercase", () => {
    expect( lowerCaseFirstLetter( "Hello" ) ).toBe( "hello" );
  } );

  it( "leaves a string unchanged when the first character is already lowercase", () => {
    expect( lowerCaseFirstLetter( "hello" ) ).toBe( "hello" );
  } );

  it( "returns an empty string for empty input", () => {
    expect( lowerCaseFirstLetter( "" ) ).toBe( "" );
  } );

  it( "throws a TypeError for non-string input", () => {
    expect( () => lowerCaseFirstLetter( null ) ).toThrow( TypeError );
    expect( () => lowerCaseFirstLetter( undefined ) ).toThrow( TypeError );
    expect( () => lowerCaseFirstLetter( 42 ) ).toThrow( TypeError );
    expect( () => lowerCaseFirstLetter( {} ) ).toThrow( TypeError );
  } );

  it( "returns a single lowercase character for a single uppercase input", () => {
    expect( lowerCaseFirstLetter( "A" ) ).toBe( "a" );
  } );

  it( "only lowercases the first character and preserves the rest", () => {
    expect( lowerCaseFirstLetter( "HELLO" ) ).toBe( "hELLO" );
  } );
} );

describe( "splitCamelCase", () => {

  it( "throws a TypeError for non-string input", () => {
    expect( () => splitCamelCase( null ) ).toThrow( TypeError );
    expect( () => splitCamelCase( undefined ) ).toThrow( TypeError );
    expect( () => splitCamelCase( 42 ) ).toThrow( TypeError );
    expect( () => splitCamelCase( {} ) ).toThrow( TypeError );
  } );

  it( "returns an empty string for empty input", () => {
    expect( splitCamelCase( "" ) ).toBe( "" );
  } );

  it( "splits simple camelCase strings", () => {
    expect( splitCamelCase( "camelCase" ) ).toBe( "camel Case" );
  } );

  it( "splits PascalCase strings", () => {
    expect( splitCamelCase( "PascalCase" ) ).toBe( "Pascal Case" );
  } );

  it( "splits multiple camelCase boundaries", () => {
    expect( splitCamelCase( "helloWorldFooBar" ) ).toBe( "hello World Foo Bar" );
  } );

  it( "handles acronyms followed by a capitalized word", () => {
    expect( splitCamelCase( "XMLParser" ) ).toBe( "XML Parser" );
  } );

  it( "handles digits followed by letters", () => {
    expect( splitCamelCase( "test123Value" ) ).toBe( "test 123 Value" );
  } );

  it( "handles letters followed by digits", () => {
    expect( splitCamelCase( "test123" ) ).toBe( "test 123" );
  } );

  it( "handles digits followed by letters at the boundary", () => {
    expect( splitCamelCase( "123abc" ) ).toBe( "123 abc" );
  } );

  it( "handles non-ASCII characters with marks", () => {
    expect( splitCamelCase( "caféLatte" ) ).toBe( "café Latte" );
  } );

  it( "leaves a single word without boundaries unchanged", () => {
    expect( splitCamelCase( "hello" ) ).toBe( "hello" );
  } );

  it( "leaves an all-uppercase string unchanged", () => {
    expect( splitCamelCase( "HTTP" ) ).toBe( "HTTP" );
  } );

  it( "handles a string with only digits", () => {
    expect( splitCamelCase( "12345" ) ).toBe( "12345" );
  } );
} );
