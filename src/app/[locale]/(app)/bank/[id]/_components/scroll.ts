export function centerCurrent(list: HTMLElement) {
  const row = list.querySelector<HTMLElement>("[aria-current=page]");
  if (row)
    list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
}
