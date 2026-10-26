---
name: Izvlačenje zajedničkog činioca
when: $2^{x+1} + 2^{x-1}$
order: 3
---

## Postupak

1. Uoči sabirke sa istom osnovom čiji se izložioci razlikuju za broj: $2^{x+1}$, $2^x$, $2^{x-1}$.
2. Izvuci ispred zagrade stepen sa najmanjim izložiocem: $2^{x+1} + 2^{x-1} = 2^{x-1}(2^2 + 1)$.
3. Izračunaj zagradu i podeli obe strane tim brojem.
4. Dobijenu jednačinu $a^{f(x)} = b$ reši svođenjem na istu osnovu.

## Primer

Rešiti jednačinu $2^{x+1} + 2^{x-1} = 20$.

:::primer
Izvlačimo $2^{x-1}$: $2^{x-1}(2^2 + 1) = 20$, odnosno $5 \cdot 2^{x-1} = 20$.

Odatle je $2^{x-1} = 4 = 2^2$, pa je $x - 1 = 2$.

**Rešenje:** $x = 3$.
:::

:::greska
Sabrati stepene kao da se sabiraju izložioci: $2^{x+1} + 2^{x-1} \ne 2^{2x}$. Zbir stepena nije stepen, pa prvo izvuci zajednički činilac.
:::
