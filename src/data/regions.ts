import type { RegionCap } from "@/types";

/**
 * TODO: 替换为各地人社、统计部门公布的最新官方数据，并记录准确年份和原始链接。
 * 当前数值仅用于产品演示，不能作为正式法律或财务依据。
 */
export const regionCaps: RegionCap[] = [
  {
    city: "北京市",
    province: "北京市",
    capMonthlyWage: 47000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
  {
    city: "上海市",
    province: "上海市",
    capMonthlyWage: 48000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
  {
    city: "广州市",
    province: "广东省",
    capMonthlyWage: 42000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
  {
    city: "深圳市",
    province: "广东省",
    capMonthlyWage: 45000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
  {
    city: "杭州市",
    province: "浙江省",
    capMonthlyWage: 40000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
  {
    city: "成都市",
    province: "四川省",
    capMonthlyWage: 35000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
  {
    city: "武汉市",
    province: "湖北省",
    capMonthlyWage: 33000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
  {
    city: "南京市",
    province: "江苏省",
    capMonthlyWage: 38000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
  {
    city: "西安市",
    province: "陕西省",
    capMonthlyWage: 32000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
  {
    city: "郑州市",
    province: "河南省",
    capMonthlyWage: 31000,
    dataYear: "示例数据，年份待补充",
    source: "来源待补充",
  },
];

export const getRegionCap = (city: string): RegionCap | undefined =>
  regionCaps.find((region) => region.city === city);
