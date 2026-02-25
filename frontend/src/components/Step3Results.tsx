import type { Building, CalculatorResult } from "../api/client";
import "./WizardLayout.css";

interface Step3ResultsProps {
  result: CalculatorResult;
  building?: Building | null;
  onFindContractor: () => void;
}

export function Step3Results({ result, building, onFindContractor }: Step3ResultsProps) {
  const years = result.years_until_break_even ?? Math.floor(result.YearsUntilBreakeventRentIncrease);
  const months = result.months_until_break_even ?? Math.round((result.YearsUntilBreakeventRentIncrease - years) * 12);
  const breakEvenText = years > 0 || months > 0
    ? `${years} years, ${months} months`
    : "—";

  return (
    <div className="wizard-step">
      <header className="wizard-header">
        <h1 className="logo">HeatMyKiez</h1>
        <p className="header-desc">Figure out how to finance insulating your building without losing money.</p>
      </header>
      <p className="step-desc">Your energy savings with these retrofits</p>
      <p className="step-desc-secondary">We help you finance the retrofitting – so you are climate-safe for the future and your tenants stay warm.</p>
      <p className="step-desc-secondary">By slight rent increase, your investment has a return and the tenants pay less Warmmiete as they pay less energy costs.</p>

      <div className="wizard-two-col">
        <div className="wizard-main">
      <p className="break-even-big">{breakEvenText}</p>
      <p className="step-desc">Years until Break Even</p>

      <dl className="results-grid">
        <dt>Type of Retrofit</dt>
        <dd>{result.SubTypeOfRetrofit}</dd>
        <dt>Baseline Costs (Euros)</dt>
        <dd>{result.RetrofitCostTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
        <dt>Cost with applicable subsidies</dt>
        <dd>{result.RetrofitCostTotalAfterSubsidy.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
        <dt>Energy Savings</dt>
        <dd>{result.EnergySavingsPct}%</dd>
        <dt>Average monthly rent/unit (Euros)</dt>
        <dd>{result.RentPerUnit.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
        <dt>Energy Saving per Unit (Euros)</dt>
        <dd>{result.SavingsPerUnit.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
        <dt>Suggested Rent Increase (Euros)</dt>
        <dd>{result.RentIncreasePerUnit.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
        <dt>Tenant Savings per Unit (Euros)</dt>
        <dd>{result.TenantSavingsPerUnit.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
        <dt>Yearly Extra Income (Euros)</dt>
        <dd>{result.YearlyExtraIncome.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
      </dl>
        </div>
        {building && (building.street || building.address) && (
          <aside className="address-card">
            <p className="address-label">Address:</p>
            <div className="address-values">
              <span>{building.street}</span>
              <span>{building.postal_code} {building.city || "Berlin"}</span>
              <span>{building.number}</span>
            </div>
          </aside>
        )}
      </div>

      <div className="stepper" role="progressbar" aria-valuenow={3} aria-valuemin={1} aria-valuemax={4}>
        <span className="step-connector" aria-hidden="true" />
        <span className="step">1</span>
        <span className="step">2</span>
        <span className="step active">3</span>
        <span className="step">4</span>
      </div>

      <button className="btn btn-primary btn-cta-large" onClick={onFindContractor}>Find Contractor</button>
    </div>
  );
}
