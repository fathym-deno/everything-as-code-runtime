import { eacAIsRoot, eacDatabases } from '../../../../eacs.ts';
import {
  AIMessage,
  assert,
  assertFalse,
  assertStringIncludes,
  BaseMessage,
  EaCAzureOpenAILLMDetails,
  EaCDynamicToolDetails,
  EaCGraphCircuitDetails,
  EaCLLMNeuron,
  EaCNeuron,
  EaCPassthroughNeuron,
  EaCToolExecutorNeuron,
  END,
  EverythingAsCodeDatabases,
  EverythingAsCodeSynaptic,
  FathymEaCServicesPlugin,
  FathymSynapticEaCServicesPlugin,
  HumanMessage,
  IoCContainer,
  Runnable,
  RunnableLambda,
  START,
  z,
} from '../../../../test.deps.ts';
import { AI_LOOKUP, buildTestIoC } from '../../../test-eac-setup.ts';

// https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/persistence.ipynb

Deno.test('Persistence Circuits', async (t) => {
  const eac = {
    AIs: {
      [AI_LOOKUP]: {
        LLMs: {
          'thinky-test': {
            Details: {
              Name: 'Azure OpenAI LLM',
              Description: 'The LLM for interacting with Azure OpenAI.',
              APIKey: Deno.env.get('AZURE_OPENAI_KEY')!,
              Endpoint: Deno.env.get('AZURE_OPENAI_ENDPOINT')!,
              DeploymentName: 'gpt-4o',
              ModelName: 'gpt-4o',
              Streaming: true,
              Verbose: false,
              ToolLookups: ['thinky|test'],
            } as EaCAzureOpenAILLMDetails,
          },
        },
        Tools: {
          test: {
            Details: {
              Type: 'Dynamic',
              Name: 'search',
              Description:
                'Use to surf the web, fetch current information, check the weather, and retrieve other information.',
              Schema: z.object({
                query: z.string().describe('The query to use in your search.'),
              }),
              Action: async ({}: { query: string }) => {
                return 'Cold, with a low of 13 ℃';
              },
            } as EaCDynamicToolDetails,
          },
        },
      },
    },
    Circuits: {
      $neurons: {
        $pass: {
          Type: 'Passthrough',
        } as EaCPassthroughNeuron,
        'thinky-llm': {
          Type: 'LLM',
          LLMLookup: `${AI_LOOKUP}|thinky-test`,
        } as EaCLLMNeuron,
        'thinky-agent': {
          Neurons: {
            '': [
              'thinky-llm',
              {
                Bootstrap: (r) => {
                  return RunnableLambda.from(
                    async (state: { messages: BaseMessage[] }, config) => {
                      const { messages } = state;

                      const response = await r.invoke(messages, config);

                      return { messages: [response] };
                    }
                  );
                },
              } as Partial<EaCNeuron>,
            ],
          },
        } as Partial<EaCNeuron>,
        'thinky-tools': {
          Type: 'ToolExecutor',
          ToolLookups: ['thinky|test'],
          MessagesPath: '$.messages',
          Bootstrap: (r) => {
            return RunnableLambda.from(
              async (state: { messages: Array<BaseMessage> }) => {
                const response = await r.invoke(state);

                console.log('Called tool...');

                return {
                  messages: response,
                };
              }
            );
          },
        } as EaCToolExecutorNeuron,
      },
      'no-persist': {
        Details: {
          Type: 'Graph',
          Priority: 100,
          State: {
            messages: {
              value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
              default: () => [],
            },
          },
          Neurons: {
            agent: 'thinky-agent',
            tools: 'thinky-tools',
          },
          Edges: {
            [START]: 'agent',
            agent: {
              Node: {
                [END]: END,
                tools: 'tools',
              },
              Condition: (state: { messages: BaseMessage[] }) => {
                const { messages } = state;

                const lastMessage = messages[messages.length - 1] as AIMessage;

                if (!lastMessage.additional_kwargs?.tool_calls?.length) {
                  return END;
                }

                return 'tools';
              },
            },
            tools: 'agent',
          },
        } as EaCGraphCircuitDetails,
      },
      'persist-memory': {
        Details: {
          Type: 'Graph',
          Priority: 100,
          PersistenceLookup: `${AI_LOOKUP}|memory`,
          State: {
            messages: {
              value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
              default: () => [],
            },
          },
          Neurons: {
            agent: 'thinky-agent',
            tools: 'thinky-tools',
          },
          Edges: {
            [START]: 'agent',
            agent: {
              Node: {
                [END]: END,
                tools: 'tools',
              },
              Condition: (state: { messages: BaseMessage[] }) => {
                const { messages } = state;

                const lastMessage = messages[messages.length - 1] as AIMessage;

                if (!lastMessage.additional_kwargs?.tool_calls?.length) {
                  return END;
                }

                return 'tools';
              },
            },
            tools: 'agent',
          },
        } as EaCGraphCircuitDetails,
      },
      'persist-denokv': {
        Details: {
          Type: 'Graph',
          Priority: 100,
          PersistenceLookup: `${AI_LOOKUP}|denokv`,
          State: {
            messages: {
              value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
              default: () => [],
            },
          },
          Neurons: {
            agent: 'thinky-agent',
            tools: 'thinky-tools',
          },
          Edges: {
            [START]: 'agent',
            agent: {
              Node: {
                [END]: END,
                tools: 'tools',
              },
              Condition: (state: { messages: BaseMessage[] }) => {
                const { messages } = state;

                const lastMessage = messages[messages.length - 1] as AIMessage;

                if (!lastMessage.additional_kwargs?.tool_calls?.length) {
                  return END;
                }

                return 'tools';
              },
            },
            tools: 'agent',
          },
        } as EaCGraphCircuitDetails,
      },
    },
  } as EverythingAsCodeSynaptic & EverythingAsCodeDatabases;

  const ioc = await buildTestIoC(eac);

  await t.step('No Persist Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'no-persist'
    );

    let chunk = await circuit.invoke(
      {
        messages: [new HumanMessage(`Hi I'm Mike, nice to meet you.`)],
      },
      {
        configurable: {
          thread_id: 'test',
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    chunk = await circuit.invoke(
      {
        messages: [new HumanMessage(`Remember my name?`)],
      },
      {
        configurable: {
          thread_id: 'test',
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    assertFalse(chunk.messages.slice(-1)[0].content.includes('Mike'));
  });

  await t.step('Persist Memory Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'persist-memory'
    );

    let chunk = await circuit.invoke(
      {
        messages: [new HumanMessage(`Hi I'm Mike, nice to meet you.`)],
      },
      {
        configurable: {
          thread_id: 'test',
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    chunk = await circuit.invoke(
      {
        messages: [new HumanMessage(`Remember my name?`)],
      },
      {
        configurable: {
          thread_id: 'test',
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    assertStringIncludes(chunk.messages.slice(-1)[0].content, 'Mike');
  });

  await t.step('Persist DenoKV Circuit', async (t) => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'persist-denokv'
    );

    let chunk = await circuit.invoke(
      {
        messages: [new HumanMessage(`Hi I'm Mike, nice to meet you.`)],
      },
      {
        configurable: {
          thread_id: 'test',
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    chunk = await circuit.invoke(
      {
        messages: [new HumanMessage(`Remember my name?`)],
      },
      {
        configurable: {
          thread_id: 'test',
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    assertStringIncludes(chunk.messages.slice(-1)[0].content, 'Mike');
  });

  await t.step('Persist DenoKV ReCheck Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'persist-denokv'
    );

    const chunk = await circuit.invoke(
      {
        messages: [new HumanMessage(`Remember my name?`)],
      },
      {
        configurable: {
          thread_id: 'test',
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    assertStringIncludes(chunk.messages.slice(-1)[0].content, 'Mike');
  });
});
