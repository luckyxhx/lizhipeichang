export const terminationReasons = [
  "economic_layoff",
  "mutual_company_proposed",
  "mutual_employee_proposed",
  "company_fault",
  "incompetence",
  "medical_expiry",
  "objective_change",
  "illegal_termination",
  "voluntary_resignation",
  "probation_dismissal",
  "serious_misconduct",
] as const;

export type TerminationReason = (typeof terminationReasons)[number];

export type CompensationRule = "N" | "N+1" | "2N" | "0";

export type ProductEdition = "free" | "paid";

export interface WizardFormValues {
  startDate: string;
  endDate: string;
  totalIncomeLast12Months: number;
  actualMonths: number;
  regionCity: string;
  capMonthlyWage: number;
  terminationReason: TerminationReason;
  writtenNoticeProvided: boolean;
  lastMonthSalary: number;
  hasWrittenContract: boolean;
}

export interface ServicePeriod {
  fullYears: number;
  remainingMonths: number;
  remainingDays: number;
  totalMonths: number;
  nUnits: number;
  summary: string;
}

export interface CalculationInput extends WizardFormValues {
  startDate: string;
  endDate: string;
}

export interface CalculationResult {
  rule: CompensationRule;
  ruleReason: string;
  service: ServicePeriod;
  monthlyAverageWage: number;
  calculatedMonthlyWage: number;
  capMonthlyWage: number;
  isWageCapped: boolean;
  isServiceYearsCapped: boolean;
  nAmount: number;
  plusOneAmount: number;
  doubleNBaseAmount: number;
  exactAmount: number;
  estimateMin: number;
  estimateMax: number;
  relevantArticleIds: number[];
  warnings: string[];
  legalConclusion: string;
}

export interface RegionCap {
  city: string;
  province: string;
  capMonthlyWage: number;
  dataYear: string;
  source: string;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5;
