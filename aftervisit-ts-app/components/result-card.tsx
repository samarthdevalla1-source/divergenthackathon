import type { ReactNode } from "react";

type ResultCardProps = {
  title: string;
  eyebrow: string;
  children?: ReactNode;
};

export function ResultCard({ title, eyebrow, children }: ResultCardProps) {
  return (
    <section className="animate-floatIn rounded-[1.5rem] border border-white/80 bg-white/85 p-5 shadow-sm">
      <p className="font-[family-name:var(--font-plex-mono)] text-xs uppercase tracking-[0.24em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-xl font-semibold text-ink">{title}</h3>
      <div className="mt-4 text-sm leading-7 text-slate-700">{children}</div>
    </section>
  );
}
