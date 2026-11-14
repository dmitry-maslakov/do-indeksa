import { deburr } from "es-toolkit";

export const fold = (s: string) =>
  deburr(s.replaceAll(/đ/gi, "dj")).toLowerCase();
