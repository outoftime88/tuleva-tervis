# Tuleva tervisekindlustus

Build a single-page web app called "Tuleva Enesekindlustus" — a self-insurance prototype for a hackathon. Estonian language UI, clean, modern fintech design (Tuleva-like: teal/green accents, generous whitespace, Inter or similar font).

Context: instead of paying an insurance company, a member builds their own personal protected savings buffer, with a small collective mutual risk pool on top. This is a demo/landing + calculator page, no backend needed — all numbers calculated client-side.

Structure of the page:

1. HERO SECTION
   - Headline: "Ära osta kindlustust. Ehita endale kaitse."
   - Subline: "Kuni 90% sinu maksest investeerub sinu isiklikusse Tuleva puhvrisse. Riskifond katab üle jääva osa vaid siis, kui seda tõesti vaja läheb."
   - CTA button: "Arvuta oma kaitse" (scrolls to calculator)

2. INTERACTIVE CALCULATOR SECTION
   Inputs (sliders or number fields):
   - Kuu makse (monthly contribution), default 100 €, range 25–500 €
   - Kaitse eesmärk (protection target required by the bank), default 100 000 €, range 20 000–300 000 €
   - Periood aastates (years), default 20, range 5–30
   - Isiklik/investeeritava osa tingimus: fixed split of 85% personal investment / 15% mutual risk pool (display this split clearly, no input needed)
   Inputs must be labeled in Estonian with helper tooltips.

   Outputs (live, recalculated instantly):
   - Isiklik puhver aasta lõpus: monthly personal share × 12 × years, with a simplified 5% annual return compounding shown as a second line ("sh. investeerimistulu")
   - Kollektiivsesse riskifondi makstud kokku
   - Kaitse oma osakaal: personal buffer / target as a percentage, shown as a progress ring or bar
   - Puudu jääv kaitse: max(0, target − personal buffer) — label it "Tuleva ühistu lisagarantii"
   - Aasta, mil isiklik puhver katab eesmärgi täielikult ("Sinu kaitse on 100% sinu oma alates aastast X") — show infinity/em-dash state if never reached
   - Comparison card: "Sama raha klassikalise elukindlustusega: 0 € sinu taskus" vs this model's accumulated personal buffer — visual side-by-side contrast

3. HOW IT WORKS SECTION
   Three numbered cards with simple icons:
   1. "Isiklik kapital" — 85% igakuisest maksest investeeritakse sinu isiklikusse fondi. Raha jääb sinu omaks ka siis, kui juhtumit ei saabu.
   2. "Kollektiivne puhver" — Kui sinu puhver ei kata kaitse eesmärki, katab puudu jääva osa Tuleva liikmete ühistuline riskifond.
   3. "Kasum jääb liikmele" — Investeerimistulu ei kao kindlustusseltsi kasumisse, vaid kasvatab sinu ja teiste liikmete vara.

4. BANK CERTIFICATE PREVIEW SECTION
   A styled mock certificate card showing:
   - "TULEVA ÜHISTU — KAITSESERTIFIKAAT"
   - Liikme nimi (editable text field)
   - Kaitstud summa (protection target from calculator, live-linked)
   - Breakdown line: "X € isiklik puhver + Y € ühistuline lisagarantii"
   - Kehtiv kuni: date (today + 1 year, auto-generated)
   - A "Laadi alla PDF" button (can be decorative for now, shows a toast "Demo: PDF allub häkatonil")

5. FOOTER
   Small text: "Häkatoniprotoüüp. Numbrid on lihtsustatud näitlikud arvutused, mitte pakkumine."

Tech notes:
- Single Next.js or Vite React app, one page, fully responsive (mobile-first)
- No login, no backend, no API keys — pure client-side demo
- All calculations in a small helper module with clear formulas so an LLM/data layer can be plugged in later
- Keep components modular (Calculator, Certificate, ComparisonCard, HowItWorks) for future iteration
- Add smooth scroll and subtle animations (e.g., animated number counters on the calculator outputs)

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a58d1652-ec7c-4169-a73e-0d7bb9510bea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
