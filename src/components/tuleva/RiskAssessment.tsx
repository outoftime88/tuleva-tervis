import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Brain, Check, ExternalLink, MessageSquareText, Minus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { assessRisk } from "@/lib/risk-assessment.functions";
import { formatEuro, formatNumber } from "@/lib/insurance-calculations";
import {
  ASSESSMENT_STORAGE_KEY,
  DEFAULT_PROFILE,
  PROFILE_STORAGE_KEY,
  LIFESTYLE_OPTIONS,
  OCCUPATIONS,
  PROTECTION_NEEDS,
  type RiskAssessment,
  type RiskProfile,
} from "@/lib/risk-profile";
import { AnimatedNumber } from "./AnimatedNumber";

const ANALYSIS_STEPS = [
  "Loen riskiprofiili",
  "Hindan sissetuleku ja ülalpeetavate mõju",
  "Kaalun tervise- ja elustiilitegureid",
  "Arvutan kaitse eesmärgi ja kuumakse",
];

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? "active" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="chip-row">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            className={`chip ${on ? "active" : ""}`}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
          >
            {on && <Check />} {o}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="intake-field">
      <div className="field-head"><span>{label}</span>{value && <strong>{value}</strong>}</div>
      {children}
    </div>
  );
}

export function RiskAssessmentSection({
  onApply,
  onProfileChange,
  surveyScore,
}: {
  onApply: (a: RiskAssessment) => void;
  onProfileChange: (p: RiskProfile) => void;
  /** Score computed from the on-page health questionnaire; fills the AI risk score slider. */
  surveyScore?: number | null;
}) {
  const run = useServerFn(assessRisk);
  const [profile, setProfile] = useState<RiskProfile>(DEFAULT_PROFILE);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<RiskAssessment | null>(null);
  const [error, setError] = useState("");
  const set = <K extends keyof RiskProfile>(k: K, v: RiskProfile[K]) => setProfile((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    onProfileChange(profile);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Questionnaire score from the on-page survey fills the AI risk score slider.
  useEffect(() => {
    if (typeof surveyScore === "number") setProfile((p) => ({ ...p, aiRiskScore: surveyScore }));
  }, [surveyScore]);

  // Assessments made in the AI chat window flow back here.
  useEffect(() => {
    const receive = (raw: string) => {
      try {
        const a = JSON.parse(raw) as RiskAssessment;
        setResult(a);
        setStatus("done");
        setProfile((p) => ({ ...p, aiRiskScore: a.score }));
        onApply(a);
      } catch {
        /* ignore */
      }
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ASSESSMENT_STORAGE_KEY && e.newValue) receive(e.newValue);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "tuleva-ai-assessment" && typeof e.data.payload === "string") receive(e.data.payload);
    };
    window.addEventListener("storage", onStorage);
    let last = "";
    const onFocus = () => {
      const raw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
      if (raw && raw !== last && last !== "") receive(raw);
      last = raw ?? "-";
    };
    onFocus();
    window.addEventListener("message", onMessage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("message", onMessage);
    };
  }, [onApply]);

  useEffect(() => {
    if (status !== "loading") return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, ANALYSIS_STEPS.length - 1)), 1400);
    return () => clearInterval(id);
  }, [status]);

  const submit = async () => {
    setStatus("loading");
    setStep(0);
    setError("");
    try {
      const res = await run({ data: profile });
      if (!res.ok) {
        setError(res.error);
        setStatus("error");
        return;
      }
      setResult(res.assessment);
      setStatus("done");
      onApply(res.assessment);
    } catch {
      setError("Riskihindamine ebaõnnestus. Proovi uuesti.");
      setStatus("error");
    }
  };

  return (
    <section className="section section-soft" id="riskiprofiil">
      <div className="section-inner">
        <div className="section-heading wide">
          <span className="eyebrow">1. samm · Riskiprofiil</span>
          <h2>Hinda oma riski täpsemalt tehisintellektiga</h2>
        </div>

        <div className="risk-layout">
          <div className="calculator-panel intake-panel">
            <Field label="Vanus" value={`${profile.age} a`}>
              <Slider value={[profile.age]} min={18} max={70} step={1} onValueChange={([v]) => v !== undefined && set("age", v)} aria-label="Vanus" />
            </Field>
            <Field label="Elukutse / tegevusvaldkond">
              <Chips options={OCCUPATIONS} value={[profile.occupation]} onChange={(v) => set("occupation", v[v.length - 1] ?? profile.occupation)} />
            </Field>
            <Field label="Netosissetulek kuus" value={`${formatNumber(profile.monthlyIncome)} €`}>
              <Slider value={[profile.monthlyIncome]} min={600} max={8000} step={100} onValueChange={([v]) => v !== undefined && set("monthlyIncome", v)} aria-label="Netosissetulek kuus" />
            </Field>
            <Field label="Ülalpeetavad">
              <Segmented
                label="Ülalpeetavad"
                value={profile.dependents}
                onChange={(v) => set("dependents", v)}
                options={[0, 1, 2, 3].map((v) => ({ value: v, label: v === 3 ? "3+" : String(v) }))}
              />
            </Field>
            <Field label="Tervis ja elustiil">
              <Chips options={LIFESTYLE_OPTIONS} value={profile.lifestyle} onChange={(v) => set("lifestyle", v)} />
            </Field>
            <Field label="Mis vajab kaitset?">
              <Chips options={PROTECTION_NEEDS} value={profile.protectionNeeds} onChange={(v) => set("protectionNeeds", v)} />
            </Field>
            <Field label="Olemasolev sääst" value={`${formatNumber(profile.existingSavings)} €`}>
              <Slider value={[profile.existingSavings]} min={0} max={100000} step={1000} onValueChange={([v]) => v !== undefined && set("existingSavings", v)} aria-label="Olemasolev sääst" />
            </Field>
            <Field label="Tehisintellekti riskiskoor" value={typeof profile.aiRiskScore === "number" ? `${profile.aiRiskScore} / 100` : "pole hinnatud"}>
              <Slider value={[profile.aiRiskScore ?? 50]} min={0} max={100} step={1} onValueChange={([v]) => v !== undefined && set("aiRiskScore", v)} aria-label="Tehisintellekti riskiskoor" className={typeof profile.aiRiskScore === "number" ? "" : "slider-pending"} />
              <small className="field-hint">Täitub automaatselt, kui vajutad AI vestluses „Arvuta mu risk kohe“. Mõjutab kuumakset ja riskifondi osa.</small>
            </Field>
            <Button size="lg" onClick={submit} disabled={status === "loading"} className="assess-button">
              <Sparkles /> {status === "loading" ? "Analüüsin…" : "Hinda minu riski"}
            </Button>
            <a className="chat-link" href="/riskivestlus" target="_blank" rel="opener">
              <MessageSquareText />
              <span><strong>Hinda minu riski täpsemalt tehisintellektiga</strong><small>Kirjelda oma tervist vabas vormis, vasta AI küsimustele — riskiskoor jõuab siia tagasi.</small></span>
              <ExternalLink />
            </a>
            <p className="live-note">Kalkulaator uueneb profiili muutmisel kohe. AI hinnang täpsustab numbreid.</p>
          </div>

          <div className="calculator-panel assessment-panel" aria-live="polite">
            {status === "idle" && (
              <div className="assessment-empty">
                <Brain />
                <h3>AI riskihinnang</h3>
                <p>Täida profiil ja vajuta „Hinda minu riski“. Mudel hindab riskiskoori, soovitab kaitse eesmärgi ja kuumakse ning täidab kalkulaatori automaatselt.</p>
              </div>
            )}
            {status === "loading" && (
              <div className="assessment-loading">
                <div className="scan-orb"><Brain /></div>
                <ul>
                  {ANALYSIS_STEPS.map((s, i) => (
                    <li key={s} className={i < step ? "done" : i === step ? "current" : ""}>
                      <span>{i < step ? <Check /> : i + 1}</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {status === "error" && (
              <div className="assessment-empty">
                <h3>Hinnang ebaõnnestus</h3>
                <p>{error}</p>
                <Button variant="outline" onClick={submit}>Proovi uuesti</Button>
              </div>
            )}
            {status === "done" && result && (
              <div className="assessment-result">
                <div className="score-row">
                  <div className={`score-gauge tier-${result.tier === "kõrge" ? "high" : result.tier === "keskmine" ? "mid" : "low"}`} style={{ "--score": `${result.score}%` } as React.CSSProperties}>
                    <div><strong><AnimatedNumber value={result.score} format={(v) => String(Math.round(v))} /></strong><span>/ 100</span></div>
                  </div>
                  <div>
                    <span className="eyebrow">Riskitase</span>
                    <h3 className="tier-label">{result.tier}</h3>
                    <p className="confidence">Kindlus: {result.confidence} · {result.confidencePercent}%</p>
                  </div>
                </div>
                <p className="assessment-summary">{result.summary}</p>
                <div className="recommend-grid">
                  <div><span>Soovitatav kaitse eesmärk</span><strong><AnimatedNumber value={result.protectionTarget} format={formatEuro} /></strong></div>
                  <div><span>Soovitatav kuumakse</span><strong><AnimatedNumber value={result.monthlyPayment} format={formatEuro} /></strong></div>
                  <div><span>Isiklik puhver / riskifond</span><strong>{Math.round((1 - result.riskPoolShare) * 100)}% / {Math.round(result.riskPoolShare * 100)}%</strong></div>
                </div>
                <div>
                  <span className="eyebrow">Mis skoori mõjutas</span>
                  <div className="factor-list">
                    {result.factors.map((f) => (
                      <div key={f.label} className={`factor factor-${f.impact === "tõstab" ? "up" : f.impact === "langetab" ? "down" : "flat"}`} title={f.explanation}>
                        {f.impact === "tõstab" ? <ArrowUp /> : f.impact === "langetab" ? <ArrowDown /> : <Minus />}
                        <strong>{f.label}</strong>
                        <em>{f.impact === "langetab" ? "−" : f.impact === "tõstab" ? "+" : "±"}{Math.round(f.weight)}</em>
                        <p>{f.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={() => document.getElementById("kalkulaator")?.scrollIntoView({ behavior: "smooth" })}>
                  Vaata kalkulaatoris <ArrowDown />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
