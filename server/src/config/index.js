/**
 * Config Index
 * Loads environment-based configuration.
 */

import { NODE_ENV } from "./env.js";

import devConfig from "./dev.js";
import prodConfig from "./prod.js";

const config = NODE_ENV === "production" ? prodConfig : devConfig;

/**
 * Get current configuration.
 * @returns {object}
 */
export function getConfig() {
  return config;
}

/**
 * Get a specific config value.
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {any}
 */
export function getConfigValue(key, defaultValue) {
  return config[key] || defaultValue;
}

export default config;
