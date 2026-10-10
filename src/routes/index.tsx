import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { ArrowDown, BadgeEuro, LineChart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calculator } from "@/components/tuleva/Calculator";
import { Certificate } from "@/components/tuleva/Certificate";
import { HowItWorks } from "@/components/tuleva/HowItWorks";
import { RiskAssessmentSection } from "@/components/tuleva/RiskAssessment";
import { SurveyRiskSection } from "@/components/tuleva/SurveyRisk";
import { estimateFromProfile, type RiskAssessment, type RiskProfile } from "@/lib/risk-profile";
import { calculateProtection, formatEuro, type CalculatorInputs } from "@/lib/insurance-calculations";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tuleva Enesekindlustus — ehita endale kaitse" },
      {
        name: "description",
        content:
          "Häkatoniprototüüp, mis arvutab isikliku kaitsepuhvri, riskifondi osa ja Tuleva ühistu lisagarantii.",
      },
      { property: "og:title", content: "Tuleva Enesekindlustus" },
      {
        property: "og:description",
        content: "Arvuta, kui suur osa sinu kaitse-eesmärgist saab sinu isiklikuks puhvriks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    monthlyContribution: 100,
    protectionTarget: 100000,
    years: 20,
  });
  const [memberName, setMemberName] = useState("Mari Mets");
  const [aiApplied, setAiApplied] = useState(false);
  const [surveyScore, setSurveyScore] = useState<number | null>(null);
  const applyProfile = useCallback((p: RiskProfile) => {
    const e = estimateFromProfile(p);
    setInputs((prev) => ({ ...prev, protectionTarget: e.protectionTarget, monthlyContribution: e.monthlyPayment, riskShare: e.riskShare }));
  }, []);
  const applyAssessment = useCallback((a: RiskAssessment) => {
    setInputs((prev) => ({
      ...prev,
      protectionTarget: a.protectionTarget,
      monthlyContribution: a.monthlyPayment,
      riskShare: a.riskPoolShare,
    }));
    setAiApplied(true);
  }, []);
  const results = useMemo(() => calculateProtection(inputs), [inputs]);

  const scrollToCalculator = () => {
    document.getElementById("riskiprofiil")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="tuleva-page">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="brand-row" aria-label="Tuleva Enesekindlustus">
              <div className="brand-mark"><span>T</span></div>
              <span>Tuleva Enesekindlustus</span>
            </div>
            <h1 id="hero-title">Ehita endale kaitse.</h1>
            <p>
              Kuni 90% sinu maksest investeerub sinu isiklikusse Tuleva puhvrisse. Riskifond katab üle jääva osa vaid siis, kui seda tõesti vaja läheb.
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={scrollToCalculator}>
                Hinda minu riski <ArrowDown />
              </Button>
              <span>{"\n"}</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Näidis sinu kaitse kasvust">
            <div className="visual-header">
              <span>Tuleva puhver</span>
              <strong>{formatEuro(results.personalBuffer)}</strong>
            </div>
            <div className="visual-chart" aria-hidden="true">
              <span className="bar one"></span>
              <span className="bar two"></span>
              <span className="bar three"></span>
              <span className="bar four"></span>
              <span className="bar five"></span>
            </div>
            <div className="visual-cards">
              <div><ShieldCheck /><span>Kaitse eesmärk</span><strong>{formatEuro(inputs.protectionTarget)}</strong></div>
              <div><LineChart /><span>Investeerimistulu</span><strong>{formatEuro(results.investmentReturn)}</strong></div>
              <div><BadgeEuro /><span>Ühistu garantii</span><strong>{formatEuro(results.mutualGuarantee)}</strong></div>
            </div>
          </div>
        </div>
      </section>

      <RiskAssessmentSection onApply={applyAssessment} onProfileChange={applyProfile} surveyScore={surveyScore} />
      <SurveyRiskSection onScoreChange={setSurveyScore} />
      {aiApplied && (
        <div className="ai-applied-banner" role="status">AI soovitus on kalkulaatorisse rakendatud — saad väärtusi edasi muuta.</div>
      )}
      <Calculator inputs={inputs} results={results} onChange={setInputs} />
      <HowItWorks />
      <Certificate
        protectionTarget={inputs.protectionTarget}
        results={results}
        name={memberName}
        onNameChange={setMemberName}
      />
      <footer className="site-footer">
        Häkatoniprotoüüp. Numbrid on lihtsustatud näitlikud arvutused, mitte pakkumine.
      </footer>
    </main>
  );
}
