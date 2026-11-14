import { daySeconds } from "./dates";

export const adoptGuestCookie = "adopt-guest";
export const profileCookie = "__Host-profile";
export const examCookie = "__Host-exam";

export const readCookie = (name: string) =>
  document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];

export function rememberExam(id: string) {
  document.cookie = `${examCookie}=${id}; Max-Age=${365 * daySeconds}; Path=/; SameSite=Lax; Secure`;
}
