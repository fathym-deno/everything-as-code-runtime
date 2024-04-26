import { Action, ActionGroup, CopyInput, Input } from '@fathym/atomic';
import { EaCGitHubAppProviderDetails } from '@fathym/eac';
import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac/runtime';
import { EaCWebState } from '../../../src/state/EaCWebState.ts';
import { EaCStatusProcessingTypes, FathymEaC, loadEaCSvc, waitForStatus } from '@fathym/eac/api';
import { redirectRequest } from '@fathym/common';

interface GitHubAppPageData {
  details?: EaCGitHubAppProviderDetails;
}

export const handler: EaCRuntimeHandlerResult<EaCWebState, GitHubAppPageData> = {
  GET(_req, ctx) {
    const data: GitHubAppPageData = {
      details: {
        AppID: '',
        ClientID: '',
        ClientSecret: '',
        PrivateKey: '',
        WebhooksSecret: '',
        Description: '',
        Name: '',
        Scopes: [],
      },
    };

    return ctx.Render(data);
  },

  async POST(req, ctx) {
    const formData = await req.formData();

    const providerLookup = formData.get('providerLookup') as string;

    const dbLookup = formData.get('dbLookup') as string;

    const appId = formData.get('appId') as string;

    const shortName = ctx.State.ResourceGroupLookup!.split('-')
      .map((p) => p.charAt(0))
      .join('');

    const eac: FathymEaC = {
      EnterpriseLookup: ctx.State.EaC!.EnterpriseLookup!,
      Providers: {
        [providerLookup]: {
          DatabaseLookup: dbLookup,
          Details: {
            Name: 'Open Biotech GitHub App OAuth Provider',
            Description: 'The provider used to connect with our Open Biotech GitHub App instance',
            ClientID: formData.get('clientId') as string,
            ClientSecret: formData.get('clientSecret') as string,
            PrivateKey: formData.get('privateKey') as string,
            WebhooksSecret: formData.get('webhooksSecret') as string,
            Scopes: ['openid'],
            AppID: appId,
          } as EaCGitHubAppProviderDetails,
        },
      },
      GitHubApps: {
        [appId]: {
          Details: {
            Name: 'Main',
            Description: 'main',
            ProviderLookup: providerLookup,
          },
          CloudLookup: ctx.State.CloudLookup,
          KeyVaultLookup: `${shortName}-key-vault`,
        },
      },
    };

    const eacSvc = await loadEaCSvc(
      eac.EnterpriseLookup!,
      ctx.State.Username!,
    );

    const commitResp = await eacSvc.Commit(eac, 60);

    const status = await waitForStatus(
      eacSvc,
      commitResp.EnterpriseLookup,
      commitResp.CommitID,
    );

    if (status.Processing === EaCStatusProcessingTypes.COMPLETE) {
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

export default function GitHubApp({ Data }: PageProps<GitHubAppPageData>) {
  const inputs = [
    {
      id: 'providerLookup',
      placeholder: 'Enter provider lookup',
      title: 'Provider Lookup',
    },
    {
      id: 'dbLookup',
      placeholder: 'Enter DB lookup',
      title: 'DB Lookup',
    },
    {
      id: 'appId',
      placeholder: 'Enter app ID',
      title: 'App ID',
    },
    {
      id: 'clientId',
      placeholder: 'Enter client ID',
      title: 'Client ID',
    },
    {
      id: 'clientSecret',
      placeholder: 'Enter client secret',
      title: 'Client Secret',
    },
    {
      id: 'privateKey',
      placeholder: 'Enter private key',
      title: 'Private Key',
      multiline: true,
    },
    {
      id: 'webhooksSecret',
      placeholder: 'Enter webhooks secret',
      title: 'Webhooks Secret',
    },
  ];
  return (
    <div>
      <form method='post' class='w-full max-w-sm md:max-w-md mx-auto p-3 mt-8'>
        {inputs.map((i) => {
          return (
            <div class='w-full px-3 mb-2'>
              <label
                for={i.id}
                class='block uppercase tracking-wide font-bold mb-0 text-xl'
              >
                {i.title}
              </label>

              <Input
                id={i.id}
                name={i.id}
                type='text'
                required
                multiline={i.multiline}
                placeholder={i.placeholder}
                class='appearance-none block w-full bg-white border border-gray-400 hover:border-gray-500 px-4 py-2 rounded leading-tight focus:outline-none focus:border-blue-500'
              />
            </div>
          );
        })}

        <ActionGroup class='mt-8 flex-col'>
          <>
            <Action
              type='submit'
              class='w-full md:w-auto text-white font-bold m-1 py-2 px-4 rounded focus:outline-none shadow-lg'
            >
              Add GitHub App
            </Action>
          </>
        </ActionGroup>
      </form>
    </div>
  );
}
