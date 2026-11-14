import { AdmissionSection } from "./admission-section";
import { FacultyFacts } from "./faculty-facts";
import { FacultyIntro } from "./faculty-intro";
import { Register } from "./register";
import { ScoringSection } from "./scoring-section";

export function FacultyView({ faculty }: { faculty: string }) {
  return (
    <main className="px-4 pt-4 pb-6 md:px-10 md:pt-6 md:pb-8">
      <FacultyIntro faculty={faculty} />
      <Register faculty={faculty} />
      <FacultyFacts faculty={faculty} />
      <div className="mt-12 grid gap-12 lg:mt-16 lg:grid-cols-[repeat(2,minmax(0,--spacing(140)))] lg:gap-x-20">
        <ScoringSection faculty={faculty} />
        <AdmissionSection faculty={faculty} />
      </div>
    </main>
  );
}
