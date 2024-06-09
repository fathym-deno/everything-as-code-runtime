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

// https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/dynamically-returning-directly.ipynb

type ScoredValue = {
  value: string;
  score: number;
};

Deno.test('Graph Dynamically Returning Directly Circuits', async (t) => {
  const aiLookup = 'thinky';

  const itsSunnyText =
    "It's sunny in San Francisco, but you better look out if you're a Gemini 😈.";

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
              Description: 'Call to surf the web.',
              Schema: z.object({
                query: z.string().describe('query to look up online'),
                return_direct: z
                  .boolean()
                  .describe(
                    'Whether or not the result of this should be returned directly to the user without you seeing what it is'
                  )
                  .default(false),
              }),
              Action: async ({}: { query: string }) => {
                return itsSunnyText;
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
      drd: {
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
                      const messages = state.messages;

                      const response = await r.invoke(messages, config);

                      return { messages: [response] };
                    }
                  );
                },
              } as Partial<EaCNeuron>,
            ],
            final: 'thinky-tools',
            tools: 'thinky-tools',
          },
          Edges: {
            [START]: 'agent',
            // agent: 'tools',
            // tools: END,
            agent: {
              Node: {
                [END]: END,
                final: 'final',
                tools: 'tools',
              },
              Condition: (state: { messages: BaseMessage[] }) => {
                const { messages } = state;

                const lastMessage = messages[messages.length - 1] as AIMessage;

                if (!lastMessage?.additional_kwargs?.tool_calls?.length) {
                  return END;
                } else {
                  const args = JSON.parse(
                    lastMessage.additional_kwargs.tool_calls[0].function
                      .arguments
                  );

                  return args?.return_direct ? 'final' : 'tools';
                }
              },
            },
            tools: 'agent',
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
    const circuit = await ioc.Resolve<Runnable>(ioc.Symbol('Circuit'), 'drd');

    let chunk = await circuit.invoke({
      messages: [new HumanMessage('what is the weather in sf?')],
    });

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    chunk = await circuit.invoke({
      messages: [new HumanMessage('what is the weather in sf? return this result directly by setting return_direct = True"')],
    });

    assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk.messages.slice(-1)[0].content);

    assertEquals(chunk.messages.slice(-1)[0].content, itsSunnyText);
  });

  kv.close();
});
