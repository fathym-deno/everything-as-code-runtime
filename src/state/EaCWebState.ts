import { FathymEaC } from '@fathym/eac/api';

export type EaCWebState = {
  AzureAccessToken?: string;

  CloudLookup?: string;

  EaC?: FathymEaC;

  EaCJWT?: string;

  ResourceGroupLookup?: string;

  Username?: string;
};
