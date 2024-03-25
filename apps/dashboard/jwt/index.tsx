import { Action, CopyInput } from '@fathym/atomic';
import { loadJwtConfig } from '@fathym/eac';
import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac/runtime';
import { EaCWebState } from '../../../src/state/EaCWebState.ts';

interface JWTPageData {
  jwt?: string;
}

export const handler: EaCRuntimeHandlerResult<EaCWebState, JWTPageData> = {
  async GET(_req, ctx) {
    const jwt = await loadJwtConfig().Create({
      EnterpriseLookup: ctx.State.EaC!.EnterpriseLookup,
      Username: ctx.State.Username,
    });

    const data: JWTPageData = { jwt };

    return ctx.Render(data);
  },
};

export default function JWT({ Data }: PageProps<JWTPageData>) {
  return (
    <div class='mx-auto max-w-sm mt-8'>
      <CopyInput id='jwt' name='jwt' type='text' value={Data.jwt} />

      <p class='mt-8'>The token is good for 1 year.</p>

      <form class='mt-8'>
        <Action type='submit'>Create New JWT</Action>
      </form>
    </div>
  );
}
