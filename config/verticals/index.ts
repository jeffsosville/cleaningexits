/**
 * Vertical Configuration System
 *
 * Export all vertical configurations and utilities
 */

// Export individual vertical configs
export { cleaningVertical } from './cleaning.vertical';
export { landscapeVertical } from './landscape.vertical';
export { hvacVertical } from './hvac.vertical';

// Export registry
export { verticalRegistry } from './registry';

// Export utility functions
export {
  getVerticalBySlug,
  getVerticalByHostname,
  getCurrentVertical,
  getCurrentVerticalClient,
  getAllVerticals,
  getAllVerticalSlugs,
  isValidVertical,
  getPrimaryHostname,
  getAllHostnames,
} from './utils';
