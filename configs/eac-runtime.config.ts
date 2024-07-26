import 'npm:html-to-text';
import {
  DefaultEaCConfig,
  defineEaCConfig,
  EaCRuntime,
} from '@fathym/eac/runtime';
import EaCWebPlugin from '../src/plugins/EaCWebPlugin.ts';

export const config = defineEaCConfig({
  Plugins: [...(DefaultEaCConfig.Plugins || []), new EaCWebPlugin()],
  Server: {
    port: 6131,
  },
});

export function configure(_rt: EaCRuntime): Promise<void> {
  return Promise.resolve();
}
