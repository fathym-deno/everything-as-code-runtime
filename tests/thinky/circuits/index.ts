import { eacAIsRoot, eacDatabases } from '../../eacs.ts';
import {
  AgentAction,
  AIMessage,
  assert,
  BaseLanguageModel,
  BaseMessage,
  BaseMessagePromptTemplateLike,
  ChatPromptTemplate,
  EaCChatHistoryNeuron,
  EaCChatPromptNeuron,
  EaCCircuitNeuron,
  EaCGraphCircuitDetails,
  EaCLinearCircuitDetails,
  EaCLLMNeuron,
  EaCPassthroughNeuron,
  EaCPromptNeuron,
  EaCStringOutputParserNeuron,
  EaCToolExecutorNeuron,
  EaCToolNeuron,
  END,
  EverythingAsCodeDatabases,
  EverythingAsCodeSynaptic,
  FathymEaCServicesPlugin,
  FathymSynapticEaCServicesPlugin,
  FunctionMessage,
  HumanMessage,
  IoCContainer,
  MessagesPlaceholder,
  Runnable,
  RunnableLambda,
  START,
  StateGraph,
  StructuredTool,
  ToolExecutor,
} from '../../test.deps.ts';
import process from 'node:process';

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
        $pass: {
          Type: 'Passthrough',
        } as EaCPassthroughNeuron,
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
        'thinky-llm-tooled': {
          Type: 'LLM',
          LLMLookup: `${aiLookup}|thinky-tooled`,
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
          Type: 'Linear',
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
          Type: 'Linear',
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
          Type: 'Linear',
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
          Type: 'Linear',
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
      'tool-chat:search': {
        Details: {
          Type: 'Linear',
          Priority: 100,
          Neurons: {
            input: '$pass',
          },
          Synapses: {
            input: [
              '$pass',
              {
                Field: '$.input',
              } as Partial<EaCPassthroughNeuron>,
            ],
            search: {
              Type: 'ChatPrompt',
              SystemMessage: 'You are an expert web researcher.',
              NewMessages: [
                [
                  'human',
                  `Turn the following user input into a search query for a search engine (just return the query, no extra quotes):
                  
{input}`,
                ],
              ],
              Neurons: {
                '': [
                  'thinky-llm',
                  {
                    Neurons: {
                      '': {
                        Type: 'StringOutputParser',
                        Neurons: {
                          '': {
                            Type: 'Tool',
                            ToolLookup: 'thinky|tavily',
                          } as EaCToolNeuron,
                        },
                      } as EaCStringOutputParserNeuron,
                    },
                  } as Partial<EaCLLMNeuron>,
                ],
              },
            } as EaCChatPromptNeuron,
          },
        },
      },
      'tool-chat': {
        Details: {
          Type: 'Linear',
          Priority: 100,
          Neurons: {
            '': {
              Type: 'Circuit',
              CircuitLookup: 'tool-chat:search',
              Neurons: {
                '': {
                  Type: 'ChatPrompt',
                  SystemMessage: `You are here to summarize the users JSON formatted web results, you will need to answer their original input:

{input}`,
                  NewMessages: [
                    [
                      'human',
                      `Please provide my answer based on:

                    {search}`,
                    ],
                  ],
                  Neurons: {
                    '': 'thinky-llm',
                  },
                } as EaCChatPromptNeuron,
              },
            } as EaCCircuitNeuron,
          },
        },
      },
      'graph-chat-model': {
        Details: {
          Type: 'Graph',
          Priority: 100,
          Neurons: {
            main: 'thinky-llm',
          },
          Edges: {
            [START]: 'main',
            main: END,
          },
        } as EaCGraphCircuitDetails,
      },
      'graph-chat-basic:agent': {
        Details: {
          Type: 'Linear',
          Priority: 100,
          Neurons: {
            '': {
              Type: 'ChatPrompt',
              SystemMessage: `You are a helpful assistant.`,
              Messages: [
                new MessagesPlaceholder('messages'),
              ] as BaseMessagePromptTemplateLike[],
              Neurons: {
                '': 'thinky-llm-tooled',
              },
              Bootstrap: (r) => {
                return RunnableLambda.from(
                  async (state: { messages: Array<BaseMessage> }) => {
                    const { messages } = state;

                    console.log('here');
                    console.log(messages);

                    const response = await r.invoke({ messages });

                    console.log('there');

                    return {
                      messages: [response],
                    };
                  }
                );
              },
              // Synapses: {
              //   messages: '$pass',
              // },
            } as EaCChatPromptNeuron,
            // action: {},
          },
        } as EaCLinearCircuitDetails,
      },
      'graph-chat-basic:action': {
        Details: {
          Type: 'Linear',
          Priority: 100,
          Neurons: {
            '': {
              Type: 'ToolExecutor',
              ToolLookups: ['thinky|tavily'],
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
            // action: {},
          },
        } as EaCLinearCircuitDetails,
      },
      'graph-chat-basic': {
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
            agent: {
              Type: 'Circuit',
              CircuitLookup: 'graph-chat-basic:agent',
            } as EaCCircuitNeuron,
            action: {
              Type: 'Circuit',
              CircuitLookup: 'graph-chat-basic:action',
            } as EaCCircuitNeuron,
          },
          Edges: {
            [START]: 'agent',
            agent: {
              Node: {
                continue: 'action',
                end: END,
              },
              // Node: END,
              Condition: (state: { messages: Array<BaseMessage> }) => {
                const { messages } = state;

                const lastMessage = messages[messages.length - 1];

                let node = 'continue';

                if (
                  (!('function_call' in lastMessage.additional_kwargs) ||
                    !lastMessage.additional_kwargs.function_call) &&
                  (!('tool_calls' in lastMessage.additional_kwargs) ||
                    !lastMessage.additional_kwargs.tool_calls)
                ) {
                  node = 'end';
                }

                return node;
              },
            },
            action: 'agent',
          },
        } as EaCGraphCircuitDetails,
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

  // process.versions.deno = '1.44.0';
  // console.log(process.versions);

  await new FathymEaCServicesPlugin().AfterEaCResolved(eac, ioc);

  await new FathymSynapticEaCServicesPlugin().AfterEaCResolved(eac, ioc);

  const sessionId = 'test';

  // const chatHistoryFactory = await ioc.Resolve<
  //   (sessionId: string) => BaseListChatMessageHistory
  // >(ioc.Symbol('ChatHistory'), `${aiLookup}|thinky`);

  // const chatHistory = chatHistoryFactory(sessionId);

  // await chatHistory.clear();

  const kv = await ioc.Resolve(Deno.Kv, aiLookup);

  // await t.step('Basic Prompt Circuit', async () => {
  //   const circuit = await ioc.Resolve<Runnable>(
  //     ioc.Symbol('Circuit'),
  //     'basic-prompt'
  //   );

  //   const chunk = await circuit.invoke({
  //     input: 'green',
  //   });

  //   assert(chunk.content, JSON.stringify(chunk));

  //   console.log(chunk.content);
  // });

  // await t.step('Basic Chat Circuit', async () => {
  //   const circuit = await ioc.Resolve<Runnable>(
  //     ioc.Symbol('Circuit'),
  //     'basic-chat'
  //   );

  //   const chunk = await circuit.invoke({
  //     input: 'What is a good color to use to make someone feel happy?',
  //   });

  //   assert(chunk.content, JSON.stringify(chunk));

  //   console.log(chunk.content);
  // });

  // await t.step('Basic Chat with History Circuit', async () => {
  //   const circuit = await ioc.Resolve<Runnable>(
  //     ioc.Symbol('Circuit'),
  //     'basic-chat-w-history'
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

  // await t.step('Tool Chat Circuit', async () => {
  //   const circuit = await ioc.Resolve<Runnable>(
  //     ioc.Symbol('Circuit'),
  //     'tool-chat'
  //   );

  //   const chunk = await circuit.invoke(
  //     'Who won the basketball game last night, celtics vs mavs? Provide me a summary that highlights the positive takeaways for the Mavs.',
  //     {
  //       configurable: { sessionId },
  //     }
  //   );

  //   assert(chunk.content, JSON.stringify(chunk));

  //   console.log(chunk.content);
  // });

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

  // await t.step('Graph Chat Model Circuit', async () => {
  //   // const model = await ioc.Resolve<BaseLanguageModel>(
  //   //   ioc.Symbol(BaseLanguageModel.name),
  //   //   'thinky|thinky'
  //   // );

  //   // const graph = new MessageGraph().addNode('oracle', model);

  //   // graph.addEdge(START, 'oracle');

  //   // graph.addEdge('oracle', END);

  //   // const circuit = graph.compile();

  //   const circuit = await ioc.Resolve<Runnable>(
  //     ioc.Symbol('Circuit'),
  //     'graph-chat-model'
  //   );

  //   const chunk = await circuit.invoke(
  //     new HumanMessage('Tell me about Circuits in 50 words or less...')
  //   );

  //   assert(chunk.slice(-1)[0].content, JSON.stringify(chunk));

  //   console.log(chunk.slice(-1)[0].content);
  // });

  await t.step('Graph Chat Basic Circuit', async () => {
    // const tool = await ioc.Resolve<StructuredTool>(
    //   ioc.Symbol('Tool'),
    //   'thinky|tavily'
    // );

    // const llm = await ioc.Resolve<BaseLanguageModel>(
    //   ioc.Symbol(BaseLanguageModel.name),
    //   'thinky|thinky-tooled'
    // );

    // const toolExecutor = new ToolExecutor({ tools: [tool] });

    // const shouldContinue = (state: { messages: Array<BaseMessage> }) => {
    //   const { messages } = state;
    //   const lastMessage = messages[messages.length - 1];
    //   // If there is no function call, then we finish
    //   if (
    //     !('function_call' in lastMessage.additional_kwargs) ||
    //     !lastMessage.additional_kwargs.function_call
    //   ) {
    //     return 'end';
    //   }
    //   // Otherwise if there is, we continue
    //   return 'continue';
    // };

    // // Define the function to execute tools
    // const _getAction = (state: {
    //   messages: Array<BaseMessage>;
    // }): AgentAction => {
    //   const { messages } = state;
    //   // Based on the continue condition
    //   // we know the last message involves a function call
    //   const lastMessage = messages[messages.length - 1];
    //   if (!lastMessage) {
    //     throw new Error('No messages found.');
    //   }
    //   if (!lastMessage.additional_kwargs.function_call) {
    //     throw new Error('No function call found in message.');
    //   }
    //   // We construct an AgentAction from the function_call
    //   return {
    //     tool: lastMessage.additional_kwargs.function_call.name,
    //     toolInput: JSON.parse(
    //       lastMessage.additional_kwargs.function_call.arguments
    //     ),
    //     log: '',
    //   };
    // };

    // // Define the function that calls the model
    // const callModel = async (state: { messages: Array<BaseMessage> }) => {
    //   const { messages } = state;
    //   // You can use a prompt here to tweak model behavior.
    //   // You can also just pass messages to the model directly.
    //   const prompt = ChatPromptTemplate.fromMessages([
    //     ['system', 'You are a helpful assistant.'],
    //     new MessagesPlaceholder('messages'),
    //   ]);
    //   const response = await prompt.pipe(llm).invoke({ messages });
    //   // We return a list, because this will get added to the existing list
    //   return {
    //     messages: [response],
    //   };
    // };

    // const callTool = async (state: { messages: Array<BaseMessage> }) => {
    //   const action = _getAction(state);
    //   // We call the tool_executor and get back a response
    //   const response = await toolExecutor.invoke(action);
    //   // We use the response to create a FunctionMessage
    //   const functionMessage = new FunctionMessage({
    //     content: response,
    //     name: action.tool,
    //   });
    //   // We return a list, because this will get added to the existing list
    //   return { messages: [functionMessage] };
    // };

    // const workflow = new StateGraph<{ messages: Array<BaseMessage> }>({
    //   channels: {
    //     messages: {
    //       value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    //       default: () => [],
    //     },
    //   },
    // })
    //   .addNode('agent', callModel)
    //   .addNode('action', callTool);

    // // Set the entrypoint as `agent`
    // // This means that this node is the first one called
    // workflow.setEntryPoint('agent');

    // // We now add a conditional edge
    // workflow.addConditionalEdges(
    //   // First, we define the start node. We use `agent`.
    //   // This means these are the edges taken after the `agent` node is called.
    //   'agent',
    //   // Next, we pass in the function that will determine which node is called next.
    //   shouldContinue,
    //   // Finally we pass in a mapping.
    //   // The keys are strings, and the values are other nodes.
    //   // END is a special node marking that the graph should finish.
    //   // What will happen is we will call `should_continue`, and then the output of that
    //   // will be matched against the keys in this mapping.
    //   // Based on which one it matches, that node will then be called.
    //   {
    //     // If `tools`, then we call the tool node.
    //     continue: 'action',
    //     // Otherwise we finish.
    //     end: END,
    //   }
    // );

    // // We now add a normal edge from `tools` to `agent`.
    // // This means that after `tools` is called, `agent` node is called next.
    // workflow.addEdge('action', 'agent');

    // // Finally, we compile it!
    // // This compiles it into a LangChain Runnable,
    // // meaning you can use it as you would any other runnable
    // const app = workflow.compile();

    // const inputs = {
    //   messages: [new HumanMessage('what is the weather in sf')],
    // };

    // const chunk = await app.invoke(inputs);

    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'graph-chat-basic'
    );

    const chunk = await circuit.invoke({
      messages: [
        new HumanMessage(
          'Who won game one of the finals between celtics and mavs?'
        ),
      ],
    });

    // assert(chunk.messages.slice(-1)[0].content, JSON.stringify(chunk));

    console.log(chunk);
    // console.log(chunk.messages.slice(-1)[0].content);
  });

  // const messages = await chatHistory.getMessages();

  // console.log(messages.map((msg) => msg.content));

  kv.close();
});
