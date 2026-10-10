// Soolevähi riskihinnangu ankeet — data-driven so questions can change without touching UI.
export type Question =
  | { id: string; label: string; type: "single"; options: string[]; hint?: string; showIf?: (a: Answers) => boolean }
  | { id: string; label: string; type: "multi"; options: string[]; hint?: string; showIf?: (a: Answers) => boolean }
  | { id: string; label: string; type: "number"; min?: number; max?: number; hint?: string; showIf?: (a: Answers) => boolean };

export type Section = { title: string; note?: string; questions: Question[] };
export type Answers = Record<string, string | string[]>;

const JEI = ["Jah", "Ei", "Ei tea"];
const yes = (id: string, ...vals: string[]) => (a: Answers) => vals.includes(a[id] as string);
const has = (id: string, v: string) => (a: Answers) => Array.isArray(a[id]) && (a[id] as string[]).includes(v);
const FREQ = ["iga päev", "mõned korda nädalas", "harvem"];

export const SECTIONS: Section[] = [
  {
    title: "1. Kaebused viimase kolme kuu jooksul",
    note: "Kui vastasite vähemalt ühele „jah“, soovitame pöörduda perearsti poole, ärge oodake sõeluuringut.",
    questions: [
      { id: "s_blood", label: "Veri väljaheites või pühkides paberil", type: "single", options: JEI },
      { id: "s_bowel", label: "Seedetegevuse muutus, mis on kestnud kauem kui 4 nädalat", type: "single", options: JEI },
      { id: "s_weight", label: "Seletamatu kaalulangus", type: "single", options: JEI },
      { id: "s_anemia", label: "Aneemia", type: "single", options: JEI },
      { id: "s_pain", label: "Kõhuvalu ja -puhitus", type: "single", options: JEI },
    ],
  },
  {
    title: "2. Põhiandmed",
    questions: [
      { id: "birthYear", label: "Sünniaasta", type: "number", min: 1920, max: 2010 },
      { id: "sex", label: "Sugu", type: "single", options: ["mees", "naine"] },
      { id: "height", label: "Pikkus (cm)", type: "number", min: 100, max: 230 },
      { id: "weight", label: "Kaal (kg)", type: "number", min: 30, max: 250 },
    ],
  },
  {
    title: "3. Kahjulikud harjumused",
    questions: [
      { id: "smoke", label: "Suitsetamine", type: "single", options: ["jah", "ei", "varasem"] },
      { id: "smokeYears", label: "Kui pikalt (aastat)", type: "number", min: 0, max: 80, showIf: yes("smoke", "jah", "varasem") },
      { id: "smokePerDay", label: "Mitu sigaretti päevas", type: "number", min: 0, max: 80, showIf: yes("smoke", "jah", "varasem") },
      { id: "ecig", label: "E-sigaretid", type: "single", options: ["jah", "ei", "varasem"] },
      { id: "ecigFreq", label: "Kui sageli", type: "single", options: FREQ, showIf: yes("ecig", "jah", "varasem") },
      { id: "ecigYears", label: "Mitu aastat", type: "number", min: 0, max: 50, showIf: yes("ecig", "jah", "varasem") },
      { id: "tobacco", label: "Muud tubakatooted (nt huuletubakas)", type: "single", options: ["jah", "ei", "varasem"] },
      { id: "tobaccoFreq", label: "Kui sageli", type: "single", options: FREQ, showIf: yes("tobacco", "jah", "varasem") },
      { id: "tobaccoYears", label: "Mitu aastat", type: "number", min: 0, max: 60, showIf: yes("tobacco", "jah", "varasem") },
      {
        id: "alcohol", label: "Alkohol: mitu ühikut nädalas", type: "number", min: 0, max: 100,
        hint: "1 ühik = 330 ml õlut (4,5–5%), 120 ml veini (12–13%) või 40 ml kanget alkoholi (40%) ≈ 10 g puhast alkoholi.",
      },
    ],
  },
  {
    title: "4. Diagnoosid ja ravimid",
    questions: [
      { id: "dx", label: "Diagnoosid (võib märkida mitu)", type: "multi", options: ["diabeet", "rasvmaks (MASLD)", "põletikuline soolehaigus (CD, UC)", "ei ühtegi"] },
      { id: "ibdYear", label: "Põletikulise soolehaiguse diagnoosi aasta", type: "number", min: 1940, max: 2026, showIf: has("dx", "põletikuline soolehaigus (CD, UC)") },
      { id: "anticoag", label: "Kas tarvitate verd vedeldavaid ravimeid?", type: "single", options: ["jah", "ei"], hint: "Nt Marevan, Xarelto, Eliquis, Pradaxa, Plavix, aspiriin." },
      { id: "nsaid", label: "Kas tarvitate regulaarselt valuvaigisteid (NSAID-e)?", type: "single", options: ["jah", "ei"], hint: "Nt ibuprofeen, diklofenak." },
    ],
  },
  {
    title: "5. Perekonnaanamnees",
    note: "Lähisugulaste all mõtleme ainult vanemaid, lapsi, õdesid-vendi.",
    questions: [
      { id: "famCrc", label: "Kas teie lähisugulastel on esinenud soolevähki?", type: "single", options: ["ei", "jah, ühel", "jah, kahel või enamal", "ei tea"] },
      { id: "famCrcU50", label: "Kas keegi neist haigestus enne 50. eluaastat?", type: "single", options: JEI, showIf: yes("famCrc", "jah, ühel", "jah, kahel või enamal") },
      { id: "famOther", label: "Kas samal poolel suguvõsast on kahel või enamal lähisugulasel esinenud endomeetriumi-, munasarja-, mao-, peensoole-, kuseteede-, kõhunäärme- või sapiteedevähki või ajukasvajat (glioblastoom)?", type: "single", options: ["ei", "jah", "ei tea"] },
      { id: "famSyndrome", label: "Kas lähisugulastel on esinenud Lynchi sündroom, FAP või muu polüpoosisündroom?", type: "multi", options: ["Lynch", "FAP", "muu polüpoosisündroom", "ei", "ei tea"] },
      { id: "geneTest", label: "Kas teile on tehtud geenitest jämesoolevähi tõusnud riski kohta?", type: "single", options: ["ei", "jah, tulemus negatiivne", "jah, tulemus positiivne", "ei tea"] },
    ],
  },
  {
    title: "6. Varasemad uuringud",
    questions: [
      { id: "fit", label: "Varasem FIT-test", type: "single", options: ["jah", "ei"] },
      { id: "fitYear", label: "Mis aastal?", type: "number", min: 1990, max: 2026, showIf: yes("fit", "jah") },
      { id: "fitResult", label: "Tulemus", type: "single", options: ["negatiivne", "positiivne", "ei tea"], showIf: yes("fit", "jah") },
      { id: "fitColo", label: "Kas pärast seda tehti koloskoopia?", type: "single", options: ["jah", "ei"], showIf: yes("fitResult", "positiivne") },
      { id: "colo", label: "Varasem koloskoopia", type: "single", options: ["jah", "ei"] },
      { id: "coloYear", label: "Mis aastal?", type: "number", min: 1980, max: 2026, showIf: yes("colo", "jah") },
      { id: "coloFull", label: "Kas koloskoopial hinnati kogu jämesool?", type: "single", options: JEI, showIf: yes("colo", "jah") },
      { id: "coloFind", label: "Leid (võib märkida mitu)", type: "multi", options: ["normileid", "polüübid", "soolevähk", "ei tea"], showIf: yes("colo", "jah") },
      { id: "coloRemoved", label: "Kas need eemaldati?", type: "single", options: JEI, showIf: (a) => has("coloFind", "polüübid")(a) || has("coloFind", "soolevähk")(a) },
      { id: "polypCount", label: "Polüüpide arv", type: "single", options: ["1", "2-4", "5-9", "10 või rohkem", "ei tea"], showIf: has("coloFind", "polüübid") },
      { id: "polypSize", label: "Suurima polüübi suurus", type: "single", options: ["alla 10 mm", "10 mm või suurem", "ei tea"], showIf: has("coloFind", "polüübid") },
      { id: "crcYear", label: "Mis aastal soolevähk diagnoositi?", type: "number", min: 1980, max: 2026, showIf: has("coloFind", "soolevähk") },
    ],
  },
];

export const visible = (q: Question, a: Answers) => !q.showIf || q.showIf(a);

export function hasAlarmSymptom(a: Answers) {
  return (SECTIONS[0]?.questions ?? []).some((q) => a[q.id] === "Jah");
}

export function answeredCount(a: Answers) {
  return Object.values(a).filter((v) => (Array.isArray(v) ? v.length : String(v).trim())).length;
}

/** Plain-text summary passed to the LLM. */
export function answersToText(a: Answers): string {
  const lines: string[] = ["Soolevähi riskihinnangu ankeet:"];
  for (const s of SECTIONS) {
    const rows = s.questions
      .filter((q) => visible(q, a))
      .map((q) => {
        const v = a[q.id];
        const txt = Array.isArray(v) ? v.join(", ") : v;
        return txt ? `- ${q.label}: ${txt}` : null;
      })
      .filter(Boolean) as string[];
    if (rows.length) lines.push(s.title, ...rows);
  }
  return lines.join("\n");
}
