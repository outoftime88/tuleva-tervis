import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assessRisk, chatRisk } from "@/lib/risk-assessment.functions";
import { formatEuro } from "@/lib/insurance-calculations";
import {
  ASSESSMENT_STORAGE_KEY,
  DEFAULT_PROFILE,
  PROFILE_STORAGE_KEY,
  type RiskAssessment,
  type RiskProfile,
} from "@/lib/risk-profile";
import { HealthQuestionnaire } from "@/components/tuleva/HealthQuestionnaire";
import { answeredCount, answersToText, type Answers } from "@/lib/colorectal-questionnaire";

export const Route = createFileRoute("/riskivestlus")({
  head: () => ({
    meta: [
      { title: "AI riskivestlus — Tuleva Enesekindlustus" },
      { name: "description", content: "Vestle AI riskinõustajaga ja saa täpsem riskihinnang ning kaitse soovitus." },
      { property: "og:title", content: "AI riskivestlus — Tuleva Enesekindlustus" },
      { property: "og:description", content: "Täpsusta oma riskiprofiili tehisintellektiga vesteldes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RiskChat,
});

type Msg = { role: "user" | "assistant"; content: string };

function RiskChat() {
  const chat = useServerFn(chatRisk);
  const assess = useServerFn(assessRisk);
  const [profile, setProfile] = useState<RiskProfile>(DEFAULT_PROFILE);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const health = answersToText(answers);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<"" | "chat" | "assess">("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<RiskAssessment | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (saved) setProfile(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const ask = async (next: Msg[]) => {
    setMessages(next);
    setBusy("chat");
    setError("");
    try {
      const res = await chat({ data: { messages: next, profile: JSON.stringify(profile) } });
      if (res.ok) setMessages([...next, { role: "assistant", content: res.reply }]);
      else setError(res.error);
    } catch {
      setError("Vestlus ebaõnnestus. Proovi uuesti.");
    } finally {
      setBusy("");
    }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void ask([...messages, { role: "user", content: text }]);
  };

  const startChat = () => {
    if (busy) return;
    void ask([{ role: "user", content: `${health}\n\nPalun küsi täpsustavaid küsimusi.` }]);
  };

  const finish = async () => {
    setBusy("assess");
    setError("");
    try {
      const conversation = messages.slice(1).map((m) => `${m.role === "user" ? "Kasutaja" : "Nõustaja"}: ${m.content}`).join("\n");
      const res = await assess({ data: { ...profile, conversation: `${health}\n\n${conversation}` } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res.assessment);
      const payload = JSON.stringify({ ...res.assessment, _t: Date.now() });
      try {
        window.opener?.postMessage({ type: "tuleva-ai-assessment", payload }, window.location.origin);
      } catch {
        /* ignore */
      }
      localStorage.setItem(ASSESSMENT_STORAGE_KEY, payload);
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...profile, aiRiskScore: res.assessment.score }));
        window.opener?.focus();
      } catch {
        /* ignore */
      }
    } catch {
      setError("Hinnangu koostamine ebaõnnestus.");
    } finally {
      setBusy("");
    }
  };

  const started = messages.length > 0;

  return (
    <main className="tuleva-page chat-page">
      <div className="chat-shell">
        <div className="brand-row"><div className="brand-mark"><span>T</span></div><span>Tuleva Enesekindlustus</span></div>
        <div className="section-heading">
          <span className="eyebrow">AI riskivestlus</span>
          <h2>Hinda oma riski täpsemalt tehisintellektiga</h2>
        </div>

        <div className="calculator-panel health-intake">
          <span className="step-label">1. Soolevähi riskihinnangu ankeet</span>
          <HealthQuestionnaire answers={answers} onChange={setAnswers} disabled={started || !!busy} />
          {!started && (
            <Button size="lg" onClick={startChat} disabled={!!busy || answeredCount(answers) < 3}>
              <Send /> {busy === "chat" ? "Loen sinu vastuseid…" : "Saada ja jätka vestlusega"}
            </Button>
          )}
        </div>

        {started && (
          <>
            <span className="step-label">2. AI täpsustavad küsimused</span>
            <div className="calculator-panel chat-box" ref={boxRef} aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`bubble ${m.role}`}>{i === 0 && m.role === "user" ? "Ankeedi vastused saadetud." : m.content}</div>
              ))}
              {busy === "chat" && <div className="bubble assistant">Mõtlen…</div>}
            </div>
            <form className="chat-form" onSubmit={send}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Vasta küsimusele…" aria-label="Sõnum" disabled={!!busy} />
              <Button type="submit" disabled={!!busy || !input.trim()} aria-label="Saada"><Send /></Button>
            </form>
          </>
        )}

        {error && <p className="live-note">{error}</p>}

        <Button size="lg" onClick={finish} disabled={!!busy || answeredCount(answers) < 3}>
          <Sparkles /> {busy === "assess" ? "Arvutan riski…" : "Arvuta mu risk kohe"}
        </Button>

        {result && (
          <div className="calculator-panel assessment-result">
            <div className="score-row">
              <div className={`score-gauge tier-${result.tier === "kõrge" ? "high" : result.tier === "keskmine" ? "mid" : "low"}`} style={{ "--score": `${result.score}%` } as React.CSSProperties}>
                <div><strong>{result.score}</strong><span>/ 100</span></div>
              </div>
              <div>
                <span className="eyebrow">Täpsustatud riskitase</span>
                <h3 className="tier-label">{result.tier}</h3>
                <p className="confidence">Kindlus: {result.confidence} · {result.confidencePercent}%</p>
              </div>
            </div>
            <p className="assessment-summary">{result.summary}</p>
            <div className="recommend-grid">
              <div><span>Soovitatav kaitse eesmärk</span><strong>{formatEuro(result.protectionTarget)}</strong></div>
              <div><span>Soovitatav kuumakse</span><strong>{formatEuro(result.monthlyPayment)}</strong></div>
              <div><span>Puhver / riskifond</span><strong>{Math.round((1 - result.riskPoolShare) * 100)}% / {Math.round(result.riskPoolShare * 100)}%</strong></div>
            </div>
            <p className="live-note"><Brain style={{ width: 14, height: 14, display: "inline" }} /> Riskiskoor on saadetud avalehele: AI riskiskoori slaider ja kalkulaator on täidetud. Võid selle akna sulgeda.</p>
          </div>
        )}
      </div>
    </main>
  );
}
