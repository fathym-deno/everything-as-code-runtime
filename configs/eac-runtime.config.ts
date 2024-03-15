import {
  DefaultEaCConfig,
  defineEaCConfig,
  EaCRuntime,
  FathymDemoPlugin,
} from '@fathym/eac/runtime';

export const config = defineEaCConfig({
  Plugins: [new FathymDemoPlugin(), ...(DefaultEaCConfig.Plugins || [])],
});

export function configure(_rt: EaCRuntime): Promise<void> {
  return Promise.resolve();
}
