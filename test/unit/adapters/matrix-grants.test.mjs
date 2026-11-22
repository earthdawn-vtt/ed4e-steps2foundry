import { describe, expect, it } from "vitest";
import { applyMatrixGrants } from "../../../module/adapters/matrix-grants.mjs";
import { adaptedEquipment, matrixGrant } from "../../helpers/factories.mjs";

const MATRIX_EDID = "matrix";

describe( "applyMatrixGrants", () => {

  describe( "the equipment that becomes a matrix", () => {

    it( "gets the matrix EDID", () => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ) ];

      applyMatrixGrants( equipment, [ matrixGrant() ], MATRIX_EDID );

      expect( equipment[ 0 ].resolved.data.system.edid ).toBe( "matrix" );
    } );

    it( "gets the EDID it was given and not a fixed one", () => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ) ];

      applyMatrixGrants( equipment, [ matrixGrant() ], "custom-matrix" );

      expect( equipment[ 0 ].resolved.data.system.edid ).toBe( "custom-matrix" );
    } );

    it( "gets the level of the grant as matrix level", () => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ) ];

      applyMatrixGrants( equipment, [ matrixGrant( { level: 8 } ) ], MATRIX_EDID );

      expect( equipment[ 0 ].resolved.data.system.matrix.level ).toBe( 8 );
    } );

    it.each( [
      [ "StandardMatrix", "standard" ],
      [ "EnhancedMatrix", "enhanced" ],
    ] )( "gets the matrix type for %s", ( matrixId, matrixType ) => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ) ];

      applyMatrixGrants( equipment, [ matrixGrant( { matrixId } ) ], MATRIX_EDID );

      expect( equipment[ 0 ].resolved.data.system.matrix.matrixType ).toBe( matrixType );
    } );

    it( "gets no matrix type for a matrix that is not known, so the default of the system applies", () => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ) ];

      applyMatrixGrants( equipment, [ matrixGrant( { matrixId: "SomethingNewMatrix" } ) ], MATRIX_EDID );

      expect( equipment[ 0 ].resolved.data.system.matrix ).not.toHaveProperty( "matrixType" );
    } );

    it( "keeps the matrix data the item already has", () => {
      const equipment = [
        adaptedEquipment( "ED4TestStaff", "equipment", { matrix: { deathRating: 10, spells: [] } } ),
      ];

      applyMatrixGrants( equipment, [ matrixGrant( { level: 6 } ) ], MATRIX_EDID );

      expect( equipment[ 0 ].resolved.data.system.matrix ).toMatchObject( { deathRating: 10, spells: [], level: 6 } );
    } );

    it.each( [
      [ "weapon" ],
      [ "armor" ],
      [ "shield" ],
      [ "equipment" ],
    ] )( "can be a %s", ( itemType ) => {
      const equipment = [ adaptedEquipment( "ED4TestStaff", itemType ) ];

      applyMatrixGrants( equipment, [ matrixGrant() ], MATRIX_EDID );

      expect( equipment[ 0 ].resolved.data.system.edid ).toBe( "matrix" );
    } );

  } );

  describe( "the attuned spell", () => {

    it( "is remembered on the equipment for the linking step", () => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ) ];

      applyMatrixGrants( equipment, [ matrixGrant( { spellSecondStepId: "ED4ECloudSummon" } ) ], MATRIX_EDID );

      expect( equipment[ 0 ].matrixSpellSecondStepId ).toBe( "ED4ECloudSummon" );
    } );

    it( "is not invented if the grant has none", () => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ) ];

      applyMatrixGrants( equipment, [ matrixGrant( { spellSecondStepId: undefined } ) ], MATRIX_EDID );

      expect( equipment[ 0 ].matrixSpellSecondStepId ).toBeUndefined();
    } );

  } );

  describe( "finding the equipment", () => {

    it( "uses the Second Step ID of the equipment and changes nothing else", () => {
      const equipment = [
        adaptedEquipment( "ED4Dagger" ),
        adaptedEquipment( "ED4TestStaff" ),
        adaptedEquipment( "ED4Rope" ),
      ];

      applyMatrixGrants( equipment, [ matrixGrant() ], MATRIX_EDID );

      expect( equipment[ 0 ].resolved.data.system ).not.toHaveProperty( "edid" );
      expect( equipment[ 1 ].resolved.data.system.edid ).toBe( "matrix" );
      expect( equipment[ 2 ].resolved.data.system ).not.toHaveProperty( "edid" );
    } );

    it( "returns the grants for which no equipment was found, and changes nothing for them", () => {
      const equipment = [ adaptedEquipment( "ED4Dagger" ) ];
      const grant = matrixGrant( { equipmentSecondStepId: "ED4Missing" } );

      const { unmatched } = applyMatrixGrants( equipment, [ grant ], MATRIX_EDID );

      expect( unmatched ).toEqual( [ grant ] );
      expect( equipment[ 0 ].resolved.data.system ).not.toHaveProperty( "edid" );
    } );

    it( "returns no unmatched grants if every grant found its equipment", () => {
      const { unmatched } = applyMatrixGrants( [ adaptedEquipment( "ED4TestStaff" ) ], [ matrixGrant() ], MATRIX_EDID );

      expect( unmatched ).toEqual( [] );
    } );

    it( "gives a second grant for the same item to the next equipment with that ID", () => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ), adaptedEquipment( "ED4TestStaff" ) ];

      const { unmatched } = applyMatrixGrants(
        equipment,
        [ matrixGrant( { level: 6 } ), matrixGrant( { level: 8 } ) ],
        MATRIX_EDID,
      );

      expect( unmatched ).toEqual( [] );
      expect( equipment[ 0 ].resolved.data.system.matrix.level ).toBe( 6 );
      expect( equipment[ 1 ].resolved.data.system.matrix.level ).toBe( 8 );
    } );

    it( "does not turn one item into two matrices, and returns the second grant as unmatched", () => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ) ];
      const second = matrixGrant( { level: 8 } );

      const { unmatched } = applyMatrixGrants( equipment, [ matrixGrant( { level: 6 } ), second ], MATRIX_EDID );

      expect( unmatched ).toEqual( [ second ] );
      expect( equipment[ 0 ].resolved.data.system.matrix.level ).toBe( 6 );
    } );

  } );

  describe( "the result", () => {

    it( "changes the equipment in place and returns only the unmatched grants", () => {
      const result = applyMatrixGrants( [ adaptedEquipment( "ED4TestStaff" ) ], [ matrixGrant() ], MATRIX_EDID );

      expect( Object.keys( result ) ).toEqual( [ "unmatched" ] );
    } );

    it( "does nothing if there are no grants", () => {
      const equipment = [ adaptedEquipment( "ED4TestStaff" ) ];
      const snapshot = structuredClone( equipment );

      const { unmatched } = applyMatrixGrants( equipment, [], MATRIX_EDID );

      expect( unmatched ).toEqual( [] );
      expect( equipment ).toEqual( snapshot );
    } );

    it( "does not change the grants", () => {
      const grants = [ matrixGrant() ];
      const snapshot = structuredClone( grants );

      applyMatrixGrants( [ adaptedEquipment( "ED4TestStaff" ) ], grants, MATRIX_EDID );

      expect( grants ).toEqual( snapshot );
    } );

  } );

} );
