import { ArrowRight, CircleCheck } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { formatEuro } from "@/lib/insurance-calculations";

export function ComparisonCard({ personalBuffer }: { personalBuffer: number }) {
  return (
    <div className="comparison-grid">
      <div className="comparison-side comparison-muted">
        <span>Klassikaline elukindlustus</span>
        <strong>0 €</strong>
        <p>sinu taskus perioodi lõpus</p>
      </div>
      <div className="comparison-arrow" aria-hidden="true">
        <ArrowRight />
      </div>
      <div className="comparison-side comparison-positive">
        <span><CircleCheck /> Tuleva enesekindlustus</span>
        <strong><AnimatedNumber value={personalBuffer} format={formatEuro} /></strong>
        <p>sinu isiklikus puhvris</p>
      </div>
    </div>
  );
}