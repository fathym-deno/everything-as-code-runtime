import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac-runtime';
import { EaCWebState } from '../../../src/state/EaCWebState.ts';

type DevelopPageData = {};

export const handler: EaCRuntimeHandlerResult<EaCWebState, DevelopPageData> = {
  GET(_req, ctx) {
    const data: DevelopPageData = {};

    return ctx.Render(data);
  },
};

export default function Develop({ Data }: PageProps<DevelopPageData>) {
  return (
    <>
      <div>Hi</div>
    </>
  );
}
