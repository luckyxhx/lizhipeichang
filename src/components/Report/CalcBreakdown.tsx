import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { CalculationInput, CalculationResult } from "@/types";

interface CalcBreakdownProps {
  input: CalculationInput;
  result: CalculationResult;
}

interface DetailRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
}

const DetailRow = ({ label, value, emphasis }: DetailRowProps): JSX.Element => (
  <div className="grid grid-cols-[8rem_1fr] gap-3 border-b border-slate-100 py-3 last:border-0">
    <dt className="text-sm text-slate-500">{label}</dt>
    <dd
      className={
        emphasis
          ? "text-right text-sm font-bold text-slate-950"
          : "text-right text-sm font-medium text-slate-800"
      }
    >
      {value}
    </dd>
  </div>
);

export const CalcBreakdown = ({ input, result }: CalcBreakdownProps): JSX.Element => (
  <details className="print-avoid-break rounded-xl border border-slate-200 bg-white" open>
    <summary className="cursor-pointer list-none px-5 py-4 text-base font-bold text-slate-900">
      计算过程拆解
      <span className="float-right text-xs font-normal text-slate-400 print:hidden">
        点击展开 / 收起
      </span>
    </summary>
    <div className="border-t border-slate-100 px-5 pb-2">
      <dl>
        <DetailRow label="入职日期" value={formatDate(input.startDate)} />
        <DetailRow label="离职日期" value={formatDate(input.endDate)} />
        <DetailRow label="工作年限" value={result.service.summary} />
        <DetailRow
          label="计入 N 月数"
          value={`${formatNumber(result.service.nUnits)} 个月`}
        />
        <DetailRow label="月平均工资" value={formatCurrency(result.monthlyAverageWage)} />
        <DetailRow
          label="计算用月工资"
          value={formatCurrency(result.calculatedMonthlyWage)}
        />
        <DetailRow
          label="三倍封顶线"
          value={`${formatCurrency(result.capMonthlyWage)}${
            result.isWageCapped ? "（已触发）" : "（未触发）"
          }`}
        />
        <DetailRow label="N 金额" value={formatCurrency(result.nAmount)} />
        <DetailRow label="+1 金额" value={formatCurrency(result.plusOneAmount)} />
        <DetailRow label="2N 金额" value={formatCurrency(result.doubleNBaseAmount)} />
        <DetailRow label="基准总额" value={formatCurrency(result.exactAmount)} emphasis />
      </dl>
      {result.isServiceYearsCapped ? (
        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          已触发工资三倍封顶，经济补偿年限最高按 12 年计入。
        </p>
      ) : null}
    </div>
  </details>
);
