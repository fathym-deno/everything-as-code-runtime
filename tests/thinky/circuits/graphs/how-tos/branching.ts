import { eacAIsRoot, eacDatabases } from '../../../../eacs.ts';
import {
  assert,
  assertEquals,
  EaCGraphCircuitDetails,
  EaCNeuron,
  EaCPassthroughNeuron,
  END,
  EverythingAsCodeDatabases,
  EverythingAsCodeSynaptic,
  FathymEaCServicesPlugin,
  FathymSynapticEaCServicesPlugin,
  IoCContainer,
  Runnable,
  RunnableLambda,
  START,
} from '../../../../test.deps.ts';

// https://github.com/langchain-ai/langgraphjs/blob/main/examples/how-tos/branching.ipynb

type ScoredValue = {
  value: string;
  score: number;
};

Deno.test('Graph Branching Circuits', async (t) => {
  const aiLookup = 'thinky';

  const loadSimpleBootstrap = (value: string) => {
    return () => {
      return RunnableLambda.from((state: { aggregate: string[] }) => {
        console.log(`Adding ${value} to ${state.aggregate}`);

        return { aggregate: [`I'm ${value}`] };
      });
    };
  };

  const loadScoredBootstrap = (value: string, score: number) => {
    return () => {
      return RunnableLambda.from((state: { aggregate: string[] }) => {
        console.log(`Adding ${value} to ${state.aggregate}`);

        return { fanoutValues: [{ value: `I'm ${value}`, score }] };
      });
    };
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
      },
      'fan-out-fan-in': {
        Details: {
          Type: 'Graph',
          Priority: 100,
          State: {
            aggregate: {
              value: (x: string[], y: string[]) => x.concat(y),
              default: () => [],
            },
          },
          Neurons: {
            a: {
              Bootstrap: loadSimpleBootstrap('A'),
            } as Partial<EaCNeuron>,
            b: {
              Bootstrap: loadSimpleBootstrap('B'),
            } as Partial<EaCNeuron>,
            c: {
              Bootstrap: loadSimpleBootstrap('C'),
            } as Partial<EaCNeuron>,
            d: {
              Bootstrap: loadSimpleBootstrap('D'),
            } as Partial<EaCNeuron>,
          },
          Edges: {
            [START]: 'a',
            a: ['b', 'c'],
            b: 'd',
            c: 'd',
            d: END,
          },
        } as EaCGraphCircuitDetails,
      },
      conditional: {
        Details: {
          Type: 'Graph',
          Priority: 100,
          State: {
            aggregate: {
              value: (x: string[], y: string[]) => x.concat(y),
              default: () => [],
            },
            which: {
              value: (x: string, y: string) => (y ? y : x),
              default: () => 'bc',
            },
          },
          Neurons: {
            a: {
              Bootstrap: loadSimpleBootstrap('A'),
            } as Partial<EaCNeuron>,
            b: {
              Bootstrap: loadSimpleBootstrap('B'),
            } as Partial<EaCNeuron>,
            c: {
              Bootstrap: loadSimpleBootstrap('C'),
            } as Partial<EaCNeuron>,
            d: {
              Bootstrap: loadSimpleBootstrap('D'),
            } as Partial<EaCNeuron>,
            e: {
              Bootstrap: loadSimpleBootstrap('E'),
            } as Partial<EaCNeuron>,
          },
          Edges: {
            [START]: 'a',
            a: {
              Node: {
                b: 'b',
                c: 'c',
                d: 'd',
              },
              Condition: (state: { which: string }) => {
                if (state.which === 'cd') {
                  return ['c', 'd'];
                }

                return ['b', 'c'];
              },
            },
            b: 'e',
            c: 'e',
            d: 'e',
            e: END,
          },
        } as EaCGraphCircuitDetails,
      },
      'stable-sorting': {
        Details: {
          Type: 'Graph',
          Priority: 100,
          State: {
            aggregate: {
              value: (x: string[], y: string[]) => x.concat(y),
              default: () => [],
            },
            which: {
              value: (x: string, y: string) => (y ? y : x),
              default: () => '',
            },
            fanoutValues: {
              value: (left?: ScoredValue[], right?: ScoredValue[]) => {
                if (!left) {
                  left = [];
                }
                if (!right || right?.length === 0) {
                  // Overwrite. Similar to redux.
                  return [];
                }
                return left.concat(right);
              },
              default: () => [],
            },
          },
          Neurons: {
            a: {
              Bootstrap: loadSimpleBootstrap('A'),
            } as Partial<EaCNeuron>,
            b: {
              Bootstrap: loadScoredBootstrap('B', 0.1),
            } as Partial<EaCNeuron>,
            c: {
              Bootstrap: loadScoredBootstrap('C', 0.9),
            } as Partial<EaCNeuron>,
            d: {
              Bootstrap: loadScoredBootstrap('D', 0.3),
            } as Partial<EaCNeuron>,
            e: {
              Bootstrap: () => {
                return RunnableLambda.from(
                  (state: { fanoutValues: ScoredValue[] }) => {
                    // Sort by score (reversed)
                    state.fanoutValues.sort((a, b) => b.score - a.score);
                    return {
                      aggregate: state.fanoutValues
                        .map((v) => v.value)
                        .concat(["I'm E"]),
                      fanoutValues: [],
                    };
                  }
                );
              },
            } as Partial<EaCNeuron>,
          },
          Edges: {
            [START]: 'a',
            a: {
              Node: {
                b: 'b',
                c: 'c',
                d: 'd',
              },
              Condition: (state: { which: string }) => {
                if (state.which === 'cd') {
                  return ['c', 'd'];
                }

                return ['b', 'c'];
              },
            },
            b: 'e',
            c: 'e',
            d: 'e',
            e: END,
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

  await t.step('Fan Out Fan In Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'fan-out-fan-in'
    );

    const chunk = await circuit.invoke({ aggregate: [] });

    console.log(chunk);

    assert(chunk.aggregate);
    assertEquals(chunk.aggregate[1], `I'm B`);
    assertEquals(chunk.aggregate[3], `I'm D`);
  });

  await t.step('Conditional Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'conditional'
    );

    let chunk = await circuit.invoke({ aggregate: [], which: 'bc' });

    console.log(chunk);

    assert(chunk.aggregate);
    assertEquals(chunk.aggregate[1], `I'm B`);
    assertEquals(chunk.aggregate[2], `I'm C`);
    assertEquals(chunk.aggregate[3], `I'm E`);

    chunk = await circuit.invoke({ aggregate: [], which: 'cd' });

    console.log(chunk);

    assert(chunk.aggregate);
    assertEquals(chunk.aggregate[1], `I'm C`);
    assertEquals(chunk.aggregate[2], `I'm D`);
    assertEquals(chunk.aggregate[3], `I'm E`);
  });

  await t.step('Stable Sorting Circuit', async () => {
    const circuit = await ioc.Resolve<Runnable>(
      ioc.Symbol('Circuit'),
      'stable-sorting'
    );

    let chunk = await circuit.invoke({ aggregate: [], which: 'bc' });

    console.log(chunk);

    assert(chunk.aggregate);
    assertEquals(chunk.aggregate[1], `I'm C`);
    assertEquals(chunk.aggregate[2], `I'm B`);
    assertEquals(chunk.aggregate[3], `I'm E`);

    chunk = await circuit.invoke({ aggregate: [], which: 'cd' });

    console.log(chunk);

    assert(chunk.aggregate);
    assertEquals(chunk.aggregate[1], `I'm C`);
    assertEquals(chunk.aggregate[2], `I'm D`);
    assertEquals(chunk.aggregate[3], `I'm E`);
  });

  kv.close();
});
