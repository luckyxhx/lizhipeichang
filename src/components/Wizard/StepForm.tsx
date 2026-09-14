import { Controller, type UseFormReturn } from "react-hook-form";
import { Search } from "lucide-react";

import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { regionCaps } from "@/data/regions";
import { getTerminationRule } from "@/lib/legalRules";
import { cn } from "@/lib/cn";
import type { TerminationReason, WizardFormValues, WizardStep } from "@/types";

interface StepFormProps {
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

export const StepForm = ({ form, currentStep }: StepFormProps): JSX.Element => {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = form;
  const selectedReason = watch("terminationReason");
  const selectedRule = selectedReason ? getTerminationRule(selectedReason) : undefined;
  const writtenNoticeProvided = watch("writtenNoticeProvided");
  const selectedRegion = regionCaps.find((region) => region.city === watch("regionCity"));

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
              {regionCaps.map((region) => (
                <option key={region.city} value={region.city}>
                  {region.city}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field
          label="当地上年度职工月平均工资的 3 倍"
          htmlFor="capMonthlyWage"
          hint="选择城市后会带出示例值；你可以在获取官方数据后手动覆盖。"
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
        {selectedRegion ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <p className="font-semibold">{selectedRegion.city} · 示例数据</p>
            <p className="mt-1">
              {selectedRegion.dataYear}；{selectedRegion.source}
              。正式使用前必须用官方最新数据复核。
            </p>
          </div>
        ) : null}
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
