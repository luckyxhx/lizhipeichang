import { BookOpen } from "lucide-react";

import { legalArticles } from "@/lib/legalRules";
import type { CalculationInput, CalculationResult } from "@/types";

interface LegalBasisProps {
  input: CalculationInput;
  result: CalculationResult;
}

export const LegalBasis = ({ input, result }: LegalBasisProps): JSX.Element => {
  const articleIds = [
    ...new Set([...result.relevantArticleIds, ...(input.hasWrittenContract ? [] : [82])]),
  ];
  const articles = articleIds
    .map((id) => legalArticles[id])
    .filter((article): article is NonNullable<typeof article> => Boolean(article));

  return (
    <section className="print-avoid-break rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-900">法律依据</h2>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        仅列示与本次输入相关的条款摘要，不替代法条原文和个案法律分析。
      </p>
      <div className="mt-5 space-y-4">
        {articles.map((article) => (
          <article key={article.id} className="border-l-2 border-brand-200 pl-4">
            <h3 className="text-sm font-bold text-slate-900">
              《劳动合同法》第 {article.id} 条 · {article.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{article.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
