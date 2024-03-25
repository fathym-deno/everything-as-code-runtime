import { Icon, IconProps } from "./icon.deps.ts"

export function LoadingIcon(props: IconProps) {
  return <Icon {...props} src="/icons/iconset" icon="loading" />;
}
