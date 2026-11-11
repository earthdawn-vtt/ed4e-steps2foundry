import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildLogJournalData } from "../../../module/importers/journal.mjs";

function baseBasics( overrides = {} ) {
  return {
    name:    "Test Name",
    logText: "<div>First entry</div><div>Second entry</div>",
    ...overrides,
  };
}

describe( "buildLogJournalData", () => {

  beforeEach( () => {
    // The global stub only returns the key. This one also shows the interpolation data.
    vi.stubGlobal( "_loc", vi.fn( ( key, data ) => ( data ? `${ key } ${ JSON.stringify( data ) }` : key ) ) );
  } );

  it( "returns null if the character has no log", () => {
    expect( buildLogJournalData( baseBasics( { logText: null } ) ) ).toBeNull();
  } );

  it( "names the journal after the character", () => {
    const data = buildLogJournalData( baseBasics( { characterName: "Test Name" } ) );

    expect( data.name ).toBe( `S2F.Journal.logJournalName ${ JSON.stringify( { characterName: "Test Name" } ) }` );
  } );

  it( "falls back to a localized name if the character has no name", () => {
    const data = buildLogJournalData( baseBasics( { name: null } ) );

    expect( data.name ).toContain( "S2F.Character.unnamed" );
  } );

  it( "has exactly one page, a text page with a localized name", () => {
    const data = buildLogJournalData( baseBasics() );

    expect( data.pages ).toHaveLength( 1 );
    expect( data.pages[ 0 ].type ).toBe( "text" );
    expect( data.pages[ 0 ].name ).toBe( "S2F.Journal.logPageName" );
  } );

  it( "puts the log into the page as HTML, unchanged", () => {
    const logText = "<div>this is <b>bold</b></div><div>and a second line</div>";
    const { pages } = buildLogJournalData( baseBasics( { logText } ) );

    expect( pages[ 0 ].text.content ).toBe( logText );
    expect( pages[ 0 ].text.format ).toBe( 1 );
  } );

} );