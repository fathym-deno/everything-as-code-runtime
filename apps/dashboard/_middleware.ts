import { EverythingAsCode } from '@fathym/eac';
import { EaCRuntimeContext, EaCRuntimeHandler } from '@fathym/eac/runtime';
import { EaCWebState } from '../../src/state/EaCWebState.ts';
import { FathymEaC, loadEaCSvc } from '@fathym/eac/api';

export default [
  async (_req, ctx: EaCRuntimeContext<EaCWebState>) => {
    const denoKv = await ctx.Runtime.IoC.Resolve(Deno.Kv, 'eac');

    const currentEntLookup = await denoKv.get<string>([
      'User',
      ctx.State.Username!,
      'Current',
      'EnterpriseLookup',
    ]);

    let eac: FathymEaC;

    if (currentEntLookup.value) {
      const eacSvc = await loadEaCSvc(
        currentEntLookup.value,
        ctx.State.Username!
      );

      eac = await eacSvc.Get(currentEntLookup.value);
    } else {
      let eacSvc = await loadEaCSvc('', ctx.State.Username!);

      const eacs = await eacSvc.ListForUser();

      if (eacs[0]) {
        await denoKv.set(
          ['User', ctx.State.Username!, 'Current', 'EnterpriseLookup'],
          eacs[0].EnterpriseLookup
        );

        eacSvc = await loadEaCSvc(
          eacs[0].EnterpriseLookup,
          ctx.State.Username!
        );

        eac = await eacSvc.Get(eacs[0].EnterpriseLookup);
      } else {
        throw new Deno.errors.NotFound(
          `Unable to locate a current EaC to use for the request.`
        );
      }
    }

    if (eac) {
      let [{ value: currentCloudLookup }, { value: currentResGroupLookup }] =
        await Promise.all([
          denoKv.get<string>([
            'User',
            ctx.State.Username!,
            'Current',
            'CloudLookup',
          ]),
          denoKv.get<string>([
            'User',
            ctx.State.Username!,
            'Current',
            'ResourceGroupLookup',
          ]),
        ]);

      const cloudLookups = Object.keys(eac.Clouds || {});

      if (currentCloudLookup && !cloudLookups.includes(currentCloudLookup)) {
        await denoKv.delete([
          'User',
          ctx.State.Username!,
          'Current',
          'CloudLookup',
        ]);

        currentCloudLookup = null;

        currentResGroupLookup = null;
      }

      if (!currentCloudLookup && cloudLookups.length > 0) {
        currentCloudLookup = cloudLookups[0];

        await denoKv.set(
          ['User', ctx.State.Username!, 'Current', 'CloudLookup'],
          currentCloudLookup
        );
      }

      if (currentCloudLookup) {
        const resGroupLookups = Object.keys(
          eac.Clouds![currentCloudLookup].ResourceGroups || {}
        );

        if (
          currentResGroupLookup &&
          !resGroupLookups.includes(currentResGroupLookup)
        ) {
          await denoKv.delete([
            'User',
            ctx.State.Username!,
            'Current',
            'ResourceGroupLookup',
          ]);

          currentResGroupLookup = null;
        }

        if (!currentResGroupLookup && resGroupLookups.length > 0) {
          currentResGroupLookup = resGroupLookups[0];

          await denoKv.set(
            ['User', ctx.State.Username!, 'Current', 'ResourceGroupLookup'],
            currentResGroupLookup
          );
        }
      }

      ctx.State.CloudLookup = currentCloudLookup || undefined;

      ctx.State.ResourceGroupLookup = currentResGroupLookup || undefined;

      ctx.State.EaC = eac;
    }

    const resp = ctx.Next();

    return resp;
  },
] as EaCRuntimeHandler[];
