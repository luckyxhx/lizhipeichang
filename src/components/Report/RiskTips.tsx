import { AlertTriangle } from "lucide-react";

interface RiskTipsProps {
  warnings: string[];
}

export const RiskTips = ({ warnings }: RiskTipsProps): JSX.Element => (
  <section className="print-avoid-break rounded-xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
    <div className="flex items-center gap-2 text-amber-950">
      <AlertTriangle className="size-5" aria-hidden="true" />
      <h2 className="text-lg font-bold">风险提示</h2>
    </div>
    <ul className="mt-4 space-y-3">
      {warnings.map((warning) => (
        <li key={warning} className="flex gap-3 text-sm leading-6 text-amber-950">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
          <span>{warning}</span>
        </li>
      ))}
    </ul>
  </section>
);
