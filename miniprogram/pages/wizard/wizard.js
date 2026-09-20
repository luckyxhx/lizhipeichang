const { getRegionCap, regionCaps } = require("../../data/regions");
const { calculateSeverance } = require("../../utils/calc");
const { getTerminationRule, terminationRules } = require("../../utils/legalRules");

const reasonOrder = [
  "economic_layoff",
  "mutual_company_proposed",
  "mutual_employee_proposed",
  "company_fault",
  "incompetence",
  "medical_expiry",
  "objective_change",
  "illegal_termination",
  "voluntary_resignation",
  "probation_dismissal",
  "serious_misconduct",
];

Page({
  data: {
    step: 1,
    steps: ["日期", "工资", "地区", "原因", "程序"],
    progress: 0,
    error: "",
    regionNames: regionCaps.map((item) => item.city),
    reasonOptions: reasonOrder.map((value) => ({
      value,
      ...terminationRules[value],
    })),
    selectedRule: terminationRules.economic_layoff,
    form: {
      startDate: "",
      endDate: "",
      totalIncomeLast12Months: "",
      actualMonths: "12",
      regionCity: "",
      capMonthlyWage: "",
      terminationReason: "economic_layoff",
      writtenNoticeProvided: true,
      lastMonthSalary: "",
      hasWrittenContract: true,
    },
  },
  onStartDateChange(event) {
    this.setField("startDate", event.detail.value);
  },
  onEndDateChange(event) {
    this.setField("endDate", event.detail.value);
  },
  onIncomeInput(event) {
    this.setField("totalIncomeLast12Months", event.detail.value);
  },
  onMonthsInput(event) {
    this.setField("actualMonths", event.detail.value);
  },
  onRegionChange(event) {
    const index = Number(event.detail.value);
    const region = regionCaps[index];
    if (!region) return;
    this.setData({
      "form.regionCity": region.city,
      "form.capMonthlyWage": String(region.capMonthlyWage),
      error: "",
    });
  },
  onCapInput(event) {
    this.setField("capMonthlyWage", event.detail.value);
  },
  onReasonChange(event) {
    const reason = event.detail.value;
    this.setData({
      "form.terminationReason": reason,
      selectedRule: getTerminationRule(reason),
      error: "",
    });
  },
  onNoticeChange(event) {
    this.setField("writtenNoticeProvided", event.detail.value === "yes");
  },
  onLastMonthSalaryInput(event) {
    this.setField("lastMonthSalary", event.detail.value);
  },
  onContractChange(event) {
    this.setField("hasWrittenContract", event.detail.value === "yes");
  },
  setField(field, value) {
    this.setData({ [`form.${field}`]: value, error: "" });
  },
  previous() {
    if (this.data.step === 1) {
      wx.navigateBack();
      return;
    }
    this.changeStep(this.data.step - 1);
  },
  next() {
    const error = this.validateStep(this.data.step);
    if (error) {
      this.setData({ error });
      wx.showToast({ title: error, icon: "none" });
      return;
    }
    if (this.data.step < 5) {
      this.changeStep(this.data.step + 1);
      return;
    }
    this.submit();
  },
  changeStep(step) {
    this.setData({
      step,
      progress: ((step - 1) / 4) * 100,
      error: "",
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },
  validateStep(step) {
    const form = this.data.form;
    if (step === 1) {
      if (!form.startDate) return "请选择入职日期";
      if (!form.endDate) return "请选择离职日期";
      if (form.endDate <= form.startDate) return "离职日期必须晚于入职日期";
    }
    if (step === 2) {
      const income = Number(form.totalIncomeLast12Months);
      const months = Number(form.actualMonths);
      if (!Number.isFinite(income) || income <= 0) return "请输入正确的收入";
      if (!Number.isFinite(months) || months < 1 || months > 12) {
        return "月份数必须在 1 到 12 之间";
      }
    }
    if (step === 3) {
      if (!form.regionCity) return "请选择劳动合同履行地";
      const cap = Number(form.capMonthlyWage);
      if (!Number.isFinite(cap) || cap <= 0) return "请输入正确的封顶线";
    }
    if (step === 4 && !form.terminationReason) {
      return "请选择离职原因";
    }
    if (step === 5) {
      if (
        this.data.selectedRule.isArticle40 &&
        !form.writtenNoticeProvided &&
        (!Number.isFinite(Number(form.lastMonthSalary)) ||
          Number(form.lastMonthSalary) <= 0)
      ) {
        return "请填写上个月应发工资";
      }
    }
    return "";
  },
  submit() {
    const form = this.data.form;
    const input = {
      ...form,
      totalIncomeLast12Months: Number(form.totalIncomeLast12Months),
      actualMonths: Number(form.actualMonths),
      capMonthlyWage: Number(form.capMonthlyWage),
      lastMonthSalary: Number(form.lastMonthSalary || 0),
    };

    try {
      const result = calculateSeverance(input);
      getApp().globalData.calculation = { input, result };
      wx.navigateTo({ url: "/pages/result/result" });
    } catch (error) {
      const message = error.message || "计算失败，请检查输入";
      this.setData({ error: message });
      wx.showToast({ title: message, icon: "none" });
    }
  },
});
