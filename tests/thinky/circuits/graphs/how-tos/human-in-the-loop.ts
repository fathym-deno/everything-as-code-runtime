import { eacAIsRoot, eacDatabases } from '../../../../eacs.ts';
import {
  AIMessage,
  assert,
  assertEquals,
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

// https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/human-in-the-loop.ipynb

Deno.test('Graph Human in the Loop Circuits', async (t) => {
  const itsSunnyText =
    "It's sunny in San Francisco, but you better look out if you're a Gemini 😈.";

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
              Description: 'Call to surf the web.',
              Schema: z.object({
                query: z.string().describe('The query to use in your search.'),
              }),
              Action: async ({}: { query: string }) => {
                return itsSunnyText;
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
      hitl: {
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
            tools: 'thinky-tools',
          },
          Interrupts: {
            Before: ['tools'],
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

                if (!lastMessage?.additional_kwargs?.tool_calls?.length) {
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

  await t.step('Human in the Loop Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(ioc.Symbol('Circuit'), 'hitl');

    let chunk = await circuit.invoke(
      {
        messages: [new HumanMessage(`Hi! I'm Mike`)],
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
        messages: [new HumanMessage('What did I tell you my name was?')],
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

    chunk = await circuit.invoke(
      {
        messages: [new HumanMessage(`What's the weather in sf now?`)],
      },
      {
        configurable: {
          thread_id: 'test',
        },
      }
    );

    assertFalse(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    chunk = await circuit.invoke(null, {
      configurable: {
        thread_id: 'test',
      },
    });

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);
  });
});
