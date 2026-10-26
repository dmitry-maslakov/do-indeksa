---
name: Smena $t = a^x$
when: $4^x$ i $2^x$, $9^x$ i $3^x$
order: 2
---

## Postupak

1. Sve stepene zapiši preko $a^x$: $4^x = (2^x)^2$, $2^{x+1} = 2 \cdot 2^x$.
2. Uvedi smenu $t = a^x$, uz uslov $t > 0$.
3. Reši kvadratnu jednačinu po $t$ i odbaci rešenja $t \le 0$.
4. Vrati se na $x$: iz $a^x = t$ sledi $x = \log_a t$.

## Primer

Rešiti jednačinu $9^x - 4 \cdot 3^x + 3 = 0$.

:::primer
Neka je $t = 3^x > 0$. Tada je $9^x = t^2$, pa je $t^2 - 4t + 3 = 0$.

$(t - 1)(t - 3) = 0$, pa je $t = 1$ ili $t = 3$. Oba su pozitivna.

$3^x = 1$ daje $x = 0$, a $3^x = 3$ daje $x = 1$.

**Rešenja:** $x = 0$ i $x = 1$.
:::

:::greska
Zadržati negativno $t$. Jednačina $2^x = -1$ nema rešenja.
:::
