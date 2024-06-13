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
  EaCAPIProcessor,
  EaCAzureADB2CProviderDetails,
  EaCAzureOpenAILLMDetails,
  EaCBaseHREFModifierDetails,
  EaCDenoKVCacheModifierDetails,
  EaCDenoKVChatHistoryDetails,
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
import {
  EaCChatHistoryNeuron,
  EaCChatPromptNeuron,
  EaCLLMNeuron,
  EaCSynapticCircuitsProcessor,
  EverythingAsCodeSynaptic,
  FathymSynapticPlugin,
} from '@fathym/synaptic';
import {
  BaseMessage,
  BaseMessagePromptTemplateLike,
  MessagesPlaceholder,
  z,
} from '../../tests/test.deps.ts';
import { RunnableLambda } from 'npm:@langchain/core/runnables';
import { coerceMessageLikeToMessage } from 'npm:@langchain/core/messages';

export default class EaCWebPlugin implements EaCRuntimePlugin {
  constructor() {}

  public Setup(config: EaCRuntimeConfig): Promise<EaCRuntimePluginConfig> {
    const pluginConfig: EaCRuntimePluginConfig = {
      Name: 'EaCWebPlugin',
      Plugins: [
        new FathymAzureContainerCheckPlugin(),
        new FathymAtomicIconsPlugin(),
        new FathymSynapticPlugin(),
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
              circuits: {
                PathPattern: '/circuits*',
                Priority: 100,
                // IsPrivate: true,
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
              oauth: {
                PathPattern: '/oauth/*',
                Priority: 500,
              },
              tailwind: {
                PathPattern: '/tailwind*',
                Priority: 500,
              },
              thinkyApi: {
                PathPattern: '/api/thinky*',
                Priority: 200,
                IsPrivate: true,
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
                    check:
                      'https://api.iconify.design/lets-icons:check-fill.svg',
                    copy: 'https://api.iconify.design/solar:copy-outline.svg',
                    delete:
                      'https://api.iconify.design/material-symbols-light:delete.svg',
                    loading:
                      'https://api.iconify.design/line-md:loading-alt-loop.svg',
                  },
                },
                Generate: true,
                SpriteSheet: '/iconset',
              },
            } as EaCAtomicIconsProcessor,
          },
          circuits: {
            Details: {
              Name: 'Circuits',
              Description: 'The API for accessing circuits',
            },
            ModifierResolvers: {},
            Processor: {
              Type: 'SynapticCircuits',
            } as EaCSynapticCircuitsProcessor,
          },
          dashboard: {
            Details: {
              Name: 'Dashboard Site',
              Description:
                'The dashboard site to be used for the marketing of the project',
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
              Description:
                'The home site to be used for the marketing of the project',
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
          thinkyApi: {
            Details: {
              Name: 'Thinky API',
              Description: 'The local Thinky API calls for Open Biotech',
            },
            ModifierResolvers: { currentEaC: { Priority: 9000 } },
            Processor: {
              Type: 'API',
              DFSLookup: 'local:apps/api/thinky',
              DefaultContentType: 'application/json',
            } as EaCAPIProcessor,
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
                'text\\/css': `public, max-age=${
                  60 * 60 * 24 * 365
                }, immutable`,
              },
            } as EaCTailwindProcessor,
          },
        },
        DFS: {
          'local:apps/api/thinky': {
            Type: 'Local',
            FileRoot: './apps/api/thinky/',
            DefaultFile: 'index.ts',
            Extensions: ['ts'],
          } as EaCLocalDistributedFileSystem,
          'local:apps/components': {
            Type: 'Local',
            FileRoot: './apps/components/',
          } as EaCLocalDistributedFileSystem,
          'local:apps/dashboard': {
            Type: 'Local',
            FileRoot: './apps/dashboard/',
            DefaultFile: 'index.tsx',
            Extensions: ['tsx'],
          } as EaCLocalDistributedFileSystem,
          'local:apps/home': {
            Type: 'Local',
            FileRoot: './apps/home/',
            DefaultFile: 'index.tsx',
            Extensions: ['tsx'],
          } as EaCLocalDistributedFileSystem,
          'esm:fathym_atomic_design_kit': {
            Type: 'ESM',
            Root: '@fathym/atomic/',
            EntryPoints: ['mod.ts'],
            IncludeDependencies: true,
          } as EaCESMDistributedFileSystem,
        },
        Modifiers: {
          baseHref: {
            Details: {
              Type: 'BaseHREF',
              Name: 'Base HREF',
              Description:
                'Adjusts the base HREF of a response based on configureation.',
            } as EaCBaseHREFModifierDetails,
          },
          keepAlive: {
            Details: {
              Type: 'KeepAlive',
              Name: 'Deno KV Cache',
              Description:
                'Lightweight cache to use that stores data in a DenoKV database.',
              KeepAlivePath: '/_eac/alive',
            } as EaCKeepAliveModifierDetails,
          },
          oauth: {
            Details: {
              Type: 'OAuth',
              Name: 'OAuth',
              Description:
                'Used to restrict user access to various applications.',
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
              Description:
                'Lightweight cache to use that stores data in a DenoKV database.',
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
              Description:
                'The provider used to connect with our azure adb2c instance',
              ClientID: Deno.env.get('AZURE_ADB2C_CLIENT_ID')!,
              ClientSecret: Deno.env.get('AZURE_ADB2C_CLIENT_SECRET')!,
              Scopes: ['openid', Deno.env.get('AZURE_ADB2C_CLIENT_ID')!],
              Domain: Deno.env.get('AZURE_ADB2C_DOMAIN')!,
              PolicyName: Deno.env.get('AZURE_ADB2C_POLICY')!,
              TenantID: Deno.env.get('AZURE_ADB2C_TENANT_ID')!,
              IsPrimary: true,
            } as EaCAzureADB2CProviderDetails,
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
        AIs: {
          thinky: {
            ChatHistories: {
              tester: {
                Details: {
                  Type: 'DenoKV',
                  Name: 'Thinky',
                  Description: 'The Thinky document indexer to use.',
                  DenoKVDatabaseLookup: 'thinky',
                  RootKey: ['Thinky', 'EaC', 'ChatHistory', 'Tester'],
                } as EaCDenoKVChatHistoryDetails,
              },
            },
            LLMs: {
              thinky: {
                Details: {
                  Name: 'Azure OpenAI LLM',
                  Description: 'The LLM for interacting with Azure OpenAI.',
                  APIKey: Deno.env.get('AZURE_OPENAI_KEY')!,
                  Endpoint: Deno.env.get('AZURE_OPENAI_ENDPOINT')!,
                  DeploymentName: 'gpt-4o',
                  ModelName: 'gpt-4o',
                  Streaming: true,
                  Verbose: false,
                } as EaCAzureOpenAILLMDetails,
              },
            },
          },
        },
        Circuits: {
          $neurons: {
            'thinky-llm': {
              Type: 'LLM',
              LLMLookup: `thinky|thinky`,
            } as EaCLLMNeuron,
          },
          'basic-chat-w-history': {
            Details: {
              Type: 'Linear',
              Name: 'basic-chat',
              Description: 'Used to have an open ended chat with you.',
              InputSchema: z.object({
                input: z.string().describe('The users new message.'),
              }),
              Priority: 100,
              Neurons: {
                '': {
                  Type: 'ChatHistory',
                  ChatHistoryLookup: `thinky|tester`,
                  InputKey: 'input',
                  HistoryKey: 'messages',
                  Neurons: {
                    '': {
                      Type: 'ChatPrompt',
                      InputKey: 'question',
                      SystemMessage: 'You are a helpful, pirate assistant.',
                      Messages: [
                        // ...baseMessages,
                        new MessagesPlaceholder('messages'),
                      ] as BaseMessagePromptTemplateLike[],
                      NewMessages: [['human', '{input}']],
                      Neurons: {
                        '': 'thinky-llm',
                      },
                    } as EaCChatPromptNeuron,
                  },
                } as EaCChatHistoryNeuron,
              },
            },
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
