import { useState } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Copy, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { buildStandardQueryPrompt } from "@/content/paidMaterials";
import { regionCaps } from "@/data/regions";
import { regionOptions } from "@/data/regionOptions";
import { getTerminationRule } from "@/lib/legalRules";
import { cn } from "@/lib/cn";
import type {
  ProductEdition,
  TerminationReason,
  WizardFormValues,
  WizardStep,
} from "@/types";

interface StepFormProps {
  edition: ProductEdition;
  form: UseFormReturn<WizardFormValues>;
  currentStep: WizardStep;
}

const optionClass = (selected: boolean): string =>
  cn(
    "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition",
    selected
      ? "border-brand-500 bg-brand-50 text-brand-700"
      : "border-slate-300 bg-white text-slate-700 hover:border-brand-200",
  );

const reasonOrder: TerminationReason[] = [
  "economic_layoff",
  "mutual_company_proposed",
  "mutual_employee_proposed",
  "company_fault",
  "incompetence",
  "medical_expiry",
  "objective_change",
  "illegal_termination",
  "voluntary_resignation",
  "probation_dismissal",
  "serious_misconduct",
];

export const StepForm = ({ edition, form, currentStep }: StepFormProps): JSX.Element => {
  const [promptCopyState, setPromptCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = form;
  const selectedReason = watch("terminationReason");
  const selectedRule = selectedReason ? getTerminationRule(selectedReason) : undefined;
  const writtenNoticeProvided = watch("writtenNoticeProvided");
  const selectedCity = watch("regionCity");
  const selectedRegion = regionCaps.find((region) => region.city === selectedCity);
  const standardQueryPrompt = selectedCity ? buildStandardQueryPrompt(selectedCity) : "";

  const copyStandardQueryPrompt = async (): Promise<void> => {
    if (!standardQueryPrompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(standardQueryPrompt);
      setPromptCopyState("copied");
    } catch {
      setPromptCopyState("failed");
    }
  };

  if (currentStep === 1) {
    return (
      <div className="space-y-6">
        <Field
          label="入职日期"
          htmlFor="startDate"
          error={errors.startDate?.message}
          required
        >
          <Input id="startDate" type="date" {...register("startDate")} />
        </Field>
        <Field
          label="离职日期"
          htmlFor="endDate"
          hint="离职日期需晚于入职日期。"
          error={errors.endDate?.message}
          required
        >
          <Input id="endDate" type="date" {...register("endDate")} />
        </Field>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div className="space-y-6">
        <Field
          label="离职前 12 个月总收入"
          htmlFor="totalIncomeLast12Months"
          hint="填写工资、奖金、津贴、补贴等货币性收入的合计，单位：元。"
          error={errors.totalIncomeLast12Months?.message}
          required
        >
          <Input
            id="totalIncomeLast12Months"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="例如 180000"
            {...register("totalIncomeLast12Months", { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="实际月份数"
          htmlFor="actualMonths"
          hint="不满 12 个月时填写实际有收入的月份数；按实际月份平均。"
          error={errors.actualMonths?.message}
          required
        >
          <Input
            id="actualMonths"
            type="number"
            min="1"
            max="12"
            step="0.5"
            inputMode="decimal"
            placeholder="例如 8"
            {...register("actualMonths", { valueAsNumber: true })}
          />
        </Field>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="space-y-6">
        <Field
          label="劳动合同履行地"
          htmlFor="regionCity"
          error={errors.regionCity?.message}
          required
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <select
              id="regionCity"
              className="min-h-12 w-full appearance-none rounded-lg border border-slate-300 bg-white pl-10 pr-9 text-base text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              {...register("regionCity")}
            >
              <option value="">请选择城市</option>
              {regionOptions.map((group) => (
                <optgroup key={group.province} label={group.province}>
                  {group.cities.map((city) => (
                    <option key={`${group.province}-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </Field>
        {selectedCity ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            <div className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 size-5 shrink-0 text-brand-600"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">城市标准匹配</p>
                {edition === "paid" && selectedRegion ? (
                  <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-950">
                    <p className="font-bold">
                      自动匹配三倍封顶线：
                      {selectedRegion.capMonthlyWage.toLocaleString("zh-CN")} 元
                    </p>
                    <p className="mt-1">
                      适用年度：{selectedRegion.dataYear}；来源：{selectedRegion.source}
                    </p>
                    <p className="mt-1">
                      当前数据仍标记为示例，正式使用前必须按官方最新数据复核。
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mt-1">
                      {edition === "paid"
                        ? "当前城市尚未收录可自动匹配的标准。请查询当地人社、统计或法院官方来源后手动填写，不要使用邻近城市或未经核实的网络数值替代。"
                        : "免费版不自动匹配当地标准。请复制提示词查询官方数据，再手动填写封顶线。"}
                    </p>
                    <Button
                      className="mt-3 w-full sm:w-auto"
                      variant="secondary"
                      type="button"
                      onClick={copyStandardQueryPrompt}
                    >
                      <Copy className="size-4" aria-hidden="true" />
                      {promptCopyState === "copied"
                        ? "提示词已复制"
                        : promptCopyState === "failed"
                          ? "复制失败"
                          : "复制官方标准查询提示词"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : null}
        <Field
          label="当地上年度职工月平均工资的 3 倍"
          htmlFor="capMonthlyWage"
          hint={
            edition === "paid"
              ? "完整版会匹配已维护城市标准；未收录时仍须按当地官方数据手动填写。"
              : "免费版不自动填充，请按当地官方数据手动填写。"
          }
          error={errors.capMonthlyWage?.message}
          required
        >
          <Input
            id="capMonthlyWage"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="请输入三倍封顶线"
            {...register("capMonthlyWage", { valueAsNumber: true })}
          />
        </Field>
      </div>
    );
  }

  if (currentStep === 4) {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            离职原因
            <span className="ml-1 text-brand-600">*</span>
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            请按最接近事实发生的解除情形选择。解除主体和证据会直接影响结论。
          </p>
        </div>
        <div className="space-y-2">
          {reasonOrder.map((reason) => {
            const rule = getTerminationRule(reason);
            return (
              <label key={reason} className={optionClass(selectedReason === reason)}>
                <input
                  className="size-4 accent-brand-600"
                  type="radio"
                  value={reason}
                  {...register("terminationReason")}
                />
                <span className="min-w-0 flex-1">{rule.label}</span>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                  {rule.shortLabel}
                </span>
              </label>
            );
          })}
        </div>
        {errors.terminationReason?.message ? (
          <p className="text-sm text-red-600" role="alert">
            {errors.terminationReason.message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">
          公司是否提前 30 日书面通知？
          <span className="ml-1 text-brand-600">*</span>
        </legend>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          仅《劳动合同法》第 40 条三种情形可能影响 +1；违法解除不会叠加 +1。
        </p>
        <Controller
          control={control}
          name="writtenNoticeProvided"
          render={({ field }) => (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className={optionClass(field.value === true)}>
                <input
                  className="size-4 accent-brand-600"
                  type="radio"
                  checked={field.value === true}
                  onChange={() => field.onChange(true)}
                />
                是
              </label>
              <label className={optionClass(field.value === false)}>
                <input
                  className="size-4 accent-brand-600"
                  type="radio"
                  checked={field.value === false}
                  onChange={() => field.onChange(false)}
                />
                否
              </label>
            </div>
          )}
        />
      </fieldset>

      {selectedRule?.isArticle40 && writtenNoticeProvided === false ? (
        <Field
          label="上个月应发工资"
          htmlFor="lastMonthSalary"
          hint="用于计算 +1 代通知金，不是离职前 12 个月平均工资。"
          error={errors.lastMonthSalary?.message}
          required
        >
          <Input
            id="lastMonthSalary"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            placeholder="例如 12000"
            {...register("lastMonthSalary", { valueAsNumber: true })}
          />
        </Field>
      ) : null}

      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">
          是否签订书面劳动合同？
          <span className="ml-1 text-brand-600">*</span>
        </legend>
        <Controller
          control={control}
          name="hasWrittenContract"
          render={({ field }) => (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className={optionClass(field.value === true)}>
                <input
                  className="size-4 accent-brand-600"
                  type="radio"
                  checked={field.value === true}
                  onChange={() => field.onChange(true)}
                />
                是
              </label>
              <label className={optionClass(field.value === false)}>
                <input
                  className="size-4 accent-brand-600"
                  type="radio"
                  checked={field.value === false}
                  onChange={() => field.onChange(false)}
                />
                否
              </label>
            </div>
          )}
        />
      </fieldset>

      {errors.root?.message ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
          {errors.root.message}
        </p>
      ) : null}
    </div>
  );
};
