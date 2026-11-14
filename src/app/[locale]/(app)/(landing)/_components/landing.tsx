import { cn } from "cn";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ExamBadge } from "@/features/catalog/exam-badge";
import { examRecord } from "@/features/catalog/exams";
import { facultyOf } from "@/features/catalog/faculties";
import type { WeeklyVariant } from "@/features/variants/weekly";
import { ExamChoice } from "./exam-choice";
import { SuggestionSample } from "./suggestion-sample";
import { TaskSample } from "./task-sample";
import { TopicMapSample } from "./topic-map-sample";
import { WeeklySample } from "./weekly-sample";

function SampleCaption({ sample }: { sample: string }) {
  const t = useTranslations("Landing");
  const exam = examRecord(sample);

  return (
    <p className="mt-4 flex items-center gap-2 font-medium text-sm lg:mt-2">
      <ExamBadge exam={exam} size="sm" />
      {t("sample", {
        faculty: facultyOf(exam.faculty).short,
        exam: exam.title,
      })}
    </p>
  );
}

interface SectionProps {
  title: string;
  text: string;
  sample: string;
  reverse?: boolean;
  className: string;
  children: ReactNode;
}

function Section({
  title,
  text,
  sample,
  reverse,
  className,
  children,
}: SectionProps) {
  return (
    <section className={cn("px-4 md:px-10", className)}>
      <div
        className={cn(
          "lg:mx-auto lg:flex lg:max-w-260 lg:items-start lg:gap-16",
          reverse && "lg:flex-row-reverse",
        )}
      >
        <div className="flex flex-col lg:min-w-0 lg:max-w-105 lg:flex-1 lg:gap-4 lg:pt-8">
          <h2 className="font-bold text-[32px] leading-9 lg:text-5xl lg:leading-13">
            {title}
          </h2>
          <p className="mt-3 font-medium text-base lg:mt-0 lg:text-lg lg:leading-normal">
            {text}
          </p>
          <SampleCaption sample={sample} />
        </div>
        {children}
      </div>
    </section>
  );
}

interface LandingProps {
  sample: string;
  weekly?: WeeklyVariant;
}

export function Landing({ sample, weekly }: LandingProps) {
  const t = useTranslations("Landing");

  return (
    <main className="pb-14 lg:pb-30">
      <div className="flex flex-col px-4 pt-10 md:items-center md:px-10 md:pt-20 md:text-center">
        <h1 className="wrap-break-word font-bold text-[44px] leading-11.5 md:max-w-140 md:text-7xl md:leading-19">
          {t("title")}
        </h1>
        <p className="mt-4 font-medium text-[17px] leading-[25px] md:mt-6 md:max-w-170 md:text-xl md:leading-7.5">
          {t("lead")}
        </p>
        <ExamChoice />
        <p className="mt-5 font-medium text-[15px] md:mt-7 md:text-base">
          {t("free")}
        </p>
      </div>
      <Section
        title={t("dailyTitle")}
        text={t("dailyText")}
        sample={sample}
        className="pt-24 lg:pt-40"
      >
        <div className="relative mt-6 flex flex-col pb-4.5 lg:mt-0 lg:w-139 lg:shrink-0 lg:pb-0">
          <TopicMapSample sample={sample} />
          <SuggestionSample sample={sample} />
        </div>
      </Section>
      <Section
        title={t("tasksTitle")}
        text={t("tasksText")}
        sample={sample}
        reverse
        className="pt-18 lg:pt-35"
      >
        <div className="mt-6 flex flex-col lg:mt-0 lg:w-139 lg:shrink-0">
          <WeeklySample sample={sample} weekly={weekly} />
          <TaskSample sample={sample} />
        </div>
      </Section>
    </main>
  );
}
