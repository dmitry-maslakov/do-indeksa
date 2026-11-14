import { Shell } from "../_components/shell/shell";

export default function FacultyLayout({ children }: LayoutProps<"/[locale]">) {
  return <Shell languages={false}>{children}</Shell>;
}
