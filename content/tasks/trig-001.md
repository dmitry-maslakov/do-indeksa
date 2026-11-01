---
topic: trigonometry
type: roots-in-interval
difficulty: 2
source: Do indeksa
answer: 'na $[0,\pi)$: $x\in\left\{\frac{\pi}{4},\ \operatorname{arctg}2\right\}$; u $\left(\frac{\pi}{3},\frac{\pi}{2}\right)$: samo $x=\operatorname{arctg}2$'
check:
- label: na $[0,\pi)$
  var: x
  kind: values
  expected: \frac{\pi}{4}, \arctan 2
- label: u $\left(\frac{\pi}{3},\frac{\pi}{2}\right)$
  var: x
  expected: \arctan 2
hints:
- |
  Uvedi smenu $t=\operatorname{tg}x$ i reši dobijenu kvadratnu jednačinu. Tangens ima osnovni period $\pi$, pa na $[0,\pi)$ svaka vrednost tangensa daje tačno jedan ugao; zatim odaberi korene koji upadaju u drugi interval.
- |
  Iz $t^2-3t+2=0$ dobijaš $\operatorname{tg}x=1$ ili $\operatorname{tg}x=2$. Za drugi interval iskoristi to što tangens na $\left(0,\dfrac{\pi}{2}\right)$ raste i što je $\operatorname{tg}\dfrac{\pi}{3}=\sqrt{3}$.
solution: |
  Smenom $t=\operatorname{tg}x$ dobijamo $t^2-3t+2=0$, pa je $t=1$ ili $t=2$:

  $$\operatorname{tg}x=1\quad\text{ili}\quad\operatorname{tg}x=2.$$

  Tangens ima osnovni period $\pi$, pa na $[0,\pi)$ svaka od ovih jednačina ima tačno jedno rešenje: $x=\dfrac{\pi}{4}$ i $x=\operatorname{arctg}2$.

  Odabir korena koji pripadaju $\left(\dfrac{\pi}{3},\dfrac{\pi}{2}\right)$: tangens na $\left(0,\dfrac{\pi}{2}\right)$ raste, a $\operatorname{tg}\dfrac{\pi}{4}=1<\sqrt{3}=\operatorname{tg}\dfrac{\pi}{3}<2$, pa $\dfrac{\pi}{4}$ ne pripada, a $\operatorname{arctg}2$ pripada.
---

Naći sva rešenja jednačine

$$\operatorname{tg}^2x-3\operatorname{tg}x+2=0,$$

koja pripadaju intervalu $[0,\,\pi)$, i posebno ona od njih koja leže u $\left(\dfrac{\pi}{3},\,\dfrac{\pi}{2}\right)$.
