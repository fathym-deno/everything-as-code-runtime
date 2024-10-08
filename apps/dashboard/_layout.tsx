import { ChatSet } from '@fathym/atomic';
import { merge } from '@fathym/common';
import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac-runtime';
import { EaCWebState } from '../../src/state/EaCWebState.ts';
import DashboardThinky from '../components/thinky/DashboardThinky.tsx';
import SiteFrame from '../components/SiteFrame.tsx';

export type MainLayoutData = {
  ActiveChat?: string;

  Chats: Record<string, ChatSet>;

  EaCJWT: string;

  Root: string;

  Username: string;
};

export const handler: EaCRuntimeHandlerResult<EaCWebState, MainLayoutData> = {
  GET: (_req, ctx) => {
    const data: MainLayoutData = {
      ActiveChat: ctx.State.EaC!.EnterpriseLookup!,
      Chats: {
        // [ctx.State.Username!]: {
        //   Name: 'User Main Chat',
        //   CircuitLookup: 'thinky-dashboard',
        // },
        [ctx.State.EaC!.EnterpriseLookup!]: {
          Name: 'Enterprise Chat',
          CircuitLookup: 'thinky-dashboard',
        },
      },
      EaCJWT: ctx.State.EaCJWT!,
      // GroupChats: ,
      Root: '/api/thinky/',
      Username: ctx.State.Username!,
    };

    ctx.Data = merge(ctx.Data, data);

    return ctx.Next();
  },
};

export default function Layout({
  Data,
  Component,
}: PageProps<MainLayoutData>) {
  return (
    <SiteFrame>
      <DashboardThinky
        activeChat={Data.ActiveChat}
        chats={Data.Chats}
        jwt={Data.EaCJWT}
        root={Data.Root}
      >
        <Component />
      </DashboardThinky>
    </SiteFrame>
  );
}
