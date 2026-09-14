import { Info } from "lucide-react";

import { product } from "@/config/product";

export const Disclaimer = (): JSX.Element => (
  <section className="rounded-xl border border-slate-300 bg-slate-50 p-5 text-xs leading-6 text-slate-600">
    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
      <Info className="size-4" aria-hidden="true" />
      免责声明
    </div>
    <p className="mt-3 whitespace-pre-line">{product.disclaimer}</p>
  </section>
);
