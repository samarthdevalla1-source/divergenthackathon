export function EmptyState() {
  return (
    <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-white/50 px-6 text-center animate-floatIn">
      <div className="rounded-full bg-sky-100 px-4 py-2 font-[family-name:var(--font-plex-mono)] text-xs uppercase tracking-[0.24em] text-sky-700">
        Waiting for notes
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-ink">Your simplified summary will appear here</h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
        Paste doctor notes on the left and AfterVisit AI will generate a short explanation, action steps,
        warnings, and helpful questions for the next visit.
      </p>
    </div>
  );
}
