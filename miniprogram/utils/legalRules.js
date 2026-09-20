const terminationRules = {
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
      "按输入规则，劳动者主动提出并协商一致解除时先估算为 0；如存在公司过错等特殊情形，应另行复核。",
    articleIds: [36, 46],
    isArticle40: false,
  },
  company_fault: {
    label: "因公司过错，由劳动者解除",
    shortLabel: "公司过错",
    rule: "N",
    explanation: "按劳动者因公司过错解除先估算为 N，具体是否适用第 46 条需结合证据复核。",
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
      "按输入规则，劳动者主动提出解除时先估算为 0；如实际存在公司过错，应另行提供证据复核。",
    articleIds: [46],
    isArticle40: false,
  },
  probation_dismissal: {
    label: "试用期内被辞退",
    shortLabel: "试用期被辞退",
    rule: "0",
    explanation: "试用期内被辞退先估算为 0，实际结果取决于解除主体、理由和证据。",
    articleIds: [39, 46],
    isArticle40: false,
  },
  serious_misconduct: {
    label: "因严重违反规章制度被解除",
    shortLabel: "严重违纪",
    rule: "0",
    explanation: "按严重违纪解除先估算为 0；规章制度程序、通知送达和举证仍可能影响认定。",
    articleIds: [39, 46],
    isArticle40: false,
  },
};

const legalArticles = {
  36: {
    id: 36,
    title: "协商一致解除",
    summary: "用人单位与劳动者协商一致，可以解除劳动合同。",
  },
  38: {
    id: 38,
    title: "劳动者因用人单位过错解除",
    summary:
      "劳动者因用人单位过错等法定情形解除劳动合同；是否适用第 46 条需结合事实和证据。",
  },
  39: {
    id: 39,
    title: "用人单位单方解除",
    summary: "劳动者存在严重违反规章制度等法定情形时，用人单位可以解除劳动合同。",
  },
  40: {
    id: 40,
    title: "无过失性辞退",
    summary:
      "包含医疗期满不能工作、培训或调岗后仍不能胜任、客观情况重大变化三种情形；未提前 30 日书面通知时另有代通知金规则。",
  },
  41: {
    id: 41,
    title: "经济性裁员",
    summary: "用人单位在法定条件下可以裁减人员。",
  },
  46: {
    id: 46,
    title: "经济补偿情形",
    summary: "规定用人单位应支付经济补偿的若干情形。",
  },
  47: {
    id: 47,
    title: "经济补偿计算",
    summary:
      "每满一年支付一个月工资；六个月以上不满一年按一年计算，不满六个月支付半个月工资。工资超过当地上年度职工月平均工资三倍时封顶，补偿年限最高 12 年。",
  },
  48: {
    id: 48,
    title: "违法解除后的选择",
    summary: "违法解除时，劳动者可要求继续履行合同，或依法主张赔偿金。",
  },
  82: {
    id: 82,
    title: "未订立书面劳动合同的二倍工资",
    summary:
      "用人单位自用工之日起超过一个月不满一年未订立书面劳动合同的，应当每月支付二倍工资。该事项不纳入主计算，仲裁时效需单独判断。",
  },
  87: {
    id: 87,
    title: "违法解除或终止赔偿",
    summary: "用人单位违法解除或终止劳动合同的，按经济补偿标准的二倍支付赔偿金。",
  },
};

const officialLegalSources = [
  {
    key: "labor-law",
    title: "中华人民共和国劳动法",
    shortTitle: "劳动法",
    versionNote: "2018 年修正",
    officialUrl: "https://flk.npc.gov.cn/detail?id=ff8080816f135f46016f20f16ee11737",
  },
  {
    key: "labor-contract-law",
    title: "中华人民共和国劳动合同法",
    shortTitle: "劳动合同法",
    versionNote: "2012 年修正",
    officialUrl: "https://flk.npc.gov.cn/detail?id=2c909fdd678bf17901678bf74d7106b3",
  },
  {
    key: "labor-dispute-law",
    title: "中华人民共和国劳动争议调解仲裁法",
    shortTitle: "劳动争议调解仲裁法",
    versionNote: "2007 年通过",
    officialUrl: "https://flk.npc.gov.cn/detail?id=2c909fdd678bf17901678bf64f28039d",
  },
];

const supportingLegalArticles = [
  {
    id: "labor-law-26",
    sourceKey: "labor-law",
    articleNumber: "第二十六条",
    title: "提前三十日书面通知解除",
    summary:
      "医疗期满不能工作、不能胜任且经培训或调岗后仍不能胜任、客观情况重大变化协商不成时，应提前三十日书面通知。",
    includeForReasons: ["incompetence", "medical_expiry", "objective_change"],
  },
  {
    id: "labor-law-28",
    sourceKey: "labor-law",
    articleNumber: "第二十八条",
    title: "经济补偿",
    summary:
      "用人单位依据第二十四条、第二十六条、第二十七条规定解除劳动合同的，应当依照国家有关规定给予经济补偿。",
    includeForRules: ["N", "N+1"],
  },
  {
    id: "labor-law-32",
    sourceKey: "labor-law",
    articleNumber: "第三十二条",
    title: "劳动者随时通知解除",
    summary:
      "在试用期、用人单位强迫劳动或未按约定支付报酬、提供劳动条件时，劳动者可以随时通知解除。",
    includeForReasons: ["company_fault"],
  },
  {
    id: "labor-law-44",
    sourceKey: "labor-law",
    articleNumber: "第四十四条",
    title: "加班工资标准",
    summary:
      "延长工作时间、休息日工作不能补休、法定休假日工作的，分别按不低于工资 150%、200%、300% 支付。",
  },
  {
    id: "labor-law-45",
    sourceKey: "labor-law",
    articleNumber: "第四十五条",
    title: "带薪年休假",
    summary: "国家实行带薪年休假制度，劳动者连续工作一年以上的享受带薪年休假。",
  },
  {
    id: "labor-dispute-law-5",
    sourceKey: "labor-dispute-law",
    articleNumber: "第五条",
    title: "协商、调解、仲裁、诉讼",
    summary:
      "发生劳动争议后可以协商、申请调解；调解不成或协议不履行的可申请仲裁，对裁决不服的可以依法起诉。",
  },
  {
    id: "labor-dispute-law-6",
    sourceKey: "labor-dispute-law",
    articleNumber: "第六条",
    title: "举证责任",
    summary:
      "与争议事项有关的证据属于用人单位掌握管理的，用人单位应当提供；不提供的应承担不利后果。",
  },
  {
    id: "labor-dispute-law-21",
    sourceKey: "labor-dispute-law",
    articleNumber: "第二十一条",
    title: "仲裁管辖",
    summary:
      "劳动争议由劳动合同履行地或用人单位所在地仲裁委员会管辖；双方分别申请的，由劳动合同履行地管辖。",
  },
  {
    id: "labor-dispute-law-27",
    sourceKey: "labor-dispute-law",
    articleNumber: "第二十七条",
    title: "仲裁时效",
    summary:
      "劳动争议申请仲裁的时效期间为一年，自知道或应当知道权利被侵害之日起计算；存在中断、中止规则。",
  },
  {
    id: "labor-dispute-law-53",
    sourceKey: "labor-dispute-law",
    articleNumber: "第五十三条",
    title: "仲裁不收费",
    summary: "劳动争议仲裁不收费，仲裁委员会经费由财政保障。",
  },
];

const getTerminationRule = (reason) => terminationRules[reason];

const getOfficialLegalSource = (key) =>
  officialLegalSources.find((item) => item.key === key);

const getSupportingLegalArticles = (rule, reason) =>
  supportingLegalArticles.filter(
    (article) =>
      (!article.includeForRules || article.includeForRules.includes(rule)) &&
      (!article.includeForReasons || article.includeForReasons.includes(reason)),
  );

module.exports = {
  terminationRules,
  legalArticles,
  officialLegalSources,
  supportingLegalArticles,
  getTerminationRule,
  getOfficialLegalSource,
  getSupportingLegalArticles,
};
