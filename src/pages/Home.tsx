import { ArrowRight, Calculator, LockKeyhole, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { product } from "@/config/product";

interface HomeProps {
  onStart: () => void;
}

const highlights = [
  {
    icon: Calculator,
    title: "本地计算",
    description: "输入信息只在当前浏览器中参与计算，不提交到服务器。",
  },
  {
    icon: ShieldCheck,
    title: "规则集中维护",
    description: "N、N+1、2N 与封顶规则统一维护，便于后续人工复核。",
  },
  {
    icon: LockKeyhole,
    title: "无需提交隐私",
    description: "不要求填写姓名、公司名、手机号或身份证号。",
  },
] as const;

export const Home = ({ onStart }: HomeProps): JSX.Element => (
  <div className="mx-auto max-w-3xl">
    <section className="relative overflow-hidden rounded-xl bg-white px-5 py-8 shadow-soft sm:px-8 sm:py-10">
      <div className="absolute -right-14 -top-14 size-36 rounded-full bg-brand-50" />
      <div className="relative">
        <p className="text-sm font-semibold text-brand-600">移动端第一轮估算工具</p>
        <h1 className="mt-3 max-w-xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl">
          离职赔偿计算系统
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          根据离职时间、工资基数和解除情形，生成包含金额区间、计算拆解、法条索引和行动清单的报告。
        </p>
        <Button className="mt-7 w-full sm:w-auto" onClick={onStart}>
          开始估算
          <ArrowRight className="size-5" aria-hidden="true" />
        </Button>
        <p className="mt-3 text-xs leading-5 text-slate-500">{product.priceNote}</p>
      </div>
    </section>

    <section className="mt-6 grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
      {highlights.map(({ icon: Icon, title, description }) => (
        <article key={title} className="min-h-36 bg-white p-5">
          <Icon className="size-5 text-brand-600" aria-hidden="true" />
          <h2 className="mt-4 font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </article>
      ))}
    </section>

    <section className="mt-6 border-l-4 border-amber-400 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
      <strong className="font-bold">先说明：</strong>
      结果仅用于第一轮估算，不构成正式法律意见。地区数据显示为待复核示例，正式使用前必须更新并核对来源。
    </section>
  </div>
);
