import { ToolMessage } from 'npm:@langchain/core/messages';
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

// https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/managing-agent-steps.ipynb

Deno.test('Graph Managing Agent Steps Circuits', async (t) => {
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
                return 'Try again in a few seconds! Checking with the weathermen... Call me again next.';
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

                console.log('Called tool...');

                return {
                  messages: response,
                };
              }
            );
          },
        } as EaCToolExecutorNeuron,
      },
      mas: {
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
                      const modelMessages = [];

                      for (let i = state.messages.length - 1; i >= 0; i--) {
                        modelMessages.push(state.messages[i]);

                        if (modelMessages.length >= 5) {
                          if (
                            !ToolMessage.isInstance(
                              modelMessages[modelMessages.length - 1]
                            )
                          ) {
                            break;
                          }
                        }
                      }

                      modelMessages.reverse();

                      const response = await r.invoke(modelMessages, config);

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

  await t.step('Managing Agent Steps Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(ioc.Symbol('Circuit'), 'mas');

    const chunk = await circuit.invoke(
      {
        messages: [
          new HumanMessage(
            `what is the weather in sf? Don't give up! Keep using your tools.`
          ),
        ],
      },
      {
        configurable: {
          thread_id: 'test',
        },
      }
    );

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);
  });
});
