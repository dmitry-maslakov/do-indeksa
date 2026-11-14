import { getTranslations } from "next-intl/server";
import { MathHtml } from "@/components/math-html";
import { SourceLine } from "@/features/admission/source-line";
import { examRecord } from "@/features/catalog/exams";
import { renderMarkdown } from "@/lib/markdown";
import { AboutSection, quietLink } from "./about-section";

export async function ExemptionSection({ examId }: { examId: string }) {
  const t = await getTranslations("ExamAbout");
  const exam = examRecord(examId);
  const exemption = exam.about?.exemption;
  if (!exemption) return null;

  return (
    <AboutSection id="oslobadjanje" title={t("exemptionTitle")}>
      <MathHtml
        html={await renderMarkdown(exemption.text, exam.id)}
        className="mt-3 leading-normal lg:mt-0 lg:max-w-170 [&_p+p]:mt-3"
      />
      <SourceLine
        faculty={exam.faculty}
        refs={exemption.sources}
        checked={exam.about?.checked}
        linkClassName={quietLink}
        className="mt-3"
      />
    </AboutSection>
  );
}
