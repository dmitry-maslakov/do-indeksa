export const adoptGuestCookie = "adopt-guest";

export const readCookie = (name: string) =>
  document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))?.[1];
