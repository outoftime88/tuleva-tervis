import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { clamp, type RiskAssessment } from "./risk-profile";

const profileSchema = z.object({
  age: z.number().int().min(18).max(75),
  occupation: z.string().max(80),
  monthlyIncome: z.number().min(0).max(100000),
  dependents: z.number().int().min(0).max(10),
  lifestyle: z.array(z.string().max(60)).max(10),
  protectionNeeds: z.array(z.string().max(60)).max(10),
  existingSavings: z.number().min(0).max(10000000),
  aiRiskScore: z.number().min(0).max(100).nullable().optional(),
  conversation: z.string().max(20000).optional(),
});

type GatewayResult = { ok: true; text: string } | { ok: false; error: string };

async function callGateway(body: Record<string, unknown>): Promise<GatewayResult> {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) return { ok: false, error: "AI teenus pole seadistatud." };
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      ...body,
    }),
  });
  if (!response.ok || !response.body) {
    if (response.status === 429) return { ok: false, error: "Liiga palju päringuid. Proovi hetke pärast uuesti." };
    if (response.status === 402) return { ok: false, error: "AI krediit on otsas. Lisa töölauale krediiti." };
    console.error("AI gateway error", response.status, await response.text().catch(() => ""));
    return { ok: false, error: `AI päring ebaõnnestus (${response.status}).` };
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload);
        if (event.type === "response.output_text.delta") output += event.delta ?? "";
        if (event.type === "response.refusal.delta") return { ok: false, error: "AI keeldus vastamast." };
        if (event.type === "error" || event.type === "response.failed") return { ok: false, error: "AI päring ebaõnnestus." };
      } catch {
        /* partial frame */
      }
    }
  }
  if (!output) return { ok: false, error: "AI ei andnud vastust." };
  return { ok: true, text: output };
}

const CHAT_PROMPT = `Sa oled Tuleva Enesekindlustuse sõbralik riskinõustaja. Vestle eesti keeles, et täpsustada inimese riskiprofiili: töö iseloom ja stabiilsus, tervis ja elustiil, pere ja ülalpeetavad, laenud ja kohustused, sääst ja olemasolevad kindlustused. Kasutaja alustab vaba tekstiga oma tervisest (mis on hästi, mis halvasti, milliseid ettevaatusabinõusid rakendab). Küsi selle põhjal täpsustavaid küsimusi, korraga 1–2 lühikest küsimust, ole lühike (max 4 lauset). Kui info on piisav, ütle, et kasutaja võib vajutada „Arvuta mu risk kohe“. Ära anna meditsiinilisi diagnoose.`;

export const chatRisk = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(40),
      profile: z.string().max(4000).optional(),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    const res = await callGateway({
      instructions: CHAT_PROMPT + (data.profile ? `\nKasutaja esialgne profiil: ${data.profile}` : ""),
      input: data.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return res.ok ? { ok: true as const, reply: res.text } : res;
  });

const SYSTEM_PROMPT = `Sa oled Tuleva Enesekindlustuse riskihindaja (underwriter). Tuleva liige ehitab endale isikliku kaitsepuhvri (investeeritakse indeksfondi, ~5% aastas) ja osa makset läheb ühistu kollektiivsesse riskifondi, mis katab vahe kaitse-eesmärgini kuni isiklik puhver on piisav.
Hinda inimese riski suurust ja soovita:
- score: 0–100 (kõrgem = suurem tõenäosus vajada kaitset lähiaastatel ja suurem finantsmõju).
- tier: "madal" (<35), "keskmine" (35–64), "kõrge" (>=65).
- protectionTarget: soovitatav kaitse eesmärk eurodes (tavaliselt 3–8 aasta netosissetulek, arvesta ülalpeetavate, kodulaenu ja olemasoleva säästuga), ümarda 5000-ni, vahemik 20000–300000.
- monthlyPayment: soovitatav kuumakse eurodes, umbes 3–8% sissetulekust, vahemik 25–500, ümarda 5-ni.
- riskPoolShare: osa maksest riskifondi, 0.10–0.25 (kõrgem risk → suurem osa).
- confidence ja confidencePercent (40–95): kui täielik ja järjepidev on info.
- summary: 1–2 lauset eesti keeles.
- factors: 4–6 tegurit, igaühel lühike silt (max 4 sõna), mõju ("tõstab" / "langetab" / "neutraalne"), weight 1–30 punkti, lühike selgitus.
Vasta ainult eesti keeles. See on demo, mitte meditsiiniline ega ametlik hinnang.`;

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "tier", "protectionTarget", "monthlyPayment", "riskPoolShare", "confidence", "confidencePercent", "summary", "factors"],
  properties: {
    score: { type: "number" },
    tier: { type: "string", enum: ["madal", "keskmine", "kõrge"] },
    protectionTarget: { type: "number" },
    monthlyPayment: { type: "number" },
    riskPoolShare: { type: "number" },
    confidence: { type: "string", enum: ["madal", "keskmine", "kõrge"] },
    confidencePercent: { type: "number" },
    summary: { type: "string" },
    factors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "impact", "weight", "explanation"],
        properties: {
          label: { type: "string" },
          impact: { type: "string", enum: ["tõstab", "langetab", "neutraalne"] },
          weight: { type: "number" },
          explanation: { type: "string" },
        },
      },
    },
  },
};

export const assessRisk = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data }): Promise<{ ok: true; assessment: RiskAssessment } | { ok: false; error: string }> => {
    const { conversation, ...profile } = data;
    const res = await callGateway({
      instructions: SYSTEM_PROMPT,
      input: `Riskiprofiil:\n${JSON.stringify(profile, null, 2)}${conversation ? `\n\nVestlus kasutajaga (arvesta seda täpsema info allikana, tõsta kindlust):\n${conversation}` : ""}`,
      text: { format: { type: "json_schema", name: "risk_assessment", strict: true, schema: jsonSchema } },
    });
    if (!res.ok) return res;
    const output = res.text;

    try {
      const raw = JSON.parse(output) as RiskAssessment;
      const score = Math.round(clamp(raw.score, 0, 100));
      return {
        ok: true,
        assessment: {
          ...raw,
          score,
          tier: score >= 65 ? "kõrge" : score >= 35 ? "keskmine" : "madal",
          protectionTarget: Math.round(clamp(raw.protectionTarget, 20000, 300000) / 5000) * 5000,
          monthlyPayment: Math.round(clamp(raw.monthlyPayment, 25, 500) / 5) * 5,
          riskPoolShare: clamp(raw.riskPoolShare, 0.1, 0.25),
          confidencePercent: Math.round(clamp(raw.confidencePercent, 0, 100)),
          factors: (raw.factors ?? []).slice(0, 6),
        },
      };
    } catch {
      return { ok: false, error: "AI vastust ei õnnestunud lugeda." };
    }
  });
