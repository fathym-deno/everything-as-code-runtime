import { EaCRuntimeHandlerResult, PageProps } from '@fathym/eac/runtime';
import SignInSignUp from '../components/SignInSignUp.tsx';

export const handler: EaCRuntimeHandlerResult = {
  GET: (_req, ctx) => {
    return ctx.Render();
  },
};

export default function Index(_props: PageProps) {
  return (
    <div class='mt-8'>
      <SignInSignUp remote={true} />
    </div>
  );
}
