"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

type Summary = { 
  case_id: string; 
  total: number; 
  passed: number; 
  failed: number; 
  optionalFlagged: number; 
  practicalFailed: number; 
  absent: number;
};

type Student = {
  id: string; 
  name: string; 
  class: string; 
  optional: string;
  gpa: { 
    finalGPADisplay: string; 
    letter: string; 
    uncappedDisplay: string; 
    failureCause: string | null; 
    failureCauseTrace: { rule: string; markUsed: string } | null; 
    hasCompulsoryFail: boolean; 
    sumCompulsory: number; 
    optionalContribution: number; 
    rawUncapped: number 
  };
  isFail: boolean; 
  result: string; 
  optionalGP: number; 
  checkingListKeys: string[];
  subjectTraces: { 
    code: string; 
    type: string; 
    hasPractical: boolean; 
    markUsed: string; 
    total: number|null; 
    gradePoint: number; 
    isFail: boolean; 
    isAbsent: boolean; 
    rule: string 
  }[];
  optionalTrace: { 
    code: string; 
    markUsed: string; 
    gradePoint: number; 
    contribution: number; 
    contributes: string; 
    rule: string; 
    isAbsent: boolean 
  };
};

const VERIFIERS = [
  { initial: "A", name: "Afridi", role: "Audit Specialist", color: "#FFAB00" },
  { initial: "K", name: "Kamal", role: "QA Lead", color: "#0065FF" },
  { initial: "R", name: "Rafiq", role: "Examination Controller", color: "#6554C0" },
  { initial: "S", name: "Sujon", role: "Lead Verifier (You)", color: "#00875A" },
];

export default function Dashboard({ initialTab = "results" }: { initialTab?: "results" | "checking" }) {
  const router = useRouter();
  const [cases, setCases] = useState<Summary[]>([]);
  const [current, setCurrent] = useState<string>("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [results, setResults] = useState<Student[]>([]);
  const [checking, setChecking] = useState<any>(null);
  const [q, setQ] = useState("");
  const [filterRes, setFilterRes] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterList, setFilterList] = useState("");
  const [drawer, setDrawer] = useState<Student | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [signedOff, setSignedOff] = useState(false);
  const [tab, setTab] = useState<"results" | "checking">(initialTab);
  const [chartView, setChartView] = useState<"distribution" | "summary">("distribution");

  useEffect(() => setTab(initialTab), [initialTab]);

  useEffect(() => {
    fetch("/api/cases")
      .then((r) => r.json())
      .then((d) => {
        setCases(d.cases || []);
        const first = d.cases?.[0]?.case_id;
        if (first) setCurrent(first);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!current) return;
    Promise.all([
      fetch(`/api/cases/${encodeURIComponent(current)}/results`).then((r) => r.json()),
      fetch(`/api/cases/${encodeURIComponent(current)}/checking-lists`).then((r) => r.json()),
    ]).then(([res, chk]) => {
      setSummary(res.summary);
      setResults(res.results || []);
      setChecking(chk);
    });
  }, [current]);

  const filtered = useMemo(() => {
    return results.filter((r) => {
      if (q && !`${r.id} ${r.name}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (filterRes === "PASS" && r.isFail) return false;
      if (filterRes === "FAIL" && !r.isFail) return false;
      if (filterGrade && r.gpa.letter !== filterGrade) return false;
      if (filterList && !r.checkingListKeys.includes(filterList)) return false;
      return true;
    });
  }, [results, q, filterRes, filterGrade, filterList]);

  // Calculate dynamic Grade Tier distribution for Chart
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = { "A+": 0, "A": 0, "A-": 0, "B": 0, "C": 0, "D": 0, "F": 0 };
    results.forEach((r) => {
      const grade = r.gpa.letter || (r.isFail ? "F" : "A");
      if (counts[grade] !== undefined) counts[grade]++;
      else counts["F"]++;
    });
    const total = results.length || 1;
    return Object.entries(counts).map(([grade, count]) => ({
      grade,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [results]);

  const maxGradePct = useMemo(() => {
    return Math.max(...gradeDistribution.map((g) => g.pct), 1);
  }, [gradeDistribution]);

  // Calculate average GPA
  const avgGPA = useMemo(() => {
    if (!results.length) return "0.00";
    const sum = results.reduce((acc, r) => acc + (parseFloat(r.gpa.finalGPADisplay) || 0), 0);
    return (sum / results.length).toFixed(2);
  }, [results]);

  const passRate = useMemo(() => {
    if (!summary || !summary.total) return "0%";
    return `${Math.round((summary.passed / summary.total) * 100)}%`;
  }, [summary]);

  const totalFlaggedCount = useMemo(() => {
    return (summary?.optionalFlagged || 0) + (summary?.practicalFailed || 0) + (summary?.absent || 0);
  }, [summary]);

  // Handler for clicking Pass Only / Fail Only buttons
  const handlePassFilterClick = () => {
    const nextVal = filterRes === "PASS" ? "" : "PASS";
    setFilterRes(nextVal);
    setFilterGrade("");
    setTab("results");
    if (nextVal) {
      setTimeout(() => {
        document.getElementById("ledger")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  const handleFailFilterClick = () => {
    const nextVal = filterRes === "FAIL" ? "" : "FAIL";
    setFilterRes(nextVal);
    setFilterGrade("");
    setTab("results");
    if (nextVal) {
      setTimeout(() => {
        document.getElementById("ledger")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  // Handler for clicking grade bars in chart
  const handleGradeBarClick = (grade: string) => {
    const nextGrade = filterGrade === grade ? "" : grade;
    setFilterGrade(nextGrade);
    setFilterRes("");
    setTab("results");
    if (nextGrade) {
      setTimeout(() => {
        document.getElementById("ledger")?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  const handleAuditCategoryFilter = (categoryKey: string) => {
    setFilterList(categoryKey);
    setFilterRes("");
    setFilterGrade("");
    setAuditModalOpen(false);
    setTab("results");
    setTimeout(() => {
      document.getElementById("ledger")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Subheader Banner */}
      <div className="workspace-subheader">
        <div>
          <h1 className="hero-welcome-title">Welcome Back, Sujon</h1>
          <p className="hero-welcome-sub">
            Academic Session 2025–2026 • Verified Deterministic GPA Engine R-11/R-12/R-13
          </p>
        </div>

        <div className="subheader-pill-controls">
          {/* Custom Date / Case Pill Selector */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <select
              className="custom-case-pill-select"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            >
              {cases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  Batch {c.case_id} — {c.total} Candidates
                </option>
              ))}
            </select>
            <span style={{ position: "absolute", right: 14, pointerEvents: "none", fontSize: 10, color: "var(--text-muted)" }}>▼</span>
          </div>

          {/* Export CSV Pill Button */}
          <a
            href={current ? `/api/cases/${encodeURIComponent(current)}/csv` : "#"}
            target="_blank"
            rel="noreferrer"
            className="pill-action-button dark"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Export CSV</span>
          </a>

          {/* View Tab Toggle */}
          <div style={{ display: "inline-flex", background: "#FFFFFF", padding: 3, borderRadius: "var(--radius-full)", border: "1px solid var(--border)", boxShadow: "var(--shadow-float)" }}>
            <button
              onClick={() => router.push("/ledger")}
              className={`chart-toggle-pill ${tab === "results" ? "active" : ""}`}
            >
              Student Ledger
            </button>
            <button
              onClick={() => router.push("/checking")}
              className={`chart-toggle-pill ${tab === "checking" ? "active" : ""}`}
            >
              Checking Lists ({totalFlaggedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Top 3-Column Bento Grid */}
      <div className="bento-container-grid">
        {/* Card 1: Emerald Result Certification Card */}
        <div className="bento-surface-card">
          <div className="bento-card-topbar">
            <div>
              <div className="bento-header-title">Certification Goal</div>
              <div className="bento-header-sub">Total batch candidates goal</div>
            </div>
            <button className="diagonal-arrow-btn" onClick={() => setTab("results")} title="View Ledger">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </button>
          </div>

          <div className="emerald-credit-card">
            <div className="credit-card-orbit"></div>
            <div className="credit-card-chip-bar">
              <span className="credit-card-brand-label">RESULTIQ PASS</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/>
                <line x1="2" y1="20" x2="2.01" y2="20"/>
              </svg>
            </div>
            <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 600 }}>Batch Pass Rate</div>
            <div className="credit-card-large-stat">{passRate} Pass</div>
            <div className="credit-card-meta-bar">
              <span>•••• {current || "PUB-01"}</span>
              <span>SESSION 2026</span>
            </div>
          </div>

          <div className="stat-row-below-card">
            <div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Batch Avg GPA</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)", letterSpacing: -0.3 }}>{avgGPA} GPA</div>
            </div>
            <span className="status-pill-badge pass">+12.8% vs Target</span>
          </div>
        </div>

        {/* Card 2: Grade Distribution Bar Chart */}
        <div className="bento-surface-card">
          <div className="bento-card-topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" x2="16" y1="21" y2="21"/>
                <line x1="12" x2="12" y1="17" y2="21"/>
              </svg>
              <div>
                <div className="bento-header-title">Grade Distribution</div>
                <div className="bento-header-sub">{filterGrade ? `Filtered by Grade ${filterGrade} (Click to clear)` : "Student performance distribution"}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="chart-toggle-pill-group">
                <button
                  className={`chart-toggle-pill ${chartView === "distribution" ? "active" : ""}`}
                  onClick={() => setChartView("distribution")}
                >
                  Grade Tiers
                </button>
                <button
                  className={`chart-toggle-pill ${chartView === "summary" ? "active" : ""}`}
                  onClick={() => setChartView("summary")}
                >
                  Pass/Fail
                </button>
              </div>
              <button className="diagonal-arrow-btn" onClick={() => setTab("results")} title="View Ledger">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"/>
                  <polyline points="7 7 17 7 17 17"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="chart-bars-viewport">
            {chartView === "distribution" ? (
              gradeDistribution.map((item) => {
                const heightPct = Math.max(14, Math.round((item.pct / maxGradePct) * 100));
                const isPeak = item.pct === maxGradePct && item.pct > 0;
                const isSelected = filterGrade === item.grade;
                return (
                  <div
                    key={item.grade}
                    className="chart-bar-pillar"
                    title={`Click to filter: Grade ${item.grade} (${item.count} students, ${item.pct}%)`}
                    onClick={() => handleGradeBarClick(item.grade)}
                  >
                    {isPeak && !isSelected && <div className="bar-badge-floating">+{item.pct}%</div>}
                    {isSelected && <div className="bar-badge-floating" style={{ background: "var(--primary-emerald)" }}>Selected ({item.count})</div>}
                    <div
                      className={`bar-pill-tube ${isPeak || isSelected ? "highlight" : ""}`}
                      style={{
                        height: `${heightPct}%`,
                        background: isSelected ? "var(--primary-emerald-dark)" : undefined,
                      }}
                    ></div>
                    <span className="bar-axis-text" style={{ color: isSelected ? "var(--primary-emerald)" : undefined, fontWeight: isSelected ? 900 : 700 }}>
                      {item.grade}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ width: "100%", display: "flex", gap: 24, alignItems: "flex-end", height: "100%", paddingBottom: 10 }}>
                <div className="chart-bar-pillar" style={{ flex: 1 }} onClick={handlePassFilterClick}>
                  <div className="bar-badge-floating">Passed ({summary?.passed || 0})</div>
                  <div className="bar-pill-tube highlight" style={{ height: `${summary?.total ? Math.round((summary.passed / summary.total) * 100) : 80}%`, background: "var(--primary-emerald)" }}></div>
                  <span className="bar-axis-text">PASS ({passRate})</span>
                </div>
                <div className="chart-bar-pillar" style={{ flex: 1 }} onClick={handleFailFilterClick}>
                  <div className="bar-badge-floating" style={{ background: "var(--bad)" }}>Failed ({summary?.failed || 0})</div>
                  <div className="bar-pill-tube" style={{ height: `${summary?.total ? Math.max(16, Math.round((summary.failed / summary.total) * 100)) : 20}%`, background: "var(--bad)" }}></div>
                  <span className="bar-axis-text">FAIL</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Stacked Right Metric Widgets */}
        <div className="right-stacked-widgets">
          {/* Top Metric: Candidate Status & Pass/Fail Filters */}
          <div className="mini-widget-card">
            <div className="bento-card-topbar" style={{ marginBottom: 0 }}>
              <div>
                <div className="bento-header-title">Candidate Status</div>
                <div className="bento-header-sub">Evaluation ledger count</div>
              </div>
              <button className="diagonal-arrow-btn" onClick={() => setTab("results")} title="View Ledger">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"/>
                  <polyline points="7 7 17 7 17 17"/>
                </svg>
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: 4 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>
                {filterRes === "FAIL" ? "Failed Candidates" : "Passed Candidates"}
              </div>
              <div className="sparkline-number-display">
                {filterRes === "FAIL" ? (summary?.failed || 0) : (summary?.passed || 0)}{" "}
                <span style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 500 }}>
                  / {summary?.total || 0}
                </span>
              </div>
            </div>

            {/* Smooth Wave Area Chart */}
            <svg className="sparkline-svg-view" viewBox="0 0 260 50">
              <defs>
                <linearGradient id="quixoticWaveGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00875A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00875A" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 38 Q 35 12, 70 28 T 140 14 T 210 32 T 260 18 L 260 50 L 0 50 Z"
                fill="url(#quixoticWaveGrad2)"
              />
              <path
                d="M 0 38 Q 35 12, 70 28 T 140 14 T 210 32 T 260 18"
                fill="none"
                stroke="#00875A"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>

            {/* Duo Action Filter Buttons */}
            <div className="duo-filter-buttons">
              <button
                type="button"
                className={`mini-filter-pill-btn ${filterRes === "PASS" ? "active-green" : ""}`}
                onClick={handlePassFilterClick}
                style={{ background: filterRes === "PASS" ? "var(--primary-emerald)" : undefined, color: filterRes === "PASS" ? "#FFFFFF" : undefined }}
              >
                {filterRes === "PASS" ? "✓ Pass Only ↑" : "Pass Only ↑"}
              </button>
              <button
                type="button"
                className={`mini-filter-pill-btn ${filterRes === "FAIL" ? "active-red" : ""}`}
                onClick={handleFailFilterClick}
              >
                {filterRes === "FAIL" ? "✓ Fail Only ↓" : "Fail Only ↓"}
              </button>
            </div>
          </div>

          {/* Middle Metric: Audit & Checking Lists Flagged (Interactive Feature Card) */}
          <div
            className="mini-widget-card"
            style={{
              cursor: "pointer",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onClick={() => setAuditModalOpen(true)}
            title="Click to open Audit & Checking Lists Verification Console"
          >
            <div className="bento-card-topbar" style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-secondary)" }}>
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <line x1="2" x2="22" y1="10" y2="10"/>
                </svg>
                <div>
                  <div className="bento-header-title">Audit & Checking Lists</div>
                  <div className="bento-header-sub">Anomalies requiring sign-off</div>
                </div>
              </div>
              <button
                type="button"
                className="diagonal-arrow-btn"
                style={{ width: 26, height: 26 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setAuditModalOpen(true);
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="7" y1="17" x2="17" y2="7"/>
                  <polyline points="7 7 17 7 17 17"/>
                </svg>
              </button>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "6px 0 2px" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", letterSpacing: -0.5, fontFamily: "'JetBrains Mono', monospace" }}>
                {totalFlaggedCount} Flagged
              </div>
              <span className="status-pill-badge pass">
                {signedOff ? "✓ Verified" : "+12.8%"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Lead Verifiers</span>
              <div className="avatar-stack-group">
                {VERIFIERS.map((v) => (
                  <div
                    key={v.initial}
                    className="stacked-avatar-item"
                    style={{ background: v.color }}
                    title={`${v.name} • ${v.role}`}
                  >
                    {v.initial}
                  </div>
                ))}
                <div className="stacked-avatar-item av-more" title="2 Board Observers (MoE, Exam Board)">+2</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive performance intelligence */}
      <section className="insights-grid" aria-label="Performance intelligence">
        <div className="insight-card performance-ring-card">
          <div className="insight-heading">
            <div>
              <span className="insight-kicker">Live outcome</span>
              <h2>Batch performance</h2>
            </div>
            <span className="live-data-pill"><i /> Live data</span>
          </div>
          <div className="ring-content">
            <button
              className="performance-ring"
              style={{ "--pass-angle": `${summary?.total ? (summary.passed / summary.total) * 360 : 0}deg` } as React.CSSProperties}
              onClick={handlePassFilterClick}
              type="button"
              aria-label={`Filter ${summary?.passed || 0} passing students`}
            >
              <span><strong>{passRate}</strong><small>pass rate</small></span>
            </button>
            <div className="ring-legend">
              <button type="button" onClick={handlePassFilterClick} className={filterRes === "PASS" ? "selected" : ""}>
                <i className="legend-dot pass-dot" /><span>Passed</span><strong>{summary?.passed || 0}</strong>
              </button>
              <button type="button" onClick={handleFailFilterClick} className={filterRes === "FAIL" ? "selected" : ""}>
                <i className="legend-dot fail-dot" /><span>Needs review</span><strong>{summary?.failed || 0}</strong>
              </button>
            </div>
          </div>
        </div>

        <div className="insight-card grade-bars-card">
          <div className="insight-heading">
            <div>
              <span className="insight-kicker">Grade profile</span>
              <h2>Performance by tier</h2>
            </div>
            <span className="insight-hint">Select a bar to filter</span>
          </div>
          <div className="horizontal-grade-bars">
            {gradeDistribution.map((item) => (
              <button
                type="button"
                key={item.grade}
                onClick={() => handleGradeBarClick(item.grade)}
                className={filterGrade === item.grade ? "selected" : ""}
                title={`${item.count} students earned ${item.grade}`}
              >
                <span className="grade-label">{item.grade}</span>
                <span className="grade-track"><i style={{ width: `${Math.max(item.pct, item.count ? 3 : 0)}%` }} /></span>
                <strong>{item.count}</strong>
                <small>{item.pct}%</small>
              </button>
            ))}
          </div>
        </div>

        <div className="insight-card audit-pulse-card">
          <div className="insight-heading">
            <div>
              <span className="insight-kicker">Quality controls</span>
              <h2>Audit pulse</h2>
            </div>
            <strong className="audit-total">{totalFlaggedCount}</strong>
          </div>
          <div className="audit-meter-list">
            {[
              ["Optional review", summary?.optionalFlagged || 0, "optional", "emerald"],
              ["Practical fail", summary?.practicalFailed || 0, "practical", "coral"],
              ["Absent record", summary?.absent || 0, "absent", "blue"],
            ].map(([label, value, key, tone]) => (
              <button type="button" key={String(key)} onClick={() => handleAuditCategoryFilter(String(key))}>
                <span><b>{label}</b><strong>{value}</strong></span>
                <i className={`audit-meter ${tone}`}><em style={{ width: `${Math.max(4, (Number(value) / Math.max(totalFlaggedCount, 1)) * 100)}%` }} /></i>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Full-Width Student Ledger Table */}
      {tab === "results" ? (
        <div className="ledger-bento-card" id="ledger">
          <div className="ledger-card-header-bar">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>
                  Student Ledger & Evaluation Records
                </h2>
                {/* Active Filter Pill Badge */}
                {(filterRes || filterGrade || filterList || q) && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--ok-bg)", border: "1px solid var(--ok-border)", padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 700, color: "var(--ok)" }}>
                    <span>
                      Active: {filterRes ? `Status: ${filterRes}` : ""} {filterGrade ? `Grade: ${filterGrade}` : ""} {filterList ? `List: ${filterList}` : ""} {q ? `"${q}"` : ""} ({filtered.length} found)
                    </span>
                    <button
                      onClick={() => { setFilterRes(""); setFilterGrade(""); setFilterList(""); setQ(""); }}
                      style={{ border: "none", background: "transparent", cursor: "pointer", fontWeight: 800, color: "var(--bad)", fontSize: 14, lineHeight: 1 }}
                      title="Clear Filter"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                Recent student evaluations ({filtered.length} of {results.length} candidates)
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {/* Search Bar */}
              <div className="ledger-search-pill-wrapper">
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search student id or name..."
                  className="ledger-search-pill-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="filter-select-pill-box"
                value={filterRes}
                onChange={(e) => { setFilterRes(e.target.value); setFilterGrade(""); }}
              >
                <option value="">All Statuses</option>
                <option value="PASS">PASS only</option>
                <option value="FAIL">FAIL only</option>
              </select>

              {/* Grade Filter */}
              <select
                className="filter-select-pill-box"
                value={filterGrade}
                onChange={(e) => { setFilterGrade(e.target.value); setFilterRes(""); }}
              >
                <option value="">All Grades</option>
                <option value="A+">A+ (5.00)</option>
                <option value="A">A (4.00)</option>
                <option value="A-">A- (3.50)</option>
                <option value="B">B (3.00)</option>
                <option value="C">C (2.00)</option>
                <option value="D">D (1.00)</option>
                <option value="F">F (0.00)</option>
              </select>

              {/* Checking List Filter */}
              <select
                className="filter-select-pill-box"
                value={filterList}
                onChange={(e) => setFilterList(e.target.value)}
              >
                <option value="">All Audit Lists</option>
                <option value="optional">On Optional list</option>
                <option value="practical">On Practical list</option>
                <option value="absent">On Absent list</option>
              </select>
            </div>
          </div>

          <div className="table-glass-container">
            <table className="executive-data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>ID</th>
                  <th>Class</th>
                  <th>Opt</th>
                  <th>GPA</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Uncapped</th>
                  <th>Audit Cause</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} onClick={() => setDrawer(r)}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="candidate-avatar-item" style={{ background: i % 3 === 0 ? "#FFEBE6" : i % 3 === 1 ? "#EAE6FF" : "#DEEBFF", color: i % 3 === 0 ? "#DE350B" : i % 3 === 1 ? "#5243AA" : "#0747A6" }}>
                          {r.name.charAt(0) || "S"}
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, color: "var(--text-main)" }}>{r.name}</span>
                          <div style={{ fontSize: 10, color: "var(--ok)", fontWeight: 700 }}>+18.67%</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)", fontWeight: 600 }}>{r.id}</span>
                    </td>
                    <td>{r.class}</td>
                    <td>
                      <span className="letter-grade-pill">{r.optional}</span>
                    </td>
                    <td>
                      <span className="gpa-monospace-value">{r.gpa.finalGPADisplay}</span>
                    </td>
                    <td>
                      <span className="letter-grade-pill" style={{ fontWeight: 800 }}>{r.gpa.letter}</span>
                    </td>
                    <td>
                      <span className={`status-pill-badge ${r.isFail ? "fail" : "pass"}`}>
                        ● {r.isFail ? "Failed" : "Successful"}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "var(--text-secondary)", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{r.gpa.uncappedDisplay}</span>
                    </td>
                    <td>
                      {r.gpa.failureCause ? (
                        <span style={{ color: "var(--bad)", fontWeight: 700, fontSize: 11 }}>
                          {r.gpa.failureCause}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pill-action-button emerald"
                        style={{ padding: "6px 14px", fontSize: 11 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDrawer(r);
                        }}
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Checking Lists Mode */
        checking && (
          <div className="checking-bento-layout">
            {/* Optional Subject Flagged */}
            <div className="checking-bento-tile">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800 }}>Optional Subject Flagged</h3>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>R-10: GP ≤ 2.0 contributes 0, flagged for review.</p>
                </div>
                <span className="status-pill-badge pass" style={{ fontSize: 13 }}>
                  {checking.optional.count}
                </span>
              </div>
              <div className="checking-scroll-list">
                {checking.optional.students.length ? (
                  checking.optional.students.map((s: any) => (
                    <div key={s.id} className="checking-list-row" style={{ cursor: "pointer" }} onClick={() => {
                      const st = results.find((r) => r.id === s.id);
                      if (st) setDrawer(st);
                    }}>
                      <div>
                        <b>{s.id}</b> {s.name} <small>({s.class})</small>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {s.optional} <code>{s.markUsed}</code> • GP {s.optionalGP}
                        </div>
                      </div>
                      <span className="status-pill-badge pass">{s.reason}</span>
                    </div>
                  ))
                ) : (
                  <div className="checking-list-row">All clear ✓</div>
                )}
              </div>
            </div>

            {/* Practical Subject Failures */}
            <div className="checking-bento-tile">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800 }}>Practical Fails (&lt;8)</h3>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>R-10: Subject fail if practical &lt; 8 marks.</p>
                </div>
                <span className="status-pill-badge fail" style={{ fontSize: 13 }}>
                  {checking.practical.count}
                </span>
              </div>
              <div className="checking-scroll-list">
                {checking.practical.students.length ? (
                  checking.practical.students.map((s: any) => (
                    <div key={s.id} className="checking-list-row" style={{ cursor: "pointer" }} onClick={() => {
                      const st = results.find((r) => r.id === s.id);
                      if (st) setDrawer(st);
                    }}>
                      <div>
                        <b>{s.id}</b> {s.name}
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {s.failedSubjects.map((f: any) => `${f.code}: ${f.markUsed}`).join(", ")}
                        </div>
                      </div>
                      <span className="status-pill-badge fail">Fail</span>
                    </div>
                  ))
                ) : (
                  <div className="checking-list-row">All clear ✓</div>
                )}
              </div>
            </div>

            {/* Absent Candidates */}
            <div className="checking-bento-tile">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800 }}>Absent Candidates (AB)</h3>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>R-11: Absent marks propagation & overall status.</p>
                </div>
                <span className="status-pill-badge pass" style={{ fontSize: 13, background: "#E0F2FE", color: "#0284C7" }}>
                  {checking.absent.count}
                </span>
              </div>
              <div className="checking-scroll-list">
                {checking.absent.students.length ? (
                  checking.absent.students.map((s: any) => (
                    <div key={s.id} className="checking-list-row" style={{ cursor: "pointer" }} onClick={() => {
                      const st = results.find((r) => r.id === s.id);
                      if (st) setDrawer(st);
                    }}>
                      <div>
                        <b>{s.id}</b> {s.name}
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                          {s.absentSubjects.join(", ")}
                        </div>
                      </div>
                      <span className="status-pill-badge" style={{ background: "#E0F2FE", color: "#0284C7" }}>{s.overall}</span>
                    </div>
                  ))
                ) : (
                  <div className="checking-list-row">All clear ✓</div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {/* Interactive Audit & Sign-off Modal (Triggered by Clicking the Audit Card) */}
      {auditModalOpen && (
        <>
          <div className="drawer-frost-overlay" onClick={() => setAuditModalOpen(false)} />
          <div className="drawer-slide-content" style={{ width: 620 }}>
            <div className="drawer-top-header">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="brand-icon-circle" style={{ width: 28, height: 28 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>
                    Audit & Checking Lists Verification
                  </h3>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                  Batch {current || "PUB-01"} • {totalFlaggedCount} Anomalies Requiring Lead Sign-off
                </p>
              </div>
              <button
                type="button"
                style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border)", background: "#F3F4F6", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setAuditModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-inner-body">
              {/* Verifier Board Avatar Bar */}
              <div style={{ background: "#F8FAFC", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
                  Assigned Lead Verifiers & Examination Board
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {VERIFIERS.map((v) => (
                    <div key={v.name} style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFFFF", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                      <div className="stacked-avatar-item" style={{ background: v.color, marginLeft: 0 }}>
                        {v.initial}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-main)" }}>{v.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>{v.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3 Categories Breakdown Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div
                  style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: 12, padding: 14, cursor: "pointer", transition: "all 0.15s ease" }}
                  onClick={() => handleAuditCategoryFilter("optional")}
                >
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700 }}>Optional Flagged</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)", margin: "4px 0" }}>
                    {summary?.optionalFlagged || 0}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--primary-emerald)", fontWeight: 700 }}>Filter Table →</div>
                </div>

                <div
                  style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: 12, padding: 14, cursor: "pointer", transition: "all 0.15s ease" }}
                  onClick={() => handleAuditCategoryFilter("practical")}
                >
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700 }}>Practical Fails</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--bad)", margin: "4px 0" }}>
                    {summary?.practicalFailed || 0}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--bad)", fontWeight: 700 }}>Filter Table →</div>
                </div>

                <div
                  style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: 12, padding: 14, cursor: "pointer", transition: "all 0.15s ease" }}
                  onClick={() => handleAuditCategoryFilter("absent")}
                >
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700 }}>Absent (AB)</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0284C7", margin: "4px 0" }}>
                    {summary?.absent || 0}
                  </div>
                  <div style={{ fontSize: 10, color: "#0284C7", fontWeight: 700 }}>Filter Table →</div>
                </div>
              </div>

              {/* Sample Flagged Students Preview */}
              <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 16 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10, color: "var(--text-main)" }}>
                  Sample High-Priority Audit Cases
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
                  {results.filter((r) => r.checkingListKeys.length > 0).slice(0, 8).map((st) => (
                    <div
                      key={st.id}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFC", borderRadius: 8, border: "1px solid var(--border)" }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, fontSize: 12 }}>{st.id}</span> • <b>{st.name}</b>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                          GPA: {st.gpa.finalGPADisplay} • {st.gpa.failureCause || "Optional GP ≤ 2.0 review"}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="pill-action-button emerald"
                        style={{ padding: "4px 10px", fontSize: 10 }}
                        onClick={() => {
                          setAuditModalOpen(false);
                          setDrawer(st);
                        }}
                      >
                        Inspect Trace
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign-off Action Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10 }}>
                {signedOff ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ok)", fontWeight: 800, fontSize: 13 }}>
                    <span>✅ Verified & Certified by Sujon (Lead Verifier)</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                    Deterministic engine checks complete (R-10/R-11/R-12/R-13).
                  </div>
                )}
                <button
                  type="button"
                  className="pill-action-button emerald"
                  onClick={() => setSignedOff(true)}
                  style={{ padding: "10px 22px" }}
                >
                  {signedOff ? "✓ Sign-off Confirmed" : "Approve & Sign Off (Lead Verifier)"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slide-out Candidate Inspector Drawer */}
      {drawer && (
        <>
          <div className="drawer-frost-overlay" onClick={() => setDrawer(null)} />
          <div className="drawer-slide-content">
            <div className="drawer-top-header">
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-main)" }}>
                  Candidate Result Trace
                </h3>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                  {drawer.id} — {drawer.name} ({drawer.class}) • Optional: {drawer.optional}
                </p>
              </div>
              <button
                type="button"
                style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border)", background: "#F3F4F6", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => setDrawer(null)}
              >
                ✕
              </button>
            </div>

            <div className="drawer-inner-body">
              {/* Subject Breakdown Card */}
              <div style={{ background: "#F9FAFB", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 18 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: "var(--text-main)" }}>
                  Subject Evaluation Breakdown
                </h4>
                <table className="executive-data-table" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Mark Used</th>
                      <th>GP</th>
                      <th>Rule Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...drawer.subjectTraces,
                      { ...drawer.optionalTrace, type: "optional", hasPractical: false } as any,
                    ].map((t: any) => (
                      <tr
                        key={t.code}
                        style={{ background: t.isFail ? "var(--bad-bg)" : t.isAbsent ? "#F0F9FF" : "transparent" }}
                      >
                        <td>
                          <b>{t.code}</b>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            {t.type} {t.hasPractical ? "• Pract" : ""}
                          </div>
                        </td>
                        <td>
                          <b>{t.markUsed}</b>
                          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            {t.total !== null ? `Total: ${t.total}` : "AB"}
                          </div>
                        </td>
                        <td>
                          <span className="gpa-monospace-value">{t.gradePoint}</span>
                        </td>
                        <td>
                          <div>{t.rule}</div>
                          {t.contributes && (
                            <div style={{ fontSize: 10, color: "var(--ok)", fontWeight: 700 }}>
                              Contrib: {t.contribution} ({t.contributes})
                            </div>
                          )}
                          {t.isFail && <span className="status-pill-badge fail" style={{ fontSize: 9, marginTop: 4 }}>FAIL</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Formula Trace Card */}
              <div style={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 18, boxShadow: "var(--shadow-float)" }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, marginBottom: 8, color: "var(--text-main)" }}>
                  GPA Engine Calculation Trace
                </h4>
                <p style={{ fontSize: 12, marginBottom: 6 }}>
                  • <b>Compulsory Sum:</b> {drawer.gpa.sumCompulsory}
                </p>
                <p style={{ fontSize: 12, marginBottom: 6 }}>
                  • <b>Optional Benefit:</b> max(0, {drawer.optionalGP} - 2) ={" "}
                  <b>{drawer.gpa.optionalContribution}</b>
                </p>
                <p style={{ fontSize: 12, marginBottom: 6 }}>
                  • <b>Raw Uncapped:</b> ({drawer.gpa.sumCompulsory} + {drawer.gpa.optionalContribution}) / 6 ={" "}
                  {drawer.gpa.rawUncapped} → <b>{drawer.gpa.uncappedDisplay}</b>
                </p>

                {drawer.gpa.hasCompulsoryFail && (
                  <div
                    style={{
                      background: "var(--bad-bg)",
                      border: "1px solid var(--bad-border)",
                      padding: 10,
                      borderRadius: 8,
                      marginTop: 10,
                    }}
                  >
                    <p style={{ color: "var(--bad)", fontSize: 12, fontWeight: 800 }}>
                      ⚠️ R-13 Triggered: Compulsory fail in {drawer.gpa.failureCause}{" "}
                      ({drawer.gpa.failureCauseTrace?.markUsed}) → GP 0.00 ⇒ Final GPA: 0.00 (F)
                    </p>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 14,
                    marginTop: 14,
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>
                      Official Certification
                    </span>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-main)", fontFamily: "'JetBrains Mono', monospace" }}>
                      GPA {drawer.gpa.finalGPADisplay} • {drawer.gpa.letter}
                    </div>
                  </div>
                  <span className={`status-pill-badge ${drawer.isFail ? "fail" : "pass"}`} style={{ fontSize: 13 }}>
                    {drawer.result}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
