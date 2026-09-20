const { getTerminationRule } = require("./legalRules");

const parseDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
};

const daysInMonth = (year, monthIndex) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const addYears = (date, years) => {
  const year = date.getUTCFullYear() + years;
  const month = date.getUTCMonth();
  const day = Math.min(date.getUTCDate(), daysInMonth(year, month));
  return new Date(Date.UTC(year, month, day));
};

const addMonths = (date, months) => {
  const targetIndex = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(targetIndex / 12);
  const month = ((targetIndex % 12) + 12) % 12;
  const day = Math.min(date.getUTCDate(), daysInMonth(year, month));
  return new Date(Date.UTC(year, month, day));
};

const differenceInYears = (start, end) => {
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  if (addYears(start, years) > end) years -= 1;
  return Math.max(0, years);
};

const differenceInMonths = (start, end) =>
  (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
  end.getUTCMonth() -
  start.getUTCMonth();

const differenceInDays = (start, end) =>
  Math.round((end.getTime() - start.getTime()) / 86400000);

const roundMoney = (value) => Math.round(value);
const roundHalf = (value) => Math.round(value * 2) / 2;

const calculateServicePeriod = (startValue, endValue) => {
  const start = parseDate(startValue);
  const end = parseDate(endValue);
  if (!start || !end) throw new Error("日期格式无效");
  if (end <= start) throw new Error("离职日期必须晚于入职日期");

  const fullYears = differenceInYears(start, end);
  const anniversary = addYears(start, fullYears);
  let remainingMonths = differenceInMonths(anniversary, end);
  let monthAnchor = addMonths(anniversary, remainingMonths);
  if (monthAnchor > end) {
    remainingMonths -= 1;
    monthAnchor = addMonths(anniversary, remainingMonths);
  }
  const remainingDays = Math.max(0, differenceInDays(monthAnchor, end));
  const totalMonths = fullYears * 12 + remainingMonths;
  const hasRemainder = remainingMonths > 0 || remainingDays > 0;
  let nUnits = fullYears;
  if (hasRemainder) {
    nUnits += remainingMonths >= 6 ? 1 : 0.5;
  } else if (fullYears === 0) {
    nUnits = totalMonths >= 6 ? 1 : 0.5;
  }

  return {
    fullYears,
    remainingMonths,
    remainingDays,
    totalMonths,
    nUnits: roundHalf(nUnits),
    summary: `${fullYears} 年 ${remainingMonths} 个月${
      remainingDays > 0 ? ` ${remainingDays} 天` : ""
    }`,
  };
};

const buildWarnings = (input, rule, isWageCapped, isServiceYearsCapped) => {
  const warnings = [
    "月工资基数按离职前 12 个月平均应得工资估算；奖金、津贴、补贴等口径应结合工资记录复核。",
    "工作年限、解除主体、书面通知、证据完整性和当地裁审口径都会影响最终结果。",
    "劳动争议申请仲裁的时效期间通常为一年，自知道或应当知道权利被侵害之日起计算。",
    "与争议事项有关的证据属于用人单位掌握管理的，用人单位应当提供；不提供的应承担不利后果。",
    "劳动争议通常由劳动合同履行地或用人单位所在地仲裁委员会管辖。",
  ];

  if (rule === "N+1") {
    warnings.unshift(
      "只有《劳动合同法》第 40 条三种情形且公司未提前 30 日书面通知时，才计入 +1；+1 按上个月应发工资估算。",
    );
  }
  if (rule === "2N") {
    warnings.unshift("违法解除不叠加 +1，2N 与 +1 的适用前提矛盾。");
    warnings.push("违法解除时，可选择要求继续履行合同，或依法主张 2N 赔偿金。");
  }
  if (isWageCapped) {
    warnings.unshift(
      "月平均工资超过当地三倍封顶线，本系统已按封顶线计算，并将补偿年限限制为最高 12 年。",
    );
  } else if (isServiceYearsCapped) {
    warnings.unshift("服务年限超过 12 年且触发工资封顶规则，年限按最高 12 年计入。");
  }
  if (!input.hasWrittenContract) {
    warnings.push(
      "未签书面劳动合同可能涉及二倍工资，但不纳入主计算，仲裁时效需单独评估。",
    );
  }
  warnings.push(
    "加班费、年终奖、未休年假工资等通常不属于本报告主计算范围，可在证据充分时单独主张。",
  );
  return warnings;
};

const calculateSeverance = (input) => {
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
  const nUnits = isServiceYearsCapped ? 12 : service.nUnits;
  const nAmount = rule === "0" ? 0 : roundMoney(calculatedMonthlyWage * nUnits);
  const plusOneAmount =
    rule === "N+1" ? roundMoney(Math.max(0, input.lastMonthSalary)) : 0;
  const doubleNBaseAmount =
    rule === "2N" ? roundMoney(calculatedMonthlyWage * nUnits * 2) : 0;
  const exactAmount =
    rule === "N" || rule === "N+1"
      ? nAmount + plusOneAmount
      : rule === "2N"
        ? doubleNBaseAmount
        : 0;

  return {
    rule,
    ruleReason:
      rule === "N+1"
        ? `${terminationRule.explanation} 你选择公司未提前 30 日书面通知，因此计入 +1。`
        : terminationRule.explanation,
    legalConclusion:
      rule === "0"
        ? "按现有输入，本系统暂不计算经济补偿或赔偿金。"
        : `按现有输入，本系统初步适用 ${rule}${
            isServiceYearsCapped ? "（补偿年限受 12 年封顶限制）" : ""
          }。`,
    service: { ...service, nUnits: rule === "0" ? 0 : nUnits },
    monthlyAverageWage: roundMoney(monthlyAverageWage),
    calculatedMonthlyWage: roundMoney(calculatedMonthlyWage),
    capMonthlyWage: roundMoney(input.capMonthlyWage),
    isWageCapped,
    isServiceYearsCapped,
    nAmount,
    plusOneAmount,
    doubleNBaseAmount,
    exactAmount,
    estimateMin: exactAmount === 0 ? 0 : roundMoney(exactAmount * 0.8),
    estimateMax: exactAmount === 0 ? 0 : roundMoney(exactAmount * 1.2),
    relevantArticleIds: terminationRule.articleIds,
    warnings: buildWarnings(input, rule, isWageCapped, isServiceYearsCapped),
  };
};

module.exports = { calculateServicePeriod, calculateSeverance };
