"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [rules, setRules] = useState<any>(null);
  const [msg, setMsg] = useState<{ status: "idle" | "saving" | "success" | "error"; text: string }>({
    status: "idle",
    text: "",
  });

  useEffect(() => {
    fetch("/api/config/rules")
      .then((r) => r.json())
      .then(setRules);
  }, []);

  if (!rules) {
    return (
      <div className="bento-surface-card" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>⚙️</div>
        <h3 style={{ fontSize: 20, fontWeight: 800 }}>Loading Rule Configuration...</h3>
        <p style={{ color: "var(--text-muted)", marginTop: 4 }}>Fetching dynamic config parameters from Next.js server runtime</p>
      </div>
    );
  }

  const save = async () => {
    setMsg({ status: "saving", text: "Updating rules with Bearer admin-token..." });
    try {
      const payload = {
        passMarks: {
          theory: +rules.passMarks.theory,
          practical: +rules.passMarks.practical,
        },
        gpa: {
          divisor: +rules.gpa.divisor,
          cap: +rules.gpa.cap,
          optionalDeduction: +rules.gpa.optionalDeduction,
        },
        gradingScale: rules.gradingScale,
      };
      const r = await fetch("/api/config/rules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-token",
        },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (r.ok) {
        setMsg({ status: "success", text: "✅ Configuration saved successfully to config/rules.json!" });
      } else {
        setMsg({ status: "error", text: `❌ Error: ${j.error || "Failed to save"}` });
      }
    } catch (e: any) {
      setMsg({ status: "error", text: `❌ Network error: ${e.message}` });
    }
  };

  return (
    <div>
      {/* Topbar Headline */}
      <div className="workspace-subheader">
        <div>
          <h1 className="hero-welcome-title">Rule Engine Configuration</h1>
          <p className="hero-welcome-sub">
            Deterministic GPA Engine Thresholds, Formula Constants & Grading Scale (config/rules.json)
          </p>
        </div>

        <div className="subheader-pill-controls">
          <Link href="/" className="pill-action-button dark">
            ← Back to Dashboard
          </Link>
          <button className="pill-action-button emerald" onClick={save} type="button">
            <span>💾 Save Rule Parameters</span>
          </button>
        </div>
      </div>

      <div className="bento-surface-card admin-config-card" style={{ marginTop: 20 }}>
        <div className="bento-card-topbar">
          <div>
            <div className="bento-header-title">Dynamic Rule Engine Parameters</div>
            <div className="bento-header-sub">Rule adjustments take effect live on the Next.js runtime</div>
          </div>
          <span className="status-pill-badge pass" style={{ fontSize: 13 }}>
            Version: {rules.version || "1.0.0"}
          </span>
        </div>

        <div className="admin-config-grid">
          {/* Left Column: Form Thresholds */}
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 18, color: "var(--text-main)" }}>
              Thresholds & Formula Constants
            </h4>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Theory Minimum Pass Mark (R-10/R-12)
              </label>
              <input className="config-input"
                type="number"
                style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "#F9FAFB", fontSize: 14, fontWeight: 600 }}
                value={rules.passMarks.theory}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    passMarks: { ...rules.passMarks, theory: +e.target.value },
                  })
                }
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Practical Minimum Pass Mark (R-10)
              </label>
              <input className="config-input"
                type="number"
                style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "#F9FAFB", fontSize: 14, fontWeight: 600 }}
                value={rules.passMarks.practical}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    passMarks: { ...rules.passMarks, practical: +e.target.value },
                  })
                }
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                GPA Divisor (Compulsory Subjects Count)
              </label>
              <input className="config-input"
                type="number"
                style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "#F9FAFB", fontSize: 14, fontWeight: 600 }}
                value={rules.gpa.divisor}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    gpa: { ...rules.gpa, divisor: +e.target.value },
                  })
                }
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                GPA Cap (Maximum Allowed GPA)
              </label>
              <input className="config-input"
                type="number"
                step="0.01"
                style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "#F9FAFB", fontSize: 14, fontWeight: 600 }}
                value={rules.gpa.cap}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    gpa: { ...rules.gpa, cap: +e.target.value },
                  })
                }
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                Optional Subject Deduction Threshold
              </label>
              <input className="config-input"
                type="number"
                step="0.1"
                style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "#F9FAFB", fontSize: 14, fontWeight: 600 }}
                value={rules.gpa.optionalDeduction}
                onChange={(e) =>
                  setRules({
                    ...rules,
                    gpa: { ...rules.gpa, optionalDeduction: +e.target.value },
                  })
                }
              />
            </div>

            {msg.text && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  fontWeight: 700,
                  marginTop: 16,
                  background:
                    msg.status === "success"
                      ? "var(--ok-bg)"
                      : msg.status === "error"
                      ? "var(--bad-bg)"
                      : "#F3F4F6",
                  color:
                    msg.status === "success"
                      ? "var(--ok)"
                      : msg.status === "error"
                      ? "var(--bad)"
                      : "var(--text-main)",
                  border:
                    msg.status === "success"
                      ? "1px solid var(--ok-border)"
                      : msg.status === "error"
                      ? "1px solid var(--bad-border)"
                      : "1px solid var(--border)",
                }}
              >
                {msg.text}
              </div>
            )}
          </div>

          {/* Right Column: Grading Scale Schema */}
          <div>
            <h4 style={{ fontSize: 15, fontWeight: 800, marginBottom: 18, color: "var(--text-main)" }}>
              Grading Scale (JSON Schema)
            </h4>
            <textarea className="config-editor"
              rows={16}
              style={{ width: "100%", padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "#F9FAFB", fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-main)", resize: "vertical" }}
              value={JSON.stringify(rules.gradingScale, null, 2)}
              onChange={(e) => {
                try {
                  setRules({ ...rules, gradingScale: JSON.parse(e.target.value) });
                } catch {}
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 8 }}>
              Configure mark boundaries, letter grade strings, and corresponding numerical grade points (0.0 to 5.0).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
