import { upperFirst } from "es-toolkit";
import { getFormatter, getTranslations } from "next-intl/server";
import { ExternalLink } from "@/components/external-link";
import { MathHtml } from "@/components/math-html";
import { moduleKindOf, type Program } from "@/features/admission/programs";
import { mutedSourceLink } from "@/features/admission/source-line";
import { facultyOf } from "@/features/catalog/faculties";
import { getFacts } from "@/i18n/facts";
import { renderMarkdown } from "@/lib/markdown";
import { Band } from "./band";

const label = "block text-[13px] text-muted-foreground";

async function Plan({ program }: { program: Program }) {
  const [t, format] = await Promise.all([
    getTranslations("Program"),
    getFormatter(),
  ]);
  const items = await Promise.all(
    program.plan.map(async (item) => ({
      ...item,
      html: item.text && (await renderMarkdown(item.text, program.id)),
      title: upperFirst(
        t("yearsLabel", {
          years: format.list(item.years.map((n) => t("yearWord", { n }))),
        }),
      ),
    })),
  );

  return items.map((item) => (
    <div key={item.title}>
      <h3 className="text-balance font-semibold text-base">{item.title}</h3>
      {item.subjects && (
        <ul className="mt-0.5 lg:columns-2 lg:gap-x-8">
          {item.subjects.map((subject) => (
            <li key={subject} className="break-inside-avoid text-[15px]">
              {subject}
            </li>
          ))}
        </ul>
      )}
      {item.html && (
        <MathHtml html={item.html} className="mt-0.5 leading-normal" />
      )}
    </div>
  ));
}

async function Modules({ program }: { program: Program }) {
  const t = await getTranslations("Program");
  const { short } = facultyOf(program.faculty);
  const texts = await Promise.all(
    program.modules.map((m) => renderMarkdown(m.text, program.id)),
  );

  return (
    <div className="border-l-2 pl-4">
      {program.modules.map((module, i) => (
        <div
          key={module.name}
          className="border-t py-3.5 first:border-t-0 first:pt-0 last:pb-0"
        >
          <h4
            id={program.moduleIds[i]}
            className="scroll-mt-4 text-balance font-semibold text-base target:animate-target"
          >
            {module.name}
          </h4>
          <MathHtml
            html={texts[i] ?? ""}
            className="mt-0.5 text-[15px] leading-normal"
          />
          {module.url && (
            <ExternalLink
              href={module.url}
              className="mt-1.5 inline-flex items-center gap-0.5 text-[13px] text-data underline-offset-3 hover:underline"
            >
              {t("modulePlan", { kind: program.moduleKind, short })}
            </ExternalLink>
          )}
        </div>
      ))}
    </div>
  );
}

async function Degree({ program }: { program: Program }) {
  const [t, facts] = await Promise.all([
    getTranslations("Program"),
    getFacts(),
  ]);
  const { degree, department, jointDepartments } = program;

  return (
    <div className="border-t pt-3.5">
      <span className={label}>
        {t("degreeAfter", {
          word: facts.word(program.years),
          years: program.years,
        })}
      </span>
      <p className="font-semibold">
        {degree.title}
        {degree.abbreviation && ` (${degree.abbreviation})`}
      </p>
      <p className="mt-1.5 text-[15px]">
        {jointDepartments
          ? t("jointDepartments", {
              count: facts.word(jointDepartments),
              department,
            })
          : t("department", { department })}
      </p>
    </div>
  );
}

export async function PlanBand({ program }: { program: Program }) {
  const t = await getTranslations("Program");
  const { short } = facultyOf(program.faculty);
  const { plan, courseBook } = program.links;
  const kind = moduleKindOf(program);
  const [notes, employment] = await Promise.all([
    Promise.all(program.planNotes.map((n) => renderMarkdown(n, program.id))),
    program.employment && renderMarkdown(program.employment, program.id),
  ]);

  return (
    <Band
      name="predmeti"
      id="predmeti"
      title={t("planTitle", { kind })}
      meta={
        <>
          <p>
            {t.rich("planSource", {
              year: String(plan.accreditation),
              short,
              link: (chunks) => (
                <ExternalLink href={plan.url} className={mutedSourceLink}>
                  {chunks}
                </ExternalLink>
              ),
            })}
          </p>
          {courseBook && (
            <p>
              {t.rich("courseBook", {
                year: String(courseBook.accreditation),
                short,
                link: (chunks) => (
                  <ExternalLink
                    href={courseBook.url}
                    className={mutedSourceLink}
                  >
                    {chunks}
                  </ExternalLink>
                ),
              })}
            </p>
          )}
        </>
      }
      className="max-w-170 space-y-5"
    >
      <Plan program={program} />
      {program.modules.length > 0 && <Modules program={program} />}
      {notes.map((html) => (
        <MathHtml
          key={html}
          html={html}
          className="text-[15px] text-muted-foreground leading-normal"
        />
      ))}
      <Degree program={program} />
      {employment && (
        <div>
          <span className={label}>{t("employment", { short })}</span>
          <MathHtml html={employment} className="mt-0.5 leading-normal" />
        </div>
      )}
    </Band>
  );
}
