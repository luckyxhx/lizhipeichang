import { BookOpen } from "lucide-react";

import {
  getOfficialLegalSource,
  getSupportingLegalArticles,
  legalArticles,
  officialLegalSources,
} from "@/lib/legalRules";
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
  const supportingArticles = getSupportingLegalArticles(
    result.rule,
    input.terminationReason,
  );

  return (
    <section className="print-avoid-break rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <BookOpen className="size-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-lg font-bold text-slate-900">法律依据</h2>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        条款摘要来自全国人大法规库。报告摘要不替代法条原文和个案法律分析。
      </p>
      <div className="mt-4 grid gap-2">
        {officialLegalSources.map((source) => (
          <a
            key={source.key}
            className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600 hover:border-brand-300 hover:text-brand-700"
            href={source.officialUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span className="font-semibold text-slate-800">{source.title}</span>
            <span>
              {source.versionNote} · {source.effectiveDate} 施行
            </span>
          </a>
        ))}
      </div>
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
      {supportingArticles.length > 0 ? (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-bold text-slate-900">补充法律依据</h3>
          <div className="mt-4 space-y-4">
            {supportingArticles.map((article) => {
              const source = getOfficialLegalSource(article.sourceKey);
              return (
                <article key={article.id} className="border-l-2 border-slate-300 pl-4">
                  <h4 className="text-sm font-bold text-slate-900">
                    {source.shortTitle}
                    {article.articleNumber} · {article.title}
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {article.summary}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
};
