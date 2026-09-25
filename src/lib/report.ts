import { product } from "@/config/product";
import {
  buildStandardQueryPrompt,
  evidenceChecklist,
  negotiationScript,
} from "@/content/paidMaterials";
import { getRegionCap } from "@/data/regions";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import {
  getOfficialLegalSource,
  getSupportingLegalArticles,
  legalArticles,
  officialLegalSources,
} from "@/lib/legalRules";
import type { CalculationInput, CalculationResult } from "@/types";

const listLine = (items: string[]): string => items.map((item) => `- ${item}`).join("\n");

export const actionChecklist = [
  "保存解除或终止劳动合同通知书，以及签收、邮件、短信或聊天记录。",
  "保存工资流水、工资条、个税记录、社保缴费记录和考勤记录。",
  "整理能证明解除原因的谈话记录、会议通知、工作交接记录或录音。",
  "不要签署空白协议；协议涉及放弃权利时，先让专业人员阅读。",
  "要求公司以书面形式说明解除理由、日期和依据。",
  "在一年仲裁时效内，向劳动合同履行地或用人单位所在地的劳动仲裁机构申请；劳动争议仲裁不收费。",
] as const;

export const buildReportText = (
  input: CalculationInput,
  result: CalculationResult,
): string => {
  const region = getRegionCap(input.regionCity);
  const articleIds = [
    ...new Set([...result.relevantArticleIds, ...(input.hasWrittenContract ? [] : [82])]),
  ];
  const articles = articleIds
    .map((id) => legalArticles[id])
    .filter((article): article is NonNullable<typeof article> => Boolean(article))
    .map(
      (article) =>
        `《劳动合同法》第 ${article.id} 条（${article.title}）：${article.summary}`,
    );
  const supportingArticles = getSupportingLegalArticles(
    result.rule,
    input.terminationReason,
  ).map((article) => {
    const source = getOfficialLegalSource(article.sourceKey);
    return `${source.shortTitle}${article.articleNumber}（${article.title}）：${article.summary}`;
  });
  const officialSources = officialLegalSources.map(
    (source) =>
      `${source.title}（${source.versionNote}，${source.effectiveDate} 施行）：${source.officialUrl}`,
  );

  return [
    `【${product.name}】`,
    "",
    `预估金额区间：${formatCurrency(result.estimateMin)} - ${formatCurrency(
      result.estimateMax,
    )}（基准 ${formatCurrency(result.exactAmount)}，展示区间按基准金额上下浮动 20%）`,
    `适用结论：${result.rule}`,
    `结论理由：${result.ruleReason}`,
    "",
    "【计算明细】",
    `入职日期：${formatDate(input.startDate)}`,
    `离职日期：${formatDate(input.endDate)}`,
    `工作年限：${result.service.summary}，计入 N 的月数：${formatNumber(
      result.service.nUnits,
    )}`,
    `离职前月平均工资：${formatCurrency(result.monthlyAverageWage)}`,
    `计算用月工资：${formatCurrency(result.calculatedMonthlyWage)}`,
    `三倍封顶线：${formatCurrency(result.capMonthlyWage)}`,
    `是否触发工资封顶：${result.isWageCapped ? "是" : "否"}`,
    `N 金额：${formatCurrency(result.nAmount)}`,
    `+1 金额：${formatCurrency(result.plusOneAmount)}`,
    `2N 金额：${formatCurrency(result.doubleNBaseAmount)}`,
    "",
    "【城市标准匹配】",
    region
      ? `${input.regionCity}：三倍封顶线 ${formatCurrency(
          region.capMonthlyWage,
        )}；适用年度 ${region.dataYear}；来源 ${region.source}`
      : `${input.regionCity}：当前未收录可自动匹配的标准，请按官方来源手动核对。`,
    region ? "" : buildStandardQueryPrompt(input.regionCity),
    "",
    "【离职谈判话术卡】",
    listLine([...negotiationScript]),
    "",
    "【仲裁举证清单】",
    listLine([...evidenceChecklist]),
    "",
    "【法律依据】",
    "官方来源：",
    listLine(officialSources),
    "",
    articles.join("\n"),
    supportingArticles.join("\n"),
    "",
    "【风险提示】",
    listLine(result.warnings),
    "",
    "【维权行动清单】",
    listLine([...actionChecklist]),
    "",
    "【免责声明】",
    product.disclaimer,
  ].join("\n");
};

export const buildFreeReportText = (
  input: CalculationInput,
  result: CalculationResult,
): string =>
  [
    `【${product.name} · ${product.editions.free.name}】`,
    "",
    `适用结论：${result.rule}`,
    `预估金额区间：${formatCurrency(result.estimateMin)} - ${formatCurrency(
      result.estimateMax,
    )}`,
    `基准金额：${formatCurrency(result.exactAmount)}`,
    "",
    "【核心计算】",
    `入职日期：${formatDate(input.startDate)}`,
    `离职日期：${formatDate(input.endDate)}`,
    `工作年限：${result.service.summary}`,
    `计入 N 的月数：${formatNumber(result.service.nUnits)}`,
    `月平均工资：${formatCurrency(result.monthlyAverageWage)}`,
    `计算用月工资：${formatCurrency(result.calculatedMonthlyWage)}`,
    `N 金额：${formatCurrency(result.nAmount)}`,
    `+1 金额：${formatCurrency(result.plusOneAmount)}`,
    `2N 金额：${formatCurrency(result.doubleNBaseAmount)}`,
    "",
    "【结论说明】",
    result.ruleReason,
    "",
    `完整版（${product.editions.paid.priceNote}）包含：${product.editions.paid.features.join(
      "、",
    )}。`,
    "",
    "【免责声明】",
    product.disclaimer,
  ].join("\n");
