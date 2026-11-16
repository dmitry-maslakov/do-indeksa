export function watchAttention() {
  let total = 0;
  let since: number | undefined;
  const settle = () => {
    const now = performance.now();
    if (since !== undefined) total += now - since;
    since =
      document.visibilityState === "visible" && document.hasFocus()
        ? now
        : undefined;
  };
  const listening = new AbortController();
  const options = { signal: listening.signal };
  addEventListener("focus", settle, options);
  addEventListener("blur", settle, options);
  document.addEventListener("visibilitychange", settle, options);
  settle();
  return {
    read() {
      settle();
      return total;
    },
    restart() {
      settle();
      total = 0;
    },
    stop: () => listening.abort(),
  };
}
