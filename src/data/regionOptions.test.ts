import { describe, expect, it } from "vitest";

import { getRegionCap } from "@/data/regions";
import { cityOptions, regionOptions } from "@/data/regionOptions";

describe("H5 region options", () => {
  it("包含全国省和地市选项", () => {
    const cityNames = cityOptions.map((item) => item.city);

    expect(regionOptions).toHaveLength(34);
    expect(cityOptions).toHaveLength(344);
    expect(new Set(cityNames).size).toBe(cityNames.length);
  });

  it("完整版已维护标准使用正式城市全称匹配", () => {
    expect(getRegionCap("北京市")?.capMonthlyWage).toBe(47000);
    expect(getRegionCap("北京")).toBeUndefined();
  });
});
