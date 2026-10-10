import { useEffect, useMemo, useState } from "react";
import { ClipboardList, ExternalLink } from "lucide-react";
import { HealthQuestionnaire } from "./HealthQuestionnaire";
import { answeredCount, type Answers } from "@/lib/colorectal-questionnaire";
import { scoreSurvey } from "@/lib/survey-risk-score";
import { AnimatedNumber } from "./AnimatedNumber";

export function SurveyRiskSection({ onScoreChange }: { onScoreChange: (score: number | null) => void }) {
  const [answers, setAnswers] = useState<Answers>({});
  const enough = answeredCount(answers) >= 5;
  const result = useMemo(() => (enough ? scoreSurvey(answers) : null), [answers, enough]);

  useEffect(() => {
    onScoreChange(result ? result.score : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.score]);

  return (
    <section className="section" id="terviseankeet">
      <div className="section-inner">
        <div className="section-heading wide">
          <span className="eyebrow">2. samm · Terviseankeet</span>
          <h2>Soolevähi riskihinnangu ankeet</h2>
          <p>
            Vasta küsimustele — tehisintellekti riskiskoor esilehel täitub automaatselt. Skoor arvutatakse sinu
            vastustest: sümptomid, pärilikud tegurid, elustiil ja varasemad uuringud.
          </p>
        </div>

        <div className="risk-layout">
          <div className="calculator-panel intake-panel">
            <HealthQuestionnaire answers={answers} onChange={setAnswers} />
          </div>

          <div className="calculator-panel assessment-panel" aria-live="polite">
            {!result && (
              <div className="assessment-empty">
                <ClipboardList />
                <h3>Skoor kujuneb vastates</h3>
                <p>Vähemalt 5 vastust ja riskiskoor arvutatakse kohe. Punktid lähevad otse „Tehisintellekti riskiskoor“ slaiderisse ülal.</p>
              </div>
            )}
            {result && (
              <div className="assessment-result">
                <div className="score-row">
                  <div
                    className={`score-gauge tier-${result.tier === "kõrge" ? "high" : result.tier === "keskmine" ? "mid" : "low"}`}
                    style={{ "--score": `${result.score}%` } as React.CSSProperties}
                  >
                    <div>
                      <strong>
                        <AnimatedNumber value={result.score} format={(v) => String(Math.round(v))} />
                      </strong>
                      <span>/ 100</span>
                    </div>
                  </div>
                  <div>
                    <span className="eyebrow">Riskitase</span>
                    <h3 className="tier-label">{result.tier}</h3>
                    <p className="confidence">{result.label}</p>
                  </div>
                </div>
                {result.factors.length > 0 && (
                  <div>
                    <span className="eyebrow">Mis skoori mõjutas</span>
                    <div className="factor-list">
                      {result.factors.map((f) => (
                        <div key={f.label} className={`factor factor-${f.points > 0 ? "up" : f.points < 0 ? "down" : "flat"}`}>
                          <strong>{f.label}</strong>
                          <em>
                            {f.points > 0 ? "+" : "−"}
                            {Math.abs(f.points)}
                          </em>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <a className="chat-link" href="/riskivestlus" target="_blank" rel="opener">
                  <span>
                    <strong>Täpsusta AI vestluses</strong>
                    <small>Sama ankeet + AI täpsustavad küsimused uues aknas.</small>
                  </span>
                  <ExternalLink />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
