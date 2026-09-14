import { ExternalLink, MessageCircle, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { product } from "@/config/product";

interface UnauthorizedProps {
  tokenConfigured: boolean;
}

export const Unauthorized = ({ tokenConfigured }: UnauthorizedProps): JSX.Element => (
  <div className="mx-auto max-w-2xl">
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
      <span className="grid size-12 place-items-center rounded-lg bg-brand-50 text-brand-600">
        <ShoppingBag className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-5 text-sm font-semibold text-brand-600">专属访问链接</p>
      <h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
        当前链接无效或缺少访问 token
      </h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        {product.purchaseHint}{" "}
        如果链接已经过期或打开时丢失了参数，请重新复制客服发送的完整链接。
      </p>

      {!tokenConfigured ? (
        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          当前部署环境尚未配置 <code>VITE_ALLOWED_TOKENS</code>
          ，所有访问都会进入未授权页。
        </div>
      ) : null}

      <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
        <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr]">
          <dt className="text-sm font-semibold text-slate-700">价格提示</dt>
          <dd className="text-sm text-slate-600">{product.priceNote}</dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[7rem_1fr]">
          <dt className="text-sm font-semibold text-slate-700">客服方式</dt>
          <dd className="text-sm text-slate-600">{product.supportContact}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {product.storeUrl ? (
          <a
            href={product.storeUrl}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-base font-semibold text-white hover:bg-brand-700"
          >
            前往小红书店铺
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : null}
        <Button variant="secondary" disabled>
          <MessageCircle className="size-4" aria-hidden="true" />
          请联系店铺客服
        </Button>
      </div>
    </section>
    <p className="mt-5 whitespace-pre-line px-1 text-xs leading-6 text-slate-500">
      {product.disclaimer}
    </p>
  </div>
);
