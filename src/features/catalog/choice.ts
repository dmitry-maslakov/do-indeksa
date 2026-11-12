import type { PartOutcome } from "@/db/columns";

export const optionLetters = ["A", "B", "C", "D", "E", "F"] as const;

export type OptionLetter = (typeof optionLetters)[number];

export interface Choice {
  many: boolean;
  options: string[];
  correct: OptionLetter[];
}

export interface RenderedChoice {
  many: boolean;
  options: string[];
  short: boolean;
}

export const lettersOf = (options: readonly unknown[]) =>
  optionLetters.slice(0, options.length);

export const isLetter = (text: string): text is OptionLetter =>
  (optionLetters as readonly string[]).includes(text);

export const picks = ["one", "many"] as const;

export const pickOf = ({ many }: { many: boolean }): (typeof picks)[number] =>
  many ? "many" : "one";

export const answerCount = ({ many, options }: Omit<Choice, "correct">) =>
  many ? options.length : 1;

export const fieldCount = (task: {
  parts: readonly unknown[];
  choice: Omit<Choice, "correct"> | null;
}) => (task.choice ? answerCount(task.choice) : task.parts.length);

export const sentOf = (
  { many, options }: Omit<Choice, "correct">,
  picked: readonly string[],
) =>
  many
    ? lettersOf(options).map((letter) =>
        picked.includes(letter) ? letter : "",
      )
    : [picked[0] ?? ""];

export const pickedOf = (answers: readonly string[]) =>
  answers.filter(isLetter);

export const keyOf = (choice: Choice) => sentOf(choice, choice.correct);

export function gradeChoice(
  { many, options, correct }: Choice,
  answers: string[],
): PartOutcome[] {
  const letters = lettersOf(options);
  if (!many) {
    const given = answers[0] ?? "";
    if (!given) return ["empty"];
    if (!isLetter(given) || !letters.includes(given)) return ["unreadable"];
    return [correct.includes(given) ? "right" : "wrong"];
  }
  const marked = letters.map((letter, i) => answers[i] === letter);
  if (!marked.includes(true)) return letters.map(() => "empty");
  return letters.map((letter, i) =>
    marked[i] === correct.includes(letter) ? "right" : "wrong",
  );
}

export function choiceProblem({ many, options, correct }: Choice) {
  const letters = lettersOf(options);
  const outside = correct.find((letter) => !letters.includes(letter));
  if (outside)
    return `"${outside}" is not an option, they end at ${letters.at(-1)}`;
  if (new Set(correct).size < correct.length)
    return "correct lists an option twice";
  if (!many && correct.length > 1)
    return "a single choice has one correct option, set many: true for several";
  const twin = options.findIndex((option, i) => options.indexOf(option) !== i);
  if (twin !== -1) return `option ${letters[twin]} repeats an earlier option`;
}

export const choiceResult = ({ options, correct }: Choice) =>
  correct
    .map((letter) => `**${letter})** ${options[optionLetters.indexOf(letter)]}`)
    .join("\n\n");

export const isShort = (option: string) =>
  option.length <= 20 && !/\$\$|\\d?frac|\\begin/.test(option);
