import { Shell } from "../_components/shell/shell";

export default function TaskLayout({ children }: LayoutProps<"/[locale]">) {
  return <Shell mode="task">{children}</Shell>;
}
