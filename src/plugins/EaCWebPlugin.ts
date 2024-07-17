import { EaCAtomicIconsProcessor } from '@fathym/atomic-icons';
import { FathymAtomicIconsPlugin } from '@fathym/atomic-icons/plugin';
import {
  EaCRuntimeConfig,
  EaCRuntimeEaC,
  EaCRuntimePlugin,
  EaCRuntimePluginConfig,
  FathymAzureContainerCheckPlugin,
} from '@fathym/eac/runtime';
import {
  EaCAzureADB2CProviderDetails,
  EaCAzureADProviderDetails,
  EaCBaseHREFModifierDetails,
  EaCDenoKVCacheModifierDetails,
  EaCDenoKVDatabaseDetails,
  EaCESMDistributedFileSystem,
  EaCKeepAliveModifierDetails,
  EaCLocalDistributedFileSystem,
  EaCOAuthModifierDetails,
  EaCOAuthProcessor,
  EaCPreactAppProcessor,
  EaCProxyProcessor,
  EaCTailwindProcessor,
  EaCTracingModifierDetails,
} from '@fathym/eac';
import { IoCContainer } from '@fathym/ioc';
import { DefaultEaCWebProcessorHandlerResolver } from './DefaultEaCWebProcessorHandlerResolver.ts';
import { EverythingAsCodeSynaptic, FathymSynapticPlugin } from '@fathym/synaptic';
import OpenIndustrialMSALPlugin from './OpenIndustrialMSALPlugin.ts';
import { EaCMSALProcessor } from '@fathym/msal';
export default class EaCWebPlugin implements EaCRuntimePlugin {
  constructor() {}

  public Setup(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'EaCWebPlugin',
      Plugins: [
        new FathymAzureContainerCheckPlugin(),
        new FathymAtomicIconsPlugin(),
        new FathymSynapticPlugin(),
        new OpenIndustrialMSALPlugin(),
      ],
      EaC: {
        Projects: {
          web: {
            Details: {
              Name: 'Everything as Code Web',
              Description: 'The project to use for the EaC website.',
              Priority: 500,
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
              eac: {
                Hostname: 'eac.fathym.com',
              },
              eac2: {
                Hostname: 'eac2.fathym.com',
              },
              eacAzure: {
                Hostname: 'everything-as-code-runtime.azurewebsites.net',
              },
            },
            ModifierResolvers: {
              keepAlive: {
                Priority: 5000,
              },
              oauth: {
                Priority: 8000,
              },
            },
            ApplicationResolvers: {
              apiProxy: {
                PathPattern: '/api/eac*',
                Priority: 200,
              },
              atomicIcons: {
                PathPattern: '/icons*',
                Priority: 200,
              },
              dashboard: {
                PathPattern: '/dashboard*',
                Priority: 100,
                IsPrivate: true,
                IsTriggerSignIn: true,
              },
              home: {
                PathPattern: '*',
                Priority: 100,
              },
              msal: {
                PathPattern: '/azure/oauth/*',
                Priority: 500,
                IsPrivate: true,
                IsTriggerSignIn: true,
              },
              oauth: {
                PathPattern: '/oauth/*',
                Priority: 500,
              },
              tailwind: {
                PathPattern: '/tailwind*',
                Priority: 500,
              },
              thinkyAzureProxy: {
                PathPattern: '/dashboard/thinky/connect/azure/*',
                Priority: 200,
                // IsPrivate: true,
              },
              thinkyProxy: {
                PathPattern: '/api/thinky*',
                Priority: 200,
                // IsPrivate: true,
              },
              thinkyPublicProxy: {
                PathPattern: '/api/public-thinky*',
                Priority: 200,
                // IsPrivate: true,
              },
              demo: {
                PathPattern: '/api/demo*',
                Priority: 200,
                // IsPrivate: true,
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
          atomicIcons: {
            Details: {
              Name: 'Atomic Icons',
              Description: 'The atomic icons for the project.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'AtomicIcons',
              Config: {
                IconSet: {
                  IconMap: {
                    begin: 'https://api.iconify.design/fe:beginner.svg',
                    check: 'https://api.iconify.design/lets-icons:check-fill.svg',
                    copy: 'https://api.iconify.design/solar:copy-outline.svg',
                    delete: 'https://api.iconify.design/material-symbols-light:delete.svg',
                    loading: 'https://api.iconify.design/mdi:loading.svg',
                  },
                },
                Generate: true,
                SpriteSheet: '/iconset',
              },
            } as EaCAtomicIconsProcessor,
          },
          dashboard: {
            Details: {
              Name: 'Dashboard Site',
              Description: 'The dashboard site to be used for the marketing of the project',
            },
            ModifierResolvers: {
              baseHref: {
                Priority: 10000,
              },
            },
            Processor: {
              Type: 'PreactApp',
              AppDFSLookup: 'local:apps/dashboard',
              ComponentDFSLookups: [
                ['local:apps/components', ['tsx']],
                ['esm:fathym_atomic_design_kit', ['ts', 'tsx']],
              ],
            } as EaCPreactAppProcessor,
          },
          home: {
            Details: {
              Name: 'Home Site',
              Description: 'The home site to be used for the marketing of the project',
            },
            ModifierResolvers: {
              baseHref: {
                Priority: 10000,
              },
            },
            Processor: {
              Type: 'PreactApp',
              AppDFSLookup: 'local:apps/home',
              ComponentDFSLookups: [
                ['local:apps/components', ['tsx']],
                ['esm:fathym_atomic_design_kit', ['ts', 'tsx']],
              ],
            } as EaCPreactAppProcessor,
          },
          msal: {
            Details: {
              Name: 'OAuth Site',
              Description: 'The site for use in OAuth workflows for a user',
            },
            Processor: {
              Type: 'MSAL',
              Config: {
                MSALSignInOptions: {
                  Scopes: [
                    'https://management.core.windows.net//user_impersonation',
                  ], // Your desired scopes go here
                  RedirectURI: '/azure/oauth/callback',
                  SuccessRedirect: '/cloud',
                },
                MSALSignOutOptions: {
                  ClearSession: false,
                  PostLogoutRedirectUri: '/',
                },
              },
              ProviderLookup: 'azure',
            } as EaCMSALProcessor,
          },
          oauth: {
            Details: {
              Name: 'OAuth Site',
              Description: 'The site for use in OAuth workflows for a user',
            },
            Processor: {
              Type: 'OAuth',
              ProviderLookup: 'adb2c',
            } as EaCOAuthProcessor,
          },
          tailwind: {
            Details: {
              Name: 'Tailwind for the Site',
              Description: 'A tailwind config for the site',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Tailwind',
              DFSLookups: [
                'local:apps/components',
                'local:apps/dashboard',
                'local:apps/home',
                'esm:fathym_atomic_design_kit',
              ],
              ConfigPath: './tailwind.config.ts',
              StylesTemplatePath: './apps/tailwind/styles.css',
              CacheControl: {
                'text\\/css': `public, max-age=${60 * 60 * 24 * 365}, immutable`,
              },
            } as EaCTailwindProcessor,
          },
          thinkyAzureProxy: {
            Details: {
              Name: 'Thinky Azure Auth Proxy',
              Description: 'A proxy for Thinky Azure OAuth.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Proxy',
              ProxyRoot: 'http://localhost:6132/connect/azure/',
            } as EaCProxyProcessor,
          },
          thinkyProxy: {
            Details: {
              Name: 'Thinky Proxy',
              Description: 'A proxy for to Thinky.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Proxy',
              ProxyRoot: 'http://localhost:6132/circuits',
            } as EaCProxyProcessor,
          },
          thinkyPublicProxy: {
            Details: {
              Name: 'Thinky Proxy',
              Description: 'A proxy for to Thinky.',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Proxy',
              ProxyRoot: 'http://localhost:6132/public-circuits',
            } as EaCProxyProcessor,
          },
          demo: {
            Details: {
              Name: 'Demo',
              Description: 'Demo',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'Proxy',
              ProxyRoot: 'http://localhost:8000/circuits',
            } as EaCProxyProcessor,
          },
        },
        DFS: {
          'local:apps/api/thinky': {
            Type: 'Local',
            FileRoot: './apps/api/thinky/',
            DefaultFile: 'index.ts',
            Extensions: ['ts'],
            WorkerPath: import.meta.resolve(
              '@fathym/eac/runtime/src/runtime/dfs/workers/EaCLocalDistributedFileSystemWorker.ts',
            ),
          } as EaCLocalDistributedFileSystem,
          'local:apps/components': {
            Type: 'Local',
            FileRoot: './apps/components/',
            WorkerPath: import.meta.resolve(
              '@fathym/eac/runtime/src/runtime/dfs/workers/EaCLocalDistributedFileSystemWorker.ts',
            ),
          } as EaCLocalDistributedFileSystem,
          'local:apps/dashboard': {
            Type: 'Local',
            FileRoot: './apps/dashboard/',
            DefaultFile: 'index.tsx',
            Extensions: ['tsx'],
            WorkerPath: import.meta.resolve(
              '@fathym/eac/runtime/src/runtime/dfs/workers/EaCLocalDistributedFileSystemWorker.ts',
            ),
          } as EaCLocalDistributedFileSystem,
          'local:apps/home': {
            Type: 'Local',
            FileRoot: './apps/home/',
            DefaultFile: 'index.tsx',
            Extensions: ['tsx'],
            WorkerPath: import.meta.resolve(
              '@fathym/eac/runtime/src/runtime/dfs/workers/EaCLocalDistributedFileSystemWorker.ts',
            ),
          } as EaCLocalDistributedFileSystem,
          'esm:fathym_atomic_design_kit': {
            Type: 'ESM',
            Root: '@fathym/atomic/',
            EntryPoints: ['mod.ts'],
            IncludeDependencies: true,
            WorkerPath: import.meta.resolve(
              '@fathym/eac/runtime/src/runtime/dfs/workers/EaCESMDistributedFileSystemWorker.ts',
            ),
          } as EaCESMDistributedFileSystem,
        },
        Modifiers: {
          baseHref: {
            Details: {
              Type: 'BaseHREF',
              Name: 'Base HREF',
              Description: 'Adjusts the base HREF of a response based on configureation.',
            } as EaCBaseHREFModifierDetails,
          },
          keepAlive: {
            Details: {
              Type: 'KeepAlive',
              Name: 'Deno KV Cache',
              Description: 'Lightweight cache to use that stores data in a DenoKV database.',
              KeepAlivePath: '/_eac/alive',
            } as EaCKeepAliveModifierDetails,
          },
          oauth: {
            Details: {
              Type: 'OAuth',
              Name: 'OAuth',
              Description: 'Used to restrict user access to various applications.',
              ProviderLookup: 'adb2c',
              SignInPath: '/oauth/signin',
            } as EaCOAuthModifierDetails,
          },
          'static-cache': {
            Details: {
              Type: 'DenoKVCache',
              Name: 'Static Cache',
              Description:
                'Lightweight cache to use that stores data in a DenoKV database for static sites.',
              DenoKVDatabaseLookup: 'cache',
              CacheSeconds: 60 * 20,
            } as EaCDenoKVCacheModifierDetails,
          },
          tracing: {
            Details: {
              Type: 'Tracing',
              Name: 'Tracing',
              Description: 'Lightweight cache to use that stores data in a DenoKV database.',
              TraceRequest: true,
              TraceResponse: true,
            } as EaCTracingModifierDetails,
          },
        },
        Providers: {
          adb2c: {
            DatabaseLookup: 'oauth',
            Details: {
              Name: 'Azure ADB2C OAuth Provider',
              Description: 'The provider used to connect with our azure adb2c instance',
              ClientID: Deno.env.get('AZURE_ADB2C_CLIENT_ID')!,
              ClientSecret: Deno.env.get('AZURE_ADB2C_CLIENT_SECRET')!,
              Scopes: ['openid', Deno.env.get('AZURE_ADB2C_CLIENT_ID')!],
              Domain: Deno.env.get('AZURE_ADB2C_DOMAIN')!,
              PolicyName: Deno.env.get('AZURE_ADB2C_POLICY')!,
              TenantID: Deno.env.get('AZURE_ADB2C_TENANT_ID')!,
              IsPrimary: true,
            } as EaCAzureADB2CProviderDetails,
          },
          azure: {
            DatabaseLookup: 'oauth',
            Details: {
              Name: 'Azure OAuth Provider',
              Description: 'The provider used to connect with Azure',
              ClientID: Deno.env.get('AZURE_AD_CLIENT_ID')!,
              ClientSecret: Deno.env.get('AZURE_AD_CLIENT_SECRET')!,
              Scopes: ['openid'],
              TenantID: Deno.env.get('AZURE_AD_TENANT_ID')!, //common
            } as EaCAzureADProviderDetails,
          },
        },
        Databases: {
          cache: {
            Details: {
              Type: 'DenoKV',
              Name: 'Local Cache',
              Description: 'The Deno KV database to use for local caching',
              DenoKVPath: Deno.env.get('LOCAL_CACHE_DENO_KV_PATH') || undefined,
            } as EaCDenoKVDatabaseDetails,
          },
          eac: {
            Details: {
              Type: 'DenoKV',
              Name: 'EaC DB',
              Description: 'The Deno KV database to use for local caching',
              DenoKVPath: Deno.env.get('EAC_DENO_KV_PATH') || undefined,
            } as EaCDenoKVDatabaseDetails,
          },
          oauth: {
            Details: {
              Type: 'DenoKV',
              Name: 'OAuth DB',
              Description: 'The Deno KV database to use for local caching',
              DenoKVPath: Deno.env.get('OAUTH_DENO_KV_PATH') || undefined,
            } as EaCDenoKVDatabaseDetails,
          },
          thinky: {
            Details: {
              Type: 'DenoKV',
              Name: 'Thinky',
              Description: 'The Deno KV database to use for thinky',
              DenoKVPath: Deno.env.get('THINKY_DENO_KV_PATH') || undefined,
            } as EaCDenoKVDatabaseDetails,
          },
        },
      } as EaCRuntimeEaC & EverythingAsCodeSynaptic,
      IoC: new IoCContainer(),
    };

    pluginConfig.IoC!.Register(DefaultEaCWebProcessorHandlerResolver, {
      Type: pluginConfig.IoC!.Symbol('ProcessorHandlerResolver'),
    });

    return Promise.resolve(pluginConfig);
  }
}
