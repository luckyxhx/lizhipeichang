const { product } = require("../../config/product");

Page({
  data: {
    product,
    features: [
      {
        title: "本地计算",
        description: "输入信息只在当前微信小程序中参与计算，不上传到服务器。",
      },
      {
        title: "规则透明",
        description: "报告展示 N、N+1、2N 的适用理由和计算明细。",
      },
      {
        title: "无需隐私",
        description: "不要求填写姓名、公司名、手机号或身份证号。",
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
