import { getCookies, setCookie } from 'https://deno.land/std@0.220.1/http/cookie.ts';
import { CSS } from 'https://deno.land/x/gfm@0.2.3/mod.ts';
import { Action, ActionStyleTypes, Header, Logo } from '@fathym/atomic';
import { merge } from '@fathym/common';
import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac/runtime';
import { EaCWebState } from '../../src/state/EaCWebState.ts';
import Thinky, { ChatSet } from '../components/thinky/Thinky.tsx';

export type MainLayoutData = {
  ActiveChat?: string;

  Chats: Record<string, ChatSet>;

  EaCJWT: string;

  Username?: string;
};

export const handler: EaCRuntimeHandlerResult<EaCWebState, MainLayoutData> = {
  GET: async (req, ctx) => {
    const cookies = await getCookies(req.headers);

    const sessionId = cookies['SessionID'] ?? crypto.randomUUID();

    const data: MainLayoutData = {
      ActiveChat: sessionId,
      Chats: {
        [sessionId]: {
          Name: 'User Public Chat',
          CircuitLookup: 'thinky-public',
        },
      },
      EaCJWT: ctx.State.EaCJWT!,
      Username: ctx.State.Username,
    };

    ctx.Data = merge(ctx.Data, data);

    const resp = await ctx.Next();

    await setCookie(resp.headers, {
      name: 'SessionID',
      value: sessionId,
    });

    console.log(sessionId);

    return resp;
  },
};

export default function Layout({
  Data,
  Component,
  Revision,
}: PageProps<MainLayoutData>) {
  return (
    <html>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />

        <title>Fathym</title>

        <link rel='shortcut icon' type='image/png' href='/thinky.png' />

        <link
          href='https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap'
          rel='stylesheet'
        >
        </link>

        <link
          rel='stylesheet'
          href={`/tailwind/styles.css?Revision=${Revision}`}
          data-eac-bypass-base
        />

        <style dangerouslySetInnerHTML={{ __html: CSS }}></style>
      </head>

      <body class='bg-slate-50 dark:bg-slate-900 text-black dark:text-white font-nun'>
        <div className='flex flex-col h-screen'>
          <Header
            class='h-[64px] text-center py-4 text-2xl font-bold drop-shadow-md z-50'
            logo={
              <Action
                href='/'
                actionStyle={ActionStyleTypes.Link | ActionStyleTypes.Rounded}
              >
                <Logo />
              </Action>
            }
          />

          <Thinky
            activeChat={Data.ActiveChat}
            chats={Data.Chats}
            hideChatHeader={true}
            jwt={Data.EaCJWT}
            root='/api/public-thinky/'
          >
            <Component />
          </Thinky>
        </div>
      </body>
    </html>
  );
}
