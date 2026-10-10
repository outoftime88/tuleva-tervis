import { HelpCircle, Infinity, PiggyBank, Shield, Users } from "lucide-react";
import type { CSSProperties } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  RISK_SHARE,
  formatEuro,
  formatNumber,
  type CalculatorInputs,
  type CalculatorResults,
} from "@/lib/insurance-calculations";
import { AnimatedNumber } from "./AnimatedNumber";
import { ComparisonCard } from "./ComparisonCard";

type CalculatorProps = {
  inputs: CalculatorInputs;
  results: CalculatorResults;
  onChange: (inputs: CalculatorInputs) => void;
};

type SliderFieldProps = {
  id: string;
  label: string;
  helper: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onValueChange: (value: number) => void;
};

function SliderField({
  id,
  label,
  helper,
  value,
  min,
  max,
  step,
  suffix,
  onValueChange,
}: SliderFieldProps) {
  return (
    <div className="slider-field">
      <div className="field-head">
        <div className="field-label">
          <Label htmlFor={id}>{label}</Label>
          <span className="tooltip" tabIndex={0} aria-label={helper}>
            <HelpCircle />
          </span>
        </div>
        <strong>{suffix === "€" ? formatEuro(value) : `${formatNumber(value)} ${suffix}`}</strong>
      </div>
      <Slider
        id={id}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => {
          const [first] = next;
          if (typeof first === "number") onValueChange(first);
        }}
        aria-label={label}
      />
      <div className="range-row" aria-hidden="true">
        <span>{suffix === "€" ? formatEuro(min) : `${min} ${suffix}`}</span>
        <span>{suffix === "€" ? formatEuro(max) : `${max} ${suffix}`}</span>
      </div>
    </div>
  );
}

function ResultTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof PiggyBank;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="result-tile">
      <div className="result-icon"><Icon /></div>
      <span>{label}</span>
      <strong><AnimatedNumber value={value} format={formatEuro} /></strong>
      <p>{detail}</p>
    </div>
  );
}

export function Calculator({ inputs, results, onChange }: CalculatorProps) {
  const ownership = Math.round(results.ownershipPercent);

  return (
    <section className="section calculator-section" id="kalkulaator">
      <div className="section-inner">
        <div className="section-heading wide">
          <span className="eyebrow">Interaktiivne kalkulaator</span>
          <h2>Sinu kaitse on sinu omand.</h2>
        </div>

        <div className="calculator-layout">
          <div className="calculator-panel inputs-panel">
            <div className="split-card" aria-label="Makse jaotus">
              <div>
                <span>Isiklik puhver</span>
                <strong>{Math.round((1 - (inputs.riskShare ?? RISK_SHARE)) * 100)}%</strong>
              </div>
              <div>
                <span>Riskifond</span>
                <strong>{Math.round((inputs.riskShare ?? RISK_SHARE) * 100)}%</strong>
              </div>
            </div>

            <SliderField
              id="monthly"
              label="Kuu makse"
              helper="Summa, mida maksad iga kuu oma kaitse kasvatamiseks."
              value={inputs.monthlyContribution}
              min={25}
              max={500}
              step={5}
              suffix="€"
              onValueChange={(monthlyContribution) => onChange({ ...inputs, monthlyContribution })}
            />
            <SliderField
              id="target"
              label="Kaitse eesmärk"
              helper="Summa, mida pank või pere vajab kindlustundeks."
              value={inputs.protectionTarget}
              min={20000}
              max={300000}
              step={5000}
              suffix="€"
              onValueChange={(protectionTarget) => onChange({ ...inputs, protectionTarget })}
            />
            <SliderField
              id="years"
              label="Periood aastates"
              helper="Aeg, mille jooksul isiklik puhver kasvab."
              value={inputs.years}
              min={5}
              max={30}
              step={1}
              suffix="a"
              onValueChange={(years) => onChange({ ...inputs, years })}
            />
          </div>

          <div className="calculator-panel results-panel">
            <div className="ownership-card">
              <div className="progress-ring" style={{ "--progress": `${ownership}%` } as CSSProperties}>
                <div><strong>{ownership}%</strong><span>sinu oma</span></div>
              </div>
              <div>
                <span className="eyebrow">Kaitse oma osakaal</span>
                <h3>{ownership >= 100 ? "Eesmärk on kaetud" : "Ühistu lisagarantii katab vahe"}</h3>
                <p>
                  {results.fullyOwnedYear
                    ? `Sinu kaitse on 100% sinu oma alates aastast ${results.fullyOwnedYear}.`
                    : "Sinu kaitse ei jõua valitud piirides täielikult isiklikuks."}
                </p>
              </div>
            </div>

            <div className="results-grid">
              <ResultTile
                icon={PiggyBank}
                label="Isiklik puhver aasta lõpus"
                value={results.personalBuffer}
                detail={`sh. investeerimistulu ${formatEuro(results.investmentReturn)}`}
              />
              <ResultTile
                icon={Users}
                label="Kollektiivsesse riskifondi makstud kokku"
                value={results.riskPoolPaid}
                detail="ühistulise kaitse tugevdamiseks"
              />
              <ResultTile
                icon={Shield}
                label="Tuleva ühistu lisagarantii"
                value={results.mutualGuarantee}
                detail="puudu jääv kaitse sinu eesmärgini"
              />
            </div>

            <div className="full-year-card">
              <span>Aasta, mil isiklik puhver katab eesmärgi täielikult</span>
              <strong>{results.fullyOwnedYear ? `${results.fullyOwnedYear}. aasta` : <><Infinity /> —</>}</strong>
            </div>

            <ComparisonCard personalBuffer={results.personalBuffer} />
          </div>
        </div>
      </div>
    </section>
  );
}