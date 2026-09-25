import { describe, expect, it } from "vitest";

import { calculateSeverance } from "@/lib/calc";
import { buildFreeReportText, buildReportText } from "@/lib/report";
import type { CalculationInput } from "@/types";

const input: CalculationInput = {
  startDate: "2024-01-01",
  endDate: "2025-01-02",
  totalIncomeLast12Months: 120000,
  actualMonths: 12,
  regionCity: "北京市",
  capMonthlyWage: 47000,
  terminationReason: "economic_layoff",
  writtenNoticeProvided: true,
  lastMonthSalary: 10000,
  hasWrittenContract: true,
};

describe("report editions", () => {
  const result = calculateSeverance(input);

  it("免费版报告只提供核心测算摘要", () => {
    const report = buildFreeReportText(input, result);

    expect(report).toContain("免费版");
    expect(report).toContain("N 金额");
    expect(report).toContain("2N 金额");
    expect(report).not.toContain("【法律依据】");
    expect(report).not.toContain("【离职谈判话术卡】");
  });

  it("完整版报告包含城市匹配、谈判话术和举证清单", () => {
    const report = buildReportText(input, result);

    expect(report).toContain("【城市标准匹配】");
    expect(report).toContain("【离职谈判话术卡】");
    expect(report).toContain("【仲裁举证清单】");
    expect(report).toContain("【法律依据】");
  });
});
