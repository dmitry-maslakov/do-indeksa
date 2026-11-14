import { examRecord } from "@/features/catalog/exams";
import { AboutHead } from "./about-head";
import { ArchiveSection } from "./archive-section";
import { ExemptionSection } from "./exemption-section";
import { ProgramsSection } from "./programs-section";
import { TopicsSection } from "./topics-section";

export function AboutView({ examId }: { examId: string }) {
  const { about } = examRecord(examId);

  return (
    <main className="px-4 pt-4 pb-6 md:px-10 md:pt-6 md:pb-8">
      <AboutHead examId={examId} />
      <TopicsSection examId={examId} />
      <ArchiveSection examId={examId} />
      {about?.exemption && <ExemptionSection examId={examId} />}
      <ProgramsSection examId={examId} />
    </main>
  );
}
