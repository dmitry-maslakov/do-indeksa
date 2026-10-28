import Sqids from "sqids";

const sqids = new Sqids({
  alphabet: "K7QM2XRV9WPHT4ZCAN3FJ8EGBY5SD6U",
  minLength: 5,
});

const legacyCode = /^[\w-]{7}$|^[\w-]{16}$/;

export const setCode = (id: number) => sqids.encode([id]);

type SetRef = { id: number } | { legacy: string };

export function parseSetCode(code: string): SetRef | undefined {
  if (legacyCode.test(code)) return { legacy: code };
  const upper = code.toUpperCase();
  const [id, ...rest] = sqids.decode(upper);
  if (id !== undefined && rest.length === 0 && setCode(id) === upper) {
    return { id };
  }
}
