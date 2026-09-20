const formatCurrency = (value) => {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `¥${Math.round(amount).toLocaleString("zh-CN")}`;
};

const formatNumber = (value) => {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  return amount.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
};

const formatDate = (value) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
};

module.exports = { formatCurrency, formatNumber, formatDate };
