import { SECTIONS, hasAlarmSymptom, visible, type Answers } from "@/lib/colorectal-questionnaire";

type Props = { answers: Answers; onChange: (a: Answers) => void; disabled?: boolean };

export function HealthQuestionnaire({ answers, onChange, disabled }: Props) {
  const set = (id: string, v: string | string[]) => onChange({ ...answers, [id]: v });
  const alarm = hasAlarmSymptom(answers);

  return (
    <div className="questionnaire">
      {SECTIONS.map((s, si) => (
        <fieldset key={s.title} className="q-section" disabled={disabled}>
          <legend>{s.title}</legend>
          {s.note && (si !== 0 || alarm) && <p className={`q-note ${si === 0 ? "alarm" : ""}`}>{s.note}</p>}
          {s.questions.filter((q) => visible(q, answers)).map((q) => (
            <div key={q.id} className="q-row">
              <span className="q-label">{q.label}</span>
              {q.hint && <span className="q-hint">{q.hint}</span>}
              {q.type === "number" ? (
                <input
                  type="number"
                  inputMode="numeric"
                  className="q-input"
                  min={q.min}
                  max={q.max}
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                  aria-label={q.label}
                />
              ) : (
                <div className="chip-row" role={q.type === "single" ? "radiogroup" : "group"} aria-label={q.label}>
                  {q.options.map((o) => {
                    const cur = answers[q.id];
                    const on = q.type === "multi" ? Array.isArray(cur) && cur.includes(o) : cur === o;
                    return (
                      <button
                        type="button"
                        key={o}
                        className={`chip ${on ? "active" : ""}`}
                        aria-pressed={on}
                        onClick={() => {
                          if (q.type === "single") return set(q.id, on ? "" : o);
                          const arr = Array.isArray(cur) ? cur : [];
                          const exclusive = ["ei ühtegi", "ei", "ei tea"];
                          let next = on ? arr.filter((x) => x !== o) : [...arr, o];
                          if (!on) next = exclusive.includes(o) ? [o] : next.filter((x) => !exclusive.includes(x));
                          set(q.id, next);
                        }}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
