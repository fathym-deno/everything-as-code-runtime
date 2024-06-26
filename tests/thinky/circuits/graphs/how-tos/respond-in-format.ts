import { eacAIsRoot, eacDatabases } from '../../../../eacs.ts';
import {
  AIMessage,
  assert,
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

// https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/respond-in-format.ipynb

Deno.test('Graph Respond in Format Circuits', async (t) => {
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
              ToolLookups: ['thinky|test', 'thinky|response'],
            } as EaCAzureOpenAILLMDetails,
          },
        },
        Tools: {
          response: {
            Details: {
              Type: 'Dynamic',
              Name: 'Response',
              Description: 'Respond to the user using this tool.',
              Schema: z.object({
                temperature: z.number().describe('the temperature'),
                other_notes: z
                  .string()
                  .describe('any other notes about the weather'),
              }),
              Action: async () => {
                return 'This tool should not be called.';
              },
            } as EaCDynamicToolDetails,
          },
          test: {
            Details: {
              Type: 'Dynamic',
              Name: 'search',
              Description: 'Call to surf the web.',
              Schema: z.object({
                query: z.string().describe('The query to use in your search.'),
              }),
              Action: async ({}: { query: string }) => {
                return 'The answer to your question lies within.';
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
      rif: {
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

                if (
                  lastMessage.additional_kwargs.tool_calls[0].function.name ===
                  'Response'
                ) {
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

  await t.step('Respond in Format Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(ioc.Symbol('Circuit'), 'rif');

    const chunk = await circuit.invoke({
      messages: [new HumanMessage(`what is the weather in sf?`)],
    });

    assert(
      chunk.messages.slice(-1)[0].additional_kwargs?.tool_calls?.[0],
      JSON.stringify(chunk)
    );

    console.log(
      chunk.messages.slice(-1)[0].additional_kwargs?.tool_calls?.[0].function
        .arguments
    );
  });
});
