import EaCThinky, { EaCThinkyProps } from './EaCThinky.tsx';

export const IsIsland = true;

export type CodeEditorThinkyProps = EaCThinkyProps;

export default function CodeEditorThinky(props: CodeEditorThinkyProps) {
  return <EaCThinky {...props} />;
}
