import { eacAIsRoot, eacDatabases } from '../eacs.ts';
import {
  AIMessage,
  assert,
  BaseMessagePromptTemplateLike,
  EaCChatHistoryNeuron,
  EaCChatPromptNeuron,
  EaCLLMNeuron,
  EaCPromptNeuron,
  EverythingAsCodeDatabases,
  EverythingAsCodeSynaptic,
  FathymEaCServicesPlugin,
  FathymSynapticEaCServicesPlugin,
  HumanMessage,
  IoCContainer,
  MessagesPlaceholder,
  Runnable,
} from '../test.deps.ts';

Deno.test('Circuits', async (t) => {
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
        ...eacAIsRoot,
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
        ...eacDatabases,
      },
    },
  } as EverythingAsCodeSynaptic & EverythingAsCodeDatabases;

  const ioc = new IoCContainer();

  await new FathymEaCServicesPlugin().AfterEaCResolved(eac, ioc);

  await new FathymSynapticEaCServicesPlugin().AfterEaCResolved(eac, ioc);

  const sessionId = 'test';

  // const chatHistoryFactory = await ioc.Resolve<
  //   (sessionId: string) => BaseListChatMessageHistory
  // >(ioc.Symbol('ChatHistory'), `${aiLookup}|thinky`);

  // const chatHistory = chatHistoryFactory(sessionId);

  // await chatHistory.clear();

  await t.step('Basic Prompt Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'basic-prompt',
    );

    const chunk = await circuit.invoke({
      input: 'green',
    });

    assert(chunk.content, JSON.stringify(chunk));

    console.log(chunk.content);
  });

  await t.step('Basic Chat Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'basic-chat',
    );

    const chunk = await circuit.invoke({
      input: 'What is a good color to use to make someone feel happy?',
    });

    assert(chunk.content, JSON.stringify(chunk));

    console.log(chunk.content);
  });

  await t.step('Basic Chat with History Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'basic-chat-w-history',
    );

    const chunk = await circuit.invoke(
      {
        question: 'What is a good color to use to make someone feel confused?',
      },
      { configurable: { sessionId } },
    );

    assert(chunk.content, JSON.stringify(chunk));

    console.log(chunk.content);
  });

  // await t.step('RAG Chat with History Circuit', async () => {
  //   const circuit = await ioc.Resolve<Runnable>(
  //     ioc.Symbol('Circuit'),
  //     'rag-chat-w-history'
  //   );

  //   const chunk = await circuit.invoke(
  //     {
  //       question: 'What is a good color to use to make someone feel confused?',
  //     },
  //     { configurable: { sessionId } }
  //   );

  //   assert(chunk.content, JSON.stringify(chunk));

  //   console.log(chunk.content);
  // });

  // const messages = await chatHistory.getMessages();

  // console.log(messages.map((msg) => msg.content));

  const kv = await ioc.Resolve(Deno.Kv, aiLookup);

  kv.close();
});
