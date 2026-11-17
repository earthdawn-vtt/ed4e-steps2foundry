import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAttemptPages } from "../../../module/importers/import-log.mjs";
import { buildReportHtml } from "../../../module/importers/report-html.mjs";

// The report is built by its own function and tested there. Here it is replaced, so only the pages are tested.
vi.mock( "../../../module/importers/report-html.mjs", () => ( {
  buildReportHtml: vi.fn( report => `<report>${ report.characterName }</report>` ),
} ) );

const successResult = ( fileName = "hero.json", characterName = "Test Name" ) => ( {
  fileName,
  status: "success",
  report: { characterName },
} );

const failedResult = ( fileName = "broken.json", error = { message: "Import failed.", cause: null } ) => ( {
  fileName,
  status: "failed",
  error,
} );

function baseAttempt( overrides = {} ) {
  return {
    startedAt: Date.UTC( 2026, 10, 15, 14, 3 ),
    userName:  "Alice",
    results:   [ successResult() ],
    ...overrides,
  };
}

describe( "buildAttemptPages", () => {

  beforeEach( () => {
    // The global stub only returns the key. This one also shows the data, so it can be checked what was passed in.
    vi.stubGlobal( "_loc", ( key, data ) => ( data ? `${ key } ${ JSON.stringify( data ) }` : key ) );
    vi.mocked( buildReportHtml ).mockClear();
  } );

  describe( "the page of the attempt", () => {

    it( "is the first page, a text page on level 1 with an HTML content", () => {
      const [ page ] = buildAttemptPages( baseAttempt() );

      expect( page.type ).toBe( "text" );
      expect( page.title ).toEqual( { show: true, level: 1 } );
      expect( page.text.format ).toBe( 1 );
    } );

    it( "is named after the time of the attempt, in UTC", () => {
      const [ page ] = buildAttemptPages( baseAttempt() );

      expect( page.name ).toContain( "2026-11-15 14:03" );
    } );

    it( "sums up how many files were imported and how many failed", () => {
      const attempt = baseAttempt( { results: [ successResult(), successResult( "b.json" ), failedResult() ] } );
      const [ page ] = buildAttemptPages( attempt );

      expect( page.text.content ).toContain( "\"total\":3" );
      expect( page.text.content ).toContain( "\"succeeded\":2" );
      expect( page.text.content ).toContain( "\"failed\":1" );
    } );

    it( "names the user and escapes the name", () => {
      const [ page ] = buildAttemptPages( baseAttempt( { userName: "<b>Al</b>" } ) );

      expect( page.text.content ).not.toContain( "<b>" );
      expect( page.text.content ).toContain( "&lt;b&gt;Al&lt;/b&gt;" );
    } );

    it( "is the only page if there are no results", () => {
      expect( buildAttemptPages( baseAttempt( { results: [] } ) ) ).toHaveLength( 1 );
    } );

  } );

  describe( "the page of a file", () => {

    it( "is a page on level 2 for every result, in the order of the results", () => {
      const attempt = baseAttempt( { results: [ successResult( "a.json" ), failedResult( "b.json" ), successResult( "c.json" ) ] } );
      const pages = buildAttemptPages( attempt );

      expect( pages ).toHaveLength( 4 );
      expect( pages.slice( 1 ).map( page => page.title.level ) ).toEqual( [ 2, 2, 2 ] );
      expect( pages[ 1 ].name ).toContain( "a.json" );
      expect( pages[ 2 ].name ).toContain( "b.json" );
      expect( pages[ 3 ].name ).toContain( "c.json" );
    } );

    it( "is a text page with HTML content", () => {
      const [ , filePage ] = buildAttemptPages( baseAttempt() );

      expect( filePage.type ).toBe( "text" );
      expect( filePage.title.show ).toBe( true );
      expect( filePage.text.format ).toBe( 1 );
    } );

    it( "is named after the file and the character for a file that was imported", () => {
      const [ , filePage ] = buildAttemptPages( baseAttempt( { results: [ successResult( "hero.json", "Test Name" ) ] } ) );

      expect( filePage.name ).toContain( "hero.json" );
      expect( filePage.name ).toContain( "Test Name" );
    } );

    it( "contains the report for a file that was imported", () => {
      const result = successResult( "hero.json", "Test Name" );
      const [ , filePage ] = buildAttemptPages( baseAttempt( { results: [ result ] } ) );

      expect( buildReportHtml ).toHaveBeenCalledWith( result.report );
      expect( filePage.text.content ).toContain( "<report>Test Name</report>" );
    } );

    it( "does not escape the title, which is plain text and not HTML", () => {
      const [ , filePage ] = buildAttemptPages( baseAttempt( { results: [ successResult( "a<b>.json" ) ] } ) );

      expect( filePage.name ).toContain( "a<b>.json" );
      expect( filePage.name ).not.toContain( "&lt;" );
    } );

  } );

  describe( "the page of a file that failed", () => {

    it( "is named after the file", () => {
      const [ , filePage ] = buildAttemptPages( baseAttempt( { results: [ failedResult( "broken.json" ) ] } ) );

      expect( filePage.name ).toContain( "broken.json" );
    } );

    it( "tells what went wrong, and what caused it, with everything escaped", () => {
      const error = { message: "Item <b>x</b> is missing.", cause: "invalid field <i>y</i>" };
      const [ , filePage ] = buildAttemptPages( baseAttempt( { results: [ failedResult( "broken.json", error ) ] } ) );

      expect( filePage.text.content ).toContain( "Item &lt;b&gt;x&lt;/b&gt; is missing." );
      expect( filePage.text.content ).toContain( "invalid field &lt;i&gt;y&lt;/i&gt;" );
      expect( filePage.text.content ).not.toContain( "<b>" );
      expect( filePage.text.content ).not.toContain( "<i>" );
    } );

    it( "does not mention a cause if there is none", () => {
      const [ , filePage ] = buildAttemptPages( baseAttempt( { results: [ failedResult( "broken.json" ) ] } ) );

      expect( filePage.text.content ).toContain( "Import failed." );
      expect( filePage.text.content ).not.toContain( "null" );
      expect( filePage.text.content ).not.toContain( "undefined" );
    } );

    it( "does not build a report", () => {
      buildAttemptPages( baseAttempt( { results: [ failedResult() ] } ) );

      expect( buildReportHtml ).not.toHaveBeenCalled();
    } );

  } );

  describe( "order", () => {

    it( "starts the pages at the sort value that was given and goes up from there", () => {
      const attempt = baseAttempt( { results: [ successResult(), failedResult(), successResult( "c.json" ) ] } );
      const sorts = buildAttemptPages( attempt, 5000 ).map( page => page.sort );

      expect( sorts[ 0 ] ).toBe( 5000 );
      expect( sorts ).toEqual( [ ...sorts ].sort( ( a, b ) => a - b ) );
      expect( new Set( sorts ).size ).toBe( sorts.length );
    } );

    it( "starts at 0 if no sort value is given", () => {
      expect( buildAttemptPages( baseAttempt() )[ 0 ].sort ).toBe( 0 );
    } );

  } );

  it( "does not change the attempt it was given", () => {
    const attempt = baseAttempt( { results: [ successResult(), failedResult() ] } );
    const snapshot = structuredClone( attempt );

    buildAttemptPages( attempt, 100 );

    expect( attempt ).toEqual( snapshot );
  } );

} );
