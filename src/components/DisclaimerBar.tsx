import { useState } from "react";
import { Info, X } from "lucide-react";

import { product } from "@/config/product";
import { cn } from "@/lib/cn";

export const DisclaimerBar = (): JSX.Element => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-2 backdrop-blur">
        <button
          type="button"
          className="mx-auto flex min-h-10 w-full max-w-4xl items-center justify-center gap-2 text-sm font-medium text-slate-600"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Info className="size-4 text-brand-600" aria-hidden="true" />
          查看免责声明
        </button>
      </div>

      <div
        className={cn(
          "no-print fixed inset-0 z-40 bg-slate-950/35 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />
      <section
        className={cn(
          "no-print fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl transition-transform",
          open ? "translate-y-0" : "translate-y-full",
        )}
        aria-hidden={!open}
        aria-label="免责声明"
      >
        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                重要说明
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">免责声明</h2>
            </div>
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="关闭免责声明"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
            {product.disclaimer}
          </p>
        </div>
      </section>
    </>
  );
};
