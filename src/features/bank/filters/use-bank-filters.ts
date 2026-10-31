import { useQueryStates } from "nuqs";
import { queryParsers } from "@/features/bank/params";
import { useBankState } from "./bank-state";

export function useBankFilters() {
  const [topic] = useBankState().topic;
  const [query, setQuery] = useQueryStates(queryParsers, {
    history: "push",
    shallow: false,
    scroll: true,
  });
  return [{ ...query, topic }, setQuery] as const;
}
