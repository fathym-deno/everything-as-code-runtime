import { useEffect, useRef } from 'preact/hooks';
import { CodeChangesProfile, CodeEditor, CodeEditorHandle, CodeSource } from '@fathym/code-editor';
import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac-runtime';
import { EaCWebState } from '../../../src/state/EaCWebState.ts';
import CodeEditorThinky from '../../components/thinky/CodeEditorThinky.tsx';
import { ChatSet } from '@fathym/atomic';

export const IsIsland = true;

export type DevelopPageData = {
  ActiveChat?: string;

  Changes: CodeChangesProfile;

  Chats: Record<string, ChatSet>;

  CodeSources: Record<string, CodeSource>;

  EaCJWT: string;

  RecommendedFiles?: string[];

  Root: string;
};

export const handler: EaCRuntimeHandlerResult<EaCWebState, DevelopPageData> = {
  GET(_req, ctx) {
    const data: DevelopPageData = {
      ActiveChat: ctx.State.EaC!.EnterpriseLookup!,
      Changes: {
        Name: 'Update documentation',
        Description:
          'Update the main README.md file with more relevant documentation and examples.',
        Lookup: '1',
        Tasks: [
          {
            Name: 'Create Introduction',
            Description: 'Provide an intro.',
            Lookup: '2',
            Complete: true,
          },
          {
            Name: 'Create Main Docs',
            Description: 'Provide the main documentation.',
            Lookup: '3',
            Tasks: [
              {
                Name: 'Document Purpose',
                Description: 'Provide an intro.',
                Lookup: '4',
                Complete: true,
                Tasks: [
                  {
                    Name: 'Document Purpose',
                    Description: 'Provide an intro.',
                    Lookup: '5',
                    Complete: true,
                  },
                  {
                    Name: 'Create Examples',
                    Description: 'Provide an outro.',
                    Lookup: '6',
                    Complete: true,
                  },
                ],
              },
              {
                Name: 'Create Examples',
                Description: 'Provide an outro.',
                Lookup: '7',
              },
            ],
          },
          {
            Name: 'Create Conclusion',
            Description: 'Provide an outro.',
            Lookup: '8',
          },
        ],
      },
      Chats: {
        // [ctx.State.Username!]: {
        //   Name: 'User Main Chat',
        //   CircuitLookup: 'thinky-dashboard',
        // },
        [ctx.State.EaC!.EnterpriseLookup!]: {
          Name: 'Code Editor',
          CircuitLookup: 'lovelace:source-information',
        },
      },
      CodeSources: {
        '@fathym-deno/eac-runtime': {
          Files: {
            '/README.md': {
              DownloadPath:
                'https://raw.githubusercontent.com/fathym-deno/eac-runtime/integration/README.md',
            },
            '/src/.exports.ts': {
              DownloadPath:
                'https://raw.githubusercontent.com/fathym-deno/eac-runtime/integration/src/.exports.ts',
            },
            '/home/deno.jsonc': {
              DownloadPath:
                'https://raw.githubusercontent.com/fathym-deno/eac-runtime/integration/deno.jsonc',
            },
            '/.gitignore': {
              DownloadPath:
                'https://raw.githubusercontent.com/fathym-deno/eac-runtime/integration/.gitignore',
            },
            '/home/gone/anotherFile.ts': {
              DownloadPath:
                'https://raw.githubusercontent.com/fathym-deno/eac-runtime/integration/deno.jsonc',
            },
            '/home/gone/someMore.ts': {
              DownloadPath:
                'https://raw.githubusercontent.com/fathym-deno/eac-runtime/integration/.gitignore',
            },
          },
        },
        '@fathym-deno/atomic': {
          Files: {
            '/README.md': {
              DownloadPath:
                'https://raw.githubusercontent.com/fathym-deno/atomic/integration/README.md',
            },
          },
        },
      },
      EaCJWT: ctx.State.EaCJWT!,
      RecommendedFiles: [
        '@fathym-deno/atomic|/README.md',
        '@fathym-deno/eac-runtime|/README.md',
      ],
      Root: '/api/thinky/',
    };

    return ctx.Render(data);
  },
};

export default function Develop({ Data }: PageProps<DevelopPageData>) {
  const editorRef = useRef<CodeEditorHandle>(null);

  useEffect(() => {
    if (editorRef.current) {
      if (Data.RecommendedFiles) {
        editorRef.current.OpenFile(Data.RecommendedFiles[0], true);
      }
    }
  }, [editorRef]);
  return (
    <CodeEditorThinky
      activeChat={Data.ActiveChat}
      chats={Data.Chats}
      jwt={Data.EaCJWT}
      root={Data.Root}
    >
      <CodeEditor
        ref={editorRef}
        changes={Data.Changes}
        recommendedFiles={Data.RecommendedFiles}
        sources={Data.CodeSources}
      />
    </CodeEditorThinky>
  );
}
