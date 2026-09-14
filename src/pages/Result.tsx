import { useEffect, useState } from "react";
import { ClipboardCheck, Copy, Printer, RotateCcw } from "lucide-react";

import { ActionChecklist } from "@/components/Report/ActionChecklist";
import { AmountCard } from "@/components/Report/AmountCard";
import { CalcBreakdown } from "@/components/Report/CalcBreakdown";
import { Disclaimer } from "@/components/Report/Disclaimer";
import { LegalBasis } from "@/components/Report/LegalBasis";
import { ReportHeader } from "@/components/Report/ReportHeader";
import { RiskTips } from "@/components/Report/RiskTips";
import { Button } from "@/components/ui/Button";
import { buildReportText } from "@/lib/report";
import type { CalculationInput, CalculationResult } from "@/types";

interface ResultProps {
  input: CalculationInput;
  result: CalculationResult;
  onRestart: () => void;
  onEdit: () => void;
}

export const Result = ({
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
      await navigator.clipboard.writeText(buildReportText(input, result));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <div className="print-container mx-auto max-w-3xl">
      <div className="no-print mb-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <Button className="w-full sm:w-auto" onClick={() => window.print()}>
          <Printer className="size-5" aria-hidden="true" />
          打印 / 保存 PDF
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
              : "复制文本摘要"}
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
        <ReportHeader />
        <AmountCard result={result} />
        <section className="rounded-xl bg-brand-50 p-5">
          <p className="text-xs font-bold text-brand-700">适用结论</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{result.rule}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">{result.ruleReason}</p>
        </section>
        <CalcBreakdown input={input} result={result} />
        <LegalBasis input={input} result={result} />
        <RiskTips warnings={result.warnings} />
        <ActionChecklist />
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
