import { Action, ActionStyleTypes, Header, Logo } from '@fathym/atomic';
import { merge } from '@fathym/common';
import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac/runtime';
import { EaCWebState } from '../../src/state/EaCWebState.ts';
import Thinky from '../components/thinky/Thinky.tsx';

interface MainLayoutData {
  Username?: string;
}

export const handler: EaCRuntimeHandlerResult<EaCWebState, MainLayoutData> = {
  GET: (_req, ctx) => {
    const data: MainLayoutData = {
      Username: ctx.State.Username,
    };

    ctx.Data = merge(ctx.Data, data);

    return ctx.Next();
  },
};

export default function Layout({ Component, Revision }: PageProps) {
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

          <Thinky>
            <Component />
          </Thinky>
        </div>
      </body>
    </html>
  );
}
