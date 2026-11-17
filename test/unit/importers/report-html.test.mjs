import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildReportHtml } from "../../../module/importers/report-html.mjs";

const countText = ( key, count ) => `${ key } ${ JSON.stringify( { count } ) }`;

const item = ( kind, name, secondStepId ) => ( { kind, name, itemType: kind, secondStepId } );

function baseReport( overrides = {} ) {
  return {
    characterName: "Test Name",
    itemCount:     0,
    resolutions:   { uuid: 0, edid: 0, synthesized: 0 },
    unresolved:    [],
    deferred:      [],
    ...overrides,
  };
}

const listItemCount = html => ( html.match( /<li>/g ) ?? [] ).length;

describe( "buildReportHtml", () => {

  beforeEach( () => {
    // The global stub only returns the key. This one also shows the data, so the numbers can be checked.
    vi.stubGlobal( "_loc", ( key, data ) => ( data ? `${ key } ${ JSON.stringify( data ) }` : key ) );
  } );

  describe( "resolutions", () => {

    it( "always starts with the resolutions heading, even for an empty report", () => {
      const html = buildReportHtml( baseReport() );

      expect( typeof html ).toBe( "string" );
      expect( html ).toContain( "<h3>S2F.Report.heading.resolutions</h3>" );
    } );

    it.each( [
      [ "uuid", 3 ],
      [ "edid", 2 ],
      [ "synthesized", 1 ],
    ] )( "shows how many items were resolved by %s", ( way, count ) => {
      const html = buildReportHtml( baseReport( { resolutions: { uuid: 3, edid: 2, synthesized: 1 } } ) );

      expect( html ).toContain( countText( `S2F.Report.resolutions.${ way }`, count ) );
    } );

  } );

  describe( "unresolved items", () => {

    it( "leaves the section out if everything was resolved", () => {
      expect( buildReportHtml( baseReport() ) ).not.toContain( "S2F.Report.heading.unresolved" );
    } );

    it( "groups the unresolved items by kind, with the number of items in the heading", () => {
      const html = buildReportHtml( baseReport( {
        unresolved: [ item( "talent", "Fire Blast", "ED4FireBlast" ), item( "talent", "Air Dance", "ED4AirDance" ), item( "skill", "Accounting", "ED4Knowledge" ) ],
      } ) );

      expect( html ).toContain( "<h3>S2F.Report.heading.unresolved</h3>" );
      expect( html ).toContain( `<h4>${ countText( "S2F.Report.kind.talent", 2 ) }</h4>` );
      expect( html ).toContain( `<h4>${ countText( "S2F.Report.kind.skill", 1 ) }</h4>` );
    } );

    it( "lists every item with its name and its Second Step ID", () => {
      const html = buildReportHtml( baseReport( { unresolved: [ item( "talent", "Fire Blast", "ED4FireBlast" ) ] } ) );

      expect( html ).toContain( "Fire Blast" );
      expect( html ).toContain( "<code>ED4FireBlast</code>" );
    } );

    it( "shows the groups in a fixed order, not in the order the items came in", () => {
      const html = buildReportHtml( baseReport( {
        unresolved: [
          item( "equipment", "Dagger", "Dagger" ),
          item( "spell", "Crunch Climb", "ED4ECrunchClimb" ),
          item( "skill", "Accounting", "ED4Knowledge" ),
          item( "talent", "Fire Blast", "ED4FireBlast" ),
        ],
      } ) );

      const positions = [ "talent", "skill", "spell", "equipment" ]
        .map( kind => html.indexOf( `S2F.Report.kind.${ kind }` ) );
      expect( positions.every( position => position >= 0 ) ).toBe( true );
      expect( positions ).toEqual( [ ...positions ].sort( ( a, b ) => a - b ) );
    } );

    it( "keeps the order of the items within a group", () => {
      const html = buildReportHtml( baseReport( {
        unresolved: [ item( "talent", "Zeta", "ED4Zeta" ), item( "talent", "Alpha", "ED4Alpha" ) ],
      } ) );

      expect( html.indexOf( "Zeta" ) ).toBeLessThan( html.indexOf( "Alpha" ) );
    } );

    it( "still lists a kind that is not known, after the known ones", () => {
      const html = buildReportHtml( baseReport( {
        unresolved: [ item( "somethingNew", "Strange", "ED4Strange" ), item( "talent", "Fire Blast", "ED4FireBlast" ) ],
      } ) );

      expect( html ).toContain( "S2F.Report.kind.somethingNew" );
      expect( html.indexOf( "S2F.Report.kind.talent" ) ).toBeLessThan( html.indexOf( "S2F.Report.kind.somethingNew" ) );
    } );

    it( "escapes names and IDs, which come from the file", () => {
      const html = buildReportHtml( baseReport( {
        unresolved: [ item( "talent", "<img src=x onerror=alert(1)>", "ED4<script>" ) ],
      } ) );

      expect( html ).not.toContain( "<img" );
      expect( html ).not.toContain( "<script>" );
      expect( html ).toContain( "&lt;img" );
      expect( html ).toContain( "&lt;script&gt;" );
    } );

  } );

  describe( "deferred sections", () => {

    it( "leaves the section out if everything was imported", () => {
      expect( buildReportHtml( baseReport() ) ).not.toContain( "S2F.Report.heading.deferred" );
    } );

    it( "lists the sections that were not imported, with their counts, in the order of the report", () => {
      const html = buildReportHtml( baseReport( {
        deferred: [ { section: "threadItems", count: 3 }, { section: "legendPoints", count: 1200 } ],
      } ) );

      expect( html ).toContain( "<h3>S2F.Report.heading.deferred</h3>" );
      expect( html ).toContain( countText( "S2F.Report.deferred.threadItems", 3 ) );
      expect( html ).toContain( countText( "S2F.Report.deferred.legendPoints", 1200 ) );
      expect( html.indexOf( "threadItems" ) ).toBeLessThan( html.indexOf( "legendPoints" ) );
    } );

  } );

  it( "has one list entry for every way, every unresolved item and every deferred section", () => {
    const html = buildReportHtml( baseReport( {
      unresolved: [ item( "talent", "Fire Blast", "ED4FireBlast" ), item( "skill", "Accounting", "ED4Knowledge" ) ],
      deferred:   [ { section: "knacks", count: 2 } ],
    } ) );

    expect( listItemCount( html ) ).toBe( 3 + 2 + 1 );
  } );

} );
