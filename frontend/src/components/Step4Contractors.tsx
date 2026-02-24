import type { Contractor } from "../api/client";
import "./WizardLayout.css";

interface Step4ContractorsProps {
  contractors: Contractor[];
  loading?: boolean;
}

export function Step4Contractors({ contractors, loading }: Step4ContractorsProps) {
  return (
    <div className="wizard-step">
      <header className="wizard-header">
        <h1 className="logo">HeatMyKiez</h1>
        <p className="header-desc">Figure out how to finance insulating your building without losing money.</p>
      </header>
      <h2 className="break-even-big">Your contractor Marketplace</h2>

      {loading ? (
        <p>Loading contractors…</p>
      ) : contractors.length === 0 ? (
        <p>No contractors found for window retrofit.</p>
      ) : (
        contractors.map((c) => (
          <div key={String(c.contractor_id || c.company_name)} className="contractor-card">
            <h3>{c.company_name ?? "—"}</h3>
            <p>Vetted Contractor</p>
            <p><strong>Specialization:</strong> {c.specialization ?? "—"}</p>
            <p><strong>District(s):</strong> {c.district_served ?? "—"}</p>
            <p><strong>Rating:</strong> {c.avg_rating ?? "—"} ({c.num_reviews ?? 0} reviews)</p>
            <button className="btn btn-accent" style={{ marginTop: 12 }}>Request Quote</button>
          </div>
        ))
      )}

      <div className="stepper">
        <span className="step">1</span>
        <span className="step">2</span>
        <span className="step">3</span>
        <span className="step active">4</span>
      </div>
    </div>
  );
}
