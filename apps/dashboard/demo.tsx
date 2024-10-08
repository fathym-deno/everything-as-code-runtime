import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac-runtime';
import { EaCWebState } from '../../src/state/EaCWebState.ts';
import { MainLayoutData } from './_layout.tsx';

export type GettingStartedPageData = {
  dashboards?: [];
};

export const handler: EaCRuntimeHandlerResult<
  EaCWebState,
  GettingStartedPageData & MainLayoutData
> = {
  GET: (_req, ctx) => {
    const userGettingStartedChat = `Getting-Started|${ctx.State.Username}`;

    const data: GettingStartedPageData & MainLayoutData = {
      ...ctx.Data,
      ActiveChat: userGettingStartedChat,
      Chats: {
        ...ctx.Data.Chats,
        [userGettingStartedChat]: {
          Name: 'Demo',
          CircuitLookup: 'chat',
        },
      },
      Root: '/api/demo/',
    };

    return ctx.Render(data);
  },
};

export default function GettingStarted({}: PageProps<GettingStartedPageData>) {
  return (
    <div class='flex flex-row'>
      Begin typing to load your getting started...
    </div>
  );
}
