import { describe, expect, it } from "vitest";
import { buildDescriptionHtml } from "../../../module/importers/description.mjs";

const APPEARANCE_FIELDS = [
  "gender",
  "age",
  "height",
  "weight",
  "hair",
  "eyes",
  "skin",
  "player",
  "passion",
  "traits",
];

function baseBasics( overrides = {} ) {
  return {
    name:        "Test Name",
    player:      null,
    gender:      null,
    age:         null,
    height:      null,
    weight:      null,
    hair:        null,
    skin:        null,
    eyes:        null,
    passion:     null,
    traits:      null,
    description: null,
    logText:     null,
    ...overrides,
  };
}

const rowCount = html => ( html.match( /<tr[\s>]/g ) ?? [] ).length;

describe( "buildDescriptionHtml", () => {

  describe( "without appearance fields", () => {

    it( "returns an empty string if there is nothing to describe", () => {
      expect( buildDescriptionHtml( baseBasics() ) ).toBe( "" );
    } );

    it( "returns only the description, unchanged, if no field has a value", () => {
      const description = "<div>test <b>description</b></div><div>second line</div>";

      expect( buildDescriptionHtml( baseBasics( { description } ) ) ).toBe( description );
    } );

  } );

  describe( "appearance table", () => {

    it.each( APPEARANCE_FIELDS )( "shows the %s with a localized label", ( field ) => {
      const html = buildDescriptionHtml( baseBasics( { [ field ]: "Some Value" } ) );

      expect( html ).toContain( "<table" );
      expect( html ).toContain( `S2F.Description.${ field }` );
      expect( html ).toContain( "Some Value" );
      expect( rowCount( html ) ).toBe( 1 );
    } );

    it( "has one row for every field with a value and none for the others", () => {
      const html = buildDescriptionHtml( baseBasics( { age: "23", hair: "red" } ) );

      expect( rowCount( html ) ).toBe( 2 );
      expect( html ).toContain( "S2F.Description.age" );
      expect( html ).toContain( "S2F.Description.hair" );
      expect( html ).not.toContain( "S2F.Description.eyes" );
    } );

    it( "lists the fields in a fixed order", () => {
      const allFields = Object.fromEntries( APPEARANCE_FIELDS.map( field => [ field, `Value ${ field }` ] ) );
      const html = buildDescriptionHtml( baseBasics( allFields ) );

      const positions = APPEARANCE_FIELDS.map( field => html.indexOf( `S2F.Description.${ field }` ) );
      expect( positions.every( position => position >= 0 ) ).toBe( true );
      expect( positions ).toEqual( [ ...positions ].sort( ( a, b ) => a - b ) );
    } );

    it( "escapes the values, which are free text from the file", () => {
      const html = buildDescriptionHtml( baseBasics( { traits: "<script>alert(\"x\")</script>" } ) );

      expect( html ).not.toContain( "<script>" );
      expect( html ).toContain( "&lt;script&gt;" );
    } );

    it( "does not use the name of the character as a field", () => {
      const html = buildDescriptionHtml( baseBasics( { name: "Unique Character Name", age: "23" } ) );

      expect( html ).not.toContain( "Unique Character Name" );
    } );

  } );

  describe( "description and table together", () => {

    it( "puts the table after the description", () => {
      const description = "<div>test description</div>";
      const html = buildDescriptionHtml( baseBasics( { description, age: "23" } ) );

      expect( html.startsWith( description ) ).toBe( true );
      expect( html.indexOf( "<table" ) ).toBeGreaterThan( description.length - 1 );
    } );

    it( "does not escape the description, because it already is HTML", () => {
      const description = "<div>test <b>description</b></div>";
      const html = buildDescriptionHtml( baseBasics( { description, age: "23" } ) );

      expect( html ).toContain( description );
      expect( html ).not.toContain( "&lt;div" );
    } );

    it( "returns just the table if there is no description", () => {
      const html = buildDescriptionHtml( baseBasics( { description: null, age: "23" } ) );

      expect( html.trimStart().startsWith( "<table" ) ).toBe( true );
    } );

  } );

} );