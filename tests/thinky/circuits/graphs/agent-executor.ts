import {
  AIMessage,
  assert,
  assertFalse,
  assertStringIncludes,
  BaseMessage,
  EaCGraphCircuitDetails,
  EaCLLMNeuron,
  EaCOpenAIFunctionsAgentNeuron,
  EaCPullChatPromptNeuron,
  EaCToolExecutorNeuron,
  END,
  EverythingAsCodeDatabases,
  EverythingAsCodeSynaptic,
  HumanMessage,
  Runnable,
  RunnableLambda,
  START,
  z,
} from '../../../test.deps.ts';
import { AI_LOOKUP, buildTestIoC } from '../../test-eac-setup.ts';

// https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/human-in-the-loop.ipynb

Deno.test('Graph Agent Executor Circuits', async (t) => {
  const eac = {
    Circuits: {
      $neurons: {
        'thinky-llm': {
          Type: 'LLM',
          LLMLookup: `${AI_LOOKUP}|thinky`,
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
      agent: {
        Details: {
          Type: 'Graph',
          Priority: 100,
          State: {
            input: {
              value: null,
            },
            steps: {
              value: (x: any[], y: any[]) => x.concat(y),
              default: () => [],
            },
            agentOutcome: {
              value: null,
            },
          },
          Neurons: {
            agent: {
              Type: 'OpenAIFunctionsAgent',
              Neurons: {
                LLM: 'thinky-llm',
                Prompt: {
                  Type: 'PullChatPrompt',
                  Template: 'hwchase17/openai-functions-agent',
                } as EaCPullChatPromptNeuron,
              },
              ToolLookups: [`${AI_LOOKUP}|tavily`],
            } as EaCOpenAIFunctionsAgentNeuron,
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

  await t.step('Agent Executor Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(ioc.Symbol('Circuit'), 'agent');

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
