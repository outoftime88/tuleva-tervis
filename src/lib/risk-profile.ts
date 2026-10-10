// Shared, browser-safe types and options for the AI risk profile.

export type RiskProfile = {
  age: number;
  occupation: string;
  monthlyIncome: number;
  dependents: number;
  lifestyle: string[];
  protectionNeeds: string[];
  existingSavings: number;
  /** 0–100 score from the AI health conversation; null until assessed. */
  aiRiskScore?: number | null;
};

export type RiskFactor = {
  label: string;
  impact: "tõstab" | "langetab" | "neutraalne";
  weight: number;
  explanation: string;
};

export type RiskAssessment = {
  score: number;
  tier: "madal" | "keskmine" | "kõrge";
  protectionTarget: number;
  monthlyPayment: number;
  riskPoolShare: number;
  confidence: "madal" | "keskmine" | "kõrge";
  confidencePercent: number;
  summary: string;
  factors: RiskFactor[];
};

export const OCCUPATIONS = [
  "Kontoritöö / IT",
  "Haridus / tervishoid",
  "Ettevõtja / FIE",
  "Ehitus / tööstus",
  "Transport / logistika",
  "Teenindus / kaubandus",
];

export const LIFESTYLE_OPTIONS = [
  "Suitsetan",
  "Krooniline haigus",
  "Ekstreemsport",
  "Liigun regulaarselt",
  "Pikad autosõidud",
  "Tervislik kaal",
];

export const PROTECTION_NEEDS = [
  "Kodulaen",
  "Pere sissetulek",
  "Töövõimetus",
  "Raske haigus",
  "Laste haridus",
];

export const DEFAULT_PROFILE: RiskProfile = {
  age: 35,
  occupation: "Kontoritöö / IT",
  monthlyIncome: 2200,
  dependents: 2,
  lifestyle: ["Liigun regulaarselt"],
  protectionNeeds: ["Kodulaen", "Pere sissetulek"],
  existingSavings: 8000,
  aiRiskScore: null,
};

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Quick deterministic estimate used to live-fill the calculator before the AI refines it. */
export function estimateFromProfile(p: RiskProfile) {
  const years = 3 + Math.min(p.dependents, 3) + (p.protectionNeeds.includes("Kodulaen") ? 1.5 : 0) + (p.age < 45 ? 1 : 0);
  const rawTarget = p.monthlyIncome * 12 * years - p.existingSavings;
  const protectionTarget = Math.round(clamp(rawTarget, 20000, 300000) / 5000) * 5000;
  const riskBumps = ["Suitsetan", "Krooniline haigus", "Ekstreemsport"].filter((x) => p.lifestyle.includes(x)).length;
  // AI score shifts the estimate: 50 is neutral, 0 lowers and 100 raises risk.
  const ai = typeof p.aiRiskScore === "number" ? (p.aiRiskScore - 50) / 50 : 0;
  const monthlyPayment = Math.round(clamp(p.monthlyIncome * (0.045 + riskBumps * 0.008 + ai * 0.012), 25, 500) / 5) * 5;
  const riskShare = clamp(0.12 + riskBumps * 0.03 + (p.age > 50 ? 0.03 : 0) + ai * 0.05, 0.1, 0.25);
  return { protectionTarget, monthlyPayment, riskShare };
}

export const PROFILE_STORAGE_KEY = "tuleva-risk-profile";
export const ASSESSMENT_STORAGE_KEY = "tuleva-ai-assessment";
