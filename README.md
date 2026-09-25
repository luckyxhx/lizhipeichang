# 离职赔偿计算系统

移动端优先的纯前端 H5 工具。用户通过五步问答录入日期、工资、地区和解除情形，系统在浏览器本地生成测算结果。H5 分为免费版和 9.9 元完整版，两版共用同一套计算规则。

## 技术栈

- Vite + React 18 + TypeScript 严格模式
- Tailwind CSS
- react-hook-form + zod
- date-fns
- Vitest
- 原生 `window.print()` 打印方案

项目没有后端和数据库，不要求用户填写姓名、公司名、手机号或身份证号。

## 本地运行

要求 Node.js 18 或更高版本，推荐 Node.js 20。

```bash
npm install
copy .env.example .env.local
npm run dev
```

启动后访问终端显示的本地地址，并附上访问 token，例如：

```text
http://localhost:5173/?token=abc123
```

常用命令：

```bash
npm test
npm run wechat:test
npm run lint
npm run format:check
npm run build
npm run preview
```

## 微信小程序版本

仓库内包含原生微信小程序版本，目录为：

```text
miniprogram/
```

目录结构：

- `pages/index/`：产品首页
- `pages/wizard/`：五步问答表单
- `pages/result/`：估算报告、法条摘要、风险提示和行动清单
- `utils/calc.js`：无第三方依赖的小程序计算引擎
- `utils/legalRules.js`：法律来源、条款摘要和适用规则
- `utils/pdf.js`：在本地生成 A4 分页 PDF，不依赖服务端
- `config/product.js`：产品名、内部定价、客服方式和免责声明
- `data/regions.js`：全国省、地市、区县三级行政区划数据

运行小程序端核心测试：

```bash
npm run wechat:test
```

使用微信开发者工具导入：

1. 打开微信开发者工具。
2. 选择“导入项目”。
3. 项目目录选择 `D:\gongchang\lizhipeichang\miniprogram`。
4. `project.config.json` 已填写当前开发 AppID；如果换成其他主体，请替换为对应 AppID。
5. 正式发布前，在微信公众平台补齐服务类目、隐私保护指引和小程序备案。

小程序端与 H5 的差异：

- 小程序本地计算，不依赖 Vercel 域名。
- 小程序内部定价为 `9.9 元`，但页面不展示价格；实际支付和交付流程仍由店铺侧完成。
- 劳动合同履行地按省、地市、区县三级选择。三倍封顶线不预填，由用户按当地官方数据填写。
- 可复制“当地标准查询提示词”到可用的大模型工具，查询当地人社、统计或法院口径。
- 可在本地生成 PDF 报告，再通过系统文档查看器打开、转发或按系统能力保存。
- 法律官方链接以“点击复制链接”方式提供；如需直接打开，需要在小程序后台配置业务域名。
- PDF 文件保存在 `wx.env.USER_DATA_PATH`，通过 `wx.openDocument` 打开。不同手机系统的保存位置和分享菜单可能不同。

小程序界面设计系统保存在 `design-system/default/MASTER.md`。实际样式 token 位于
`miniprogram/app.wxss`，主色为深青，CTA 使用高对比橙色，警告和错误使用独立语义色。
页面改动集中在三个阶段：首页信息结构、五步表单交互、结果报告阅读路径。

## 访问控制

在 `.env.local` 或部署平台的环境变量中配置：

```env
VITE_ALLOWED_TOKENS=free123,free456
VITE_PAID_TOKENS=paid123,paid456
```

规则：

- 多个 token 用英文逗号分隔。
- 访问链接必须带 `?token=...`。
- `VITE_ALLOWED_TOKENS` 中的 token 进入免费版。
- `VITE_PAID_TOKENS` 中的 token 进入完整版；完整版 token 优先于免费版 token。
- token 不匹配、缺失或环境变量为空时，显示购买提示页。
- 修改 token 后需要重新构建和部署，才能让新列表生效。

生成随机 token 的 PowerShell 示例：

```powershell
[System.BitConverter]::ToString(
  [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(16)
).Replace("-", "").ToLower()
```

生成后分别拼接链接：

```text
https://你的域名/?token=免费版token
https://你的域名/?token=完整版token
```

## H5 两个版本

### 免费版

- 完成日期、工资、地区和解除情形输入。
- 计算 N、N+1、2N 或 0 的估算金额。
- 展示核心计算项和结论说明。
- 支持打印或保存“简版测算卡”。
- 不自动匹配社平工资，城市封顶线由用户手动填写。

免费版通过 `VITE_ALLOWED_TOKENS` 中的专属 token 访问，可配合公众号关注后自动回复链接。

### 完整版（9.9 元）

- 包含免费版的全部计算能力。
- 生成《赔偿测算报告》完整 PDF，可打印保存。
- 全国省、地市城市选择；在地区步骤中即时显示匹配结果，并自动带出已维护城市的三倍封顶线。
- 未收录城市不会使用邻近城市估价，而是提示查询官方来源。
- 附带《离职谈判话术卡》和《仲裁举证清单》。
- 通过 `VITE_PAID_TOKENS` 中的专属 token 访问。

当前自动匹配数据只包含 `src/data/regions.ts` 中的人工维护条目。北京、上海、广州、深圳、杭州、成都、武汉、南京、西安、郑州当前仍是示例值，不能作为正式法律或财务依据。要实现全国城市准确匹配，必须继续录入当地官方来源、适用年度和三倍封顶线。

### 安全边界

当前方案是前端 token 校验，只能拦截普通用户误访问，不能阻止技术人员查看打包后的 JavaScript。不要把它理解为强授权系统。

如果后续需要更强控制，建议升级为 Cloudflare Worker + KV：

1. 请求先到 Worker。
2. Worker 从 URL 读取 token，并在 KV 中检查有效性、有效期和是否已撤销。
3. 校验通过后写入短期签名 Cookie，再返回静态页面。
4. 前端不再保存 token 列表，可按订单生成、撤销和统计访问。

## 部署

### Vercel

1. 将项目推送到 GitHub、GitLab 或 Bitbucket。
2. 在 Vercel 中导入仓库。
3. Framework Preset 选择 `Vite`。
4. Build Command 使用 `npm run build`。
5. Output Directory 使用 `dist`。
6. 在 Project Settings 的 Environment Variables 中添加 `VITE_ALLOWED_TOKENS` 和 `VITE_PAID_TOKENS`。
7. 部署后分别验证免费版和完整版 token。

### Cloudflare Pages

1. 在 Cloudflare Pages 中连接代码仓库。
2. Build command 使用 `npm run build`。
3. Build output directory 使用 `dist`。
4. 在环境变量中添加 `VITE_ALLOWED_TOKENS` 和 `VITE_PAID_TOKENS`。
5. 重新部署后验证带 token 和不带 token 两种访问情况。

项目没有前端路由和重写规则，因此不需要额外的 `_redirects` 或 SPA fallback 配置。

## 修改产品信息

编辑 `src/config/product.ts`：

- 产品名、客服方式
- 购买提示
- 小红书店铺链接
- 免责声明全文

发布前至少替换客服方式和小红书店铺链接。

## 新增或更新城市

### H5 城市与封顶线

`src/data/regionOptions.json` 包含全国省和地市选择列表，由现有行政区数据生成。免费版允许选择城市但要求手动填写；完整版会从 `src/data/regions.ts` 查找已维护的封顶线。

编辑 `src/data/regions.ts`，按现有结构增加或更新城市标准：

```ts
{
  city: "城市名",
  province: "省或直辖市",
  capMonthlyWage: 48000,
  dataYear: "2025",
  source: "当地人社或统计部门官方链接"
}
```

`capMonthlyWage` 表示“当地上年度职工月平均工资的 3 倍”。完整版用户选择已收录城市后会自动带出该值，也可以手动覆盖；免费版只提供手动输入。

当前内置的北京、上海、广州、深圳、杭州、成都、武汉、南京、西安、郑州金额均为产品演示占位值，年份和来源没有核实，不能直接用于正式交付。上线前必须逐项替换为官方最新数据。

### 小程序行政区划

`miniprogram/data/regions.js` 由 MIT 许可的
[`province-city-china@8.5.8`](https://github.com/uiwjs/province-city-china) 生成，当前包含：

- 34 个省级节点
- 344 个地市节点
- 3311 个区县节点

数据文件只保留 `code`、`name`、`cities`、`counties` 字段。行政区划变化时，应使用新版本
`province-city-china` 的 `dist/level.min.json` 重新生成同样结构，并复核：

- 省级、地市和区县节点数量
- 直辖市、港澳台和自治区直辖县级行政区的特殊结构
- 小程序主包体积是否仍低于平台限制

小程序不会内置当地社平工资或三倍封顶线。这样避免展示过期金额，也避免把示例数据误当成法律结论。

### 查询当地标准

用户选完省、地市、区县后，小程序会生成并复制下面的提示词：

```text
请查询{地区全路径}最近一个已公布年度的“当地上年度职工月平均工资”，并计算其三倍封顶线。请注明统计口径、适用年度、发布机关和官方来源链接；如当地对经济补偿封顶另有明确裁审口径，请一并列出。只引用政府、人社局、统计局、法院等官方来源；没有查到就明确说明，不要估算。
```

小程序没有后端，也不会替用户调用大模型 API。用户需要把剪贴板中的提示词粘贴到可用的大模型工具，核对官方来源后，再把三倍封顶线填回表单。

### 小程序购买与 9.9 元定价

`miniprogram/config/product.js` 中的 `purchasePrice` 仅作为订单侧内部定价，当前不会在页面展示。实际让用户在微信内支付 9.9 元，需要：

1. 申请并配置微信支付商户号。
2. 使用云函数或可信服务端创建订单、生成支付参数并校验支付回调。
3. 支付成功后再发放报告权限，不能只依赖前端传回的“已支付”状态。
4. 按微信平台规则确认虚拟商品和当前主体是否允许接入对应支付能力。

在这些条件完成前，页面只保留“开始估算”，不展示价格，也不伪造支付成功状态。

### 小程序 PDF

`miniprogram/utils/pdf.js` 把报告文本转换为 A4 PDF 字节流，`pages/result/result.js` 将文件写入本地用户目录并调用 `wx.openDocument`。PDF 生成不依赖后端。

当前 PDF 使用系统标准中文字体 `STSong-Light`，未内嵌字体。发布前应在微信开发者工具和至少一台 iPhone、一台 Android 真机上验证中文显示和打开效果。如果目标系统缺少该字体，可改为 canvas 图片报告后再封装 PDF，或增加云函数生成 PDF。

## 更新法律规则

集中修改以下文件：

- `src/lib/legalRules.ts`：离职情形、N/N+1/2N/0 映射、条款摘要、官方法律来源
- `src/lib/calc.ts`：工作年限、工资基数、封顶和金额计算
- `src/types/index.ts`：表单字段与离职原因类型
- `src/lib/wizardSchema.ts`：表单校验
- `src/lib/calc.test.ts`：新增或修改规则时同步补测试

不要在报告组件里直接写计算逻辑。报告只展示 `calculateSeverance` 的结果，便于人工复核和回归测试。

## 官方法律来源

项目内已登记以下全国人大法规库官方来源：

- [中华人民共和国劳动法](https://flk.npc.gov.cn/detail?id=ff8080816f135f46016f20f16ee11737)，2018 年修正。
- [中华人民共和国劳动合同法](https://flk.npc.gov.cn/detail?id=2c909fdd678bf17901678bf74d7106b3)，2012 年修正，2013 年 7 月 1 日施行。
- [中华人民共和国劳动争议调解仲裁法](https://flk.npc.gov.cn/detail?id=2c909fdd678bf17901678bf64f28039d)，2008 年 5 月 1 日施行。

《劳动法》第 82 条关于六十日仲裁申请期限的旧规定，与后续施行的《劳动争议调解仲裁法》第 27 条不一致时，项目按后者的现行一年时效规则展示和提示。

更新法律来源时，应同时核对：

- 官方链接是否仍可访问
- 版本说明和施行日期
- `supportingLegalArticles` 中的条款摘要
- `src/lib/legalRules.test.ts` 中的来源和适用测试

## 法律与产品待复核项

以下内容已标为 TODO，发布商业版本前需要专业人员复核：

- H5 中十座城市的社平工资三倍封顶线、适用年份和官方来源，当前全部是示例数据；小程序改为由用户查询并手动填写。
- 离职前 12 个月“应得工资”的具体口径，以及奖金、津贴、补贴的纳入和排除规则。
- 不满 12 个月时平均工资的当地裁审口径。
- 《劳动合同法》第 38 条各项情形与证据要求。
- 未签书面劳动合同二倍工资的起止月份、计算基数和仲裁时效，目前不纳入主计算。
- 加班费、年终奖、未休年假工资、工资欠款等独立请求的时效和计算方式，目前仅提示。
- 违法解除时继续履行与 2N 赔偿金的选择策略。
- 金额展示区间目前按基准金额上下浮动 20%，这是产品估算展示方式，不是法定区间。
- 条款摘要均不是法条原文；虽已关联全国人大法规库，仍应由专业人员逐条对照官方文本复核。

如果输入事实与选项不完全匹配，应先标记为待人工复核，不要自行扩大解释。

## 隐私与交付建议

- 系统不会主动上传表单数据。
- 不要在用户手填内容中加入姓名、公司名或联系方式。
- token 会出现在浏览器地址栏和浏览历史中，应使用每个订单独立、难以猜测的 token。
- 如需撤销某个 token，更新 `VITE_ALLOWED_TOKENS` 并重新部署；当前 MVP 会整体替换列表，无法单独标记历史订单。
- 报告打印和复制功能由用户主动触发。

## 测试覆盖

`src/lib/calc.test.ts` 覆盖：

- 工作 5 个月，N = 0.5
- 工作 1 年 1 天，N = 1.5
- 工作 2 年 7 个月，N = 3
- 恰好 6 个月按 1 年计算
- 月工资未封顶和封顶
- 工作 15 年且封顶时，年限最高 12 年
- N+1 仅在第 40 条三种情形且未提前 30 日通知时出现
- 违法解除输出 2N，且不叠加 +1
- 主动辞职和劳动者提出协商一致解除输出 0
- 不满 12 个月时按实际月份平均工资计算

`miniprogram/tests/calc.test.cjs` 还覆盖小程序计算、官方法律来源和 PDF 基本结构。行政区数据完整性应在更新
`miniprogram/data/regions.js` 后单独校验省、地市、区县节点数量。

最终验收命令：

```bash
npm run format:check
npm run lint
npm test
npm run build
```

## 免责声明

本系统提供的是基于用户自行填写信息的第一轮估算，不构成正式法律意见，也不能替代律师、劳动仲裁机构或人民法院结合完整证据作出的判断。正式使用前请完成法律复核，并在产品中保留完整免责声明。
