import { merge } from '@fathym/common';
import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac-runtime';
import { EaCWebState } from '../../../src/state/EaCWebState.ts';
import SiteFrame from '../../components/SiteFrame.tsx';

export const ParentLayouts: string[] = [];

export type DevelopLayoutData = {
  Username: string;
};

export const handler: EaCRuntimeHandlerResult<EaCWebState, DevelopLayoutData> = {
  GET: (_req, ctx) => {
    const data: DevelopLayoutData = {
      Username: ctx.State.Username!,
    };

    ctx.Data = merge(ctx.Data, data);

    return ctx.Next();
  },
};

export default function DevelopLayout({
  Component,
}: PageProps<DevelopLayoutData>) {
  return (
    <SiteFrame>
      <Component />
    </SiteFrame>
  );
}
