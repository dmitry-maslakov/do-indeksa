"use client";

import { Noto_Sans_Math } from "next/font/google";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { fallbackGlyphs, startField } from "./field";

const math = Noto_Sans_Math({ weight: "400" });

export function GlyphField({ children }: { children: ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const text = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!canvas.current || !text.current) return;
    return startField(canvas.current, text.current, {
      onReady: () => setReady(true),
      onFallback: () => setFallback(true),
    });
  }, []);

  return (
    <>
      {fallback ? (
        <div
          aria-hidden
          className={`${math.className} pointer-events-none fixed inset-0 [mask-image:radial-gradient(ellipse_46%_30%_at_50%_50%,transparent_55%,#000)] max-sm:[mask-image:radial-gradient(ellipse_70%_26%_at_50%_50%,transparent_50%,#000)]`}
        >
          {fallbackGlyphs.map((g) => (
            <i
              key={`${g.left}${g.top}`}
              className="absolute animate-rise not-italic text-daily-glyph opacity-0 motion-reduce:[animation-play-state:paused]"
              style={{
                left: g.left,
                top: g.top,
                fontSize: g.fontSize,
                animationDelay: g.delay,
              }}
            >
              {g.glyph}
            </i>
          ))}
        </div>
      ) : (
        <canvas
          ref={canvas}
          aria-hidden
          data-ready={ready || undefined}
          className="pointer-events-none fixed inset-0 size-full text-daily-glyph opacity-0 transition-opacity duration-1600 data-ready:opacity-100"
          style={{ fontFamily: `${math.style.fontFamily}, var(--font-sans)` }}
        />
      )}
      <div ref={text} className="relative z-10 flex flex-col items-center">
        {children}
      </div>
    </>
  );
}
