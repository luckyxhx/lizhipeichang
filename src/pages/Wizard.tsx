import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldPath, type SubmitHandler } from "react-hook-form";

import { StepForm } from "@/components/Wizard/StepForm";
import { StepIndicator } from "@/components/Wizard/StepIndicator";
import { StepResult } from "@/components/Wizard/StepResult";
import { Button } from "@/components/ui/Button";
import { getRegionCap } from "@/data/regions";
import { calculateSeverance } from "@/lib/calc";
import { wizardSchema } from "@/lib/wizardSchema";
import type {
  CalculationInput,
  CalculationResult,
  ProductEdition,
  WizardFormValues,
  WizardStep,
} from "@/types";

interface WizardProps {
  edition: ProductEdition;
  initialValues?: CalculationInput;
  onBackHome: () => void;
  onComplete: (input: CalculationInput, result: CalculationResult) => void;
}

const stepFields: Record<WizardStep, FieldPath<WizardFormValues>[]> = {
  1: ["startDate", "endDate"],
  2: ["totalIncomeLast12Months", "actualMonths"],
  3: ["regionCity", "capMonthlyWage"],
  4: ["terminationReason"],
  5: ["writtenNoticeProvided", "lastMonthSalary", "hasWrittenContract"],
};

export const Wizard = ({
  edition,
  initialValues,
  onBackHome,
  onComplete,
}: WizardProps): JSX.Element => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const previousCity = useRef(initialValues?.regionCity ?? "");
  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    mode: "onTouched",
    defaultValues: initialValues ?? {
      startDate: "",
      endDate: "",
      totalIncomeLast12Months: 0,
      actualMonths: 12,
      regionCity: "",
      capMonthlyWage: 0,
      terminationReason: "economic_layoff",
      writtenNoticeProvided: true,
      lastMonthSalary: 0,
      hasWrittenContract: true,
    },
  });
  const {
    handleSubmit,
    setError,
    setValue,
    trigger,
    watch,
    formState: { isSubmitting },
  } = form;

  const selectedCity = watch("regionCity");

  useEffect(() => {
    const region = getRegionCap(selectedCity);
    if (edition === "paid" && region && selectedCity !== previousCity.current) {
      setValue("capMonthlyWage", region.capMonthlyWage, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    previousCity.current = selectedCity;
  }, [edition, selectedCity, setValue]);

  const goNext = async (): Promise<void> => {
    const valid = await trigger(stepFields[currentStep], {
      shouldFocus: true,
    });
    if (!valid) {
      return;
    }

    setCurrentStep((step) => Math.min(5, step + 1) as WizardStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = (): void => {
    if (currentStep === 1) {
      onBackHome();
      return;
    }

    setCurrentStep((step) => Math.max(1, step - 1) as WizardStep);
  };

  const onSubmit: SubmitHandler<WizardFormValues> = (values) => {
    try {
      const result = calculateSeverance(values);
      onComplete(values, result);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: unknown) {
      setError("root", {
        message: error instanceof Error ? error.message : "计算失败，请检查输入",
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-700"
        onClick={goBack}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {currentStep === 1 ? "返回首页" : "上一步"}
      </button>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
        <div className="mb-5 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <span className="font-semibold text-slate-700">
            {edition === "paid" ? "完整版" : "免费版"}
          </span>
          <span className="text-xs text-slate-500">
            {edition === "paid" ? "包含完整报告与付费材料" : "仅提供核心测算结果"}
          </span>
        </div>
        <StepIndicator currentStep={currentStep} />
        <form className="mt-7" onSubmit={handleSubmit(onSubmit)} noValidate>
          <StepForm edition={edition} form={form} currentStep={currentStep} />
          {currentStep === 5 ? (
            <div className="mt-7">
              <StepResult isSubmitting={isSubmitting} />
            </div>
          ) : (
            <Button className="mt-7 w-full" onClick={goNext}>
              下一步
              <ArrowRight className="size-5" aria-hidden="true" />
            </Button>
          )}
        </form>
      </section>
    </div>
  );
};
