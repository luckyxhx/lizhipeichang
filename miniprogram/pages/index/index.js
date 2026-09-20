const { product } = require("../../config/product");

Page({
  data: {
    product,
    features: [
      {
        title: "本地计算",
        description: "表单内容在当前微信小程序中计算，不上传到服务器。",
      },
      {
        title: "结论可核对",
        description: "报告列出 N、N+1、2N 的适用理由和金额拆解。",
      },
      {
        title: "不收集身份信息",
        description: "不需要姓名、公司名、手机号或身份证号。",
      },
    ],
  },
  start() {
    wx.navigateTo({ url: "/pages/wizard/wizard" });
  },
  onShareAppMessage() {
    return {
      title: "离职赔偿计算器｜N、N+1、2N 第一轮估算",
      path: "/pages/index/index",
    };
  },
});
