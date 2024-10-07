import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac-runtime';
import { EaCWebState } from '../../../../src/state/EaCWebState.ts';
import { redirectRequest } from '@fathym/common';
import { EaCStatusProcessingTypes, FathymEaC } from '@fathym/eac-api';
import { loadEaCAzureSvc, loadEaCSvc } from '@fathym/eac-api/client';
import { waitForStatus } from '@fathym/eac-api/status';
import { EaCCloudAzureDetails } from '@fathym/eac/clouds';
import { ConnectAzure } from '@fathym/atomic';

export type AzurePageData = {
  billingScopes: Record<string, string>;

  isAzureConnected: boolean;

  subs: Record<string, string>;

  tenants: Record<string, string>;
};

export const handler: EaCRuntimeHandlerResult<EaCWebState, AzurePageData> = {
  async GET(_req, ctx) {
    const data: AzurePageData = {
      billingScopes: {},
      isAzureConnected: !!ctx.State.AzureAccessToken,
      subs: {},
      tenants: {},
    };

    const svcCalls: (() => Promise<void>)[] = [];

    const eacAzureSvc = await loadEaCAzureSvc(ctx.State.EaCJWT!);

    if (ctx.State.AzureAccessToken) {
      const _provider = ctx.Runtime.EaC.Providers!['azure']!;

      svcCalls.push(async () => {
        const tenants = await eacAzureSvc.Tenants(
          ctx.State.EaC!.EnterpriseLookup!,
          ctx.State.AzureAccessToken!,
        );

        data.tenants = tenants.reduce((acc, tenant) => {
          acc[tenant.tenantId!] = tenant.displayName!;

          return acc;
        }, {} as Record<string, string>);
      // });

      // svcCalls.push(async () => {
        const subs = await eacAzureSvc.Subscriptions(
          ctx.State.EaC!.EnterpriseLookup!,
          ctx.State.AzureAccessToken!,
        );

        data.subs = subs.reduce((acc, sub) => {
          acc[sub.subscriptionId!] = sub.displayName!;

          return acc;
        }, {} as Record<string, string>);
      // });

      // svcCalls.push(async () => {
        const billingAccounts = await eacAzureSvc.BillingAccounts(
          ctx.State.EaC!.EnterpriseLookup!,
          ctx.State.AzureAccessToken!,
        );

        data.billingScopes = billingAccounts.reduce((acc, billingAccount) => {
          const [id, displayName] = [
            billingAccount.id!,
            billingAccount.displayName,
          ];

          switch (billingAccount.agreementType!) {
            case 'MicrosoftOnlineServicesProgram': {
              acc[id] = `MOSP - ${displayName}`;
              break;
            }

            case 'MicrosoftCustomerAgreement': {
              const billingProfiles = billingAccount.billingProfiles?.value || [];

              billingProfiles.forEach((billingProfile) => {
                const invoiceSections = billingProfile.invoiceSections?.value || [];

                invoiceSections.forEach((invoiceSection) => {
                  acc[
                    invoiceSection.id!
                  ] =
                    `MCA - ${displayName} - Profile - ${billingProfile.displayName} - Invoice - ${invoiceSection.displayName}`;
                });
              });
              break;
            }

            case 'MicrosoftPartnerAgreement': {
              // TODO(mcgear): Add support for Partner Agreement Flows
              // https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/programmatically-create-subscription-microsoft-partner-agreement?tabs=rest#find-customers-that-have-azure-plans
              // acc[id] = displayName;
              break;
            }

            case 'EnterpriseAgreement': {
              const enrollmentAccounts = billingAccount.enrollmentAccounts || [];

              enrollmentAccounts.forEach((account) => {
                acc[
                  account.id!
                ] = `EA - ${displayName} - Enrollment - ${account.accountName}`;
              });
              break;
            }
          }

          return acc;
        }, {} as Record<string, string>);
      });

      await await Promise.all(
        svcCalls.map(async (sc) => {
          await sc();
        }),
      );
    }

    return ctx.Render(data);
  },

  async POST(req, ctx) {
    const formData = await req.formData();

    const cloudLookup = (formData.get('cloudLookup') as string) || crypto.randomUUID();

    const eac: FathymEaC = {
      EnterpriseLookup: ctx.State.EaC!.EnterpriseLookup,
      Clouds: {
        [cloudLookup]: {
          Token: ctx.State.AzureAccessToken,
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

export default function Azure({ Data }: PageProps<AzurePageData>) {
  return (
    <ConnectAzure
      cloudAction=''
      oauthAction='/azure/oauth/signin'
      subAction='/dashboard/api/eac/clouds/subs'
      class='px-4'
      isConnected={Data.isAzureConnected}
      billingScopes={Data.billingScopes}
      subs={Data.subs}
      tenants={Data.tenants}
    />
  );
}
