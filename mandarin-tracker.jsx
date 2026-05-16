import { useState, useEffect } from "react";

const WEEKS_KEY = "mandarin-weeks-v1";
const PROG_KEY  = "mandarin-prog-v1";

function weekPhase(w) {
  if (w <= 12) return { bg: "#E6F1FB", color: "#185FA5", label: "Phase 1 · Foundations" };
  if (w <= 24) return { bg: "#E1F5EE", color: "#0F6E56", label: "Phase 2 · Core building" };
  if (w <= 48) return { bg: "#FAEEDA", color: "#854F0B", label: "Phase 3 · Intermediate" };
  return        { bg: "#FBEAF0", color: "#993556", label: "Phase 4 · Business fluency" };
}

const OVERVIEW_PHASES = [
  { label:"Phase 1", months:"Months 1–3",  bg:"#E6F1FB", color:"#185FA5", title:"Foundations",        desc:"Pinyin · 4 tones · 200 words · 50 characters",             milestone:"HSK 1 mock · Introduce yourself in Mandarin" },
  { label:"Phase 2", months:"Months 4–6",  bg:"#E1F5EE", color:"#0F6E56", title:"Core building",      desc:"Grammar patterns · 500 words · 150 characters",            milestone:"HSK 2 mock · First iTalki session · Basic small talk" },
  { label:"Phase 3", months:"Months 7–12", bg:"#FAEEDA", color:"#854F0B", title:"Intermediate",       desc:"Business vocab · 900 words · 350 characters",              milestone:"HSK 3 mock · Participate in business calls" },
  { label:"Phase 4", months:"Months 13–24",bg:"#FBEAF0", color:"#993556", title:"Business fluency",   desc:"Professional Mandarin · 2500 words · 800+ characters",     milestone:"HSK 4 exam · Lead a full meeting in Mandarin" },
];

export default function MandarinTracker() {
  const [tab,         setTab]         = useState("tracker");
  const [weeks,       setWeeks]       = useState([]);
  const [weekIdx,     setWeekIdx]     = useState(0);
  const [checked,     setChecked]     = useState({});
  const [showImport,  setShowImport]  = useState(false);
  const [importText,  setImportText]  = useState("");
  const [importErr,   setImportErr]   = useState("");
  const [ready,       setReady]       = useState(false);
  const [toast,       setToast]       = useState("");

  /* ── load ── */
  useEffect(() => {
    (async () => {
      try { const r = await window.storage.get(WEEKS_KEY); if (r) setWeeks(JSON.parse(r.value)); } catch {}
      try {
        const r = await window.storage.get(PROG_KEY);
        if (r) { const p = JSON.parse(r.value); setChecked(p.checked||{}); setWeekIdx(p.weekIdx||0); }
      } catch {}
      setReady(true);
    })();
  }, []);

  async function saveProgress(c, i) {
    try { await window.storage.set(PROG_KEY, JSON.stringify({ checked: c, weekIdx: i })); } catch {}
  }

  /* ── import ── */
  async function handleImport() {
    setImportErr("");
    try {
      const raw = JSON.parse(importText.trim());
      const arr = Array.isArray(raw) ? raw : [raw];
      const next = [...weeks];
      for (const w of arr) {
        const i = next.findIndex(x => x.week === w.week);
        if (i >= 0) next[i] = w; else next.push(w);
      }
      next.sort((a, b) => a.week - b.week);
      setWeeks(next);
      await window.storage.set(WEEKS_KEY, JSON.stringify(next));
      setImportText(""); setShowImport(false);
      flash("Imported successfully!");
    } catch { setImportErr("Invalid JSON — check the format and try again."); }
  }

  function flash(msg) { setToast(msg); setTimeout(() => setToast(""), 2500); }
  function toggle(id) { const c = { ...checked, [id]: !checked[id] }; setChecked(c); saveProgress(c, weekIdx); }
  function goWeek(i)  { setWeekIdx(i); saveProgress(checked, i); }

  /* ── derived ── */
  const cw    = weeks[weekIdx] || null;
  const tasks = cw?.tasks || [];
  const done  = tasks.filter(t => checked[t.id]).length;
  const pct   = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const allDone = tasks.length > 0 && done === tasks.length;

  /* ── shared styles ── */
  const pill = (active) => ({
    padding: "6px 16px", fontSize: 13, borderRadius: 20, cursor: "pointer",
    fontFamily: "var(--font-sans)", border: "0.5px solid " + (active ? "var(--color-text-primary)" : "var(--color-border-secondary)"),
    background: active ? "var(--color-text-primary)" : "transparent",
    color: active ? "var(--color-background-primary)" : "var(--color-text-secondary)",
  });

  if (!ready) return (
    <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 14 }}>Loading…</div>
  );

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 660, margin: "0 auto", padding: "1.5rem 1rem", position: "relative" }}>
      <h2 className="sr-only">Mandarin business learning plan tracker</h2>

      {/* Toast */}
      {toast && (
        <div style={{ position: "absolute", top: 0, right: 0, background: "var(--color-background-success)", color: "var(--color-text-success)", fontSize: 12, padding: "6px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-success)", zIndex: 10 }}>
          {toast}
        </div>
      )}

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
        <button style={pill(tab === "overview")} onClick={() => setTab("overview")}>Plan overview</button>
        <button style={pill(tab === "tracker")}  onClick={() => setTab("tracker")}>Weekly tracker</button>
      </div>

      {/* ══════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div>
          {/* Profile bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: "1.5rem" }}>
            {[["Goal","Business & career"],["Daily","15–30 min"],["Timeline","1–2 years"],["Target","HSK 4–5 / B1"],["Languages","EN + RU"]].map(([l,v]) => (
              <div key={l}>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3 }}>{l}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Phases */}
          {OVERVIEW_PHASES.map(p => (
            <div key={p.label} style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 10px", borderRadius: 20, background: p.bg, color: p.color }}>{p.label}</span>
                <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{p.months}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 }}>{p.desc}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 8 }}>
                🎯 {p.milestone}
              </div>
            </div>
          ))}

          {/* Streak notice */}
          <div style={{ marginTop: "1rem", padding: "12px 16px", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>Key habit:</strong> 15–30 min every day beats 3 hours once a week. Track each week in the Weekly tracker tab.
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TRACKER TAB
      ══════════════════════════════════════════════ */}
      {tab === "tracker" && (
        <div>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {cw ? `Week ${cw.week}: ${cw.title}` : "No weeks loaded yet"}
            </div>
            <button
              onClick={() => { setShowImport(!showImport); setImportErr(""); }}
              style={{ fontSize: 12, padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--font-sans)", border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-secondary)" }}
            >
              {showImport ? "✕ Close" : "+ Import week"}
            </button>
          </div>

          {/* Inline import panel */}
          {showImport && (
            <div style={{ marginBottom: "1rem", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", padding: "1rem", background: "var(--color-background-secondary)" }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Paste week JSON</div>
              <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", marginBottom: 8 }}>Paste one week or an array of weeks. Existing weeks will be updated in place.</div>
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={'{"week":1,"title":"Pinyin Foundations","tasks":[...]}'}
                style={{ width: "100%", minHeight: 110, fontSize: 12, fontFamily: "var(--font-mono)", padding: "8px 10px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", resize: "vertical", boxSizing: "border-box" }}
              />
              {importErr && <div style={{ fontSize: 12, color: "var(--color-text-danger)", marginTop: 6 }}>{importErr}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={handleImport} style={{ padding: "7px 20px", fontSize: 13, borderRadius: 20, cursor: "pointer", fontFamily: "var(--font-sans)", border: "none", background: "var(--color-text-primary)", color: "var(--color-background-primary)" }}>
                  Import
                </button>
                <button onClick={() => setShowImport(false)} style={{ padding: "7px 16px", fontSize: 13, borderRadius: 20, cursor: "pointer", fontFamily: "var(--font-sans)", border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-secondary)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {weeks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 2rem", border: "0.5px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)" }}>
              <div style={{ fontSize: 32, marginBottom: "0.75rem" }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No weeks loaded yet</div>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: "1.5rem", maxWidth: 280, margin: "0 auto 1.5rem" }}>
                Paste the Week 1 JSON (provided below the app) to get started.
              </div>
              <button onClick={() => setShowImport(true)} style={{ padding: "8px 22px", fontSize: 13, borderRadius: 20, cursor: "pointer", fontFamily: "var(--font-sans)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)" }}>
                Import first week →
              </button>
            </div>
          ) : (
            <>
              {/* Week pills */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: "1rem" }}>
                {weeks.map((w, i) => {
                  const ph    = weekPhase(w.week);
                  const wDone = w.tasks.every(t => checked[t.id]);
                  const isAct = i === weekIdx;
                  return (
                    <button key={w.week} onClick={() => goWeek(i)} style={{
                      padding: "4px 12px", fontSize: 12, borderRadius: 20, cursor: "pointer", fontFamily: "var(--font-sans)",
                      background: isAct ? ph.bg : "transparent",
                      color:      isAct ? ph.color : "var(--color-text-secondary)",
                      border:     "0.5px solid " + (isAct ? ph.color : "var(--color-border-tertiary)"),
                      fontWeight: isAct ? 500 : 400,
                    }}>
                      W{w.week}{wDone ? " ✓" : ""}
                    </button>
                  );
                })}
              </div>

              {/* Phase label + subtitle */}
              {cw && (() => {
                const ph = weekPhase(cw.week);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 10px", borderRadius: 20, background: ph.bg, color: ph.color }}>{ph.label}</span>
                    {cw.subtitle && <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{cw.subtitle}</span>}
                  </div>
                );
              })()}

              {/* Progress bar */}
              <div style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Progress this week</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: allDone ? "var(--color-text-success)" : "var(--color-text-primary)" }}>
                    {done}/{tasks.length}{allDone ? " — Complete! 🎉" : ""}
                  </span>
                </div>
                <div style={{ height: 4, background: "var(--color-background-secondary)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 99, width: pct + "%", transition: "width .4s ease", background: allDone ? "#22c55e" : "var(--color-text-primary)" }} />
                </div>
              </div>

              {/* Task list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tasks.map(task => {
                  const isDone = !!checked[task.id];
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggle(task.id)}
                      style={{
                        display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px",
                        borderRadius: "var(--border-radius-md)", cursor: "pointer", userSelect: "none",
                        border: "0.5px solid " + (isDone ? "var(--color-border-tertiary)" : "var(--color-border-secondary)"),
                        background: isDone ? "var(--color-background-secondary)" : "var(--color-background-primary)",
                        transition: "all .15s",
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 2,
                        border: "1.5px solid " + (isDone ? "#22c55e" : "var(--color-border-primary)"),
                        background: isDone ? "#22c55e" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                      }}>
                        {isDone && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                          {task.day && (
                            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)", border: "0.5px solid var(--color-border-tertiary)", fontWeight: 500 }}>
                              {task.day}
                            </span>
                          )}
                          {task.tool && (
                            <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 8, background: "var(--color-background-info)", color: "var(--color-text-info)" }}>
                              {task.tool}
                            </span>
                          )}
                          <span style={{ fontSize: 13, fontWeight: 500, textDecoration: isDone ? "line-through" : "none", color: isDone ? "var(--color-text-tertiary)" : "var(--color-text-primary)", transition: "all .15s" }}>
                            {task.title}
                          </span>
                        </div>
                        {task.desc && (
                          <div style={{ fontSize: 12, color: isDone ? "var(--color-text-tertiary)" : "var(--color-text-secondary)", lineHeight: 1.6 }}>
                            {task.desc}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next week prompt */}
              {allDone && weekIdx < weeks.length - 1 && (
                <div style={{ marginTop: "1rem", padding: "12px 16px", borderRadius: "var(--border-radius-md)", background: "var(--color-background-success)", border: "0.5px solid var(--color-border-success)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--color-text-success)" }}>
                    Great work! Ready for Week {weeks[weekIdx + 1]?.week}?
                  </span>
                  <button onClick={() => goWeek(weekIdx + 1)} style={{ fontSize: 12, padding: "5px 16px", borderRadius: 20, cursor: "pointer", fontFamily: "var(--font-sans)", border: "none", background: "#22c55e", color: "white" }}>
                    Start Week {weeks[weekIdx + 1]?.week} →
                  </button>
                </div>
              )}

              {/* All weeks done */}
              {allDone && weekIdx === weeks.length - 1 && (
                <div style={{ marginTop: "1rem", padding: "12px 16px", borderRadius: "var(--border-radius-md)", background: "var(--color-background-success)", border: "0.5px solid var(--color-border-success)", fontSize: 13, color: "var(--color-text-success)" }}>
                  🎉 All loaded weeks complete! Import the next week's plan to continue.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
