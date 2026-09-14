import { isValid, parseISO } from "date-fns";
import { z } from "zod";

import { getTerminationRule } from "@/lib/legalRules";
import { terminationReasons } from "@/types";

const requiredDate = (label: string) =>
  z
    .string()
    .min(1, `请选择${label}`)
    .refine((value) => isValid(parseISO(value)), `${label}格式无效`);

export const wizardSchema = z
  .object({
    startDate: requiredDate("入职日期"),
    endDate: requiredDate("离职日期"),
    totalIncomeLast12Months: z
      .number({ invalid_type_error: "请输入离职前总收入" })
      .positive("离职前总收入必须大于 0"),
    actualMonths: z
      .number({ invalid_type_error: "请输入实际月份数" })
      .min(1, "实际月份数不能少于 1")
      .max(12, "实际月份数不能超过 12"),
    regionCity: z.string().min(1, "请选择劳动合同履行地"),
    capMonthlyWage: z
      .number({ invalid_type_error: "请输入三倍封顶线" })
      .positive("三倍封顶线必须大于 0"),
    terminationReason: z.enum(terminationReasons, {
      errorMap: () => ({ message: "请选择离职原因" }),
    }),
    writtenNoticeProvided: z.boolean(),
    lastMonthSalary: z.number({ invalid_type_error: "请输入上个月应发工资" }),
    hasWrittenContract: z.boolean(),
  })
  .superRefine((values, context) => {
    const startDate = parseISO(values.startDate);
    const endDate = parseISO(values.endDate);

    if (isValid(startDate) && isValid(endDate) && endDate <= startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "离职日期必须晚于入职日期",
      });
    }

    const selectedRule = getTerminationRule(values.terminationReason);
    if (
      selectedRule.isArticle40 &&
      !values.writtenNoticeProvided &&
      (!Number.isFinite(values.lastMonthSalary) || values.lastMonthSalary <= 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lastMonthSalary"],
        message: "计入 +1 时需要填写上个月应发工资",
      });
    }
  });

export type WizardSchemaValues = z.infer<typeof wizardSchema>;
