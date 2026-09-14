import type { ReactNode } from "react";
import { Scale } from "lucide-react";

import { DisclaimerBar } from "@/components/DisclaimerBar";
import { product } from "@/config/product";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps): JSX.Element => (
  <div className="min-h-screen bg-paper text-ink">
    <header className="no-print border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-4">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Scale className="size-4.5" aria-hidden="true" />
        </span>
        <span className="text-sm font-bold tracking-wide text-slate-800 sm:text-base">
          {product.name}
        </span>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">{children}</main>
    <DisclaimerBar />
  </div>
);
