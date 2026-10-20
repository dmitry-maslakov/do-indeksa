import { hasGuestToAdopt } from "@/server/auth";
import { GuestAdoption } from "./guest-adoption";

export async function AdoptGuest() {
  return (await hasGuestToAdopt()) && <GuestAdoption />;
}
