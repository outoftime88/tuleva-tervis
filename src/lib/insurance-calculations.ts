export const PERSONAL_SHARE = 0.85;
export const RISK_SHARE = 0.15;
export const ANNUAL_RETURN = 0.05;

export type CalculatorInputs = {
  monthlyContribution: number;
  protectionTarget: number;
  years: number;
  /** Share of the monthly payment going to the collective risk pool (0–1). */
  riskShare?: number;
};

export type CalculatorResults = {
  personalContributions: number;
  personalBuffer: number;
  investmentReturn: number;
  riskPoolPaid: number;
  ownershipPercent: number;
  mutualGuarantee: number;
  fullyOwnedYear: number | null;
};

function futureValue(monthlyInvestment: number, years: number) {
  const monthlyRate = ANNUAL_RETURN / 12;
  const months = years * 12;
  return monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

export function calculateProtection({
  monthlyContribution,
  protectionTarget,
  years,
  riskShare = RISK_SHARE,
}: CalculatorInputs): CalculatorResults {
  const monthlyPersonal = monthlyContribution * (1 - riskShare);
  const personalContributions = monthlyPersonal * 12 * years;
  const personalBuffer = futureValue(monthlyPersonal, years);
  const riskPoolPaid = monthlyContribution * riskShare * 12 * years;
  const ownershipPercent = Math.min(100, (personalBuffer / protectionTarget) * 100);
  const mutualGuarantee = Math.max(0, protectionTarget - personalBuffer);

  let fullyOwnedYear: number | null = null;
  for (let year = 1; year <= 30; year += 1) {
    if (futureValue(monthlyPersonal, year) >= protectionTarget) {
      fullyOwnedYear = year;
      break;
    }
  }

  return {
    personalContributions,
    personalBuffer,
    investmentReturn: Math.max(0, personalBuffer - personalContributions),
    riskPoolPaid,
    ownershipPercent,
    mutualGuarantee,
    fullyOwnedYear,
  };
}

export const formatEuro = (value: number) =>
  new Intl.NumberFormat("et-EE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.round(value));

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("et-EE", { maximumFractionDigits: 0 }).format(Math.round(value));