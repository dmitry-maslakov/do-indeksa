import { deburr, kebabCase } from "es-toolkit";

const latin = (s: string) => deburr(s.replaceAll(/đ/gi, "dj")).toLowerCase();

export const fold = (s: string) => latin(s).replaceAll("dj", "d");

export const slugOf = (s: string) => kebabCase(latin(s));
