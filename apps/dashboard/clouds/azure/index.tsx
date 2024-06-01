import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac/runtime';
import { EaCWebState } from '../../../../src/state/EaCWebState.ts';
import { redirectRequest } from '@fathym/common';
import { EaCStatusProcessingTypes, FathymEaC, loadEaCSvc, waitForStatus } from '@fathym/eac/api';
import { EaCCloudAzureDetails } from '@fathym/eac';
import { EaCManageCloudForm } from '@fathym/atomic';

type AzurePageData = Record<string, unknown>;

export const handler: EaCRuntimeHandlerResult<EaCWebState, AzurePageData> = {
  GET(_req, ctx) {
    const data: AzurePageData = {};

    return ctx.Render(data);
  },

  async POST(req, ctx) {
    const formData = await req.formData();

    const cloudLookup = (formData.get('cloudLookup') as string) || crypto.randomUUID();

    const eac: FathymEaC = {
      EnterpriseLookup: ctx.State.EaC!.EnterpriseLookup,
      Clouds: {
        [cloudLookup]: {
          Details: {
            Name: formData.get('name') as string,
            Description: formData.get('description') as string,
            ApplicationID: formData.get('application-id') as string,
            AuthKey: formData.get('auth-key') as string,
            SubscriptionID: formData.get('subscription-id') as string,
            TenantID: formData.get('tenant-id') as string,
            Type: 'Azure',
          } as EaCCloudAzureDetails,
        },
      },
    };

    console.log(eac);

    const eacSvc = await loadEaCSvc(eac.EnterpriseLookup!, ctx.State.Username!);

    const commitResp = await eacSvc.Commit(eac, 60);

    const status = await waitForStatus(
      eacSvc,
      commitResp.EnterpriseLookup,
      commitResp.CommitID,
    );

    if (status.Processing == EaCStatusProcessingTypes.COMPLETE) {
      return redirectRequest('/dashboard', false, false);
    } else {
      return redirectRequest(
        `/dashboard?error=${
          encodeURIComponent(
            status.Messages['Error'] as string,
          )
        }&commitId=${commitResp.CommitID}`,
        false,
        false,
      );
    }
  },
};

export default function Azure({}: PageProps<AzurePageData>) {
  return <EaCManageCloudForm action='' />;
}
