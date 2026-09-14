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
    title: "未订立书面劳动合同的二倍工资",
    summary:
      "用人单位自用工之日起超过一个月不满一年未与劳动者订立书面劳动合同的，应当向劳动者每月支付二倍工资。该事项属于可单独评估的请求，本系统不计入主计算，仲裁时效需要单独判断。",
    source: "《中华人民共和国劳动合同法》",
  },
  87: {
    id: 87,
    title: "违法解除或终止赔偿",
    summary: "用人单位违法解除或终止劳动合同的，按经济补偿标准的二倍支付赔偿金。",
    source: "《中华人民共和国劳动合同法》",
  },
};

export type OfficialLegalSourceKey =
  "labor-law" | "labor-contract-law" | "labor-dispute-law";

export interface OfficialLegalSource {
  key: OfficialLegalSourceKey;
  title: string;
  shortTitle: string;
  versionNote: string;
  effectiveDate: string;
  officialUrl: string;
}

export const officialLegalSources: OfficialLegalSource[] = [
  {
    key: "labor-law",
    title: "中华人民共和国劳动法",
    shortTitle: "劳动法",
    versionNote: "2018 年修正",
    effectiveDate: "1995-01-01",
    officialUrl: "https://flk.npc.gov.cn/detail?id=ff8080816f135f46016f20f16ee11737",
  },
  {
    key: "labor-contract-law",
    title: "中华人民共和国劳动合同法",
    shortTitle: "劳动合同法",
    versionNote: "2012 年修正",
    effectiveDate: "2013-07-01",
    officialUrl: "https://flk.npc.gov.cn/detail?id=2c909fdd678bf17901678bf74d7106b3",
  },
  {
    key: "labor-dispute-law",
    title: "中华人民共和国劳动争议调解仲裁法",
    shortTitle: "劳动争议调解仲裁法",
    versionNote: "2007 年通过",
    effectiveDate: "2008-05-01",
    officialUrl: "https://flk.npc.gov.cn/detail?id=2c909fdd678bf17901678bf64f28039d",
  },
];

export interface SupportingLegalArticle {
  id: string;
  sourceKey: OfficialLegalSourceKey;
  articleNumber: string;
  title: string;
  summary: string;
  includeForRules?: CompensationRule[];
  includeForReasons?: TerminationReason[];
}

export const supportingLegalArticles: SupportingLegalArticle[] = [
  {
    id: "labor-law-26",
    sourceKey: "labor-law",
    articleNumber: "第二十六条",
    title: "提前三十日书面通知解除",
    summary:
      "医疗期满不能工作、不能胜任且经培训或调岗后仍不能胜任、客观情况重大变化协商不成三种情形下，用人单位可以解除劳动合同，但应当提前三十日以书面形式通知劳动者本人。",
    includeForReasons: ["incompetence", "medical_expiry", "objective_change"],
  },
  {
    id: "labor-law-28",
    sourceKey: "labor-law",
    articleNumber: "第二十八条",
    title: "经济补偿",
    summary:
      "用人单位依据本法第二十四条、第二十六条、第二十七条规定解除劳动合同的，应当依照国家有关规定给予经济补偿。",
    includeForRules: ["N", "N+1"],
  },
  {
    id: "labor-law-32",
    sourceKey: "labor-law",
    articleNumber: "第三十二条",
    title: "劳动者随时通知解除",
    summary:
      "在试用期内，或用人单位以暴力、威胁、非法限制人身自由手段强迫劳动，或未按约定支付劳动报酬、提供劳动条件时，劳动者可以随时通知用人单位解除劳动合同。",
    includeForReasons: ["company_fault"],
  },
  {
    id: "labor-law-44",
    sourceKey: "labor-law",
    articleNumber: "第四十四条",
    title: "加班工资标准",
    summary:
      "安排延长工作时间、休息日工作且不能补休、法定休假日工作的，分别按不低于工资的 150%、200%、300% 支付工资报酬。",
  },
  {
    id: "labor-law-45",
    sourceKey: "labor-law",
    articleNumber: "第四十五条",
    title: "带薪年休假",
    summary: "国家实行带薪年休假制度，劳动者连续工作一年以上的，享受带薪年休假。",
  },
  {
    id: "labor-dispute-law-5",
    sourceKey: "labor-dispute-law",
    articleNumber: "第五条",
    title: "协商、调解、仲裁、诉讼",
    summary:
      "发生劳动争议后，当事人可以协商、申请调解；不愿调解、调解不成或调解协议不履行的，可以申请仲裁；对仲裁裁决不服的，除法律另有规定外，可以依法起诉。",
  },
  {
    id: "labor-dispute-law-6",
    sourceKey: "labor-dispute-law",
    articleNumber: "第六条",
    title: "举证责任",
    summary:
      "当事人对自己提出的主张有责任提供证据。与争议事项有关的证据属于用人单位掌握管理的，用人单位应当提供；不提供的，应当承担不利后果。",
  },
  {
    id: "labor-dispute-law-21",
    sourceKey: "labor-dispute-law",
    articleNumber: "第二十一条",
    title: "仲裁管辖",
    summary:
      "劳动争议由劳动合同履行地或者用人单位所在地的劳动争议仲裁委员会管辖；双方分别申请的，由劳动合同履行地仲裁委员会管辖。",
  },
  {
    id: "labor-dispute-law-27",
    sourceKey: "labor-dispute-law",
    articleNumber: "第二十七条",
    title: "仲裁时效",
    summary:
      "劳动争议申请仲裁的时效期间为一年，自当事人知道或者应当知道其权利被侵害之日起计算；时效存在中断、中止规则。劳动关系存续期间因拖欠劳动报酬发生争议的，有特别规则；劳动关系终止后，一般应自终止之日起一年内提出。",
  },
  {
    id: "labor-dispute-law-53",
    sourceKey: "labor-dispute-law",
    articleNumber: "第五十三条",
    title: "仲裁不收费",
    summary: "劳动争议仲裁不收费，劳动争议仲裁委员会的经费由财政予以保障。",
  },
];

export const getSupportingLegalArticles = (
  rule: CompensationRule,
  reason: TerminationReason,
): SupportingLegalArticle[] =>
  supportingLegalArticles.filter(
    (article) =>
      (!article.includeForRules || article.includeForRules.includes(rule)) &&
      (!article.includeForReasons || article.includeForReasons.includes(reason)),
  );

export const getOfficialLegalSource = (
  key: OfficialLegalSourceKey,
): OfficialLegalSource => {
  const source = officialLegalSources.find((item) => item.key === key);
  if (!source) {
    throw new Error(`Unknown official legal source: ${key}`);
  }

  return source;
};

export const getTerminationRule = (reason: TerminationReason): TerminationRule =>
  terminationRules[reason];
