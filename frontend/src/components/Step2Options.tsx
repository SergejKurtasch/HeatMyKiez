import type { Building } from "../api/client";
import "./WizardLayout.css";

interface OptionCard {
  subType: string;
  label: string;
  savingsPct: number;
  RetrofitCostTotal: number;
  RetrofitCostTotalAfterSubsidy: number;
}

interface Step2OptionsProps {
  building: Building;
  optionCards: OptionCard[];
  selectedOption: OptionCard | null;
  onSelect: (opt: OptionCard) => void;
  onCalculateBreakEven: () => void;
  onBack: () => void;
  loading?: boolean;
}

export function Step2Options({
  building,
  optionCards,
  selectedOption,
  onSelect,
  onCalculateBreakEven,
  onBack,
  loading,
}: Step2OptionsProps) {
  const windowType = (building.window_type || building.WindowType || "").toString();
  const isTriple = /triple/i.test(windowType);

  return (
    <div className="wizard-step step2-options">
      <header className="wizard-header">
        <h1 className="logo">HeatMyKiez</h1>
        <p className="header-desc">Figure out how to finance insulating your building without losing money.</p>
        <button type="button" className="menu-icon" aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      </header>
      <p className="step-desc">Now, let's summarize the data</p>
      <p className="step-desc-secondary">And pick the retrofits</p>
      <div className="stepper" role="progressbar" aria-valuenow={2} aria-valuemin={1} aria-valuemax={4}>
        <span className="step-connector" aria-hidden="true" />
        <span className="step">1</span>
        <span className="step active">2</span>
        <span className="step">3</span>
        <span className="step">4</span>
      </div>

      <div className="wizard-two-col">
        <div className="wizard-main">
      <div className="summary-table">
        <span className="summary-label">Address:</span>
        <span className="summary-value">{building.street} {building.number}, {building.postal_code} Berlin</span>
        <span className="summary-label">Building Square Meters (m2):</span>
        <span className="summary-value">{building.total_area_m2 != null ? String(building.total_area_m2) : "—"}</span>
        <span className="summary-label">Average monthly rent/unit (Euros)</span>
        <span className="summary-value">{building.RentPerUnit != null ? String(building.RentPerUnit) : "—"}</span>
        <span className="summary-label">Window Type</span>
        <span className="summary-value">{windowType || "—"}</span>
        <span className="summary-label">Window to Floor Square Meters Ratio</span>
        <span className="summary-value">{building.WindowToFloorRatio != null ? String(building.WindowToFloorRatio) : "—"}</span>
        <span className="summary-label">Energy cost per month (Euros)</span>
        <span className="summary-value">{building.EnergyCostsPerMonth != null ? String(building.EnergyCostsPerMonth) : "—"}</span>
        <span className="summary-label">Number of residential units</span>
        <span className="summary-value">{building.num_units != null ? String(building.num_units) : "—"}</span>
      </div>

      {isTriple ? (
        <>
          <p className="step-desc no-opportunity">Unfortunately there is no improvement opportunity for windows — no additional savings.</p>
          <div className="wizard-actions">
            <button type="button" className="btn btn-back" onClick={onBack}>Back</button>
          </div>
        </>
      ) : (
        <>
          <div className="card-group retrofit-cards">
            {optionCards.map((opt) => (
              <div
                key={opt.subType}
                className={`option-card ${selectedOption?.subType === opt.subType ? "selected" : ""}`}
              >
                <label className="option-checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={selectedOption?.subType === opt.subType}
                    onChange={() => onSelect(opt)}
                  />
                  <span className="option-marker" aria-hidden="true" />
                </label>
                <h3>{opt.label}</h3>
                <p><strong>Energy Savings:</strong> {opt.savingsPct}%</p>
                <p><strong>Baseline Cost (Euros):</strong> {opt.RetrofitCostTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</p>
                <p><strong>Cost with applicable subsidies:</strong> {opt.RetrofitCostTotalAfterSubsidy.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
          <div className="subsidy-block">
            <p className="step-desc">*Berlin has an amazing subsidies program where you can finance up to 35% of your investment.</p>
            <p className="step-desc-secondary"><a href="#" className="subsidy-link">Learn more here</a></p>
          </div>
          <div className="wizard-actions">
            <button type="button" className="btn btn-back" onClick={onBack}>Back</button>
            <button
              className="btn btn-primary btn-cta-large"
              disabled={!selectedOption || loading}
              onClick={onCalculateBreakEven}
            >
              {loading ? "Calculating…" : "Calculate Break Even"}
            </button>
          </div>
        </>
      )}
        </div>
        <aside className="address-card">
          <p className="address-label">Address:</p>
          <div className="address-values">
            <span>{building.street}</span>
            <span>{building.postal_code} {building.city || "Berlin"}</span>
            <span>{building.number}</span>
          </div>
        </aside>
      </div>

    </div>
  );
}
