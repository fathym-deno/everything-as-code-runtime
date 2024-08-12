import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac-runtime';
import { EaCWebState } from '../../../src/state/EaCWebState.ts';
import { mergeWithArrays, redirectRequest } from '@fathym/common';
import {
  EaCServiceDefinitions,
  EaCStatusProcessingTypes,
  FathymEaC,
  loadEaCAzureSvc,
  loadEaCSvc,
  waitForStatus,
} from '@fathym/eac-api';
import { EaCCloudAzureDetails, EaCCloudResourceFormatDetails } from '@fathym/eac';
import { CloudCALZForm } from '@fathym/atomic';
import { Location } from '@azure/arm-subscriptions';

interface CALZPageData {
  cloudLookup?: string;

  locations: Location[];
}

export const handler: EaCRuntimeHandlerResult<EaCWebState, CALZPageData> = {
  async GET(_req, ctx) {
    const data: CALZPageData = {
      cloudLookup: ctx.State.CloudLookup,
      locations: [],
    };

    const serviceFiles = [
      'https://raw.githubusercontent.com/lowcodeunit/infrastructure/master/templates/eac/calz/services.jsonc',
    ];

    const svcCalls: (() => Promise<void>)[] = [];

    const svcFileCalls = serviceFiles.map(async (sf) => {
      const resp = await fetch(sf);

      return await resp.json();
    });

    svcCalls.push(async () => {
      const svcDefs = await Promise.all<EaCServiceDefinitions>(svcFileCalls);

      const svcDef = mergeWithArrays<EaCServiceDefinitions>(...svcDefs);

      const eacAzureSvc = await loadEaCAzureSvc(
        ctx.State.EaC!.EnterpriseLookup!,
        ctx.State.Username!,
      );

      const locationsResp = await eacAzureSvc.CloudLocations(
        ctx.State.EaC!.EnterpriseLookup!,
        data.cloudLookup!,
        svcDef,
      );

      data.locations = locationsResp.Locations;
    });

    await await Promise.all(
      svcCalls.map(async (sc) => {
        await sc();
      }),
    );

    return ctx.Render(data);
  },

  async POST(req, ctx) {
    const formData = await req.formData();

    const cloudLookup = formData.get('cloudLookup') as string;

    const resGroupLookup = formData.get('resGroupLookup') as string;

    const resLookup = (formData.get('resLookup') as string) || 'calz';

    const resGroupLocation = formData.get('location') as string;

    const shortName = resGroupLookup
      .split('-')
      .map((p) => p.charAt(0))
      .join('');

    const details = ctx.State.EaC!.Clouds![cloudLookup]
      .Details as EaCCloudAzureDetails;

    const servicePrincipalId = details!.ID;

    const commitEaC: FathymEaC = {
      EnterpriseLookup: ctx.State.EaC!.EnterpriseLookup,
      Clouds: {
        [cloudLookup]: {
          ResourceGroups: {
            [resGroupLookup]: {
              Details: {
                Name: resGroupLookup,
                Description: formData.get('description') as string,
                Location: resGroupLocation,
                Order: 1,
              },
              Resources: {
                [resLookup]: {
                  Details: {
                    Type: 'Format',
                    Name: 'Core CALZ',
                    Description: 'The core CALZ to use for the enterprise.',
                    Order: 1,
                    Template: {
                      Content:
                        'https://raw.githubusercontent.com/lowcodeunit/infrastructure/master/templates/eac/calz/template.jsonc',
                      Parameters:
                        'https://raw.githubusercontent.com/lowcodeunit/infrastructure/master/templates/eac/calz/parameters.jsonc',
                    },
                    Data: {
                      CloudLookup: cloudLookup,
                      Location: resGroupLocation,
                      Name: resGroupLookup,
                      PrincipalID: '', // TODO(mcgear): Pass in actual principal ID (maybe retrievable from MSAL account record? I think can just be the email?)
                      ResourceLookup: resLookup,
                      ServicePrincipalID: servicePrincipalId,
                      ShortName: shortName,
                    },
                    Outputs: {},
                  } as EaCCloudResourceFormatDetails,
                },
              },
            },
          },
        },
      },
    };

    const eacSvc = await loadEaCSvc(
      commitEaC.EnterpriseLookup!,
      ctx.State.Username!,
    );

    const commitResp = await eacSvc.Commit(commitEaC, 60 * 30);

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

export default function CALZ({ Data }: PageProps<CALZPageData>) {
  return (
    <CloudCALZForm
      class='px-4'
      cloudLookup={Data.cloudLookup!}
      locations={Data.locations}
      action=''
    />
  );
}
