import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface EmptyNoteProps {
  text: string;
  href?: string;
  action?: string;
}

export function EmptyNote({ text, href, action }: EmptyNoteProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl bg-muted px-5 py-4 text-sm text-subtle">
      <p>{text}</p>
      {href && (
        <Button
          size="sm"
          variant="tint"
          render={<Link href={href} />}
          nativeButton={false}
        >
          {action}
        </Button>
      )}
    </div>
  );
}
