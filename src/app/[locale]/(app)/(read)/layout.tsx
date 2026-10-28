import { Shell } from "../_components/shell/shell";

export default function ReadLayout({ children }: LayoutProps<"/[locale]">) {
  return <Shell mode="read">{children}</Shell>;
}
