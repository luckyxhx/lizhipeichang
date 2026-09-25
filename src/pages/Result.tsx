import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ClipboardCheck,
  Copy,
  LockKeyhole,
  Printer,
  RotateCcw,
} from "lucide-react";

import { ActionChecklist } from "@/components/Report/ActionChecklist";
import { AmountCard } from "@/components/Report/AmountCard";
import { CalcBreakdown } from "@/components/Report/CalcBreakdown";
import { Disclaimer } from "@/components/Report/Disclaimer";
import { LegalBasis } from "@/components/Report/LegalBasis";
import { PaidExtras } from "@/components/Report/PaidExtras";
import { ReportHeader } from "@/components/Report/ReportHeader";
import { RiskTips } from "@/components/Report/RiskTips";
import { Button } from "@/components/ui/Button";
import { product } from "@/config/product";
import { buildFreeReportText, buildReportText } from "@/lib/report";
import type { CalculationInput, CalculationResult, ProductEdition } from "@/types";

interface ResultProps {
  edition: ProductEdition;
  input: CalculationInput;
  result: CalculationResult;
  onRestart: () => void;
  onEdit: () => void;
}

export const Result = ({
  edition,
  input,
  result,
  onRestart,
  onEdit,
}: ResultProps): JSX.Element => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    const openCalculationDetails = (): void => {
      document.querySelectorAll("details").forEach((details) => {
        details.open = true;
      });
    };

    window.addEventListener("beforeprint", openCalculationDetails);
    return () => window.removeEventListener("beforeprint", openCalculationDetails);
  }, []);

  const copyReport = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(
        edition === "paid"
          ? buildReportText(input, result)
          : buildFreeReportText(input, result),
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <div className="print-container mx-auto max-w-3xl">
      <div className="no-print mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-soft">
        <span className="text-sm font-bold text-slate-800">
          {edition === "paid" ? product.editions.paid.name : product.editions.free.name}
        </span>
        <span className="text-xs text-slate-500">
          {edition === "paid" ? "完整报告已解锁" : "核心测算结果"}
        </span>
      </div>
      <div className="no-print mb-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <Button className="w-full sm:w-auto" onClick={() => window.print()}>
          <Printer className="size-5" aria-hidden="true" />
          {edition === "paid" ? "下载完整报告 PDF" : "打印简版结果"}
        </Button>
        <Button className="w-full sm:w-auto" variant="secondary" onClick={copyReport}>
          {copyState === "copied" ? (
            <ClipboardCheck className="size-5" aria-hidden="true" />
          ) : (
            <Copy className="size-5" aria-hidden="true" />
          )}
          {copyState === "copied"
            ? "已复制"
            : copyState === "failed"
              ? "复制失败"
              : edition === "paid"
                ? "复制完整报告"
                : "复制简版摘要"}
        </Button>
        <Button
          className="col-span-2 w-full sm:w-auto"
          variant="ghost"
          onClick={onRestart}
        >
          <RotateCcw className="size-5" aria-hidden="true" />
          重新计算
        </Button>
      </div>

      <article className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-soft sm:p-8">
        <ReportHeader edition={edition} />
        <AmountCard result={result} />
        <section className="rounded-xl bg-brand-50 p-5">
          <p className="text-xs font-bold text-brand-700">适用结论</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{result.rule}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">{result.ruleReason}</p>
        </section>
        <CalcBreakdown input={input} result={result} />
        {edition === "paid" ? (
          <>
            <PaidExtras input={input} />
            <LegalBasis input={input} result={result} />
            <RiskTips warnings={result.warnings} />
            <ActionChecklist />
          </>
        ) : (
          <section className="no-print rounded-xl border border-orange-200 bg-orange-50 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-orange-900">
              <LockKeyhole className="size-5" aria-hidden="true" />
              <h2 className="text-lg font-bold">完整版包含</h2>
            </div>
            <ul className="mt-4 grid gap-2 text-sm leading-6 text-orange-950 sm:grid-cols-2">
              {product.editions.paid.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <BadgeCheck
                    className="mt-0.5 size-4 shrink-0 text-orange-700"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-orange-900">
              完整版为 {product.editions.paid.priceNote}，购买后通过专属链接访问。
            </p>
          </section>
        )}
        <Disclaimer />
        <button
          type="button"
          className="no-print min-h-11 w-full rounded-lg border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          onClick={onEdit}
        >
          返回修改输入
        </button>
      </article>
    </div>
  );
};
