import { useCallback, useEffect, useState } from "react";

const read = (key: string) => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

const write = (key: string, value: boolean) => {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {}
};

export function useStoredFlag(key: string) {
  const [flag, setFlag] = useState(false);

  useEffect(() => setFlag(read(key)), [key]);

  const toggle = useCallback(() => {
    setFlag((value) => {
      write(key, !value);
      return !value;
    });
  }, [key]);

  return [flag, toggle] as const;
}
