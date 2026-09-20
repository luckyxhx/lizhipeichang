const regionCaps = [
  {
    city: "北京",
    province: "北京市",
    capMonthlyWage: 47000,
    dataYear: "待补充",
    source: "待补充",
  },
  {
    city: "上海",
    province: "上海市",
    capMonthlyWage: 48000,
    dataYear: "待补充",
    source: "待补充",
  },
  {
    city: "广州",
    province: "广东省",
    capMonthlyWage: 42000,
    dataYear: "待补充",
    source: "待补充",
  },
  {
    city: "深圳",
    province: "广东省",
    capMonthlyWage: 45000,
    dataYear: "待补充",
    source: "待补充",
  },
  {
    city: "杭州",
    province: "浙江省",
    capMonthlyWage: 40000,
    dataYear: "待补充",
    source: "待补充",
  },
  {
    city: "成都",
    province: "四川省",
    capMonthlyWage: 35000,
    dataYear: "待补充",
    source: "待补充",
  },
  {
    city: "武汉",
    province: "湖北省",
    capMonthlyWage: 33000,
    dataYear: "待补充",
    source: "待补充",
  },
  {
    city: "南京",
    province: "江苏省",
    capMonthlyWage: 38000,
    dataYear: "待补充",
    source: "待补充",
  },
  {
    city: "西安",
    province: "陕西省",
    capMonthlyWage: 32000,
    dataYear: "待补充",
    source: "待补充",
  },
  {
    city: "郑州",
    province: "河南省",
    capMonthlyWage: 31000,
    dataYear: "待补充",
    source: "待补充",
  },
];

const getRegionCap = (city) => regionCaps.find((item) => item.city === city);

module.exports = { regionCaps, getRegionCap };
