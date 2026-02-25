import type { Building } from "../api/client";
import "./WizardLayout.css";

const WINDOW_OPTIONS = ["Single Pane", "Double Pane", "Triple Pane", "Mixed"];
const ROOF_OPTIONS = ["Flat", "Hip", "Mansard", "Pitched"];
const HEATING_OPTIONS = ["District Heating", "Electric", "Gas Boiler", "Oil Boiler", "Heat Pump", "Mixed"];
const FACADE_OPTIONS = ["Brick", "Concrete", "Mixed", "Prefab Panel", "Render", "Sandstone"];
const INSULATION_OPTIONS = ["Partial", "Full", "None"];

function excelToUIWindow(s: string | undefined): string {
  if (!s) return "Single Pane";
  const t = String(s);
  if (/single/i.test(t)) return "Single Pane";
  if (/double/i.test(t)) return "Double Pane";
  if (/triple/i.test(t)) return "Triple Pane";
  return t || "Single Pane";
}

function uiToExcelWindow(s: string): string {
  if (s === "Single Pane") return "Single-pane";
  if (s === "Double Pane") return "Double-pane";
  if (s === "Triple Pane") return "Triple-pane";
  return s;
}

interface Step1FormProps {
  building: Building;
  overrides: Record<string, unknown>;
  onChange: (overrides: Record<string, unknown>) => void;
  onNext: () => void;
}

export function Step1Form({ building, overrides, onChange, onNext }: Step1FormProps) {
  const val = (key: string): string | number | undefined => {
    const v = overrides[key] ?? building[key];
    if (v === undefined || v === null) return undefined;
    return typeof v === "object" ? undefined : (v as string | number);
  };
  const set = (key: string, value: unknown) => onChange({ ...overrides, [key]: value });

  return (
    <div className="wizard-step step1-form">
      <header className="wizard-header">
        <h1 className="logo">HeatMyKiez</h1>
        <p className="header-desc">Figure out how to finance insulating your building without losing money.</p>
        <button type="button" className="menu-icon" aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      </header>
      <div className="step1-form-copy">
        <p className="step-desc">To understand your situation, we need some data from you.</p>
        <p className="step-desc-secondary">Now, give some basic details about the building and costs</p>
        <p className="step-desc-secondary">Then, let's get real and dive into heating related details</p>
        <div className="stepper" role="progressbar" aria-valuenow={2} aria-valuemin={1} aria-valuemax={4}>
          <span className="step-connector" aria-hidden="true" />
          <span className="step">1</span>
          <span className="step active">2</span>
          <span className="step">3</span>
          <span className="step">4</span>
        </div>
      </div>

      <div className="step1-form-layout">
        {building.address && (
          <aside className="address-card step-address">
            <p className="address-label">Address:</p>
            <div className="address-values">
              <span>{building.street}</span>
              <span>{building.postal_code} {building.city || "Berlin"}</span>
              <span>{building.number}</span>
            </div>
          </aside>
        )}

        <div className="form form-building form-building-basic">
          <div className="field">
            <label>Building Square Meters (m2)</label>
            <input
              type="number"
              value={val("total_area_m2") != null ? String(val("total_area_m2")) : ""}
              onChange={(e) => set("total_area_m2", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 2523"
            />
          </div>
          <div className="field">
            <label>Number of residential units</label>
            <input
              type="number"
              value={val("num_units") != null ? String(val("num_units")) : ""}
              onChange={(e) => set("num_units", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 31"
            />
          </div>
          <div className="field">
            <label>Average monthly rent/unit (Euros)</label>
            <input
              type="number"
              step="0.01"
              value={val("RentPerUnit") != null ? String(val("RentPerUnit")) : ""}
              onChange={(e) => set("RentPerUnit", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 856.75"
            />
          </div>
          <div className="field">
            <label>Energy Cost per month (Euros)</label>
            <input
              type="number"
              step="0.01"
              value={val("EnergyCostsPerMonth") != null ? String(val("EnergyCostsPerMonth")) : ""}
              onChange={(e) => set("EnergyCostsPerMonth", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 1650.73"
            />
          </div>
        </div>

        <div className="form form-building form-building-advanced">
          <div className="field">
            <label>Window Type</label>
            <select
              value={excelToUIWindow(val("window_type") as string)}
              onChange={(e) => set("window_type", uiToExcelWindow(e.target.value))}
            >
              {WINDOW_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Window to Floor Square Meters Ratio</label>
            <input
              type="number"
              step="0.01"
              value={val("WindowToFloorRatio") != null ? String(val("WindowToFloorRatio")) : ""}
              onChange={(e) => set("WindowToFloorRatio", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 0.14"
            />
          </div>
          <div className="field">
            <label>Roof Type</label>
            <select
              value={(val("roof_type") as string) ?? ""}
              onChange={(e) => set("roof_type", e.target.value)}
            >
              <option value="">Select type</option>
              {ROOF_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Facade Type</label>
            <select
              value={(val("facade_material") as string) ?? ""}
              onChange={(e) => set("facade_material", e.target.value)}
            >
              <option value="">Select type</option>
              {FACADE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Facade Insulation</label>
            <select
              value={(val("insulation_walls") as string) ?? ""}
              onChange={(e) => set("insulation_walls", e.target.value)}
            >
              <option value="">Select type</option>
              {INSULATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Roof Insulation</label>
            <select
              value={(val("insulation_roof") as string) ?? ""}
              onChange={(e) => set("insulation_roof", e.target.value)}
            >
              <option value="">Select type</option>
              {INSULATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Heating System Type</label>
            <select
              value={(val("heating_system") as string) ?? ""}
              onChange={(e) => set("heating_system", e.target.value)}
            >
              <option value="">Select type</option>
              {HEATING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Facade Square Meters (m2)</label>
            <input
              type="number"
              value={val("facade_sqm") != null ? String(val("facade_sqm")) : ""}
              onChange={(e) => set("facade_sqm", e.target.value ? Number(e.target.value) : undefined)}
              placeholder={building.facade_sqm_suggestion ? `e.g. ${building.facade_sqm_suggestion}` : "e.g. 26554"}
              className={!overrides.facade_sqm && building.facade_sqm_suggestion ? "hint" : ""}
            />
          </div>
          <div className="field">
            <label>Heating Age</label>
            <input
              type="number"
              value={val("heating_age") != null ? String(val("heating_age")) : ""}
              onChange={(e) => set("heating_age", e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 2007"
            />
          </div>
        </div>

      </div>

      <button className="btn btn-primary btn-cta-large" onClick={onNext}>Next</button>
    </div>
  );
}
