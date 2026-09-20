const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateServicePeriod, calculateSeverance } = require("../utils/calc");
const {
  getOfficialLegalSource,
  getSupportingLegalArticles,
} = require("../utils/legalRules");
const { buildPdfArrayBuffer } = require("../utils/pdf");
const regionTree = require("../data/regions");

const makeInput = (overrides = {}) => ({
  startDate: "2024-01-01",
  endDate: "2025-01-02",
  totalIncomeLast12Months: 120000,
  actualMonths: 12,
  regionCity: "北京",
  capMonthlyWage: 47000,
  terminationReason: "economic_layoff",
  writtenNoticeProvided: true,
  lastMonthSalary: 10000,
  hasWrittenContract: true,
  ...overrides,
});

test("工作 5 个月时 N = 0.5", () => {
  assert.equal(calculateServicePeriod("2024-01-01", "2024-06-01").nUnits, 0.5);
});

test("工作 1 年 1 天时 N = 1.5", () => {
  assert.equal(calculateServicePeriod("2024-01-01", "2025-01-02").nUnits, 1.5);
});

test("工作 2 年 7 个月时 N = 3", () => {
  assert.equal(calculateServicePeriod("2022-01-01", "2024-08-01").nUnits, 3);
});

test("月工资未封顶时按实际平均工资计算", () => {
  const result = calculateSeverance(
    makeInput({
      totalIncomeLast12Months: 120000,
      actualMonths: 12,
      capMonthlyWage: 20000,
    }),
  );
  assert.equal(result.calculatedMonthlyWage, 10000);
  assert.equal(result.nAmount, 15000);
});

test("月工资超过封顶线时按封顶线计算", () => {
  const result = calculateSeverance(
    makeInput({
      totalIncomeLast12Months: 600000,
      capMonthlyWage: 30000,
    }),
  );
  assert.equal(result.calculatedMonthlyWage, 30000);
  assert.equal(result.isWageCapped, true);
});

test("工作 15 年且封顶时补偿年限最高 12 年", () => {
  const result = calculateSeverance(
    makeInput({
      startDate: "2010-01-01",
      endDate: "2025-01-01",
      totalIncomeLast12Months: 600000,
      capMonthlyWage: 30000,
    }),
  );
  assert.equal(result.service.nUnits, 12);
  assert.equal(result.nAmount, 360000);
});

test("N+1 仅在第三类法定情形且未提前通知时出现", () => {
  assert.equal(
    calculateSeverance(
      makeInput({
        terminationReason: "incompetence",
        writtenNoticeProvided: false,
      }),
    ).rule,
    "N+1",
  );
  assert.equal(
    calculateSeverance(
      makeInput({
        terminationReason: "incompetence",
        writtenNoticeProvided: true,
      }),
    ).rule,
    "N",
  );
  assert.equal(
    calculateSeverance(
      makeInput({
        terminationReason: "economic_layoff",
        writtenNoticeProvided: false,
      }),
    ).rule,
    "N",
  );
});

test("违法解除输出 2N 且不叠加 +1", () => {
  const result = calculateSeverance(
    makeInput({
      terminationReason: "illegal_termination",
      writtenNoticeProvided: false,
    }),
  );
  assert.equal(result.rule, "2N");
  assert.equal(result.plusOneAmount, 0);
  assert.equal(result.exactAmount, result.doubleNBaseAmount);
});

test("主动辞职输出 N = 0", () => {
  const result = calculateSeverance(
    makeInput({ terminationReason: "voluntary_resignation" }),
  );
  assert.equal(result.rule, "0");
  assert.equal(result.exactAmount, 0);
  assert.equal(result.service.nUnits, 0);
});

test("不满 12 个月时按实际月份平均工资计算", () => {
  const result = calculateSeverance(
    makeInput({
      startDate: "2024-01-01",
      endDate: "2024-06-01",
      totalIncomeLast12Months: 50000,
      actualMonths: 5,
    }),
  );
  assert.equal(result.monthlyAverageWage, 10000);
  assert.equal(result.nAmount, 5000);
});

test("官方法律来源和仲裁时效条款已接入", () => {
  assert.match(
    getOfficialLegalSource("labor-contract-law").officialUrl,
    /flk\.npc\.gov\.cn/,
  );
  assert.ok(
    getSupportingLegalArticles("N", "economic_layoff").some(
      (article) => article.id === "labor-dispute-law-27",
    ),
  );
});

test("PDF 生成器输出可预览的 PDF 结构", () => {
  const report = [
    "离职赔偿估算报告",
    "适用结论：N+1",
    "预估金额区间：¥100,000 - ¥120,000",
    "风险提示：请保存证据，并在一年仲裁时效内处理。",
  ].join("\n");
  const bytes = buildPdfArrayBuffer(report);
  const text = Buffer.from(bytes).toString("latin1");

  assert.ok(bytes instanceof ArrayBuffer);
  assert.match(text, /^%PDF-1\.4/);
  assert.match(text, /\/Type \/Pages/);
  assert.match(text, /\/BaseFont \/STSong-Light/);
  assert.match(text, /%%EOF$/);
});

test("行政区数据包含省、地市、区县三级节点", () => {
  const cityCount = regionTree.reduce(
    (total, province) => total + province.cities.length,
    0,
  );
  const countyCount = regionTree.reduce(
    (provinceTotal, province) =>
      provinceTotal +
      province.cities.reduce((cityTotal, city) => cityTotal + city.counties.length, 0),
    0,
  );

  assert.equal(regionTree.length, 34);
  assert.equal(cityCount, 344);
  assert.equal(countyCount, 3311);
  assert.ok(regionTree.every((province) => province.cities.length > 0));
});
