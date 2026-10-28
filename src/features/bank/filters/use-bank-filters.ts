import { useQueryStates } from "nuqs";
import { bankParsers } from "@/features/bank/params";

export const useBankFilters = () =>
  useQueryStates(bankParsers, {
    history: "push",
    shallow: false,
    scroll: true,
  });
