import type { CompensationRule, TerminationReason } from "@/types";

export interface TerminationRule {
  label: string;
  shortLabel: string;
  rule: CompensationRule;
  explanation: string;
  articleIds: number[];
  isArticle40: boolean;
}

export const terminationRules: Record<TerminationReason, TerminationRule> = {
  economic_layoff: {
    label: "经济性裁员",
    shortLabel: "经济性裁员",
    rule: "N",
    explanation:
      "经济性裁员属于《劳动合同法》第 46 条所列经济补偿情形，按第 47 条计算 N。",
    articleIds: [41, 46, 47],
    isArticle40: false,
  },
  mutual_company_proposed: {
    label: "公司提出，协商一致解除",
    shortLabel: "协商一致",
    rule: "N",
    explanation:
      "由用人单位提出并协商一致解除，属于《劳动合同法》第 46 条所列经济补偿情形。",
    articleIds: [36, 46, 47],
    isArticle40: false,
  },
  mutual_employee_proposed: {
    label: "劳动者提出，协商一致解除",
    shortLabel: "劳动者协商",
    rule: "0",
    explanation:
      "按本系统输入规则，劳动者主动提出并协商一致解除时先估算为 0；如实际存在公司过错、欠薪等特殊情形，应另行提供证据复核。",
    articleIds: [36, 46],
    isArticle40: false,
  },
  company_fault: {
    label: "因公司过错，由劳动者解除",
    shortLabel: "公司过错",
    rule: "N",
    explanation:
      "用户选择劳动者因公司过错解除。本系统仅据此先按《劳动合同法》第 46 条经济补偿情形估算，具体是否成立需结合证据复核。",
    articleIds: [38, 46, 47],
    isArticle40: false,
  },
  incompetence: {
    label: "不能胜任工作，培训或调岗后仍不能胜任",
    shortLabel: "不能胜任",
    rule: "N",
    explanation:
      "属于《劳动合同法》第 40 条情形；公司未提前 30 日书面通知时，另计一个月工资作为代通知金。",
    articleIds: [40, 46, 47],
    isArticle40: true,
  },
  medical_expiry: {
    label: "医疗期满不能从事原工作，也不能从事另行安排的工作",
    shortLabel: "医疗期满",
    rule: "N",
    explanation:
      "属于《劳动合同法》第 40 条情形；公司未提前 30 日书面通知时，另计一个月工资作为代通知金。",
    articleIds: [40, 46, 47],
    isArticle40: true,
  },
  objective_change: {
    label: "客观情况重大变化致合同无法履行，协商不成",
    shortLabel: "客观情况变化",
    rule: "N",
    explanation:
      "属于《劳动合同法》第 40 条情形；公司未提前 30 日书面通知时，另计一个月工资作为代通知金。",
    articleIds: [40, 46, 47],
    isArticle40: true,
  },
  illegal_termination: {
    label: "违法解除或违法终止",
    shortLabel: "违法解除",
    rule: "2N",
    explanation:
      "按《劳动合同法》第 87 条，违法解除或违法终止按经济补偿标准的二倍估算。2N 与 +1 的适用前提矛盾，不叠加代通知金。",
    articleIds: [47, 48, 87],
    isArticle40: false,
  },
  voluntary_resignation: {
    label: "劳动者主动辞职",
    shortLabel: "主动辞职",
    rule: "0",
    explanation:
      "按本系统输入规则，劳动者主动提出解除时先估算为 0；如实际存在公司过错等特殊情形，应另行提供证据复核。",
    articleIds: [46],
    isArticle40: false,
  },
  probation_dismissal: {
    label: "试用期内被辞退",
    shortLabel: "试用期被辞退",
    rule: "0",
    explanation:
      "按本系统输入规则，试用期内被辞退先估算为 0；该选项不区分具体解除主体和证据，实际结果必须以解除理由、通知和证据为准。",
    articleIds: [39, 46],
    isArticle40: false,
  },
  serious_misconduct: {
    label: "因严重违反规章制度被解除",
    shortLabel: "严重违纪",
    rule: "0",
    explanation:
      "按本系统输入规则，用人单位依据严重违纪等法定情形解除时先估算为 0；规章制度的合法性、公示送达和举证仍可能影响认定。",
    articleIds: [39, 46],
    isArticle40: false,
  },
};

export interface LegalArticle {
  id: number;
  title: string;
  summary: string;
  source: "《中华人民共和国劳动合同法》";
}

export const legalArticles: Record<number, LegalArticle> = {
  36: {
    id: 36,
    title: "协商一致解除",
    summary: "用人单位与劳动者协商一致，可以解除劳动合同。",
    source: "《中华人民共和国劳动合同法》",
  },
  38: {
    id: 38,
    title: "劳动者因用人单位过错解除",
    summary:
      "劳动者因用人单位过错等法定情形解除劳动合同；是否适用第 46 条经济补偿，需结合具体事实和证据。",
    source: "《中华人民共和国劳动合同法》",
  },
  39: {
    id: 39,
    title: "用人单位单方解除",
    summary: "劳动者存在严重违反规章制度等法定情形时，用人单位可以解除劳动合同。",
    source: "《中华人民共和国劳动合同法》",
  },
  40: {
    id: 40,
    title: "无过失性辞退",
    summary:
      "包含医疗期满不能工作、经培训或调岗后仍不能胜任、客观情况重大变化三种情形；未提前 30 日书面通知时，另有代通知金规则。",
    source: "《中华人民共和国劳动合同法》",
  },
  41: {
    id: 41,
    title: "经济性裁员",
    summary: "用人单位在法定条件下可以裁减人员。",
    source: "《中华人民共和国劳动合同法》",
  },
  46: {
    id: 46,
    title: "经济补偿情形",
    summary:
      "规定用人单位应当向劳动者支付经济补偿的若干情形，包括经济性裁员、用人单位提出协商一致解除等。",
    source: "《中华人民共和国劳动合同法》",
  },
  47: {
    id: 47,
    title: "经济补偿计算",
    summary:
      "按工作年限计算，每满一年支付一个月工资；六个月以上不满一年按一年计算，不满六个月支付半个月工资。月工资高于当地上年度职工月平均工资三倍时，按三倍封顶，补偿年限最高不超过 12 年。",
    source: "《中华人民共和国劳动合同法》",
  },
  48: {
    id: 48,
    title: "违法解除后的选择",
    summary:
      "违法解除时，劳动者可要求继续履行劳动合同；不要求继续履行或已不能继续履行时，可依法主张赔偿金。",
    source: "《中华人民共和国劳动合同法》",
  },
  82: {
    id: 82,
    title: "未签书面劳动合同",
    summary:
      "未依法订立书面劳动合同的二倍工资属于另一项可单独评估的请求，本系统不计入主计算。仲裁时效需要单独判断。",
    source: "《中华人民共和国劳动合同法》",
  },
  87: {
    id: 87,
    title: "违法解除或终止赔偿",
    summary: "用人单位违法解除或终止劳动合同的，按经济补偿标准的二倍支付赔偿金。",
    source: "《中华人民共和国劳动合同法》",
  },
};

export const getTerminationRule = (reason: TerminationReason): TerminationRule =>
  terminationRules[reason];
