import { redirectRequest } from '@fathym/common';
import { EaCCloudDetails } from '@fathym/eac/clouds';
import { EaCStatusProcessingTypes, FathymEaC } from '@fathym/eac-api';
import { loadEaCSvc } from '@fathym/eac-api/client';
import { waitForStatus } from '@fathym/eac-api/status';
import { EaCRuntimeHandlers } from '@fathym/eac-runtime';
import { EaCWebState } from '../../../../../src/state/EaCWebState.ts';

export const handler: EaCRuntimeHandlers<EaCWebState> = {
  async POST(req, ctx) {
    const formData = await req.formData();

    const cloudLookup =
      (formData.get('cloudLookup') as string) || crypto.randomUUID();

    const eac: FathymEaC = {
      EnterpriseLookup: ctx.State.EaC!.EnterpriseLookup,
      Clouds: {
        [cloudLookup]: {
          Token: ctx.State.AzureAccessToken!,
          Details: {
            Name: formData.get('subscription-name') as string,
            Description: formData.get('subscription-name') as string,
            SubscriptionID: formData.get('subscription-id') as string,
            IsDev: !!formData.get('is-dev'),
            BillingScope: formData.get('billing-scope') as string,
            Type: 'Azure',
          } as EaCCloudDetails,
        },
      },
    };

    const eacSvc = await loadEaCSvc(ctx.State.EaCJWT!);

    const commitResp = await eacSvc.Commit(eac, 60);

    const status = await waitForStatus(
      eacSvc,
      commitResp.EnterpriseLookup,
      commitResp.CommitID
    );

    if (status.Processing == EaCStatusProcessingTypes.COMPLETE) {
      return redirectRequest('/dashboard/clouds/azure', false, false);
    } else {
      return redirectRequest(
        `/dashboard/clouds/azure?commitId=${commitResp.CommitID}`,
        false,
        false
      );
    }
  },
};
