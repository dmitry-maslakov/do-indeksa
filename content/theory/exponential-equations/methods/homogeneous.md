---
name: Homogene jednačine
when: $4^x$, $6^x$, $9^x$
order: 4
---

## Postupak

1. Prepoznaj oblik $A \cdot a^{2x} + B \cdot (ab)^x + C \cdot b^{2x} = 0$, npr. sa $4^x$, $6^x$ i $9^x$.
2. Podeli celu jednačinu sa $b^{2x}$, koje je uvek pozitivno.
3. Uvedi smenu $t = \left(\frac{a}{b}\right)^x > 0$ i dobićeš $A t^2 + B t + C = 0$.
4. Reši po $t$, odbaci $t \le 0$ i vrati se na $x$.

## Primer

Rešiti jednačinu $4^x + 6^x = 2 \cdot 9^x$.

:::primer
Delimo sa $9^x > 0$: $\left(\frac{4}{9}\right)^x + \left(\frac{6}{9}\right)^x = 2$, odnosno $\left(\frac{2}{3}\right)^{2x} + \left(\frac{2}{3}\right)^x - 2 = 0$.

Smena $t = \left(\frac{2}{3}\right)^x > 0$ daje $t^2 + t - 2 = 0$, tj. $(t - 1)(t + 2) = 0$.

Koren $t = -2$ odbacujemo, pa je $\left(\frac{2}{3}\right)^x = 1$.

**Rešenje:** $x = 0$.
:::

:::greska
Podeliti sa $9^x$ samo levu stranu. Deli se cela jednačina, pa desna strana postaje $2$.
:::
