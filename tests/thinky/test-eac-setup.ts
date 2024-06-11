import { eacAIsRoot, eacDatabases } from '../eacs.ts';
import {
  EverythingAsCodeDatabases,
  EverythingAsCodeSynaptic,
  FathymEaCServicesPlugin,
  FathymSynapticEaCServicesPlugin,
  IoCContainer,
} from '../test.deps.ts';

export const AI_LOOKUP = 'thinky';

const eac = {
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
} as EverythingAsCodeSynaptic & EverythingAsCodeDatabases;

export async function configureEaCIoC(
  eac: EverythingAsCodeSynaptic & EverythingAsCodeDatabases,
  ioc: IoCContainer
): Promise<void> {
  await new FathymEaCServicesPlugin().AfterEaCResolved(eac, ioc);
}

export async function configureSynapticEaCIoC(
  eac: EverythingAsCodeSynaptic & EverythingAsCodeDatabases,
  ioc: IoCContainer
): Promise<void> {
  await new FathymSynapticEaCServicesPlugin().AfterEaCResolved(eac, ioc);
}

const iocSetup = new Promise<IoCContainer>((resolve) => {
  const ioc = new IoCContainer();

  configureEaCIoC(eac, ioc).then(() => {
    configureSynapticEaCIoC(eac, ioc).then(() => {
      resolve(ioc);
    });
  });
});

export async function buildTestIoC(
  eac: EverythingAsCodeSynaptic & EverythingAsCodeDatabases
) {
  const ioc = await iocSetup;

  const testIoC = new IoCContainer();

  await ioc.CopyTo(testIoC);

  await configureEaCIoC(eac, testIoC);

  await configureSynapticEaCIoC(eac, testIoC);

  return testIoC;
}

export async function cleanupKv(kvLookup: string, ioc: IoCContainer) {
  const kv = await ioc.Resolve(Deno.Kv, kvLookup);

  return () => kv.close();
}
