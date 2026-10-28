export function HeroBackdrop() {
  return (
    <>
      <div className="absolute -inset-x-4 -top-4 -bottom-8 bg-[linear-gradient(var(--background),var(--muted)_22%,var(--muted)_80%,var(--background))] md:hidden" />
      <div className="absolute -inset-x-10 -top-6 -bottom-36 max-md:hidden">
        <svg
          aria-hidden
          viewBox="0 0 1440 360"
          preserveAspectRatio="none"
          className="size-full"
        >
          <defs>
            <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--background)" />
              <stop offset=".35" stopColor="var(--muted)" />
            </linearGradient>
          </defs>
          <path
            d="M0 0H1440V270C1300 320 1180 240 1000 260C820 280 760 350 560 320C380 292 300 230 0 270Z"
            fill="url(#hero-fade)"
          />
        </svg>
      </div>
    </>
  );
}
