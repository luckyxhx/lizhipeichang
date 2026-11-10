/// <reference types="node" />

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { productKitResources } from "@/content/productKit";

const publicDirectory = path.resolve(process.cwd(), "public");

describe("product kit", () => {
  it("提供四项资料且下载信息完整", () => {
    expect(productKitResources).toHaveLength(4);
    expect(new Set(productKitResources.map((resource) => resource.id)).size).toBe(4);

    productKitResources.forEach((resource) => {
      expect(resource.href).toMatch(/^\/(?:app\/)?downloads\/.+\.(docx|pdf)$/);
      expect(resource.downloadName).toMatch(/\.(docx|pdf)$/);
    });
  });

  it("所有资料文件都存在且文件格式正确", () => {
    productKitResources.forEach((resource) => {
      const filePath = path.join(publicDirectory, resource.href.replace(/^\//, ""));
      expect(existsSync(filePath), `${resource.href} 应存在`).toBe(true);

      const file = readFileSync(filePath);
      expect(file.byteLength).toBeGreaterThan(1_000);

      if (resource.href.endsWith(".docx")) {
        expect(file.subarray(0, 2).toString("ascii")).toBe("PK");
      } else {
        expect(file.subarray(0, 4).toString("ascii")).toBe("%PDF");
      }
    });
  });
});
