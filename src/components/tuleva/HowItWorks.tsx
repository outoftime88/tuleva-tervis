import { Coins, ShieldCheck, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Coins,
    title: "Isiklik kapital",
    text: "85% igakuisest maksest investeeritakse sinu isiklikusse fondi. Raha jääb sinu omaks ka siis, kui juhtumit ei saabu.",
  },
  {
    icon: ShieldCheck,
    title: "Kollektiivne puhver",
    text: "Kui sinu puhver ei kata kaitse eesmärki, katab puudu jääva osa Tuleva liikmete ühistuline riskifond.",
  },
  {
    icon: TrendingUp,
    title: "Kasum jääb liikmele",
    text: "Investeerimistulu ei kao kindlustusseltsi kasumisse, vaid kasvatab sinu ja teiste liikmete vara.",
  },
];

export function HowItWorks() {
  return (
    <section className="section section-soft" id="toimimine">
      <div className="section-inner">
        <div className="section-heading">
          <span className="eyebrow">Liikme kasuks loodud</span>
          <h2>Kuidas enesekindlustus töötab?</h2>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article className="step-card" key={step.title}>
                <div className="step-top">
                  <span className="step-number">0{index + 1}</span>
                  <span className="step-icon"><Icon /></span>
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}