import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "ResultIQ — Executive GPA & Result Processing Engine",
  description: "Deterministic GPA engine: R-11/R-12/R-13 Compliance, Bento Verification Console.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="canvas-wrapper">
          {/* 1. Floating Pill Top Navbar */}
          <header className="floating-topbar">
            {/* Left Brand */}
            <Link href="/" className="topbar-brand">
              <div className="brand-icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <span className="brand-title-text">ResultIQ</span>
            </Link>

            {/* Center Pill Nav Links */}
            <nav className="header-nav-pill-container">
              <Link href="/" className="header-nav-item active">
                Dashboard
              </Link>
              <Link href="/?tab=checking" className="header-nav-item">
                Checking Lists
              </Link>
              <Link href="/admin" className="header-nav-item">
                Rule Config
              </Link>
              <a href="#ledger" className="header-nav-item">
                Student Ledger
              </a>
              <a href="/docs/ARCHITECTURE.md" target="_blank" className="header-nav-item">
                Documentation
              </a>
            </nav>

            {/* Right Group: Search, Notification Bell, User Avatar */}
            <div className="topbar-right-group">
              <button className="circle-icon-button" title="Quick Search" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
              <button className="circle-icon-button" title="Live Notifications" type="button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span className="bell-live-dot"></span>
              </button>
              <div className="user-profile-pill">
                <div className="user-avatar-circle">S</div>
                <div style={{ lineHeight: 1.15, paddingRight: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-main)" }}>Sujon</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>Lead Verifier</div>
                </div>
              </div>
            </div>
          </header>

          {/* 2. Workspace with Left Floating Capsule Sidebar & Main Content */}
          <div className="main-content-layout">
            {/* Floating Capsule Sidebar Rail */}
            <aside className="floating-sidebar-rail">
              <div className="rail-icon-stack">
                {/* Active Grid Icon */}
                <Link href="/" className="rail-icon-btn active" title="Dashboard">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="2"/>
                  </svg>
                </Link>

                {/* Analytics / Chart Icon */}
                <a href="#ledger" className="rail-icon-btn" title="Analytics Ledger">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"/>
                    <path d="M18 17V9"/>
                    <path d="M13 17V5"/>
                    <path d="M8 17v-3"/>
                  </svg>
                </a>

                {/* Case / Wallet Icon */}
                <Link href="/?tab=checking" className="rail-icon-btn" title="Checking Lists">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11 3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </Link>

                {/* Rule Config Sliders Icon */}
                <Link href="/admin" className="rail-icon-btn" title="Rule Configuration">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" x2="4" y1="21" y2="14"/>
                    <line x1="4" x2="4" y1="10" y2="3"/>
                    <line x1="12" x2="12" y1="21" y2="12"/>
                    <line x1="12" x2="12" y1="8" y2="3"/>
                    <line x1="20" x2="20" y1="21" y2="16"/>
                    <line x1="20" x2="20" y1="12" y2="3"/>
                    <line x1="1" x2="7" y1="14" y2="14"/>
                    <line x1="9" x2="15" y1="8" y2="8"/>
                    <line x1="17" x2="23" y1="16" y2="16"/>
                  </svg>
                </Link>

                <div className="rail-divider"></div>

                {/* Document / Reports Icon */}
                <a href="/api/cases" target="_blank" className="rail-icon-btn" title="JSON Cases API">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" x2="8" y1="13" y2="13"/>
                    <line x1="16" x2="8" y1="17" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </a>
              </div>

              {/* Bottom Settings & Logout Icons */}
              <div className="rail-icon-stack">
                <Link href="/admin" className="rail-icon-btn" title="Settings & Rules">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </Link>

                <button className="rail-icon-btn" title="Sign Out" type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" x2="9" y1="12" y2="12"/>
                  </svg>
                </button>
              </div>
            </aside>

            {/* Main Content View */}
            <main className="inner-workspace">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
