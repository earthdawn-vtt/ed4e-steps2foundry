/**
 * @import { AdaptedEquipment } from "./equipment.mjs";
 * @import { MatrixGrant } from "./talents.mjs";
 */

import { MATRIX_TYPE_FROM_SECOND_STEP_MATRIX_ID } from "../constants/constants.mjs";

/**
 * Turns the equipment that grants a matrix into a matrix, in place. The matrix edid is what makes an item a matrix
 * in ed4e, so the original edid of the item is replaced.
 * @param {AdaptedEquipment[]} equipment - The adapted equipment. Gets modified.
 * @param {MatrixGrant[]} matrixGrants - The matrix grants from the talents.
 * @param {string} matrixEdid - See {@link getMatrixEdid}.
 * @returns {{ unmatched: MatrixGrant[] }} The grants for which no equipment was found.
 */
export function applyMatrixGrants( equipment, matrixGrants, matrixEdid ) {
  const granted = new Set();
  const unmatched = [];

  for ( const grant of matrixGrants ) {
    const target = equipment.find(
      adapted => !granted.has( adapted ) && adapted.resolved.secondStepId === grant.equipmentSecondStepId
    );
    if ( !target ) {
      unmatched.push( grant );
      continue;
    }
    granted.add( target );

    const { data } = target.resolved;
    data.system ??= {};
    data.system.edid = matrixEdid;
    data.system.matrix = { ...data.system.matrix, level: grant.level };

    const matrixType = MATRIX_TYPE_FROM_SECOND_STEP_MATRIX_ID[ grant.matrixId ];
    if ( matrixType ) data.system.matrix.matrixType = matrixType;

    target.matrixSpellSecondStepId = grant.spellSecondStepId;
  }

  return { unmatched };
}
