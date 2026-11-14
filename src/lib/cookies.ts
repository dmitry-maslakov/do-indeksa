export const adoptGuestCookie = "adopt-guest";
export const profileCookie = "__Host-profile";
export const examCookie = "__Host-exam";

export const readCookie = (name: string) =>
  document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];

export function writeCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}
