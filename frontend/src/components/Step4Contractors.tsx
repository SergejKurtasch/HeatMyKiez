import type { Contractor } from "../api/client";
import "./WizardLayout.css";

interface Step4ContractorsProps {
  contractors: Contractor[];
  loading?: boolean;
  onBack: () => void;
}

export function Step4Contractors({ contractors, loading, onBack }: Step4ContractorsProps) {
  return (
    <div className="wizard-step step4-contractors">
      <header className="wizard-header">
        <h1 className="logo">HeatMyKiez</h1>
        <p className="header-desc">Figure out how to finance insulating your building without losing money.</p>
        <button type="button" className="menu-icon" aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      </header>
      <h2 className="marketplace-title">Your contractor Marketplace</h2>
      <div className="stepper" role="progressbar" aria-valuenow={4} aria-valuemin={1} aria-valuemax={4}>
        <span className="step-connector" aria-hidden="true" />
        <span className="step">1</span>
        <span className="step">2</span>
        <span className="step">3</span>
        <span className="step active">4</span>
      </div>

      {loading ? (
        <p className="step-desc-secondary">Loading contractors…</p>
      ) : contractors.length === 0 ? (
        <p className="step-desc-secondary">No contractors found for window retrofit.</p>
      ) : (
        <div className="contractor-grid">
          {contractors.map((c) => (
            <div key={String(c.contractor_id || c.company_name)} className="contractor-card">
              <h3>{c.company_name ?? "—"}</h3>
              <p className="contractor-subtitle">Vetted Contractor</p>
              <p className="contractor-badge">
                {c.specialization ? `${c.specialization} Available` : "Available Immediately"}
              </p>
              <div className="contractor-stars" aria-label="contractor rating">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
              <button className="btn btn-primary btn-quote">Request Quote</button>
            </div>
          ))}
        </div>
      )}

      <div className="wizard-actions">
        <button type="button" className="btn btn-back" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
