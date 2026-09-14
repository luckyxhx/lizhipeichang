import { cn } from "@/lib/cn";
import type { WizardStep } from "@/types";

interface StepIndicatorProps {
  currentStep: WizardStep;
}

const steps: Array<{ id: WizardStep; label: string }> = [
  { id: 1, label: "日期" },
  { id: 2, label: "工资" },
  { id: 3, label: "地区" },
  { id: 4, label: "原因" },
  { id: 5, label: "程序" },
];

export const StepIndicator = ({ currentStep }: StepIndicatorProps): JSX.Element => {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div aria-label={`当前第 ${currentStep} 步，共 5 步`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">第 {currentStep} 步 / 共 5 步</p>
        <p className="text-sm font-medium text-brand-700">
          {steps[currentStep - 1]?.label}
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="mt-3 grid grid-cols-5 gap-1">
        {steps.map((step) => (
          <li
            key={step.id}
            className={cn(
              "text-center text-[11px] font-medium",
              step.id === currentStep
                ? "text-brand-700"
                : step.id < currentStep
                  ? "text-slate-600"
                  : "text-slate-400",
            )}
          >
            {step.label}
          </li>
        ))}
      </ol>
    </div>
  );
};
