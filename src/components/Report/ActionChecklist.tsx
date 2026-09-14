import { CheckSquare } from "lucide-react";

import { actionChecklist } from "@/lib/report";

export const ActionChecklist = (): JSX.Element => (
  <section className="print-avoid-break rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="flex items-center gap-2">
      <CheckSquare className="size-5 text-brand-600" aria-hidden="true" />
      <h2 className="text-lg font-bold text-slate-900">维权行动清单</h2>
    </div>
    <ul className="mt-4 space-y-3">
      {actionChecklist.map((action) => (
        <li key={action}>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 text-sm leading-6 text-slate-700 hover:bg-slate-50">
            <input type="checkbox" className="mt-1 size-4 shrink-0 accent-brand-600" />
            <span>{action}</span>
          </label>
        </li>
      ))}
    </ul>
  </section>
);
