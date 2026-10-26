---
name: Logaritmovanje
when: $3^x = 5$
order: 5
---

## Postupak

1. Svedi jednačinu na oblik $a^{f(x)} = b$ ili $a^{f(x)} = c^{g(x)}$, kad se osnove ne mogu izjednačiti.
2. Logaritmuj obe strane istim logaritmom, npr. dekadnim. Obe strane moraju biti pozitivne.
3. Spusti izložioce ispred logaritma: $\log a^{f(x)} = f(x) \log a$.
4. Reši dobijenu linearnu jednačinu po $x$.

## Primer

Rešiti jednačinu $2^x = 3^{x-1}$.

:::primer
Logaritmujemo obe strane: $x \log 2 = (x - 1) \log 3$.

Sređujemo: $x \log 3 - x \log 2 = \log 3$, odnosno $x \log \frac{3}{2} = \log 3$.

**Rešenje:** $x = \dfrac{\log 3}{\log \frac{3}{2}} = \log_{3/2} 3$.
:::

:::greska
Logaritmovati zbir član po član: $\log(2^x + 3^x) \ne x \log 2 + x \log 3$. Logaritmuje se tek kad je na svakoj strani jedan stepen ili proizvod.
:::
