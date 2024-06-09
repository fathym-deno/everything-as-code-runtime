import { eacAIsRoot, eacDatabases } from '../../../../eacs.ts';
import {
  AIMessage,
  assert,
  assertEquals,
  assertStrictEquals,
  assertStringIncludes,
  BaseMessage,
  EaCAzureOpenAILLMDetails,
  EaCDynamicStructuredToolDetails,
  EaCGraphCircuitDetails,
  EaCLLMNeuron,
  EaCNeuron,
  EaCPassthroughNeuron,
  EaCToolExecutorNeuron,
  EaCToolNodeNeuron,
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
  ToolNode,
  z,
} from '../../../../test.deps.ts';

// https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/force-calling-a-tool-first.ipynb

type ScoredValue = {
  value: string;
  score: number;
};

Deno.test('Graph Force Calling a Tool First Circuits', async (t) => {
  const aiLookup = 'thinky';

  const eac = {
    AIs: {
      [aiLookup]: {
        ...eacAIsRoot,
        LLMs: {
          ...eacAIsRoot.LLMs,
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
          ...eacAIsRoot.Tools,
          test: {
            Details: {
              Type: 'DynamicStructured',
              Name: 'search',
              Description:
                'Use to surf the web, fetch current information, check the weather, and retrieve other information.',
              Schema: z.object({
                query: z.string().describe('The query to use in your search.'),
              }),
              Action: async ({}: { query: string }) => {
                return 'Cold, with a low of 13 ℃';
              },
            } as EaCDynamicStructuredToolDetails,
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
          LLMLookup: `${aiLookup}|thinky-test`,
        } as EaCLLMNeuron,
        'thinky-tools': {
          Type: 'ToolExecutor',
          ToolLookups: ['thinky|test'],
          MessagesPath: '$.messages',
          Bootstrap: (r) => {
            return RunnableLambda.from(
              async (state: { messages: Array<BaseMessage> }) => {
                const response = await r.invoke(state);

                return {
                  messages: response,
                };
              }
            );
          },
        } as EaCToolExecutorNeuron,
      },
      'tool-first': {
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
            agent: [
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
            first_agent: {
              Bootstrap: () => {
                return RunnableLambda.from(
                  (state: { messages: BaseMessage[] }) => {
                    const humanInput =
                      state.messages[state.messages.length - 1].content || '';

                    return {
                      messages: [
                        new AIMessage({
                          content: '',
                          tool_calls: [
                            {
                              name: 'search',
                              args: {
                                query: humanInput,
                              },
                              id: 'tool_abcd123',
                            },
                          ],
                        }),
                      ],
                    };
                  }
                );
              },
            } as Partial<EaCNeuron>,
            action: 'thinky-tools',
          },
          Edges: {
            [START]: 'first_agent',
            first_agent: 'action',
            action: 'agent',
            agent: {
              Node: {
                [END]: END,
                continue: 'action',
              },
              Condition: (state: { messages: BaseMessage[] }) => {
                const { messages } = state;

                const lastMessage = messages[messages.length - 1] as AIMessage;

                if (!lastMessage.additional_kwargs.tool_calls?.length) {
                  return END;
                }

                return 'continue';
              },
            },
            final: END,
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

  await t.step('Dynamically Returning Directly Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'tool-first'
    );

    const chunk = await circuit.invoke({
      messages: [new HumanMessage('what is the weather in sf?')],
    });

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);
  });

  kv.close();
});
