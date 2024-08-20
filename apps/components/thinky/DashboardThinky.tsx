import EaCThinky, { EaCThinkyProps } from './EaCThinky.tsx';

export const IsIsland = true;

export type DashboardThinkyProps = EaCThinkyProps;

export default function DashboardThinky(props: DashboardThinkyProps) {
  return <EaCThinky {...props} />;
}
