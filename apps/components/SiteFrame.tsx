import { ComponentChildren, JSX } from 'preact';
import { Action, ActionStyleTypes, Header, Logo } from '@fathym/atomic';
import { CSS } from '@deno/gfm';

export type SiteFrameProps = {
  children: ComponentChildren;
  title?: string;
} & Omit<JSX.HTMLAttributes<HTMLElement>, 'title'>;

export default function SiteFrame({
  children,
  title,
}: SiteFrameProps) {
  return (
    <html>
      <head>
        <meta charset='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />

        <title>{title || 'Fathym'}</title>

        <link rel='shortcut icon' type='image/png' href='/thinky.png' />

        <link
          href='https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap'
          rel='stylesheet'
        >
        </link>

        <link
          rel='stylesheet'
          href={`/tailwind/styles.css`}
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

          {children}
        </div>
      </body>
    </html>
  );
}
