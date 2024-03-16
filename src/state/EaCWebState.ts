import { FathymEaC } from '@fathym/eac/api';

export type EaCWebState = {
  CloudLookup?: string;

  EaC?: FathymEaC;

  EaCJWT?: string;

  ResourceGroupLookup?: string;

  Username?: string;
};
