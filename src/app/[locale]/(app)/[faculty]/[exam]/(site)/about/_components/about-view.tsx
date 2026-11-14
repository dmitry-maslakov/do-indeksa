import { AboutHead } from "./about-head";
import type { Years } from "./about-section";
import { ArchiveSection } from "./archive-section";
import { ExemptionSection } from "./exemption-section";
import { ProgramsSection } from "./programs-section";
import { TopicsSection } from "./topics-section";

export function AboutView({ examId, years }: { examId: string; years: Years }) {
  return (
    <main className="px-4 pt-4 pb-6 md:px-10 md:pt-6 md:pb-8 [&_:is(a,summary)]:focus-visible:outline-none [&_:is(a,summary)]:focus-visible:ring-2 [&_:is(a,summary)]:focus-visible:ring-ring">
      <AboutHead examId={examId} />
      <TopicsSection examId={examId} years={years} />
      <ArchiveSection examId={examId} years={years} />
      <ExemptionSection examId={examId} />
      <ProgramsSection examId={examId} />
    </main>
  );
}
