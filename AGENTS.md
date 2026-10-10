<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep the Tuleva Enesekindlustus experience modular by separating calculation logic from page sections; this makes future data-layer or LLM integrations safer.
- AI risk assessment runs in a server function (src/lib/risk-assessment.functions.ts) calling the AI gateway with a strict JSON schema; its output only pre-fills calculator inputs, so all money math stays in insurance-calculations.ts.
