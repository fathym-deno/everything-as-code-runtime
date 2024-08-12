import { EaCRuntimeHandlerResult } from '@fathym/eac-runtime';
import { EaCWebState } from '../../../../src/state/EaCWebState.ts';

export const handler: EaCRuntimeHandlerResult<EaCWebState> = {
  GET(_req, ctx) {
    return Response.json(ctx.State.EaC);
  },
};
