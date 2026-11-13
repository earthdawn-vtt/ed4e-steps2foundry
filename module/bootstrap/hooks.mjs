import { init } from "../hooks/init.mjs";
import { ready } from "../hooks/ready.mjs";

/**
 * Registers and initializes the necessary hooks for the module.
 */
export function registerHooks() {
  init();
  ready();
}