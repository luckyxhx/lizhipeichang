import type { LucideIcon } from "lucide-react";
import { Clock3, Download, FileText, MessagesSquare, ShieldCheck } from "lucide-react";

import { productKitResources, type ProductKitResourceId } from "@/content/productKit";

const resourceIcons: Record<ProductKitResourceId, LucideIcon> = {
  "agreement-checklist": FileText,
  "evidence-checklist": ShieldCheck,
  "negotiation-cards": MessagesSquare,
  "process-timeline": Clock3,
};

export const ProductKit = (): JSX.Element => (
  <section className="no-print rounded-xl border border-brand-200 bg-brand-50/50 p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold text-brand-700">完整版附加资料</p>
        <h2 className="mt-1 text-lg font-bold text-slate-950">离职准备工具包</h2>
      </div>
      <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-700">
        4 份文件
      </span>
    </div>
    <p className="mt-2 text-sm leading-6 text-slate-600">
      用于签署协议、整理证据和谈判前自查。文件可单独保存，也可配合完整报告使用。
    </p>

    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {productKitResources.map((resource) => {
        const Icon = resourceIcons[resource.id];
        return (
          <article
            key={resource.id}
            className="flex min-h-48 flex-col rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                {resource.format}
              </span>
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-950">{resource.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
              {resource.summary}
            </p>
            <a
              aria-label={`下载${resource.title}`}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              href={resource.href}
              download={resource.downloadName}
            >
              <Download className="size-4" aria-hidden="true" />
              下载资料
            </a>
          </article>
        );
      })}
    </div>

    <p className="mt-4 text-xs leading-5 text-slate-500">
      文件是通用自查工具，不构成正式法律意见。复杂条款和证据争议仍应由专业人员结合原件复核。
    </p>
  </section>
);
