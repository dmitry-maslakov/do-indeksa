import { Shell } from "../_components/shell/shell";

export default function SiteLayout({ children }: LayoutProps<"/[locale]">) {
  return <Shell>{children}</Shell>;
}
