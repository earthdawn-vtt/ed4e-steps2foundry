import * as logging from "../logging/logging.mjs";
import { MODULE_ID } from "../constants/constants.mjs";

/**
 * Initializes the module by setting up the necessary hooks and logging its initialization.
 */
export function init() {
  Hooks.once( "init", () => {
    logging.log( `Initializing "${ MODULE_ID }" module` );
  } );
}