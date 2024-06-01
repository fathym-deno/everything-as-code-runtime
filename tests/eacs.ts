import {
  AzureAISearchQueryType,
  EaCAIAsCode,
  EaCAzureOpenAIEmbeddingsDetails,
  EaCAzureOpenAILLMDetails,
  EaCAzureSearchAIVectorStoreDetails,
  EaCCheerioWebDocumentLoaderDetails,
  EaCDatabaseAsCode,
  EaCDenoKVChatHistoryDetails,
  EaCDenoKVDatabaseDetails,
  EaCDenoKVIndexerDetails,
  EaCRecursiveCharacterTextSplitterDetails,
} from './test.deps.ts';

export const eacAIsRoot = {
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
} as EaCAIAsCode;

export const eacDatabases = {
  Details: {
    Type: 'DenoKV',
    Name: 'Thinky',
    Description: 'The Deno KV database to use for thinky',
    DenoKVPath: Deno.env.get('THINKY_DENO_KV_PATH') || undefined,
  } as EaCDenoKVDatabaseDetails,
} as EaCDatabaseAsCode;
