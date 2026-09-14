import { describe, expect, it } from "vitest";

import { calculateServicePeriod, calculateSeverance } from "@/lib/calc";
import type { CalculationInput, CompensationRule, TerminationReason } from "@/types";

const makeInput = (overrides: Partial<CalculationInput> = {}): CalculationInput => ({
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

const expectService = (startDate: string, endDate: string, expectedN: number): void => {
  expect(calculateServicePeriod(startDate, endDate).nUnits).toBe(expectedN);
};

const expectRule = (
  reason: TerminationReason,
  writtenNoticeProvided: boolean,
  expectedRule: CompensationRule,
): void => {
  expect(
    calculateSeverance(
      makeInput({
        terminationReason: reason,
        writtenNoticeProvided,
      }),
    ).rule,
  ).toBe(expectedRule);
};

describe("calculateServicePeriod", () => {
  it("工作 5 个月时 N = 0.5", () => {
    expectService("2024-01-01", "2024-06-01", 0.5);
  });

  it("工作 1 年 1 天时 N = 1.5", () => {
    expectService("2024-01-01", "2025-01-02", 1.5);
  });

  it("工作 2 年 7 个月时 N = 3", () => {
    expectService("2022-01-01", "2024-08-01", 3);
  });

  it("工作恰好 6 个月时按 1 年计算", () => {
    expectService("2024-01-01", "2024-07-01", 1);
  });
});

describe("calculateSeverance", () => {
  it("月工资未超过封顶线时不封顶", () => {
    const result = calculateSeverance(
      makeInput({
        totalIncomeLast12Months: 120000,
        actualMonths: 12,
        capMonthlyWage: 20000,
      }),
    );

    expect(result.monthlyAverageWage).toBe(10000);
    expect(result.calculatedMonthlyWage).toBe(10000);
    expect(result.isWageCapped).toBe(false);
    expect(result.nAmount).toBe(15000);
  });

  it("月工资超过封顶线时按三倍封顶线计算", () => {
    const result = calculateSeverance(
      makeInput({
        totalIncomeLast12Months: 600000,
        actualMonths: 12,
        capMonthlyWage: 30000,
      }),
    );

    expect(result.monthlyAverageWage).toBe(50000);
    expect(result.calculatedMonthlyWage).toBe(30000);
    expect(result.isWageCapped).toBe(true);
    expect(result.nAmount).toBe(45000);
  });

  it("工作 15 年且触发工资封顶时，补偿年限最高为 12 年", () => {
    const result = calculateSeverance(
      makeInput({
        startDate: "2010-01-01",
        endDate: "2025-01-01",
        totalIncomeLast12Months: 600000,
        actualMonths: 12,
        capMonthlyWage: 30000,
      }),
    );

    expect(result.service.nUnits).toBe(12);
    expect(result.isServiceYearsCapped).toBe(true);
    expect(result.nAmount).toBe(360000);
  });

  it("N+1 仅在第三类法定情形且未提前 30 日通知时出现", () => {
    expectRule("incompetence", false, "N+1");
    expectRule("medical_expiry", false, "N+1");
    expectRule("objective_change", false, "N+1");
    expectRule("incompetence", true, "N");
    expectRule("economic_layoff", false, "N");
  });

  it("违法解除输出 2N，且不叠加 +1", () => {
    const result = calculateSeverance(
      makeInput({
        terminationReason: "illegal_termination",
        writtenNoticeProvided: false,
      }),
    );

    expect(result.rule).toBe("2N");
    expect(result.plusOneAmount).toBe(0);
    expect(result.doubleNBaseAmount).toBe(30000);
    expect(result.exactAmount).toBe(30000);
  });

  it("主动辞职输出 N = 0", () => {
    const result = calculateSeverance(
      makeInput({
        terminationReason: "voluntary_resignation",
      }),
    );

    expect(result.rule).toBe("0");
    expect(result.exactAmount).toBe(0);
    expect(result.nAmount).toBe(0);
    expect(result.service.nUnits).toBe(0);
    expect(result.warnings[0]).not.toContain("封顶线");
  });

  it("劳动者提出协商一致解除输出 N = 0", () => {
    const result = calculateSeverance(
      makeInput({
        terminationReason: "mutual_employee_proposed",
      }),
    );

    expect(result.rule).toBe("0");
    expect(result.exactAmount).toBe(0);
  });

  it("不满 12 个月时按实际月份平均工资计算", () => {
    const result = calculateSeverance(
      makeInput({
        startDate: "2024-01-01",
        endDate: "2024-06-01",
        totalIncomeLast12Months: 50000,
        actualMonths: 5,
      }),
    );

    expect(result.monthlyAverageWage).toBe(10000);
    expect(result.nAmount).toBe(5000);
  });
});
