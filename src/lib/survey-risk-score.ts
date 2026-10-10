// Deterministic risk score from the colorectal questionnaire answers.
// Tier logic follows the clinical triage model: red flags and hereditary
// risk override the weighted score; otherwise factors are summed.
import { hasAlarmSymptom, type Answers } from "./colorectal-questionnaire";
import { clamp } from "./risk-profile";

export type SurveyScore = {
  score: number; // 0–100
  tier: "madal" | "keskmine" | "kõrge";
  /** Which triage tier produced the result. */
  path: "sümptomid" | "pärilik" | "kaalutud" | "keskmine";
  label: string;
  factors: { label: string; points: number }[];
};

const num = (a: Answers, id: string) => {
  const v = Number(a[id]);
  return Number.isFinite(v) ? v : 0;
};
const has = (a: Answers, id: string, v: string) => Array.isArray(a[id]) && (a[id] as string[]).includes(v);

export function scoreSurvey(a: Answers): SurveyScore {
  // Tier 1: any red-flag symptom bypasses scoring entirely.
  if (hasAlarmSymptom(a)) {
    return {
      score: 95,
      tier: "kõrge",
      path: "sümptomid",
      label: "Sümptomid — soovitame pöörduda perearsti poole, ära oota sõeluuringut.",
      factors: [{ label: "Häiresümptom viimase 3 kuu jooksul", points: 95 }],
    };
  }

  // Tier 2: hereditary / high-risk path overrides standard scoring.
  const tier2: string[] = [];
  if (has(a, "dx", "põletikuline soolehaigus (CD, UC)")) tier2.push("Põletikuline soolehaigus");
  if (has(a, "famSyndrome", "Lynch") || has(a, "famSyndrome", "FAP") || has(a, "famSyndrome", "muu polüpoosisündroom"))
    tier2.push("Pärilik sündroom (Lynch / FAP)");
  if (a["geneTest"] === "jah, tulemus positiivne") tier2.push("Positiivne geenitest");
  if (a["famCrc"] === "jah, kahel või enamal") tier2.push("Mitu lähisugulast soolevähiga");
  if (a["famCrcU50"] === "Jah") tier2.push("Lähisugulane haigestus enne 50. eluaastat");
  if (a["famOther"] === "jah") tier2.push("Lynchiga seotud vähid suguvõsas");
  if (has(a, "coloFind", "soolevähk")) tier2.push("Varasem soolevähk");
  if (has(a, "coloFind", "polüübid") && (a["polypSize"] === "10 mm või suurem" || a["polypCount"] === "5-9" || a["polypCount"] === "10 või rohkem"))
    tier2.push("Suured või arvukad polüübid");
  if (tier2.length) {
    return {
      score: 85,
      tier: "kõrge",
      path: "pärilik",
      label: "Kõrge risk — soovitatav regulaarne koloskoopia-jälgimine, mitte tavaline sõeluuring.",
      factors: tier2.map((label) => ({ label, points: 85 })),
    };
  }

  // Tier 3: multifactorial weighted score.
  const factors: { label: string; points: number }[] = [];
  const add = (label: string, points: number) => points && factors.push({ label, points });

  const age = a["birthYear"] ? new Date().getFullYear() - num(a, "birthYear") : 0;
  if (age >= 60) add("Vanus 60+", 22);
  else if (age >= 50) add("Vanus 50–59", 15);
  else if (age >= 40) add("Vanus 40–49", 8);
  if (a["sex"] === "mees") add("Meessugu", 5);

  const h = num(a, "height");
  const w = num(a, "weight");
  const bmi = h > 0 ? w / (h / 100) ** 2 : 0;
  if (bmi > 30) add("KMI üle 30", 12);
  else if (bmi > 25) add("KMI 25–30", 6);
  if (has(a, "dx", "diabeet")) add("Diabeet", 8);
  if (has(a, "dx", "rasvmaks (MASLD)")) add("Rasvmaks (MASLD)", 6);

  const packYears = (num(a, "smokeYears") * num(a, "smokePerDay")) / 20;
  if (a["smoke"] === "jah") add("Suitsetamine", packYears > 20 ? 20 : 15);
  else if (a["smoke"] === "varasem") add("Varasem suitsetamine", 6);
  const alcohol = num(a, "alcohol");
  if (alcohol > 24) add("Alkohol üle 24 ühiku nädalas", 15);
  else if (alcohol > 14) add("Alkohol 14–24 ühikut nädalas", 10);

  if (a["famCrc"] === "jah, ühel" && a["famCrcU50"] !== "Jah") add("Üks lähisugulane soolevähiga (üle 50 a)", 12);
  if (a["nsaid"] === "jah") add("Regulaarne NSAID-kasutus", -5);

  const score = clamp(Math.round(factors.reduce((s, f) => s + f.points, 10)), 0, 100);

  // Tier 4: average risk.
  if (score < 35) {
    return {
      score,
      tier: "madal",
      path: "keskmine",
      label: "Keskmine risk — jääd tavapärasesse sõeluuringu rada (FIT-test iga 2 aasta tagant).",
      factors,
    };
  }
  return {
    score,
    tier: score >= 65 ? "kõrge" : "keskmine",
    path: "kaalutud",
    label:
      score >= 65
        ? "Tõusnud risk — soovitatav varasem sõeluuringu algus või esmane koloskoopia."
        : "Mõõdukalt tõusnud risk — kaalu varasemat sõeluuringu algust.",
    factors,
  };
}
