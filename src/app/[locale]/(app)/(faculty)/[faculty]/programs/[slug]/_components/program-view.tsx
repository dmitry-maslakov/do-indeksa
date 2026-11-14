import type { Program } from "@/features/admission/programs";
import { AdmissionBand } from "./admission-band";
import { NeighboursBand } from "./neighbours-band";
import { OfficialBand } from "./official-band";
import { PlanBand } from "./plan-band";
import { ProgramHero } from "./program-hero";

export function ProgramView({ program }: { program: Program }) {
  return (
    <main className="px-4 pt-4 pb-6 md:px-10 md:pt-6 md:pb-8">
      <ProgramHero program={program} />
      <PlanBand program={program} />
      <AdmissionBand program={program} />
      <NeighboursBand program={program} />
      <OfficialBand program={program} />
    </main>
  );
}
