import { describe, expect, it } from "vitest";

import {
  getOfficialLegalSource,
  getSupportingLegalArticles,
  officialLegalSources,
} from "@/lib/legalRules";

describe("official legal sources", () => {
  it("包含三部法律的全国人大法规库直达链接", () => {
    expect(officialLegalSources).toHaveLength(3);
    expect(getOfficialLegalSource("labor-law").officialUrl).toBe(
      "https://flk.npc.gov.cn/detail?id=ff8080816f135f46016f20f16ee11737",
    );
    expect(getOfficialLegalSource("labor-contract-law").officialUrl).toBe(
      "https://flk.npc.gov.cn/detail?id=2c909fdd678bf17901678bf74d7106b3",
    );
    expect(getOfficialLegalSource("labor-dispute-law").officialUrl).toBe(
      "https://flk.npc.gov.cn/detail?id=2c909fdd678bf17901678bf64f28039d",
    );
  });

  it("N+1 医疗期满情形包含劳动法和仲裁时效依据", () => {
    const ids = getSupportingLegalArticles("N+1", "medical_expiry").map(
      (article) => article.id,
    );

    expect(ids).toContain("labor-law-26");
    expect(ids).toContain("labor-law-28");
    expect(ids).toContain("labor-dispute-law-27");
  });

  it("主动辞职不展示经济补偿条款", () => {
    const ids = getSupportingLegalArticles("0", "voluntary_resignation").map(
      (article) => article.id,
    );

    expect(ids).not.toContain("labor-law-28");
    expect(ids).toContain("labor-dispute-law-27");
  });
});
