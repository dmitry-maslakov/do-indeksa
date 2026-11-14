import { Shell } from "../_components/shell/shell";
import { SiteNote } from "./_components/site-note";

export default function LandingLayout({ children }: LayoutProps<"/[locale]">) {
  return <Shell note={<SiteNote />}>{children}</Shell>;
}
