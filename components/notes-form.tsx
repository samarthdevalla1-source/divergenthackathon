type NotesFormProps = {
  notes: string;
  error: string | null;
  isLoading: boolean;
  onChange: (value: string) => void;
  onLoadExample: () => void;
  onReset: () => void;
  onSubmit: () => void;
};

export function NotesForm({
  notes,
  error,
  isLoading,
  onChange,
  onLoadExample,
  onReset,
  onSubmit
}: NotesFormProps) {
  const isDisabled = !notes.trim() || isLoading;

  return (
    <section className="glass-panel rounded-[2rem] border border-white/70 p-6 shadow-soft">
      <div className="flex flex-col gap-2">
        <p className="font-[family-name:var(--font-plex-mono)] text-xs uppercase tracking-[0.24em] text-slate-500">
          Input
        </p>
        <h2 className="text-2xl font-semibold text-ink">Paste doctor notes</h2>
        <p className="text-sm leading-7 text-slate-600">
          Add the after-visit summary, medication instructions, or follow-up guidance you want rewritten in
          plain language.
        </p>
      </div>

      <textarea
        value={notes}
        onChange={(event: { target: { value: string } }) => onChange(event.target.value)}
        placeholder="Example: Continue lisinopril 10mg once daily, reduce sodium intake, check blood pressure at home, and follow up in 2 weeks."
        className="mt-5 min-h-[20rem] w-full resize-none rounded-[1.5rem] border border-slate-200 bg-white px-5 py-4 text-base leading-7 text-slate-800 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isDisabled}
          className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Simplifying..." : "Simplify Instructions"}
        </button>
        <button
          type="button"
          onClick={onLoadExample}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Load Example
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-2xl border border-transparent bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
        >
          Clear
        </button>
      </div>

      <p className="mt-5 rounded-[1.5rem] border border-amber-100 bg-peach px-4 py-3 text-sm leading-6 text-slate-700">
        AfterVisit AI is for communication support only. It does not diagnose, replace clinicians, or create
        new treatment advice.
      </p>

      {error ? (
        <p className="mt-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
