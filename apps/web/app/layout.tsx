import "./globals.css";
import Link from "next/link";
import { Suspense } from "react";
import ActiveNavLink from "./ActiveNavLink";

export const metadata = {
  title: "ResultIQ — Executive GPA & Result Processing Engine",
  description: "Deterministic GPA engine: R-11/R-12/R-13 Compliance, Bento Verification Console.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
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
            <Suspense fallback={<nav className="header-nav-pill-container" />}>
            <nav className="header-nav-pill-container" aria-label="Primary navigation">
              <ActiveNavLink href="/" className="header-nav-item" mode="dashboard">
                Dashboard
              </ActiveNavLink>
              <ActiveNavLink href="/checking" className="header-nav-item" mode="checking">
                Checking Lists
              </ActiveNavLink>
              <ActiveNavLink href="/admin" className="header-nav-item" mode="admin">
                Rule Config
              </ActiveNavLink>
              <ActiveNavLink href="/ledger" className="header-nav-item" mode="ledger">
                Student Ledger
              </ActiveNavLink>
              <ActiveNavLink href="/docs" className="header-nav-item" mode="docs">
                Documentation
              </ActiveNavLink>
            </nav>
            </Suspense>

            {/* Current verifier */}
            <div className="topbar-right-group">
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
                <ActiveNavLink href="/" className="rail-icon-btn" mode="dashboard" title="Dashboard">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="2"/>
                    <rect x="14" y="3" width="7" height="7" rx="2"/>
                    <rect x="14" y="14" width="7" height="7" rx="2"/>
                    <rect x="3" y="14" width="7" height="7" rx="2"/>
                  </svg>
                </ActiveNavLink>

                {/* Analytics / Chart Icon */}
                <ActiveNavLink href="/ledger" className="rail-icon-btn" mode="ledger" title="Analytics Ledger">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"/>
                    <path d="M18 17V9"/>
                    <path d="M13 17V5"/>
                    <path d="M8 17v-3"/>
                  </svg>
                </ActiveNavLink>

                {/* Case / Wallet Icon */}
                <ActiveNavLink href="/checking" className="rail-icon-btn" mode="checking" title="Checking Lists">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11 3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </ActiveNavLink>

                {/* Rule Config Sliders Icon */}
                <ActiveNavLink href="/admin" className="rail-icon-btn" mode="admin" title="Rule Configuration">
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
                </ActiveNavLink>

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
