import { Calculator, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/Button";

interface StepResultProps {
  isSubmitting: boolean;
}

export const StepResult = ({ isSubmitting }: StepResultProps): JSX.Element => (
  <div className="pt-2">
    <Button className="w-full" type="submit" disabled={isSubmitting}>
      <Calculator className="size-5" aria-hidden="true" />
      {isSubmitting ? "正在计算…" : "生成估算报告"}
    </Button>
    <p className="mt-3 flex items-start justify-center gap-2 text-center text-xs leading-5 text-slate-500">
      <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      计算在本地浏览器完成，不要求填写姓名、公司名或手机号。
    </p>
  </div>
);
