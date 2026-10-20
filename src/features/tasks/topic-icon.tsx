import { cva } from "class-variance-authority";
import {
  ArrowUpRightIcon,
  BoxIcon,
  type LucideIcon,
  TriangleIcon,
} from "lucide-react";
import type { IconName, Tone, TopicIconData } from "./topic-look";

const glyphs: Record<IconName, LucideIcon> = {
  "arrow-up-right": ArrowUpRightIcon,
  triangle: TriangleIcon,
  box: BoxIcon,
};

const tones: Record<Tone, string> = {
  blue: "bg-tone-blue",
  pink: "bg-tone-pink",
  orange: "bg-tone-orange",
  cyan: "bg-tone-cyan",
  yellow: "bg-tone-yellow",
};

const box = cva(
  "inline-flex shrink-0 items-center justify-center font-semibold text-foreground leading-none",
  {
    variants: {
      size: {
        sm: "size-6 rounded-md [&_svg]:size-3",
        md: "size-9 rounded-xl [&_svg]:size-4",
        lg: "size-14 rounded-2xl [&_svg]:size-7",
      },
    },
  },
);

const text = cva("", {
  variants: {
    size: { sm: "text-xs", md: "text-base", lg: "text-2xl" },
    long: { true: "" },
  },
  compoundVariants: [
    { size: "sm", long: true, class: "text-2xs" },
    { size: "md", long: true, class: "text-xs" },
    { size: "lg", long: true, class: "text-xl" },
  ],
});

interface TopicIconProps {
  icon: TopicIconData;
  tone: Tone;
  size?: "sm" | "md" | "lg";
}

export function TopicGlyph({
  icon,
  size = "md",
}: Omit<TopicIconProps, "tone">) {
  if ("name" in icon) {
    const Glyph = glyphs[icon.name];
    return <Glyph />;
  }
  return (
    <span className={text({ size, long: icon.text.length > 2 })}>
      {icon.text}
    </span>
  );
}

export function TopicIcon({ icon, tone, size = "md" }: TopicIconProps) {
  return (
    <span aria-hidden="true" className={`${box({ size })} ${tones[tone]}`}>
      <TopicGlyph icon={icon} size={size} />
    </span>
  );
}
