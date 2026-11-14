import { Shell } from "../_components/shell/shell";

export default function FacultyLayout({ children }: LayoutProps<"/[locale]">) {
  return <Shell>{children}</Shell>;
}
