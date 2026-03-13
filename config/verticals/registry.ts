import { VerticalRegistry } from '../types';
import { cleaningVertical } from './cleaning.vertical';
import { landscapeVertical } from './landscape.vertical';
import { hvacVertical } from './hvac.vertical';
import { pestVertical } from './pest.vertical';
import { plumbingVertical } from './plumbing.vertical';

/**
 * Global registry of all vertical configurations
 */
export const verticalRegistry: VerticalRegistry = {
  verticals: {
    cleaning: cleaningVertical,
    landscape: landscapeVertical,
    hvac: hvacVertical,
    pest: pestVertical,
    plumbing: plumbingVertical,
  },

  hostnameMappings: [
    // Cleaning vertical
    { hostname: 'cleaningexits.com', verticalSlug: 'cleaning', isPrimary: true },
    { hostname: 'www.cleaningexits.com', verticalSlug: 'cleaning', isPrimary: false },
    { hostname: 'localhost', verticalSlug: 'cleaning', isPrimary: false }, // Development

    // Landscape vertical
    { hostname: 'landscapeexits.com', verticalSlug: 'landscape', isPrimary: true },
    { hostname: 'www.landscapeexits.com', verticalSlug: 'landscape', isPrimary: false },

    // HVAC vertical
    { hostname: 'hvacexits.com', verticalSlug: 'hvac', isPrimary: true },
    { hostname: 'www.hvacexits.com', verticalSlug: 'hvac', isPrimary: false },

    // Pest Control vertical
    { hostname: 'pestexits.com', verticalSlug: 'pest', isPrimary: true },
    { hostname: 'www.pestexits.com', verticalSlug: 'pest', isPrimary: false },

    // Plumbing vertical
    { hostname: 'plumbingexits.com', verticalSlug: 'plumbing', isPrimary: true },
    { hostname: 'www.plumbingexits.com', verticalSlug: 'plumbing', isPrimary: false },
  ],

  defaultVertical: 'cleaning',
};
