import { LightbulbIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

const callouts = { zapamti: LightbulbIcon, greska: TriangleAlertIcon };

interface BlockProps {
  name: string;
  tagged: boolean;
  children: ReactNode;
}

export function Block({ name, tagged, children }: BlockProps) {
  const t = useTranslations("Theory");

  if (name === "zapamti" || name === "greska") {
    const Icon = callouts[name];
    return (
      <div
        data-block={name}
        className="flex gap-3 rounded-2xl bg-lime-tint px-4 py-3.5"
      >
        <Icon
          aria-hidden="true"
          className="mt-1 size-4.5 shrink-0 text-lime-text"
        />
        <div className="flex min-w-0 flex-col [&_p+p]:mt-2">
          <strong className="font-bold text-[13px] text-lime-text">
            {t(name)}
          </strong>
          {children}
        </div>
      </div>
    );
  }

  if (name === "primer") {
    return (
      <div className="rounded-2xl px-4 py-3.5 ring-[1.5px] ring-border ring-inset [&_p+p]:mt-2">
        {tagged && (
          <strong className="mb-1.5 flex h-6.5 w-fit items-center rounded-full bg-muted px-2.5 font-semibold text-muted-foreground text-xs">
            {t("primer")}
          </strong>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="[&_li]:overflow-x-auto [&_li]:rounded-xl [&_li]:bg-(--tint) [&_li]:px-3 [&_li]:py-3 [&_li]:text-base md:[&_li]:px-4 md:[&_li]:text-lg [&_ul]:grid [&_ul]:grid-cols-2 [&_ul]:gap-2">
      {children}
    </div>
  );
}
