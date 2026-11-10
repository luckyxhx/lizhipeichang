const downloadBase = `${import.meta.env.BASE_URL.replace(/\/+$/, "")}/downloads`;

export const productKitResources = [
  {
    id: "agreement-checklist",
    title: "离职协议自查表",
    format: "可编辑 Word",
    summary: "逐条核对解除依据、补偿金额、支付安排、社保和权利处分条款。",
    href: `${downloadBase}/agreement-checklist.docx`,
    downloadName: "离职协议与解除协议自查表.docx",
  },
  {
    id: "evidence-checklist",
    title: "证据保存清单",
    format: "可打印 PDF",
    summary: "按 6 类证据整理通知、工资、考勤、绩效、沟通和交接材料。",
    href: `${downloadBase}/evidence-checklist.pdf`,
    downloadName: "离职争议证据保存清单.pdf",
  },
  {
    id: "negotiation-cards",
    title: "离职谈判话术卡",
    format: "可打印 PDF",
    summary: "6 个核对依据、工资基数和协议条款时可直接改写的表达。",
    href: `${downloadBase}/negotiation-cards.pdf`,
    downloadName: "离职谈判话术卡.pdf",
  },
  {
    id: "process-timeline",
    title: "离职流程时间轴",
    format: "一页纸 PDF",
    summary: "从收到通知、保存证据、协议自查到仲裁时效的行动顺序。",
    href: `${downloadBase}/process-timeline.pdf`,
    downloadName: "离职流程时间轴.pdf",
  },
] as const;

export type ProductKitResource = (typeof productKitResources)[number];
export type ProductKitResourceId = ProductKitResource["id"];
