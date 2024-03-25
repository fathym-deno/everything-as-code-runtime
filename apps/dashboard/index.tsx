import { redirectRequest } from '@fathym/common';
import { EaCRuntimeContext, EaCRuntimeHandlerResult, PageProps } from '@fathym/eac/runtime';
import { EaCWebState } from '../../src/state/EaCWebState.ts';

export const handler: EaCRuntimeHandlerResult = {
  GET: (_req, ctx: EaCRuntimeContext<EaCWebState>) => {
    if (!ctx.State.EaC) {
      return redirectRequest('/dashboard/enterprises', false, false);
    } else if (!ctx.State.CloudLookup) {
      return redirectRequest('/dashboard/clouds/azure', false, false);
    } else if (!ctx.State.ResourceGroupLookup) {
      return redirectRequest('/dashboard/clouds/calz', false, false);
    } else {
      return redirectRequest('/dashboard/jwt', false, false);
    }
  },
};
