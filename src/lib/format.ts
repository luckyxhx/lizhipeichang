import { format, parseISO } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("zh-CN", {
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0);

export const formatNumber = (value: number): string =>
  numberFormatter.format(Number.isFinite(value) ? value : 0);

export const formatDate = (value: string): string => {
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? value : format(date, "yyyy 年 M 月 d 日");
};

export const formatMonthCount = (value: number): string =>
  Number.isInteger(value) ? `${value} 个月` : `${value.toFixed(1)} 个月`;
