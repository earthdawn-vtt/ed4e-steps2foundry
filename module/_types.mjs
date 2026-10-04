/**
 * @import * from "./constants/constants.mjs"
 */

// region General Types

/**
 * Text content that represents HTML text.
 * @typedef {string} HtmlContent
 */

/**
 * A unique identifier for an entity (like a talent or skill) in the second step character sheet.
 * Follows UUID v4.
 * @typedef {string} UUID
 */

/**
 * A field value that represents a number but might be stored as a string.
 * @typedef {string|number} NumberValue
 */

/**
 * A field value that represents a boolean value.
 * @typedef {"YES"|"NO"|"Yes"|"No"|"yes"|"no"|"TRUE"|"FALSE"|"True"|"False"|"true"|"false"|true|false} BooleanValue
 */

/**
 * A two-letter code for a language following ISO 639.
 * @typedef {string} LanguageCode
 */

// endregion

// region SecondStep Export Types

/**
 * @typedef SecondStepExportBasics
 * @property {string} Name - Name of the character.
 * @property {string} Player - Player of the character.
 * @property {string} Gender - Gender of the character.
 * @property {string} Age - Age of the character.
 * @property {string} Height - Height of the character.
 * @property {string} Weight - Weight of the character.
 * @property {string} Hair - Hair of the character.
 * @property {string} Skin - Skin of the character.
 * @property {string} Eyes - Eyes of the character.
 * @property {string} Passion - Passion of the character.
 * @property {string} Traits - Traits of the character.
 * @property {HtmlContent} Description - Description of the character.
 * @property {HtmlContent} LogText - Log of the player.
 */

/**
 * @typedef SecondStepExportAttributeData
 * @property {NumberValue} Buildpoints - Number of attribute points spend on this attribute during character creation.
 * @property {NumberValue} Increases - Number of additional increases for this attribute.
 */

/**
 * @typedef SecondStepExportAttributes
 * @property {SecondStepExportAttributeData} Dex - Attribute data for Dexterity.
 * @property {SecondStepExportAttributeData} Str - Attribute data for Strength.
 * @property {SecondStepExportAttributeData} Tou - Attribute data for Toughness.
 * @property {SecondStepExportAttributeData} Per - Attribute data for Perception.
 * @property {SecondStepExportAttributeData} Wil - Attribute data for Willpower.
 * @property {SecondStepExportAttributeData} Cha - Attribute data for Charisma.
 */

/**
 * @typedef SecondStepExportDisciplineOptionalTalentData
 * @property {NumberValue} Circle - The circle of the corresponding discipline at which this talent was learned.
 * @property {string} ID - ID of the talent.
 */

/**
 * @typedef SecondStepExportDiscipline
 * @property {string} ID - ID of the discipline.
 * @property {NumberValue} Circle - The current circle of the discipline.
 * @property {NumberValue} Order - The place in the order in which multiple disciplines were learned.
 * @property {NumberValue} StartedAt - The circle of the primary discipline (#Order = 1) this discipline was learned at.
 * @property {SecondStepExportDisciplineOptionalTalentData[]} OptionalTalentsChosen - Optional talents that were learned in this discipline.
 */

/**
 * @typedef SecondStepExportPath
 * @property {string} ID - ID of the path.
 * @property {NumberValue} Rank - The rank of the path.
 * @property {string} Linked - The ID of the discipline this path belongs to.
 * @property {string[]} GrantedTalents - The IDs of the talents chosen for this path.
 */

/**
 * @typedef {"DisciplineFree"|"Race"} SecondStepExportTalentSourceType
 */

/**
 * @typedef SecondStepExportTalentSource
 * @property {SecondStepExportTalentSourceType} Type - The type of the talent, in which way it relates to its source.
 * @property {string} ID - ID of the corresponding discipline, path, namegiver, or other this talent belongs to.
 */

/**
 * @typedef {"Discipline"|"Free"|"Optional"|"PathTalent"|"PathGrantedTalent"|"Item"|"Effect,raisable"} SecondStepExportTalentType
 */

/**
 * @typedef SecondStepExportTalentRank
 * @property {NumberValue} Rank - The rank level this is about.
 * @property {string} Source - The ID of the source this talent is assigned to, e.g. "ED4Windling", or "ED4Wizard".
 * @property {NumberValue} Cost - The number of legend points it cost to raise the talent to the given `rank`.
 */

/**
 * @typedef SecondStepExportTalent
 * @property {NumberValue} Order - The order in which the talent was learned.
 * @property {string} ID - ID of the talent.
 * @property {NumberValue} Rank - The rank of the talent.
 * @property {NumberValue} Freerank - The number of ranks that were assigned for free at character creation.
 * @property {SecondStepExportTalentSource[]} Sources - The sources of the talent.
 * @property {string} Source - An readable string representation of sources this talent can be learned from as
 * comma-separated string. For example, the name of the namegiver ("Windling"), or discipline name.
 * and circle ("Wizard 2").
 * @property {string} DisciplineId - The IDs of the disciplines this talent can be learned in.
 * @property {string} Circle - The circles of the disciplines this talent can be learned in. Maps to the IDs
 * in `DisciplineId`.
 * @property {SecondStepExportTalentType} Type - The type of the talent.
 * @property {BooleanValue} [TalentPointsUsable] - Whether free ranks from character creation can be spent on this talent.
 * @property {NumberValue} CurrentCost - The tier on which the legend point cost for raising this talent is based on.
 * Mapping Novice, Journeyman, Warden, Master to 0 through 3.
 * @property {string} CurrentSource - The ID of the source this talent is assigned to, e.g. "ED4Windling", or "ED4Wizard".
 * @property {NumberValue} FirstLearnt - The discipline in which this talent was first learned, referred to by
 * its `Order` in {@link SecondStepExportDiscipline}.
 * @property {SecondStepExportTalentRank[]} Ranks - The ranks of this talent.
 * @property {UUID} UID - The unique ID of this talent.
 * @property {NumberValue} Step - The final step this talent is rolled with.
 * @property {NumberValue} Cost - The total legend point cost for the talent on its current rank.
 * @property {NumberValue} [FreeTalent] - If this talent is a free talent, this is the order of the free talent for the
 * discipline it is free in.
 * @property {string} [debug] - Debug information.
 * @property {string} [Spell] - The ID of the spell that is attuned to this talent if it is a matrix.
 * @property {BooleanValue} [HasBeenMerged] - Whether this talent has been merged with another talent. Unsure what it means
 * exactly.
 * @property {BooleanValue} [PayExtraForFirstRank] - `True` if this talent has a higher legend point cost du it being an
 * additional discipline.
 * @property {string} PathID - The ID of the path this talent belongs to.
 * @property {NumberValue} PathRank - The rank of the path at which this talent was learned.
 * @property {NumberValue} BonusRank - How many ranks this talent gets as a bonus on its rank.
 */

/**
 * The full name of an attribute, if any (it seems like it is a `&nbsp` entity otherwise).
 * @typedef {"Dexterity"|"Toughness"|"Strength"|"Perception"|"Willpower"|"Charisma"} SecondStepExportAttributeName
 */

/**
 * @typedef SecondStepExportKnack
 * @property {string} ID - The ID of the knack.
 * @property {NumberValue} Step - The step to roll the knack with.
 * @property {SecondStepExportAttributeName} Attribute - The attribute the knack is based on.
 * @property {NumberValue} [Index] - I do not know yet what this refers to.
 */

/**
 * @typedef {"General"|"Knowledge"|"Artisan"} SecondStepExportSkillCategory
 */

/**
 * @typedef SecondStepExportSkill
 * @property {string} ID - ID of the skill.
 * @property {NumberValue} Rank - The rank of the skill.
 * @property {NumberValue} Freerank - The number of ranks that were assigned for free at character creation.
 * @property {SecondStepExportSkillCategory} Category - The category of the skill.
 * @property {UUID} UID - The unique ID of this skill.
 * @property {SecondStepExportAttributeName} Attribute - The attribute the skill is based on, if any.
 * @property {string} Name - The name of the skill. Used for Knowledge and Artisan Skills, which need further definition.
 */

/**
 * @typedef SecondStepExportSpell
 * @property {string} ID - ID of the spell.
 * @property {NumberValue} Index - Sort index in order of when the spell was selected/learned.
 * @property {NumberValue} [defaultEffect] - Unknown
 */

/**
 * @typedef {
 * "Accomodation"
 * |"Adventuring"
 * |"Armor"
 * |"Blood Charm"
 * |"Blood Ink"
 * |"Clothing"
 * |"Healing Aid / Potion"
 * |"Healing Aid"
 * |"Magic"
 * |"Melee Weapon"
 * |"Missile Weapon"
 * |"Missile"
 * |"Mount"
 * |"Provender"
 * |"Rune Tattoo"
 * |"Shield"
 * |"Thread Item"
 * |"Thrown"
 * |"Trade Services"
 * |"Transport"
 * |"Valuable"
 * } SecondStepExportEquipmentType
 */

/**
 * @typedef SecondStepExportEquipment
 * @property {string} ID - ID of the equipment.
 * @property {NumberValue} Count - How much or many of this the character has.
 * @property {BooleanValue} InUse - Whether this equipment is currently in use.
 * @property {SecondStepExportEquipmentType} Type - The type of the equipment.
 * @property {NumberValue} [DamageStep] - The damage step for weapons, if applicable.
 * @property {NumberValue} [PhForge] - The number of times this shield or armor was forged for its physical value, if applicable.
 * @property {NumberValue} [MyForge] - The number of times this shield or armor was forged for its mystical value, if applicable.
 * @property {NumberValue} [Forged] - The number of times this weapon was forged, if applicable.
 * @property {NumberValue} [Rank] - The rank of the equipment, if applicable. For example, the rank of the thread to a thread item.
 * @property {NumberValue} [Cost] - The number of legend points spent on this equipment, if applicable.
 */

/**
 * @typedef {"Ed12C"|"EdCOption"|"ED3"|"ED10"|"ED4"} SecondStepExportEdition
 */

/**
 * @typedef {NumberValue|"PERstep"} SecondStepExportSpellpoints
 */

/**
 * @typedef {"Free"|"4ed"|"1Prog"|"2ed"|"1Fib"|"2Fib"} SecondStepExportSpellCostOptions
 */

/**
 * @typedef {"Novice"|"Journeyman"|"Warden"|"Master"} SecondStepExportTierOptions
 */

/**
 * @typedef {"1st"|"Best"} SecondStepExportDurabilityOptions
 */

/**
 * @typedef {"Costs"|"1perCMax"|"1perCSum"|"FreeCMax"|"FreeCSum"} SecondStepExportAttributeIncreaseOptions
 */

/**
 * @typedef {"Highest"|"Stack"} SecondStepExportDisciplineBonusesOptions
 */

/**
 * @typedef {"First"|"Highest"} SecondStepExportCasterCircleOptions
 */

/**
 * @typedef SecondStepExportOptions
 * @property {SecondStepExportEdition} Edition - The edition used in the character sheet.
 * @property {NumberValue} Attributepoints - The number of attribute points available to spend on character creation.
 * @property {NumberValue} MaxAttributeIncrease - The maximum number of points an attribute can be increased by.
 * @property {NumberValue} Talentpoints - The number of ranks that can be assigned to talents for free at character creation.
 * @property {SecondStepExportSpellpoints} Spellpoints - The number of spell points available to spend on character creation.
 * @property {NumberValue} KnowledgeSkillpoints - The number of ranks that can be assigned to Knowledge Skills for free at character creation.
 * @property {NumberValue} ArtisanSkillpoints - The number of ranks that can be assigned to Artisan Skills for free at character creation.
 * @property {NumberValue} SpeakSkillpoints - The number of free ranks assigned to the "Speak Language" skill for free at character creation.
 * @property {NumberValue} ReadSkillpoints - The number of free ranks assigned to the "Read and Write Language" skill for free at character creation.
 * @property {NumberValue} FreeSkillpoints - The number of ranks that can be assigned to skills in general for free at character creation.
 * @property {BooleanValue} BuyMoreOptionalMatrices - Whether the optional matrix talents can be bought for multiple spellcasting disciplines.
 * @property {BooleanValue} FreeMatricesStack - Whether free matrices of multiple spellcasting disciplines stack.
 * @property {BooleanValue} BuyMatricesPerDiscipline - unsure
 * @property {BooleanValue} CasterCircle5Bonus - unsure
 * @property {SecondStepExportSpellCostOptions} SpellsCostLP - Determines how much LP spells cost to learn.
 * @property {BooleanValue} FirstWoundFree - Whether the first wound doesn't impose a penalty.
 * @property {string} Books - Which source books are considered.
 * @property {SecondStepExportEdition} StepDic - The edition used for the Step/Dice table.
 * @property {SecondStepExportTierOptions} SkillFreeRanksLimit - Up to which tier skill can free skill ranks be assigned at character creation.
 * @property {BooleanValue} RangedAggressive - Whether the modifiers from Aggressive Stance apply to ranged attacks.
 * @property {SecondStepExportDurabilityOptions} Durability - Which durability modifier to use when multi-disciplining.
 * @property {SecondStepExportAttributeIncreaseOptions} AttributeIncrease - How to spend LP when increasing attributes.
 * @property {SecondStepExportDisciplineBonusesOptions} DiscBonusesStack - How discipline bonus modifiers stack when multi-disciplining.
 * @property {SecondStepExportCasterCircleOptions} CasterCircle - Which spellcasting discipline circle counts for determining the rank of free matrices.
 * @property {BooleanValue} AllTalentsToAdvance - Whether the optional rule for circle advancement using all talents is used.
 * @property {string} TalentOverlaps - unknown
 */

/**
 * @typedef {"Follower"|"Adherent"|"Exemplar"} SecondStepExportQuestorTier
 */

/**
 * @typedef SecondStepExportDevotion
 * @property {string} devotionID - The ID of the devotion.
 * @property {NumberValue} devotionRank - The rank of the devotion.
 * @property {NumberValue} devotionStep - The final step to roll the devotion with.
 * @property {string} [devotionAbility] - unknown
 * @property {SecondStepExportQuestorTier} Cost - The tier determining the LP cost for the devotion.
 */

/**
 * @typedef SecondStepExportQuestor
 * @property {string} Doctrine - The ID of the passion of this questor.
 * @property {SecondStepExportDevotion[]} Ranks - The devotions for each rank.
 * @property {NumberValue} Rank - The level of the questor.
 * @property {NumberValue} devotionPoints - The number of current devotion points.
 * @property {NumberValue} questorDevotionStep - The step of the "Questor" devotion.
 */

/**
 * What threads can target for their effect. Either the UUID of an entity or the name of a characteristic.
 * @typedef {UUID|"Empty"|"PhDef"|"MyDef"|"SoDef"|"WndTh"|"MyArm"|"Dur"} SecondStepExportThreadTarget
 */

/**
 * @typedef SecondStepExportThread
 * @property {SecondStepExportThreadTarget} Target - What the thread targets.
 * @property {NumberValue} Rank - The rank of the thread.
 */

/**
 * All kinds of things with magical effects, like threads to patterns, blood promises, and so on.
 * @typedef SecondStepExportMagic
 * @property {string} ID - The ID of the magic.
 * @property {SecondStepExportThread[]} [Threads] - The active threads that are attached to this magic.
 * @property {SecondStepExportThreadTarget} [Target] - What the thread targets.
 * @property {BooleanValue} Applicable - Whether this magic is currently active and its effects applied.
 */

/**
 * @typedef {"Self"|"External"} SecondStepExportEffectSource
 */

/**
 * @typedef {"Talent"|"Legend Points Award"|"Spell"|"Custom"} SecondStepExportEffectCategory
 */

/**
 * @typedef SecondStepExportEffectUIData
 * @property {string|UUID} ID - The ID or UUID of the entity that causes the effect.
 * @property {BooleanValue} Active - Whether the effect is currently active.
 * @property {NumberValue} [LP] - How much LP this effect costs or gives.
 * @property {NumberValue} Extra - The numeric modifier of this effect, like the number to add to the rank of a talent.
 * @property {SecondStepExportEffectSource} Source - Whether this effect comes from the character itself or from an external source.
 * @property {SecondStepExportEffectCategory} Category - The category of the effect.
 */

/**
 * @typedef {"Short"|"Long"} SecondStepExportEffectDuration
 */

/**
 * @typedef {"AStep"|"Combat"|"Health"|"LP"|"Talent"|"Text"|"XTalent"} SecondStepExportEffectModifierCategory
 */

/**
 * @typedef {"Empty"|"DexStep"|"StrStep"|"TouStep"|"PerStep"|"WilStep"|"ChaStep"} SecondStepExportAttributeStepEffectTarget
 */

/**
 * @typedef {"Empty"|"MlAtk"|"MlDam"|"UaAtk"|"UaDam"|"RngAtk"|"RngDam"|"Cast"|"SplEff"} SecondStepExportCombatEffectTarget
 */

/**
 * @typedef {"Empty"|"Uncon"|"Death"|"WndTh"|"Dur"|"RecTest"|"RecStep"} SecondStepExportHealthEffectTarget
 */

/**
 * @typedef SecondStepExportEffectModifier
 * @property {SecondStepExportEffectModifierCategory} Category - The category of the modifier.
 * @property {SecondStepExportCombatEffectTarget|SecondStepExportHealthEffectTarget|SecondStepExportAttributeStepEffectTarget|string} ID - The target of the
 * modifier depending on the category. Can be an ability ID.
 * @property {NumberValue|string} Modifier - The modifier value.
 * @property {BooleanValue} [IsMultipliable] - Whether the modifier can be multiplied.
 * @property {BooleanValue} [IsRaisable] - Whether the extra talent's rank can be raised with LP.
 */

/**
 * @typedef SecondStepExportEffect
 * @property {string} ID - The ID of the effect.
 * @property {string} Name - The generic name of the effect.
 * @property {string} Description - The custom description of the effect.
 * @property {SecondStepExportEffectDuration} Duration - The duration of the effect.
 * @property {SecondStepExportEffectCategory} Category - The category of the effect.
 * @property {SecondStepExportEffectModifier[]} Modifiers - The modifiers of the effect.
 */

/**
 * @typedef SecondStepExportHomebrew
 * @property {SecondStepExportEffect[]} Effects
 */

/**
 * @typedef SecondStepExport
 * @property {SecondStepExportBasics} Basic - Basic information about the character.
 * @property {string} Race - Id of the namegiver of the character.
 * @property {number} attributePoints - Number of attribute points to spend on character creation.
 * @property {SecondStepExportAttributes} Attributes - Attribute data.
 * @property {number|null} LegendPoints - Amount of total Legend Points this character has.
 * @property {[]} MiscSpent - n/a.
 * @property {SecondStepExportDiscipline[]} Disciplines - Discipline data.
 * @property {SecondStepExportPath[]} Paths - Path data.
 * @property {SecondStepExportTalent[]} Talents - Talent data.
 * @property {SecondStepExportKnack[]} Knacks - Knack data.
 * @property {SecondStepExportSkill[]} Skills - Skill data.
 * @property {SecondStepExportSpell[]} Spells - Spell data.
 * @property {SecondStepExportEquipment[]} Equipment - Equipment data.
 * @property {SecondStepExportOptions} Options - Second Step Settings for this character.
 * @property {NumberValue} Damage - How much damage this character currently has.
 * @property {NumberValue} Wounds - How many wounds this character currently has.
 * @property {string} PortraitURL - URL to the selected portrait image.
 * @property {SecondStepExportQuestor} Questor - The questor data for this character.
 * @property {NumberValue} StepsVersion - The version of the Second Step app.
 * @property {SecondStepExportMagic[]} Magic - All magic effects currently active.
 * @property {object} UIOptions - Additional options for the Second Step UI. Irrelevant for us here.
 * @property {SecondStepExportEffectUIData[]} Effects - All effects that are currently active, as shown in the UI.
 * @property {LanguageCode} Language - The language of the character.
 * @property {NumberValue} Theme - The theme of the Second Step UI.
 * @property {SecondStepExportHomebrew} Homebrew - The homebrew data for this character.
 */

// endregion

// region Steps2Foundry Parsed Types

/**
 * A normalized value for a {@link SecondStepExportBasics} string property, stripped of sentinels.
 * @typedef {string|null} NormalizedStringValue
 */

/**
 * A normalized value for a {@link SecondStepExportBasics} {@link HtmlContent} property, stripped of sentinels.
 * @typedef {HtmlContent|null} NormalizedHtmlContent
 */

/**
 * A SecondStep enum-like token (e.g. `"General"`, `"Thread Item"`) after being run through `normalizeEnumToken`,
 * i.e., reshaped into a lower-camelCase token. This is a purely syntactic transform; it carries no ed4e-specific
 * meaning by itself.
 * @typedef {string} NormalizedEnumToken
 */

/**
 * The normalized form of {@link SecondStepExportSkillCategory}.
 * @typedef {"general"|"knowledge"|"artisan"} NormalizedSkillCategory
 */

/**
 * The normalized form of {@link SecondStepExportEquipmentType}.
 * @typedef {
 * "accomodation"
 * |"adventuring"
 * |"armor"
 * |"bloodCharm"
 * |"bloodInk"
 * |"clothing"
 * |"healingAidPotion"
 * |"healingAid"
 * |"magic"
 * |"meleeWeapon"
 * |"missileWeapon"
 * |"missile"
 * |"mount"
 * |"provender"
 * |"runeTattoo"
 * |"shield"
 * |"threadItem"
 * |"thrown"
 * |"tradeServices"
 * |"transport"
 * |"valuable"
 * } NormalizedEquipmentType
 */

/**
 * The normalized form of {@link SecondStepExportEffectSource}.
 * @typedef {"self"|"external"} NormalizedEffectSource
 */

/**
 * The normalized form of {@link SecondStepExportEffectCategory}.
 * @typedef {"talent"|"legendPointsAward"|"spell"|"custom"} NormalizedEffectCategory
 */

/**
 * The normalized form of {@link SecondStepExportEffectModifierCategory}. Note that single-word all-caps source
 * tokens (`"AStep"`, `"XTalent"`, `"LP"`) collapse to fully lowercase rather than internal camelCase, since
 * `normalizeEnumToken` only inserts word boundaries at lowercase-to-uppercase transitions.
 * @typedef {"astep"|"combat"|"health"|"lp"|"talent"|"text"|"xtalent"} NormalizedEffectModifierCategory
 */

/**
 * The normalized form of {@link SecondStepExportEffectDuration}.
 * @typedef {"short"|"long"} NormalizedEffectDuration
 */

/**
 * The normalized form of {@link SecondStepExportTalentType}.
 * @typedef {"discipline"|"free"|"optional"|"pathTalent"|"pathGrantedTalent"|"item"|"effectRaisable"} NormalizedTalentType
 */

/**
 * A normalized value for a {@link SecondStepExportBasics} string property, stripped of sentinels.
 * @typedef ParsedIdSource
 * @property {string} id - The canonical ID of the entity.
 * @property {SecondStepExportSourceTag} source - The source tag of the entity.
 * @property {string} secondStepId - The original ID of the entity, as exported from the Second Step app.
 */

/**
 * @typedef ParsedBasics
 * @property {NormalizedStringValue} name - Name of the character.
 * @property {NormalizedStringValue} player - Player of the character.
 * @property {NormalizedStringValue} gender - Gender of the character.
 * @property {NormalizedStringValue} age - Age of the character.
 * @property {NormalizedStringValue} height - Height of the character.
 * @property {NormalizedStringValue} weight - Weight of the character.
 * @property {NormalizedStringValue} hair - Hair of the character.
 * @property {NormalizedStringValue} skin - Skin of the character.
 * @property {NormalizedStringValue} eyes - Eyes of the character.
 * @property {NormalizedStringValue} passion - Passion of the character.
 * @property {NormalizedStringValue} traits - Traits of the character.
 * @property {NormalizedHtmlContent} description - Description of the character as HTML text.
 * @property {NormalizedHtmlContent} logText - Player's log as HTML text.
 */

/**
 * @typedef ParsedAttributes
 * @property {number} buildPoints - Number of attribute points spend on this attribute during character creation.
 * @property {number} increases - Number of additional increases for this attribute.
 */

/**
 * @typedef ParsedOptionalTalent
 * @property {ParsedIdSource} id - ID of the talent.
 * @property {number} circle - The circle of the corresponding discipline at which this talent was learned.
 */

/**
 * @typedef ParsedDiscipline
 * @property {ParsedIdSource} id - ID of the discipline.
 * @property {number} circle - The current circle of the discipline.
 * @property {number} order - The place in the order in which multiple disciplines were learned.
 * @property {number} startedAt - The circle of the primary discipline (#Order = 1) this discipline was learned at.
 * @property {ParsedOptionalTalent[]} optionalTalentsChosen - Optional talents that were learned in this discipline.
 */

/**
 * @typedef ParsedTalentRank
 * @property {number} rank - The rank level this is about.
 * @property {number} lpCost - The number of legend points it cost to raise the talent to the given `rank`.
 */

/**
 * @typedef ParsedTalent
 * @property {ParsedIdSource} id - ID of the talent.
 * @property {number} order - The order in which the talent was learned.
 * @property {number} rank - The rank of the talent.
 * @property {number} freeRanks - The number of ranks that were assigned for free at character creation.
 * @property {ParsedIdSource} source - The ID of the entity that provides the talent, e.g., disciplines, namegiver, item, or effect.
 * @property {ParsedIdSource[]} disciplineIds - The IDs of every discipline in which this talent can be learned in.
 * Empty for talents not tied to any discipline (like path-/item-/effect-granted talents).
 * @property {number[]} circles - The circles of each discipline in {@link disciplineIds}, at the same index.
 * @property {NormalizedTalentType} type - The type of the talent.
 * @property {NumberValue} lpCostTier - The tier on which the legend point cost for raising this talent is based on.
 * Mapping Novice, Journeyman, Warden, Master to 0 through 3. Free talents are mapped to -1.
 * @property {ParsedTalentRank[]} ranks - The ranks of this talent.
 * @property {UUID|null} uid - The unique ID of this talent.
 * @property {number} lpCost - The total legend point cost for the talent on its current rank.
 * @property {ParsedIdSource} [spell] - The ID of the spell that is attuned to this talent if it is a matrix.
 * @property {ParsedIdSource} [path] - The ID of the path this talent belongs to.
 * @property {number} [pathRank] - The rank of the path at which this talent was learned.
 * @property {number} [bonusRank] - How many ranks this talent gets as a bonus on its rank.
 */

/**
 * @typedef ParsedKnack
 * @property {ParsedIdSource} id - ID of the knack.
 * @property {AttributeAbbreviation|null} attribute - The attribute the knack is based on, or `null` if the
 * SecondStep export used a sentinel (e.g. `"&nbsp;"`) that does not map to a known attribute.
 */

/**
 * @typedef ParsedSkill
 * @property {ParsedIdSource} id - ID of the skill.
 * @property {number} rank - The rank of the skill.
 * @property {number} freeRanks - The number of ranks that were assigned for free at character creation.
 * @property {NormalizedSkillCategory} category - The category of the skill.
 * @property {UUID} uid - The unique ID of this skill.
 * @property {string|null} attribute - The attribute the skill is based on, if any. As the 3-letter lowercase abbreviation.
 * @property {string|null} name - The name of the skill. Used for Knowledge and Artisan Skills, which need further definition.
 */

/**
 * @typedef ParsedSpell
 * @property {ParsedIdSource} id - ID of the spell.
 * @property {number} index - Sort index in order of when the spell was selected/learned.
 */

/**
 * @typedef ParsedEquipment
 * @property {ParsedIdSource} id - ID of the equipment.
 * @property {number} amount - How much or many of this the character has.
 * @property {boolean} inUse - Whether this equipment is currently in use.
 * @property {NormalizedEquipmentType} type - The type of the equipment.
 * @property {number} [damageStep] - The damage step for weapons, if applicable.
 * @property {number} [timesForgedPhysical] - The number of times this shield or armor was forged for its physical value, if applicable.
 * @property {number} [timesForgedMystical] - The number of times this shield or armor was forged for its mystical value, if applicable.
 * @property {number} [timesForged] - The number of times this weapon was forged, if applicable.
 * @property {number} [rank] - The rank of the equipment, if applicable. For example, the rank of the thread to a thread item.
 * @property {number} [lpCost] - The number of legend points spent on this equipment, if applicable.
 */

/**
 * @typedef ParsedPath
 * @property {ParsedIdSource} id - ID of the path.
 * @property {number} rank - The rank of the path.
 * @property {ParsedIdSource} linked - The ID of the discipline this path is linked to.
 * @property {ParsedIdSource[]} grantedTalents - The IDs of the talents that are granted by this path.
 */

/**
 * @typedef ParsedDevotion
 * @property {ParsedIdSource} id - The ID of the devotion.
 * @property {number} rank - The rank of the devotion.
 * @property {QuestorDevotionTier} tier - The tier of the devotion.
 */

/**
 * @typedef ParsedQuestor
 * @property {ParsedIdSource} passionId - ID of the questor.@property {string} Doctrine - The ID of the passion of this questor.
 * @property {ParsedDevotion[]} devotions - The devotions for each rank.
 * @property {number} rank - The level of the questor.
 * @property {number} devotionPoints - The number of current devotion points.
 * @property {number} questorDevotionStep - The step of the "Questor" devotion.
 */

/**
 * @typedef ParsedThread
 * @property {number} rank - The rank of the thread.
 * @property {MappedSecondStepThreadTarget} target - What the thread targets.
 */

/**
 * All kinds of things with magical effects, like threads to patterns, blood promises, and so on.
 * @typedef ParsedMagic
 * @property {ParsedIdSource} id - The ID of the magic.
 * @property {ParsedThread[]} [threads] - The active threads that are attached to this magic.
 * @property {MappedSecondStepThreadTarget|ParsedIdSource|null}  [target] - What the magic targets.
 * @property {boolean} active - Whether this magic is currently active and its effects applied.
 */

/**
 * @typedef ParsedEffect
 * @property {ParsedIdSource} id - The ID or UUID of the entity that causes the effect.
 * @property {boolean} active - Whether the effect is currently active.
 * @property {number} [lp] - How much LP this effect costs or gives.
 * @property {number} extra - The numeric modifier of this effect, like the number to add to the rank of a talent.
 * @property {NormalizedEffectSource} source - Whether this effect comes from the character itself or from an external source.
 * @property {NormalizedEffectCategory} category - The category of the effect.
 */

/**
 * @typedef ParsedEffectModifier
 * @property {NormalizedEffectModifierCategory} category - The category of the modifier.
 * @property {SecondStepExportCombatEffectTarget|SecondStepExportHealthEffectTarget|SecondStepExportAttributeStepEffectTarget|string} id - The target of the
 * modifier depending on the category. Can be an ability ID.
 * @property {number|string} modifier - The modifier value.
 * @property {boolean} [multipliable] - Whether the modifier can be multiplied.
 * @property {boolean} [raisable] - Whether the extra talent's rank can be raised with LP.'
 */

/**
 * @typedef ParsedHomebrewEffect
 * @property {ParsedIdSource} id - The ID of the effect.
 * @property {NormalizedStringValue} name - The generic name of the effect.
 * @property {NormalizedStringValue} description - The custom description of the effect.
 * @property {NormalizedEffectDuration} duration - The duration of the effect.
 * @property {NormalizedEffectCategory} category - The category of the effect.
 * @property {ParsedEffectModifier[]} modifiers - The modifiers of the effect.
 */

/**
 * @typedef ParsedMetaData
 * @property {number} stepsVersion - The version of the Second Step app.
 * @property {string} edition - The edition used for the Step/Dice table.
 * @property {LanguageCode} language - The language used in the app.
 * @property {number} attributePoints - The number of attribute points available to spend on character creation.
 * @property {SecondStepExportOptions} options - The Second Step Settings for this character.
 */

/**
 * @typedef ParsedExportData
 * @property {ParsedMetaData} meta - Metadata about the character and the Second Step app.
 * @property {ParsedBasics} basics - Basic information about the character.
 * @property {string|null} portraitUrl - URL to the selected portrait image.
 * @property {ParsedIdSource} namegiver - The namegiver of the character.
 * @property {ParsedAttributes} attributes - Attribute data.
 * @property {ParsedDiscipline[]} disciplines - Discipline data.
 * @property {ParsedPath[]} paths - Path data.
 * @property {ParsedQuestor|null} questor - Questor data, or `null` if this character is not a questor.
 * @property {ParsedTalent[]} talents - Talent data.
 * @property {ParsedKnack[]} knacks - Knack data.
 * @property {ParsedSkill[]} skills - Skill data.
 * @property {ParsedSpell[]} spells - Spell data.
 * @property {ParsedEquipment[]} equipment - Equipment data.
 * @property {ParsedMagic[]} magic - All magic effects currently active.
 * @property {ParsedEffect[]} effects - All effects that are currently active, as shown in the UI.
 * @property {ParsedHomebrewEffect[]} homebrewEffects - The homebrew data for this character.
 * @property {number} damage - How much damage this character currently has.
 * @property {number} wounds - How many wounds this character currently has.
 * @property {number} legendPoints - Amount of total Legend Points this character has.
 */

// endregion
