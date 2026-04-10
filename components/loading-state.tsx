export function LoadingState() {
  return (
    <div className="flex min-h-[28rem] flex-col items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white/60 px-6 text-center animate-floatIn">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-100">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold text-ink">Simplifying instructions</h2>
      <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
        Reading the visit notes and converting them into clear, patient-friendly guidance.
      </p>
    </div>
  );
}
