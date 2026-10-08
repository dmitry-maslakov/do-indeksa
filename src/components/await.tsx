import type { ReactNode } from "react";

interface AwaitProps<T> {
  promise: Promise<T>;
  children: (value: T) => ReactNode;
}

export async function Await<T>({ promise, children }: AwaitProps<T>) {
  return children(await promise);
}
