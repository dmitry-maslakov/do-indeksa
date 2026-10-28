import { hasGuestToAdopt } from "./adopt";
import { GuestAdoption } from "./guest-adoption";

export async function AdoptGuest() {
  return (await hasGuestToAdopt()) && <GuestAdoption />;
}
