import {
  AIMessage,
  AzureAISearchQueryType,
  BaseMessagePromptTemplateLike,
  EaCAzureOpenAIEmbeddingsDetails,
  EaCAzureOpenAILLMDetails,
  EaCAzureSearchAIVectorStoreDetails,
  EaCChatHistoryNeuron,
  EaCChatPromptNeuron,
  EaCCheerioWebDocumentLoaderDetails,
  EaCDenoKVChatHistoryDetails,
  EaCDenoKVDatabaseDetails,
  EaCDenoKVIndexerDetails,
  EaCLLMNeuron,
  EaCPromptNeuron,
  EaCRecursiveCharacterTextSplitterDetails,
  EverythingAsCodeDatabases,
  EverythingAsCodeSynaptic,
  FathymEaCServicesPlugin,
  FathymSynapticEaCServicesPlugin,
  HumanMessage,
  IoCContainer,
  MessagesPlaceholder,
} from '../../test.deps.ts';

Deno.test('Plan - Minerva', async (_t) => {
  const aiLookup = 'thinky';

  const systemMessage =
    'You are a helpful assistant named Thinky. Answer all questions to the best of your ability. Respond like a pirate. If you are asked the same question, act annoyed.';

  const baseMessages: BaseMessagePromptTemplateLike[] = [
    new AIMessage('Hello'),
    new HumanMessage('Hi, how are you feeling today?'),
    new AIMessage('Fantastic, thanks for asking.'),
  ];

  const eac = {
    AIs: {
      [aiLookup]: {
        Details: {
          Name: 'Thinky AI',
          Description: 'The Thinky AI for product workflow management.',
        },
        ChatHistories: {
          thinky: {
            Details: {
              Type: 'DenoKV',
              Name: 'Thinky',
              Description: 'The Thinky document indexer to use.',
              DenoKVDatabaseLookup: 'thinky',
              RootKey: ['Thinky', 'EaC', 'ChatHistory'],
            } as EaCDenoKVChatHistoryDetails,
          },
        },
        Embeddings: {
          thinky: {
            Details: {
              Name: 'Azure OpenAI LLM',
              Description: 'The LLM for interacting with Azure OpenAI.',
              APIKey: Deno.env.get('AZURE_OPENAI_KEY')!,
              Endpoint: Deno.env.get('AZURE_OPENAI_ENDPOINT')!,
              DeploymentName: 'text-embedding-ada-002',
            } as EaCAzureOpenAIEmbeddingsDetails,
          },
        },
        Indexers: {
          main: {
            Details: {
              Type: 'DenoKV',
              Name: 'Thinky',
              Description: 'The Thinky document indexer to use.',
              DenoKVDatabaseLookup: 'thinky',
              RootKey: ['Thinky', 'EaC', 'Indexers'],
            } as EaCDenoKVIndexerDetails,
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
        Loaders: {
          fathym: {
            Details: {
              Type: 'CheerioWeb',
              URL: 'https://www.fathym.com',
            } as EaCCheerioWebDocumentLoaderDetails,
          },
        },
        TextSplitters: {
          main: {
            Details: {
              Type: 'RecursiveCharacter',
              ChunkOverlap: 50,
              ChunkSize: 300,
            } as EaCRecursiveCharacterTextSplitterDetails,
          },
        },
        VectorStores: {
          thinky: {
            Details: {
              Type: 'AzureSearchAI',
              Name: 'Azure Search AI',
              Description: 'The Vector Store for interacting with Azure Search AI.',
              APIKey: Deno.env.get('AZURE_AI_SEARCH_KEY')!,
              Endpoint: Deno.env.get('AZURE_AI_SEARCH_ENDPOINT')!,
              EmbeddingsLookup: 'thinky',
              IndexerLookup: 'thinky',
              QueryType: AzureAISearchQueryType.SimilarityHybrid,
            } as EaCAzureSearchAIVectorStoreDetails,
          },
        },
      },
    },
    Circuits: {
      $neurons: {
        'chat-history': {
          Type: 'ChatHistory',
          ChatHistoryLookup: `${aiLookup}|thinky`,
          InputKey: 'input',
          HistoryKey: 'chat_history',
        } as EaCChatHistoryNeuron,
        'thinky-llm': {
          Type: 'LLM',
          LLMLookup: `${aiLookup}|thinky`,
        } as EaCLLMNeuron,
        'test-chat': {
          Type: 'ChatPrompt',
          SystemMessage: systemMessage,
          Messages: baseMessages,
          Neurons: {
            '': 'thinky-llm',
          },
        } as EaCChatPromptNeuron,
      },
      'basic-prompt': {
        Details: {
          Type: '',
          Priority: 100,
          Neurons: {
            '': {
              Type: 'Prompt',
              PromptTemplate: 'What mood does the color {input} provoke?',
              Neurons: {
                '': 'thinky-llm',
              },
            } as EaCPromptNeuron,
          },
        },
      },
      'basic-chat': {
        Details: {
          Type: '',
          Priority: 100,
          Neurons: {
            '': [
              'test-chat',
              {
                NewMessages: [['human', '{input}']],
              } as Partial<EaCChatPromptNeuron>,
            ],
          },
        },
      },
      'basic-chat-w-history': {
        Details: {
          Type: '',
          Priority: 100,
          Neurons: {
            '': [
              'chat-history',
              {
                InputKey: 'question',
                Neurons: {
                  '': [
                    'test-chat',
                    {
                      NewMessages: [['human', '{question}']],
                      Messages: [
                        ...baseMessages,
                        new MessagesPlaceholder('chat_history'),
                      ],
                    } as Partial<EaCChatPromptNeuron>,
                  ],
                },
              } as Partial<EaCChatPromptNeuron>,
            ],
          },
        },
      },
      'rag-chat-w-history': {
        Details: {
          Type: '',
          Priority: 100,
          Neurons: {
            '': [
              'chat-history',
              {
                InputKey: 'question',
                Neurons: {
                  '': [
                    'test-chat',
                    {
                      NewMessages: [['human', '{question}']],
                      Messages: [
                        ...baseMessages,
                        new MessagesPlaceholder('chat_history'),
                      ],
                    } as Partial<EaCChatPromptNeuron>,
                  ],
                },
              } as Partial<EaCChatPromptNeuron>,
            ],
          },
        },
      },
    },
    // Retrievers: {
    //   fathym: {
    //     Details: {
    //       LoaderLookups: ['thinky|fathym'],
    //       TextSplitterLookup: 'thinky|main',
    //       VectorStoreLookup: 'thinky|thinky',
    //       IndexerLookup: 'thinky|main',
    //     },
    //   },
    // },
    Databases: {
      [aiLookup]: {
        Details: {
          Type: 'DenoKV',
          Name: 'Thinky',
          Description: 'The Deno KV database to use for thinky',
          DenoKVPath: Deno.env.get('THINKY_DENO_KV_PATH') || undefined,
        } as EaCDenoKVDatabaseDetails,
      },
    },
  } as EverythingAsCodeSynaptic & EverythingAsCodeDatabases;

  const ioc = new IoCContainer();

  await new FathymEaCServicesPlugin().AfterEaCResolved(eac, ioc);

  await new FathymSynapticEaCServicesPlugin().AfterEaCResolved(eac, ioc);

  // const sessionId = 'minerva-test';

  // const chatHistoryFactory = await ioc.Resolve<
  //   (sessionId: string) => BaseListChatMessageHistory
  // >(ioc.Symbol('ChatHistory'), `${aiLookup}|thinky`);

  // const chatHistory = chatHistoryFactory(sessionId);

  // await chatHistory.clear();

  //   await t.step('Story Interpreter', async () => {
  //     // Store incoming files/contents
  //     // Summarize
  //     // Extract possible epics, features, and stories
  //     // Overlay found epics, features, and stories accross the existing
  //     // Create new Epics, Feature, and Stories
  //     // Update existing epics, features, and stories with new context
  //     // Should be a business focused story at this time
  //   });

  //   await t.step('Product Owner', async () => {
  //     // Store incoming files/contents
  //     // Summarize
  //     // Extract possible epics, features, and stories
  //     // Overlay found epics, features, and stories accross the existing
  //     // Create new Epics, Feature, and Stories
  //     // Update existing epics, features, and stories with new context
  //     // Should be a business focused story at this time
  //   });

  const kv = await ioc.Resolve(Deno.Kv, aiLookup);

  kv.close();
});
