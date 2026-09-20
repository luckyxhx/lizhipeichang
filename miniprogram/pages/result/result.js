const {
  getOfficialLegalSource,
  getSupportingLegalArticles,
  legalArticles,
  officialLegalSources,
} = require("../../utils/legalRules");
const { formatCurrency, formatDate, formatNumber } = require("../../utils/format");
const { actionChecklist, buildReportText } = require("../../utils/report");
const { buildPdfArrayBuffer } = require("../../utils/pdf");

Page({
  data: {
    ready: false,
    input: null,
    result: null,
    view: null,
    checklist: actionChecklist,
  },
  onLoad() {
    const calculation = getApp().globalData.calculation;
    if (!calculation) {
      wx.showModal({
        title: "报告不存在",
        content: "请先完成估算表单。",
        showCancel: false,
        success: () => wx.navigateBack(),
      });
      return;
    }

    const { input, result } = calculation;
    const articleIds = Array.from(
      new Set([...result.relevantArticleIds, ...(input.hasWrittenContract ? [] : [82])]),
    );
    const articles = articleIds.map((id) => legalArticles[id]).filter(Boolean);
    const supportingArticles = getSupportingLegalArticles(
      result.rule,
      input.terminationReason,
    ).map((article) => ({
      ...article,
      sourceName: getOfficialLegalSource(article.sourceKey).shortTitle,
    }));

    this.setData({
      ready: true,
      input,
      result,
      view: {
        range: `${formatCurrency(result.estimateMin)} - ${formatCurrency(
          result.estimateMax,
        )}`,
        exactAmount: formatCurrency(result.exactAmount),
        startDate: formatDate(input.startDate),
        endDate: formatDate(input.endDate),
        nUnits: formatNumber(result.service.nUnits),
        monthlyAverageWage: formatCurrency(result.monthlyAverageWage),
        calculatedMonthlyWage: formatCurrency(result.calculatedMonthlyWage),
        capMonthlyWage: formatCurrency(result.capMonthlyWage),
        nAmount: formatCurrency(result.nAmount),
        plusOneAmount: formatCurrency(result.plusOneAmount),
        doubleNBaseAmount: formatCurrency(result.doubleNBaseAmount),
        articles,
        supportingArticles,
        officialLegalSources,
      },
    });
  },
  copyReport() {
    const { input, result } = this.data;
    if (!input || !result) return;
    wx.setClipboardData({
      data: buildReportText(input, result),
      success: () => wx.showToast({ title: "报告已复制", icon: "success" }),
    });
  },
  copySource(event) {
    const url = event.currentTarget.dataset.url;
    wx.setClipboardData({
      data: url,
      success: () => wx.showToast({ title: "官方链接已复制", icon: "success" }),
    });
  },
  downloadPdf() {
    const { input, result } = this.data;
    if (!input || !result) return;

    try {
      const filePath = `${wx.env.USER_DATA_PATH}/离职赔偿估算报告.pdf`;
      const reportText = buildReportText(input, result);
      const pdfBuffer = buildPdfArrayBuffer(reportText);
      wx.getFileSystemManager().writeFileSync(filePath, pdfBuffer);
      wx.openDocument({
        filePath,
        fileType: "pdf",
        showMenu: true,
        fail: () => {
          wx.showToast({ title: "PDF 打开失败，请重试", icon: "none" });
        },
      });
    } catch (error) {
      wx.showToast({ title: "PDF 生成失败，请重试", icon: "none" });
    }
  },
  restart() {
    getApp().globalData.calculation = null;
    wx.redirectTo({ url: "/pages/wizard/wizard" });
  },
  onShareAppMessage() {
    return {
      title: "离职赔偿计算器｜生成第一轮估算报告",
      path: "/pages/index/index",
    };
  },
});
