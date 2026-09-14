import {
  addMonths,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  isValid,
  parseISO,
} from "date-fns";

import { getTerminationRule } from "@/lib/legalRules";
import type {
  CalculationInput,
  CalculationResult,
  CompensationRule,
  ServicePeriod,
} from "@/types";

const roundMoney = (value: number): number => Math.round(value);

const roundHalf = (value: number): number => Math.round(value * 2) / 2;

const formatMonthPart = (months: number): string => {
  if (months === 0) {
    return "整月";
  }

  return `${months} 个月`;
};

export const calculateServicePeriod = (
  startDateValue: string,
  endDateValue: string,
): ServicePeriod => {
  const startDate = parseISO(startDateValue);
  const endDate = parseISO(endDateValue);

  if (!isValid(startDate) || !isValid(endDate)) {
    throw new Error("入职日期或离职日期格式无效");
  }

  if (endDate <= startDate) {
    throw new Error("离职日期必须晚于入职日期");
  }

  const fullYears = differenceInYearsSafe(startDate, endDate);
  const anniversary = addYears(startDate, fullYears);
  let remainingMonths = differenceInCalendarMonths(endDate, anniversary);
  let monthAnchor = addMonths(anniversary, remainingMonths);

  if (monthAnchor > endDate) {
    remainingMonths -= 1;
    monthAnchor = addMonths(anniversary, remainingMonths);
  }

  const remainingDays = Math.max(0, differenceInCalendarDays(endDate, monthAnchor));
  const totalMonths = fullYears * 12 + remainingMonths;
  const hasCompletedAtLeastOneYear = fullYears > 0;
  const hasRemainder = remainingMonths > 0 || remainingDays > 0;

  let nUnits = fullYears;
  if (hasRemainder) {
    nUnits += remainingMonths >= 6 ? 1 : 0.5;
  } else if (!hasCompletedAtLeastOneYear) {
    // 不足一年且没有完整月份余数时，仅在日期跨度不足 6 个月时按半月计。
    nUnits = totalMonths >= 6 ? 1 : 0.5;
  }

  return {
    fullYears,
    remainingMonths,
    remainingDays,
    totalMonths,
    nUnits: roundHalf(nUnits),
    summary: `${fullYears} 年 ${formatMonthPart(remainingMonths)}${
      remainingDays > 0 ? ` ${remainingDays} 天` : ""
    }`,
  };
};

const differenceInYearsSafe = (startDate: Date, endDate: Date): number => {
  let years = endDate.getFullYear() - startDate.getFullYear();
  const anniversary = addYears(startDate, years);

  if (anniversary > endDate) {
    years -= 1;
  }

  return Math.max(0, years);
};

const buildWarnings = (
  input: CalculationInput,
  rule: CompensationRule,
  isWageCapped: boolean,
  isServiceYearsCapped: boolean,
): string[] => {
  const warnings = [
    "月工资基数按离职前 12 个月平均应得工资估算；奖金、津贴、补贴等是否计入及具体口径，应由专业人员结合工资记录复核。",
    "工作年限、解除主体、书面通知、证据完整性和当地裁审口径都会影响最终结果。",
    "劳动争议申请仲裁的时效期间通常为一年，自知道或者应当知道权利被侵害之日起计算；劳动关系终止后的欠薪等请求也存在一年限制。",
    "与争议事项有关的证据属于用人单位掌握管理的，用人单位应当提供；不提供的，应当承担不利后果。",
    "劳动争议通常由劳动合同履行地或者用人单位所在地的劳动争议仲裁委员会管辖，请尽快保全证据并咨询当地机构或律师。",
  ];

  if (rule === "N+1") {
    warnings.unshift(
      "只有《劳动合同法》第 40 条三种情形且公司未提前 30 日书面通知时，本系统才计入 +1；+1 按你填写的上个月应发工资估算。",
    );
  }

  if (rule === "2N") {
    warnings.unshift(
      "违法解除项下，本系统不叠加 +1。2N 与 +1 的适用前提矛盾，不能简单相加。",
    );
    warnings.push("违法解除时，可选择要求继续履行合同，或依法主张 2N 赔偿金。");
  }

  if (isWageCapped) {
    warnings.unshift(
      "月平均工资超过你填写的当地三倍封顶线，本系统已按封顶线计算，并将补偿年限限制为最高 12 年。",
    );
  } else if (isServiceYearsCapped) {
    warnings.unshift("服务年限超过 12 年且触发工资封顶规则，年限按最高 12 年计入。");
  }

  if (!input.hasWrittenContract) {
    warnings.push(
      "未签书面劳动合同可能涉及二倍工资，但本系统不将其纳入主计算。该项请求及仲裁时效需单独评估。",
    );
  }

  warnings.push(
    "加班费、年终奖、未休年假工资等通常不属于本报告主计算范围，可在证据充分时单独主张。",
  );

  if (input.terminationReason === "company_fault") {
    warnings.push(
      "“因公司过错解除”是否成立，需要核对第 38 条具体情形、解除通知、送达记录和证据，不能仅凭主观陈述。",
    );
  }

  if (
    input.terminationReason === "probation_dismissal" ||
    input.terminationReason === "serious_misconduct"
  ) {
    warnings.push(
      "该项先按 0 估算，不代表解除一定合法。解除理由、规章制度程序、通知送达和举证责任仍需单独复核。",
    );
  }

  return warnings;
};

export const calculateSeverance = (input: CalculationInput): CalculationResult => {
  if (
    !Number.isFinite(input.totalIncomeLast12Months) ||
    input.totalIncomeLast12Months <= 0
  ) {
    throw new Error("离职前收入必须为正数");
  }

  if (
    !Number.isFinite(input.actualMonths) ||
    input.actualMonths < 1 ||
    input.actualMonths > 12
  ) {
    throw new Error("实际月份数必须在 1 到 12 之间");
  }

  if (!Number.isFinite(input.capMonthlyWage) || input.capMonthlyWage <= 0) {
    throw new Error("三倍封顶线必须为正数");
  }

  const terminationRule = getTerminationRule(input.terminationReason);
  const service = calculateServicePeriod(input.startDate, input.endDate);
  const monthlyAverageWage = input.totalIncomeLast12Months / input.actualMonths;
  const isWageCapped = monthlyAverageWage > input.capMonthlyWage;
  const calculatedMonthlyWage = Math.min(monthlyAverageWage, input.capMonthlyWage);

  let rule = terminationRule.rule;
  if (terminationRule.isArticle40 && !input.writtenNoticeProvided) {
    rule = "N+1";
  }

  const isServiceYearsCapped = rule !== "0" && isWageCapped && service.nUnits > 12;
  const nUnitsForCompensation = isServiceYearsCapped ? 12 : service.nUnits;
  const nAmount =
    rule === "0" ? 0 : roundMoney(calculatedMonthlyWage * nUnitsForCompensation);
  const plusOneAmount =
    rule === "N+1" ? roundMoney(Math.max(0, input.lastMonthSalary)) : 0;
  const doubleNBaseAmount =
    rule === "2N" ? roundMoney(calculatedMonthlyWage * nUnitsForCompensation * 2) : 0;
  const exactAmount =
    rule === "N" || rule === "N+1"
      ? nAmount + plusOneAmount
      : rule === "2N"
        ? doubleNBaseAmount
        : 0;
  const estimateMin = exactAmount === 0 ? 0 : roundMoney(exactAmount * 0.8);
  const estimateMax = exactAmount === 0 ? 0 : roundMoney(exactAmount * 1.2);

  const ruleReason =
    rule === "N+1"
      ? `${terminationRule.explanation} 你选择公司未提前 30 日书面通知，因此计入 +1。`
      : terminationRule.explanation;

  const legalConclusion =
    rule === "0"
      ? "按现有输入，本系统暂不计算经济补偿或赔偿金。"
      : `按现有输入，本系统初步适用 ${rule}${
          isServiceYearsCapped ? "（补偿年限受 12 年封顶限制）" : ""
        }。`;

  return {
    rule,
    ruleReason,
    service: {
      ...service,
      nUnits: rule === "0" ? 0 : nUnitsForCompensation,
    },
    monthlyAverageWage: roundMoney(monthlyAverageWage),
    calculatedMonthlyWage: roundMoney(calculatedMonthlyWage),
    capMonthlyWage: roundMoney(input.capMonthlyWage),
    isWageCapped,
    isServiceYearsCapped,
    nAmount,
    plusOneAmount,
    doubleNBaseAmount,
    exactAmount,
    estimateMin,
    estimateMax,
    relevantArticleIds: terminationRule.articleIds,
    warnings: buildWarnings(input, rule, isWageCapped, isServiceYearsCapped),
    legalConclusion,
  };
};
