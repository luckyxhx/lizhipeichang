import { AlertTriangle, BadgeCheck } from "lucide-react";

import { formatCurrency } from "@/lib/format";
import type { CalculationResult } from "@/types";

interface AmountCardProps {
  result: CalculationResult;
}

export const AmountCard = ({ result }: AmountCardProps): JSX.Element => (
  <section className="print-avoid-break rounded-xl bg-slate-950 p-5 text-white sm:p-7">
    <div className="flex items-center gap-2 text-sm font-semibold text-brand-100">
      <BadgeCheck className="size-4" aria-hidden="true" />
      初步适用 {result.rule}
    </div>
    <p className="mt-4 text-sm text-slate-300">预估赔偿总额区间</p>
    <p className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
      {formatCurrency(result.estimateMin)}
      <span className="mx-2 font-medium text-slate-400">至</span>
      {formatCurrency(result.estimateMax)}
    </p>
    <p className="mt-3 text-xs leading-5 text-slate-400">
      基准金额 {formatCurrency(result.exactAmount)}
      ；展示区间按基准金额上下浮动 20%，不是法定最低或最高金额。
    </p>
    <p className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-sm leading-6 text-slate-200">
      <AlertTriangle className="mt-1 size-4 shrink-0 text-amber-300" aria-hidden="true" />
      {result.legalConclusion}
    </p>
  </section>
);
