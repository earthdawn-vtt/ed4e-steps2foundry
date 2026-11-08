import { describe, expect, it } from "vitest";
import { mockLookupTable } from "../../mocks/browser.mjs";
import { mockUuidDocument } from "../../mocks/foundry.mjs";
import { adaptSkills } from "../../../module/adapters/skills.mjs";
import {
  MODULE_ID,
  NORMALIZED_SECOND_STEP_SKILL_CATEGORIES,
} from "../../../module/constants/constants.mjs";
import { idSource } from "../../helpers/factories.mjs";

const CATEGORIES = NORMALIZED_SECOND_STEP_SKILL_CATEGORIES;

function baseSkill( overrides = {} ) {
  return {
    id:        idSource( "ED4TestSkill" ),
    rank:      3,
    freeRanks: 0,
    category:  CATEGORIES.general,
    uid:       "uid-1",
    attribute: "per",
    name:      null,
    ...overrides,
  };
}

/**
 * Makes the skill with the given SecondStep ID resolvable through the UUID lookup table.
 * @param {object} [system] - The `system` data of the document the UUID resolves to.
 * @param {string} [name] - The name of that document.
 * @param {string} [secondStepId] - The SecondStep ID to add to the lookup table.
 */
function mockSkillResolvable( system = {}, name = "Test Skill", secondStepId = "ED4TestSkill" ) {
  mockLookupTable( { [ secondStepId ]: { uuid: "Compendium.pack.item.Item.123" } } );
  mockUuidDocument( {
    type:     "skill",
    toObject: () => ( { name, type: "skill", system: { ...system } } ),
  } );
}

describe( "adaptSkills", () => {

  describe( "resolved skills", () => {

    it( "sets level and keeps the attribute and skill type of the compendium item", async () => {
      mockSkillResolvable( { attribute: "cha", level: 0, skillType: "general" } );
      const { skills } = await adaptSkills( [
        baseSkill( { rank: 4, category: CATEGORIES.knowledge, attribute: "per" } ),
      ] );

      const { resolved } = skills[ 0 ];
      expect( resolved.resolution ).toBe( "uuid" );
      expect( resolved.itemType ).toBe( "skill" );
      expect( resolved.data.system.level ).toBe( 4 );
      expect( resolved.data.system.skillType ).toBe( "general" );
      expect( resolved.data.system.attribute ).toBe( "cha" );
    } );

    it( "leaves the name of the compendium item alone if there is no specialization", async () => {
      mockSkillResolvable( {}, "Craft Armor" );
      const { skills } = await adaptSkills( [ baseSkill( { name: null } ) ] );

      expect( skills[0].resolved.data.name ).toBe( "Craft Armor" );
    } );

  } );

  describe( "synthesized skills", () => {

    it( "flags a skill that cannot be resolved for review", async () => {
      const { skills } = await adaptSkills( [
        baseSkill( { rank: 2, category: CATEGORIES.artisan, attribute: "cha" } ),
      ] );

      const { resolved } = skills[0];
      expect( resolved.resolution ).toBe( "synthesized" );
      expect( resolved.data.type ).toBe( "skill" );
      expect( resolved.data.name ).toBe( "TestSkill" );
      expect( resolved.data.system.level ).toBe( 2 );
      expect( resolved.data.system.skillType ).toBe( "artisan" );
      expect( resolved.data.system.attribute ).toBe( "cha" );
      expect( resolved.data.flags[ MODULE_ID ].unresolved ).toBe( true );
    } );

    it( "does not invent an attribute if Second Step did not provide one", async () => {
      const { skills } = await adaptSkills( [ baseSkill( { attribute: null } ) ] );

      expect( skills[0].resolved.data.system.attribute ).toBeNullable();
    } );

    it( "falls back to a general skill for synthesized skills with an unknown category", async () => {
      const { skills } = await adaptSkills( [ baseSkill( { category: "somethingNew" } ) ] );

      expect( skills[0].resolved.data.system.skillType ).toBe( "general" );
    } );

    it( "puts the specialization into the name of a synthesized skill", async () => {
      const { skills } = await adaptSkills( [
        baseSkill( { id: idSource( "ED4Knowledge" ), category: CATEGORIES.knowledge, name: "Elf Lore" } ),
      ] );

      expect( skills[0].resolved.data.name ).toBe( "Knowledge (Elf Lore)" );
    } );

  } );

  describe( "specializations", () => {

    it( "fills the empty parentheses of a template skill", async () => {
      mockSkillResolvable( { skillType: "knowledge", }, "Knowledge ()", "ED4Knowledge" );
      const { skills } = await adaptSkills( [
        baseSkill( { id: idSource( "ED4Knowledge" ), category: CATEGORIES.knowledge, name: "Accounting" } ),
      ] );

      expect( skills[0].resolved.data.name ).toBe( "Knowledge (Accounting)" );
    } );

    it( "appends the specialization if the skill has no placeholder", async () => {
      mockSkillResolvable( { skillType: "artisan", }, "Artisan Skill", "ED4Artisan" );
      const { skills } = await adaptSkills( [
        baseSkill( { id: idSource( "ED4Artisan" ), category: CATEGORIES.artisan, name: "Embroidery" } ),
      ] );

      expect( skills[0].resolved.data.name ).toBe( "Artisan Skill (Embroidery)" );
    } );

    it( "keeps skills that share an ID as separate items", async () => {
      mockSkillResolvable( { skillType: "knowledge", }, "Knowledge ()", "ED4Knowledge" );
      const { skills } = await adaptSkills( [ "Accounting", "Elf Lore", "Trolls" ].map( name => baseSkill( {
        id:       idSource( "ED4Knowledge" ),
        category: CATEGORIES.knowledge,
        name,
      } ) ) );

      expect( skills.map( adapted => adapted.resolved.data.name ) ).toEqual( [
        "Knowledge (Accounting)",
        "Knowledge (Elf Lore)",
        "Knowledge (Trolls)",
      ] );
      expect( skills[ 0 ].resolved.data ).not.toBe( skills[ 1 ].resolved.data );
      expect( skills.every( adapted => adapted.resolved.secondStepId === "ED4Knowledge" ) ).toBe( true );
    } );

  } );

  describe( "bookkeeping", () => {

    it( "keeps the UID of every skill and the order of the skills", async () => {
      const { skills } = await adaptSkills( [
        baseSkill( { id: idSource( "ED4First" ), uid: "uid-a" } ),
        baseSkill( { id: idSource( "ED4Second" ), uid: "uid-b" } ),
        baseSkill( { id: idSource( "ED4Third" ), uid: "uid-c" } ),
      ] );

      expect( skills.map( adapted => adapted.uid ) ).toEqual( [ "uid-a", "uid-b", "uid-c" ] );
      expect( skills.map( adapted => adapted.resolved.secondStepId ) )
        .toEqual( [ "ED4First", "ED4Second", "ED4Third" ] );
    } );

  } );

} );