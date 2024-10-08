import { EaCRuntimeHandlerResult } from '@fathym/eac-runtime';
import { EaCWebState } from '../../../../src/state/EaCWebState.ts';
import { loadEaCSvc } from '@fathym/eac-api/client';

export const handler: EaCRuntimeHandlerResult<EaCWebState> = {
  async GET(_req, ctx) {
    const eacSvc = await loadEaCSvc(ctx.State.EaCJWT!);

    const connections = await eacSvc.Connections(ctx.State.EaC!);

    return Response.json(connections);
  },
};
