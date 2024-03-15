import { DefaultEaCConfig, defineEaCConfig, EaCRuntime } from '@fathym/eac/runtime';
import EaCWebRuntimePlugin from '../src/plugins/EaCWebRuntimePlugin.ts';

export const config = defineEaCConfig({
  Plugins: [new EaCWebRuntimePlugin(), ...(DefaultEaCConfig.Plugins || [])],
});

export function configure(_rt: EaCRuntime): Promise<void> {
  return Promise.resolve();
}
