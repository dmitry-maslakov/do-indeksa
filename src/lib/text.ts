import { deburr, kebabCase } from "es-toolkit";

export const fold = (s: string) =>
  deburr(s.replaceAll(/đ/gi, "dj")).toLowerCase();

export const slugOf = (s: string) => kebabCase(fold(s));
