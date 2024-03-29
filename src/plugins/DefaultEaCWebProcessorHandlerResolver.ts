import { DefaultAtomicIconsProcessorHandlerResolver } from '@fathym/atomic-icons/plugin';
import {
  DefaultProcessorHandlerResolver,
  EaCApplicationProcessorConfig,
  EaCRuntimeEaC,
  ProcessorHandlerResolver,
} from '@fathym/eac/runtime';
import { IoCContainer } from '@fathym/ioc';

export class DefaultEaCWebProcessorHandlerResolver implements ProcessorHandlerResolver {
  public async Resolve(
    ioc: IoCContainer,
    appProcCfg: EaCApplicationProcessorConfig,
    eac: EaCRuntimeEaC,
  ) {
    const atomicIconsResolver = new DefaultAtomicIconsProcessorHandlerResolver();

    const defaultResolver = new DefaultProcessorHandlerResolver();

    let resolver = await atomicIconsResolver.Resolve(ioc, appProcCfg, eac);

    if (!resolver) {
      resolver = await defaultResolver.Resolve(ioc, appProcCfg, eac);
    }

    return resolver;
  }
}
