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
  loading?: boolean;
}

export function Step2Options({
  building,
  optionCards,
  selectedOption,
  onSelect,
  onCalculateBreakEven,
  loading,
}: Step2OptionsProps) {
  const windowType = (building.window_type || building.WindowType || "").toString();
  const isTriple = /triple/i.test(windowType);

  return (
    <div className="wizard-step">
      <header className="wizard-header">
        <h1 className="logo">HeatMyKiez</h1>
        <p className="header-desc">Figure out how to finance insulating your building without losing money.</p>
      </header>
      <p className="step-desc">Now, let's summarize the data</p>
      <p className="step-desc-secondary">And pick the retrofits</p>

      <p><strong>Address:</strong> {building.street} {building.number}, {building.postal_code} Berlin</p>
      <p><strong>Building Square Meters (m2):</strong> {building.total_area_m2 != null ? String(building.total_area_m2) : "—"}</p>
      <p><strong>Average monthly rent/unit (Euros):</strong> {building.RentPerUnit != null ? String(building.RentPerUnit) : "—"}</p>
      <p><strong>Window Type:</strong> {windowType || "—"}</p>
      <p><strong>Window to Floor Square Meters Ratio:</strong> {building.WindowToFloorRatio != null ? String(building.WindowToFloorRatio) : "—"}</p>
      <p><strong>Energy cost per month (Euros):</strong> {building.EnergyCostsPerMonth != null ? String(building.EnergyCostsPerMonth) : "—"}</p>
      <p><strong>Number of residential units:</strong> {building.num_units != null ? String(building.num_units) : "—"}</p>

      {isTriple ? (
        <p className="step-desc">Unfortunately there is no improvement opportunity for windows — no additional savings.</p>
      ) : (
        <>
          <div className="card-group">
            {optionCards.map((opt) => (
              <div
                key={opt.subType}
                className={`option-card ${selectedOption?.subType === opt.subType ? "selected" : ""}`}
                onClick={() => onSelect(opt)}
              >
                <h3>{opt.label}</h3>
                <p><strong>Energy Savings:</strong> {opt.savingsPct}%</p>
                <p><strong>Baseline Cost (Euros):</strong> {opt.RetrofitCostTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</p>
                <p><strong>Cost with applicable subsidies:</strong> {opt.RetrofitCostTotalAfterSubsidy.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
          <p className="step-desc">*Berlin has an amazing subsidies program where you can finance up to 35% of your investment. Learn more here.</p>
          <button
            className="btn btn-accent"
            disabled={!selectedOption || loading}
            onClick={onCalculateBreakEven}
          >
            {loading ? "Calculating…" : "Calculate Break Even"}
          </button>
        </>
      )}

      <div className="stepper">
        <span className="step">1</span>
        <span className="step active">2</span>
        <span className="step">3</span>
        <span className="step">4</span>
      </div>
    </div>
  );
}
