import { Download, Landmark, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEuro, type CalculatorResults } from "@/lib/insurance-calculations";

type CertificateProps = {
  protectionTarget: number;
  results: CalculatorResults;
  name: string;
  onNameChange: (name: string) => void;
};

function expiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return new Intl.DateTimeFormat("et-EE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function Certificate({ protectionTarget, results, name, onNameChange }: CertificateProps) {
  const ownPart = Math.min(results.personalBuffer, protectionTarget);

  return (
    <section className="section certificate-section" id="sertifikaat">
      <div className="section-inner certificate-layout">
        <div className="certificate-copy">
          <span className="eyebrow">Pangale esitamiseks</span>
          <h2>Sinu kaitse, selgelt tõendatud.</h2>
          <p>
            Sertifikaat näitab pangale ühe pilguga sinu kogukaitset, isiklikku puhvrit ja ühistu lisagarantiid.
          </p>
        </div>

        <div className="certificate-card">
          <div className="certificate-watermark"><ShieldCheck /></div>
          <header className="certificate-header">
            <div className="brand-mark small"><span>T</span></div>
            <div>
              <span>TULEVA ÜHISTU</span>
              <strong>KAITSESERTIFIKAAT</strong>
            </div>
            <Landmark aria-hidden="true" />
          </header>

          <div className="certificate-body">
            <label htmlFor="member-name">Liikme nimi</label>
            <Input
              id="member-name"
              value={name}
              placeholder="Sisesta liikme nimi"
              onChange={(event) => onNameChange(event.target.value)}
              className="certificate-name"
            />

            <div className="certificate-amount">
              <span>Kaitstud summa</span>
              <strong>{formatEuro(protectionTarget)}</strong>
            </div>

            <div className="certificate-breakdown">
              <div><span>Isiklik puhver</span><strong>{formatEuro(ownPart)}</strong></div>
              <span className="plus">+</span>
              <div><span>Ühistuline lisagarantii</span><strong>{formatEuro(results.mutualGuarantee)}</strong></div>
            </div>

            <div className="certificate-footer">
              <div><span>Kehtiv kuni</span><strong>{expiryDate()}</strong></div>
              <span className="verified"><ShieldCheck /> Digitaalselt kinnitatud</span>
            </div>
          </div>

          <Button
            className="certificate-download"
            onClick={() => toast.success("Demo: PDF valmib häkatonil")}
          >
            <Download /> Laadi alla PDF
          </Button>
        </div>
      </div>
    </section>
  );
}