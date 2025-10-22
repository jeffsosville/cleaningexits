/**
 * Main Configuration Export
 *
 * Central export point for all configuration and utilities
 */

// Export types
export type {
  VerticalBasicInfo,
  VerticalSEO,
  VerticalCategory,
  ValuationMultiples,
  BrokerDataSource,
  EmailTemplates,
  IndustryTerminology,
  VerticalConfig,
  VerticalHostnameMapping,
  VerticalRegistry,
} from './types';

// Export vertical configurations and utilities
export {
  // Individual verticals
  cleaningVertical,
  landscapeVertical,
  hvacVertical,
  // Registry
  verticalRegistry,
  // Utility functions
  getVerticalBySlug,
  getVerticalByHostname,
  getCurrentVertical,
  getCurrentVerticalClient,
  getAllVerticals,
  getAllVerticalSlugs,
  isValidVertical,
  getPrimaryHostname,
  getAllHostnames,
} from './verticals';
