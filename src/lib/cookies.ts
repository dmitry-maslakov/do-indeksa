import { daySeconds } from "./dates";

export const adoptGuestCookie = "adopt-guest";
export const profileCookie = "__Host-profile";
export const examCookie = "__Host-exam";

export const readCookie = (name: string) =>
  document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];

function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

export const rememberExam = (id: string) =>
  writeCookie(examCookie, id, 365 * daySeconds);
