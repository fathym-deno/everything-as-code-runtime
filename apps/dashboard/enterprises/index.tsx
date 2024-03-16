import { redirectRequest, respond } from '@fathym/common';
import { EverythingAsCode } from '@fathym/eac';
import {
  EaCStatusProcessingTypes,
  FathymEaC,
  UserEaCRecord,
  loadEaCSvc,
  waitForStatus,
  waitForStatusWithFreshJwt,
} from '@fathym/eac/api';
import {
  EaCRuntimeContext,
  EaCRuntimeHandlerResult,
  PageProps,
} from '@fathym/eac/runtime';
import { EaCWebState } from '../../../src/state/EaCWebState.ts';

type EnterprisePageData = {
  CurrentEnterpriseLookup?: string;

  Enterprises: UserEaCRecord[];
};

export const handler: EaCRuntimeHandlerResult<EaCWebState, EnterprisePageData> =
  {
    async GET(_req, ctx) {
      const data: EnterprisePageData = {
        CurrentEnterpriseLookup: ctx.State.EaC?.EnterpriseLookup,
        Enterprises: [],
      };

      if (ctx.State.EaC) {
        const eacSvc = await loadEaCSvc(
          data.CurrentEnterpriseLookup!,
          ctx.State.Username!
        );

        data.Enterprises = await eacSvc.ListForUser();
      }

      return ctx.Render(data);
    },

    async POST(req, ctx) {
      const formData = await req.formData();

      const newEaC: FathymEaC = {
        EnterpriseLookup:
          ctx.State.EaC?.EnterpriseLookup || crypto.randomUUID(),
        Details: {
          Name: formData.get('name') as string,
          Description: formData.get('description') as string,
        },
      };

      const eacSvc = await loadEaCSvc(
        newEaC.EnterpriseLookup!,
        ctx.State.Username!
      );

      const createResp = await eacSvc.Create(newEaC, ctx.State.Username!, 60);

      const status = await waitForStatusWithFreshJwt(
        eacSvc,
        createResp.EnterpriseLookup,
        createResp.CommitID,
        ctx.State.Username!
      );

      const denoKv = await ctx.Runtime.IoC.Resolve(Deno.Kv, 'eac');

      if (status.Processing == EaCStatusProcessingTypes.COMPLETE) {
        await denoKv
          .atomic()
          .set(
            ['User', ctx.State.Username!, 'Current', 'EnterpriseLookup'],
            createResp.EnterpriseLookup
          )
          .delete(['User', ctx.State.Username!, 'Current', 'CloudLookup'])
          .delete([
            'User',
            ctx.State.Username!,
            'Current',
            'ResourceGroupLookup',
          ])
          .commit();

        return redirectRequest(ctx.Runtime.URLMatch.Base, false, false);
      } else {
        return redirectRequest(
          `${ctx.Runtime.URLMatch.Base}?error=${encodeURIComponent(
            status.Messages['Error'] as string
          )}&commitId=${createResp.CommitID}`,
          false,
          false
        );
      }
    },

    async PUT(req, ctx) {
      const eac: EverythingAsCode = await req.json();

      const denoKv = await ctx.Runtime.IoC.Resolve(Deno.Kv, 'eac');

      await denoKv
        .atomic()
        .set(
          ['User', ctx.State.Username!, 'Current', 'EnterpriseLookup'],
          eac.EnterpriseLookup
        )
        .delete(['User', ctx.State.Username!, 'Current', 'CloudLookup'])
        .delete(['User', ctx.State.Username!, 'Current', 'ResourceGroupLookup'])
        .commit();

      return respond({ Processing: EaCStatusProcessingTypes.COMPLETE });
    },

    async DELETE(req, ctx) {
      const eac: EverythingAsCode = await req.json();

      const eacSvc = await loadEaCSvc(
        eac.EnterpriseLookup!,
        ctx.State.Username!
      );

      const deleteResp = await eacSvc.Delete(eac, true, 60);

      const status = await waitForStatus(
        eacSvc,
        eac.EnterpriseLookup!,
        deleteResp.CommitID
      );

      if (ctx.State.EaC?.EnterpriseLookup === eac.EnterpriseLookup) {
        const denoKv = await ctx.Runtime.IoC.Resolve(Deno.Kv, 'eac');

        await denoKv
          .atomic()
          .delete(['User', ctx.State.Username!, 'Current', 'EnterpriseLookup'])
          .delete(['User', ctx.State.Username!, 'Current', 'CloudLookup'])
          .delete([
            'User',
            ctx.State.Username!,
            'Current',
            'ResourceGroupLookup',
          ])
          .commit();
      }

      return redirectRequest(ctx.Runtime.URLMatch.Base, false, false);
    },
  };

export default function Enterprises({ Data }: PageProps<EnterprisePageData>) {
  return (
    <>
      <EaCManageForm action="" />

      <div class="max-w-sm m-auto">
        <div class="border-b-[1px] border-dotted border-slate-400 dark:border-slate-700"></div>

        {Data.Enterprises &&
          Data.Enterprises.map((enterprise) => {
            return (
              <EntepriseManagementItem
                active={
                  Data.CurrentEnterpriseLookup ===
                  enterprise.EnterpriseLookup
                }
                enterprise={enterprise}
              />
            );
          })}
      </div>
    </>
  );
}
