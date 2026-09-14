import { format } from "date-fns";
import { Scale } from "lucide-react";

import { product } from "@/config/product";

export const ReportHeader = (): JSX.Element => (
  <header className="border-b-2 border-slate-900 pb-5">
    <div className="flex items-start justify-between gap-5">
      <div>
        <div className="flex items-center gap-2 text-brand-700">
          <Scale className="size-5" aria-hidden="true" />
          <span className="text-sm font-bold">离职权益第一轮估算</span>
        </div>
        <h1 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
          {product.name}报告
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          生成日期：{format(new Date(), "yyyy 年 M 月 d 日")}
        </p>
      </div>
      <div className="hidden rounded-lg border border-slate-300 px-3 py-2 text-right text-xs leading-5 text-slate-500 sm:block">
        <p>本地生成</p>
        <p>不含姓名与公司名</p>
      </div>
    </div>
  </header>
);
