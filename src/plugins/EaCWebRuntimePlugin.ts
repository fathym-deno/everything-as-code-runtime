import { EaCRuntimeConfig, EaCRuntimePlugin, EaCRuntimePluginConfig } from '@fathym/eac/runtime';
import {
  EaCLocalDistributedFileSystem,
  EaCPreactAppProcessor,
  EaCProxyProcessor,
  EaCTailwindProcessor,
} from '@fathym/eac';

export default class EaCWebRuntimePlugin implements EaCRuntimePlugin {
  constructor() {}

  public Build(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'MyDemoPlugin',
      EaC: {
        Projects: {
          demo: {
            Details: {
              Name: 'Everything as Code Web',
              Description: 'The project to use for the EaC website.',
              Priority: 100,
            },
            ResolverConfigs: {
              dev: {
                Hostname: 'localhost',
                Port: config.Server.port || 8000,
              },
              dev2: {
                Hostname: '127.0.0.1',
                Port: config.Server.port || 8000,
              },
            },
            ModifierResolvers: {
              keepAlive: {
                Priority: 1000,
              },
            },
            ApplicationResolvers: {
              apiProxy: {
                PathPattern: '/api/eac*',
                Priority: 200,
              },
              home: {
                PathPattern: '/*',
                Priority: 100,
              },
              tailwind: {
                PathPattern: '/tailwind*',
                Priority: 500,
              },
            },
          },
        },
        Applications: {
          apiProxy: {
            Details: {
              Name: 'EaC API Proxy',
              Description: 'A proxy for the EaC API service.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Proxy',
              ProxyRoot: 'http://localhost:6130/api/eac',
            } as EaCProxyProcessor,
          },
          home: {
            Details: {
              Name: 'Home Site',
              Description: 'The home site to be used for the marketing of the project',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'PreactApp',
              AppDFSLookup: 'local:apps/home',
              ComponentDFSLookups: ['local:apps/components'],
            } as EaCPreactAppProcessor,
          },
          tailwind: {
            Details: {
              Name: 'Tailwind for the Site',
              Description: 'A tailwind config for the site',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Tailwind',
              DFSLookups: ['local:apps/home', 'local:apps/components'],
              ConfigPath: '/apps/tailwind/tailwind.config.ts',
              StylesTemplatePath: './apps/tailwind/styles.css',
              CacheControl: {
                'text\\/css': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
              },
            } as EaCTailwindProcessor,
          },
        },
        DFS: {
          'local:apps/components': {
            Type: 'Local',
            FileRoot: './apps/components/',
          } as EaCLocalDistributedFileSystem,
          'local:apps/home': {
            Type: 'Local',
            FileRoot: './apps/home/',
            DefaultFile: 'index.tsx',
            Extensions: ['tsx'],
          } as EaCLocalDistributedFileSystem,
        },
      },
    };

    return Promise.resolve(pluginConfig);
  }
}
