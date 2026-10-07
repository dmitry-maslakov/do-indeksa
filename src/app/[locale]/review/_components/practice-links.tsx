import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export function PracticeLinks({
  topics,
}: {
  topics: { id: string; name: string }[];
}) {
  const t = useTranslations("Review");
  if (topics.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {topics.slice(0, 2).map((topic) => (
        <Button
          key={topic.id}
          size="sm"
          variant="tint"
          render={<Link href={`/bank?topic=${topic.id}`} />}
          nativeButton={false}
        >
          {t("practice", { topic: topic.name })}
        </Button>
      ))}
    </div>
  );
}
