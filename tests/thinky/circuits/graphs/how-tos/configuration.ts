import { eacAIsRoot, eacDatabases } from '../../../../eacs.ts';
import {
  assert,
  assertEquals,
  assertStringIncludes,
  BaseMessage,
  BaseMessagePromptTemplateLike,
  EaCChatPromptNeuron,
  EaCGraphCircuitDetails,
  EaCLLMNeuron,
  EaCNeuron,
  EaCPassthroughNeuron,
  END,
  EverythingAsCodeDatabases,
  EverythingAsCodeSynaptic,
  FathymEaCServicesPlugin,
  FathymSynapticEaCServicesPlugin,
  HumanMessage,
  IoCContainer,
  MessagesPlaceholder,
  Runnable,
  RunnableLambda,
  START,
} from '../../../../test.deps.ts';

// https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/configuration.ipynb

type ScoredValue = {
  value: string;
  score: number;
};

Deno.test('Graph Configuration Circuits', async (t) => {
  const aiLookup = 'thinky';

  const userDB = {
    user1: {
      name: 'John Doe',
      email: 'jod@langchain.ai',
      phone: '+1234567890',
    },
    user2: {
      name: 'Jane Doe',
      email: 'jad@langchain.ai',
      phone: '+0987654321',
    },
  };

  const eac = {
    AIs: {
      [aiLookup]: {
        ...eacAIsRoot,
      },
    },
    Circuits: {
      $neurons: {
        $pass: {
          Type: 'Passthrough',
        } as EaCPassthroughNeuron,
        'thinky-llm': {
          Type: 'LLM',
          LLMLookup: `${aiLookup}|thinky`,
        } as EaCLLMNeuron,
      },
      config: {
        Details: {
          Type: 'Graph',
          Priority: 100,
          State: {
            messages: {
              value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
              default: () => [],
            },
            userInfo: {
              value: (x?: string, y?: string) => {
                return y ? y : x ? x : 'N/A';
              },
              default: () => 'N/A',
            },
          },
          Neurons: {
            agent: {
              Type: 'ChatPrompt',
              SystemMessage:
                'You are a helpful assistant.\n\n## User Info:\n{userInfo}',
              Messages: [
                new MessagesPlaceholder('messages'),
              ] as BaseMessagePromptTemplateLike[],
              Neurons: {
                '': 'thinky-llm',
              },
              Bootstrap: (r) => {
                return RunnableLambda.from(
                  async (
                    state: { messages: BaseMessage[]; userInfo: string },
                    config
                  ) => {
                    const { messages, userInfo } = state;

                    const response = await r.invoke(
                      {
                        messages,
                        userInfo,
                      },
                      config
                    );

                    return { messages: [response] };
                  }
                );
              },
            } as EaCChatPromptNeuron,
            'fetch-user-info': {
              Bootstrap: () => {
                return RunnableLambda.from((_: {}, config) => {
                  const userId = config?.configurable?.user;

                  if (userId) {
                    const user = userDB[userId as keyof typeof userDB];

                    if (user) {
                      return {
                        userInfo: `Name: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone}`,
                      };
                    }
                  }

                  return { userInfo: 'N/A' };
                });
              },
            } as Partial<EaCNeuron>,
          },
          Edges: {
            [START]: 'fetch-user-info',
            ['fetch-user-info']: 'agent',
            agent: END,
          },
        } as EaCGraphCircuitDetails,
      },
    },
    Databases: {
      [aiLookup]: {
        ...eacDatabases,
      },
    },
  } as EverythingAsCodeSynaptic & EverythingAsCodeDatabases;

  const ioc = new IoCContainer();

  await new FathymEaCServicesPlugin().AfterEaCResolved(eac, ioc);

  await new FathymSynapticEaCServicesPlugin().AfterEaCResolved(eac, ioc);

  const kv = await ioc.Resolve(Deno.Kv, aiLookup);

  await t.step('Configuration Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'config'
    );

    let user = 'user1';

    let chunk = await circuit.invoke(
      {
        messages: [new HumanMessage('Could you remind me of my email??')],
      },
      {
        configurable: {
          user,
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    assertStringIncludes(
      chunk.messages.slice(-1)[0].content,
      userDB[user as keyof typeof userDB].email
    );

    user = 'user2';

    chunk = await circuit.invoke(
      {
        messages: [new HumanMessage('Could you remind me of my email??')],
      },
      {
        configurable: {
          user,
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    assertStringIncludes(
      chunk.messages.slice(-1)[0].content,
      userDB[user as keyof typeof userDB].email
    );
  });

  kv.close();
});