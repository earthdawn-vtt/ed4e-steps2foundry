import * as logging from "../logging/logging.mjs";
import { MODULE_ID } from "../constants/constants.mjs";

export function init() {
  Hooks.once("init", () => {
      logging.log(`Initializing "${ MODULE_ID }" module`);
   });
}