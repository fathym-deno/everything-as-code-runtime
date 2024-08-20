import EaCThinky, { EaCThinkyProps } from './EaCThinky.tsx';

export const IsIsland = true;

export type HomeThinkyProps = EaCThinkyProps;

export default function HomeThinky(props: HomeThinkyProps) {
  return <EaCThinky {...props} />;
}
