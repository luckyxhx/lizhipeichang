import { useState } from "react";
import { Check, Copy, MapPin, MessageSquareText, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  buildStandardQueryPrompt,
  evidenceChecklist,
  negotiationScript,
} from "@/content/paidMaterials";
import { getRegionCap } from "@/data/regions";
import { cn } from "@/lib/cn";
import type { CalculationInput } from "@/types";

interface PaidExtrasProps {
  input: CalculationInput;
}

export const PaidExtras = ({ input }: PaidExtrasProps): JSX.Element => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [promptCopyState, setPromptCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const region = getRegionCap(input.regionCity);
  const standardQueryPrompt = buildStandardQueryPrompt(input.regionCity);

  const copyNegotiationScript = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(
        negotiationScript.map((item, index) => `${index + 1}. ${item}`).join("\n"),
      );
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const toggleItem = (index: number): void => {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const copyStandardQueryPrompt = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(standardQueryPrompt);
      setPromptCopyState("copied");
    } catch {
      setPromptCopyState("failed");
    }
  };

  return (
    <div className="space-y-5">
      <section className="print-avoid-break rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <MapPin className="size-5 text-brand-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900">城市标准匹配</h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          已选择：{input.regionCity}
        </p>
        {region ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <p className="font-bold">
              自动匹配三倍封顶线：{region.capMonthlyWage.toLocaleString("zh-CN")} 元
            </p>
            <p className="mt-1">
              适用年度：{region.dataYear}；来源：{region.source}
            </p>
            <p className="mt-2">
              当前数据仍标记为示例，正式使用前必须按官方最新数据复核。
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <p>
              当前城市尚未收录可自动匹配的标准。请查询当地人社、统计或法院官方来源后手动填写，
              不要使用邻近城市或未经核实的网络数值替代。
            </p>
            <Button
              className="no-print mt-3 w-full sm:w-auto"
              variant="secondary"
              onClick={copyStandardQueryPrompt}
            >
              <Copy className="size-4" aria-hidden="true" />
              {promptCopyState === "copied"
                ? "提示词已复制"
                : promptCopyState === "failed"
                  ? "复制失败"
                  : "复制官方标准查询提示词"}
            </Button>
          </div>
        )}
      </section>

      <section className="print-avoid-break rounded-xl border border-orange-200 bg-orange-50/60 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-5 text-orange-700" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-950">离职谈判话术卡</h2>
          </div>
          <Button
            className="no-print w-full sm:w-auto"
            variant="secondary"
            onClick={copyNegotiationScript}
          >
            <Copy className="size-4" aria-hidden="true" />
            {copyState === "copied"
              ? "已复制"
              : copyState === "failed"
                ? "复制失败"
                : "复制话术"}
          </Button>
        </div>
        <ol className="mt-5 space-y-3">
          {negotiationScript.map((item, index) => (
            <li key={item} className="flex gap-3 text-sm leading-6 text-slate-800">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-orange-700">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="print-avoid-break rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-brand-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-slate-900">仲裁举证清单</h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          勾选状态仅用于本次查看，不会上传或保存。
        </p>
        <div className="mt-4 space-y-2">
          {evidenceChecklist.map((item, index) => {
            const checked = checkedItems.has(index);
            return (
              <button
                key={item}
                type="button"
                aria-pressed={checked}
                className={cn(
                  "flex min-h-11 w-full items-start gap-3 rounded-lg border px-3 py-2 text-left text-sm leading-6 transition",
                  checked
                    ? "border-brand-300 bg-brand-50 text-brand-900"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-200",
                )}
                onClick={() => toggleItem(index)}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded border",
                    checked
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300 bg-white",
                  )}
                >
                  {checked ? <Check className="size-3.5" aria-hidden="true" /> : null}
                </span>
                {item}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
