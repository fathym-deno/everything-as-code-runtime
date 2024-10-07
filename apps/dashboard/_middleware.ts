import { EaCAzureADProviderDetails } from '@fathym/eac/identity';
import { FathymEaC } from '@fathym/eac-api';
import { loadEaCAzureSvc, loadEaCSvc } from '@fathym/eac-api/client';
import { createAzureADOAuthConfig, createOAuthHelpers } from '@fathym/common/oauth';
import { EaCRuntimeContext, EaCRuntimeHandler } from '@fathym/eac-runtime';
import { EaCWebState } from '../../src/state/EaCWebState.ts';

export default [
  async (req, ctx: EaCRuntimeContext<EaCWebState>) => {
    const denoKv = await ctx.Runtime.IoC.Resolve(Deno.Kv, 'eac');

    const currentEntLookup = await denoKv.get<string>([
      'User',
      ctx.State.Username!,
      'Current',
      'EnterpriseLookup',
    ]);

    let eac: FathymEaC | undefined = undefined;

    if (currentEntLookup.value) {
      const eacSvc = await loadEaCSvc(
        currentEntLookup.value,
        ctx.State.Username!,
      );

      eac = await eacSvc.Get(currentEntLookup.value);
    } else {
      const parentEaCSvc = await loadEaCSvc();

      const eacs = await parentEaCSvc.ListForUser(ctx.State.Username!, ctx.Runtime.EaC.EnterpriseLookup);

      if (eacs[0]) {
        await denoKv.set(
          ['User', ctx.State.Username!, 'Current', 'EnterpriseLookup'],
          eacs[0].EnterpriseLookup,
        );

        const eacSvc = await loadEaCSvc(
          eacs[0].EnterpriseLookup,
          ctx.State.Username!,
        );

        eac = await eacSvc.Get(eacs[0].EnterpriseLookup);
      }
      // else {
      //   throw new Deno.errors.NotFound(
      //     `Unable to locate a current EaC to use for the request.`,
      //   );
      // }
    }

    if (eac) {
      let [{ value: currentCloudLookup }, { value: currentResGroupLookup }] = await Promise.all([
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
          currentCloudLookup,
        );
      }

      if (currentCloudLookup) {
        const resGroupLookups = Object.keys(
          eac.Clouds![currentCloudLookup].ResourceGroups || {},
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
            currentResGroupLookup,
          );
        }
      }

      ctx.State.CloudLookup = currentCloudLookup || undefined;

      ctx.State.ResourceGroupLookup = currentResGroupLookup || undefined;

      ctx.State.EaC = eac;

      const parentEaCSvc = await loadEaCSvc();

      const jwt = await parentEaCSvc.JWT(
        eac.EnterpriseLookup!,
        ctx.State.Username!,
      );

      ctx.State.EaCJWT = jwt.Token;
    }

    if (ctx.State.Username) {
      const providerLookup = 'azure';

      const provider = ctx.Runtime.EaC!.Providers![providerLookup]!;

      const providerDetails = provider.Details as EaCAzureADProviderDetails;

      const oAuthConfig = createAzureADOAuthConfig(
        providerDetails!.ClientID,
        providerDetails!.ClientSecret,
        providerDetails!.TenantID,
        providerDetails!.Scopes,
      );

      const helpers = createOAuthHelpers(oAuthConfig);

      const sessionId = await helpers.getSessionId(req);

      const oauthKv = await ctx.Runtime.IoC.Resolve<Deno.Kv>(
        Deno.Kv,
        provider.DatabaseLookup,
      );

      const currentAccTok = await oauthKv.get<string>([
        'MSAL',
        'Session',
        sessionId!,
        'AccessToken',
      ]);

      if (currentAccTok.value) {
        const eacAzureSvc = await loadEaCAzureSvc(ctx.State.EaCJWT!);

        try {
          await eacAzureSvc.Tenants(
            ctx.State.EaC!.EnterpriseLookup!,
            currentAccTok.value!,
          );

          ctx.State.AzureAccessToken = currentAccTok.value;
        } catch (err) {
          ctx.Runtime.Logs.Package.warn('AzureAccessToken not working.', err);
        }
      }
    }

    const resp = ctx.Next();

    return resp;
  },
] as EaCRuntimeHandler[];
