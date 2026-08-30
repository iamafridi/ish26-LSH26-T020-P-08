import Link from "next/link";

const documents = [
  ["Frontend", "Interface structure and client behavior", "FRONTEND.md"],
  ["Rule engine", "Deterministic grading and GPA rules", "RULE_ENGINE.md"],
  ["API specification", "Available endpoints and response contracts", "API_SPEC.md"],
  ["Security", "Validation, access, and operational controls", "SECURITY.md"],
  ["Deployment", "Build and production deployment guidance", "DEPLOYMENT.md"],
];

export default function DocumentationPage() {
  return (
    <div>
      <div className="workspace-subheader">
        <div>
          <div className="eyebrow-label">Knowledge base</div>
          <h1 className="hero-welcome-title">Product documentation</h1>
          <p className="hero-welcome-sub">Technical references for the ResultIQ verification platform.</p>
        </div>
        <Link href="/" className="pill-action-button dark">← Back to dashboard</Link>
      </div>

      <div className="docs-grid">
        {documents.map(([title, description, file]) => (
          <article className="docs-card" key={file}>
            <div className="docs-icon" aria-hidden="true">↗</div>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
              <span>{file}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="docs-note">
        <strong>Repository documentation</strong>
        <p>The source documents are maintained in the project’s <code>docs/</code> directory and ship with the application repository.</p>
      </div>
    </div>
  );
}
