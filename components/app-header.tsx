const FEATURE_BADGES = [
  "Plain-language explanation",
  "Action checklist",
  "Warning signs",
  "Doctor follow-up questions"
];

export function AppHeader() {
  return (
    <header className="glass-panel rounded-[2rem] border border-white/70 px-6 py-8 shadow-soft sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex rounded-full border border-sky-200 bg-white/80 px-3 py-1 font-[family-name:var(--font-plex-mono)] text-xs uppercase tracking-[0.24em] text-sky-700">
            Healthcare AI Demo
          </div>
          <h1 className="mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            AfterVisit AI
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base leading-7 text-slate-600 sm:text-lg">
            Turn dense doctor notes into calm, patient-friendly instructions that are easier to understand,
            remember, and follow after a visit.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {FEATURE_BADGES.map((badge) => (
            <div
              key={badge}
              className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm"
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
