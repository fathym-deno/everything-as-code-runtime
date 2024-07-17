// TODO(ttrichar): MOVE TO @fathym/eac/runtim ref after EaCRuntimePluginDef export bug is fixed
import { eacAIsRoot, eacDatabases } from './eacs.ts';
import {
  buildEaCTestIoC,
  EaCESMDistributedFileSystem,
  EaCRuntimePlugin,
  EverythingAsCode,
  EverythingAsCodeDatabases,
  EverythingAsCodeSynaptic,
} from './test.deps.ts';

export const AI_LOOKUP = 'thinky';

const testEaC = {
  AIs: {
    [AI_LOOKUP]: {
      ...eacAIsRoot,
    },
  },
  Databases: {
    [AI_LOOKUP]: {
      ...eacDatabases,
    },
  },
  DFS: {
    'fathym-synaptic-resolvers': {
      Type: 'ESM',
      Root: '@fathym/synaptic/',
      EntryPoints: ['resolvers.ts'],
      IncludeDependencies: false,
      WorkerPath: import.meta.resolve(
        '@fathym/eac/runtime/src/runtime/dfs/workers/EaCESMDistributedFileSystemWorker.ts',
      ),
    } as EaCESMDistributedFileSystem,
  },
} as EverythingAsCodeSynaptic & EverythingAsCodeDatabases;

export async function buildTestIoC(
  eac: EverythingAsCode,
  plugins: EaCRuntimePlugin[] = [],
  useDefault = true,
  useDefaultPlugins = true,
) {
  return await buildEaCTestIoC(
    useDefault ? testEaC : {},
    eac,
    plugins,
    useDefaultPlugins,
  );
}
