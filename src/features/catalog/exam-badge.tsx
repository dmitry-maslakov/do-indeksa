import { cva } from "class-variance-authority";
import { cn } from "cn";
import { type Tone, toneStyle } from "./topic-look";

const badge = cva("inline-flex shrink-0 items-center justify-center", {
  variants: {
    size: {
      dot: "size-2 -translate-y-0.5 rounded-full",
      sm: "size-6 rounded-full font-bold text-2xs",
      md: "size-11.5 rounded-full font-bold text-[15px] leading-none md:size-13 md:text-base",
    },
  },
});

interface ExamBadgeProps {
  exam: { title: string; tone?: Tone };
  size: "dot" | "sm" | "md";
  className?: string;
}

export function ExamBadge({ exam, size, className }: ExamBadgeProps) {
  return (
    <span
      aria-hidden="true"
      style={exam.tone && toneStyle(exam.tone)}
      className={cn(
        badge({ size }),
        exam.tone ? "bg-(--tone)" : "bg-untouched ring-1 ring-input ring-inset",
        className,
      )}
    >
      {size !== "dot" && exam.title}
    </span>
  );
}
