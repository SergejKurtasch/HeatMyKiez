import type { Building, CalculatorResult } from "../api/client";
import "./WizardLayout.css";

interface Step3ResultsProps {
  result: CalculatorResult;
  building?: Building | null;
  onFindContractor: () => void;
  onBack: () => void;
}

export function Step3Results({ result, building, onFindContractor, onBack }: Step3ResultsProps) {
  const years = result.years_until_break_even ?? Math.floor(result.YearsUntilBreakeventRentIncrease);
  const months = result.months_until_break_even ?? Math.round((result.YearsUntilBreakeventRentIncrease - years) * 12);
  const breakEvenText = years > 0 || months > 0
    ? `${years} years, ${months} months`
    : "—";

  const addressLine1 = building?.street && building?.number
    ? `${building.street} ${building.number}`
    : building?.street || building?.address || "—";
  const addressLine2 = building?.postal_code && building?.city
    ? `${building.postal_code} ${building.city}`
    : building?.postal_code ? `${building.postal_code} Berlin` : "—";

  return (
    <div className="wizard-step step3-results">
      <header className="wizard-header">
        <h1 className="logo">HeatMyKiez</h1>
        <p className="header-desc">Figure out how to finance insulating your building without losing money.</p>
        <button type="button" className="menu-icon" aria-label="Open menu">
          <span />
          <span />
          <span />
        </button>
      </header>

      <div className="stepper" role="progressbar" aria-valuenow={3} aria-valuemin={1} aria-valuemax={4}>
        <span className="step-connector" aria-hidden="true" />
        <span className="step">1</span>
        <span className="step">2</span>
        <span className="step active">3</span>
        <span className="step">4</span>
      </div>

      <div className="step3-content">
        <h2 className="step3-title">Your energy savings with these retrofits</h2>

        <section className="step3-block step3-block-first">
          <div className="step3-two-col">
            <div className="step3-col">
              <dl className="step3-dl">
                <dt>Type of Retrofit</dt>
                <dd>{result.SubTypeOfRetrofit}</dd>
                <dt>Baseline Costs (Euros)</dt>
                <dd>{result.RetrofitCostTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
              </dl>
            </div>
            <div className="step3-col step3-col-address">
              <dl className="step3-dl">
                <dt>Address:</dt>
                <dd>{addressLine1}<br />{addressLine2}</dd>
                <dt>Energy Savings</dt>
                <dd>{result.EnergySavingsPct}%</dd>
                <dt>Cost with applicable subsidies</dt>
                <dd>{result.RetrofitCostTotalAfterSubsidy.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
              </dl>
            </div>
          </div>
        </section>

        <hr className="step3-divider" />

        <div className="step3-text">
          <p>We help you finance the retrofitting – so you are climate-safe for the future and your tenants stay warm.</p>
          <p>By slight rent increase, your investment has a return and the tenants pay less Warmmiete as they pay less energy costs.</p>
        </div>

        <hr className="step3-divider" />

        <section className="step3-block">
          <div className="step3-two-col">
            <div className="step3-col">
              <dl className="step3-dl">
                <dt>Average monthly rent/unit (Euros)</dt>
                <dd>{result.RentPerUnit.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
                <dt>Suggested Rent Increase (Euros)</dt>
                <dd>{result.RentIncreasePerUnit.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
                <dt>Tenant Savings per Unit (Euros)</dt>
                <dd>{result.TenantSavingsPerUnit.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
              </dl>
            </div>
            <div className="step3-col">
              <dl className="step3-dl">
                <dt>Energy Saving per Unit (Euros)</dt>
                <dd>{result.SavingsPerUnit.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
              </dl>
            </div>
          </div>
        </section>

        <hr className="step3-divider" />

        <section className="step3-block step3-block-break-even">
          <dl className="step3-dl">
            <dt>Yearly Extra Income (Euros)</dt>
            <dd>{result.YearlyExtraIncome.toLocaleString("de-DE", { minimumFractionDigits: 2 })}</dd>
          </dl>
          <div className="step3-break-even-row">
            <span className="step3-break-even-label">Years until Break Even</span>
            <span className="step3-break-even-value">{breakEvenText}</span>
          </div>
        </section>

        <div className="wizard-actions">
          <button type="button" className="btn btn-back" onClick={onBack}>Back</button>
          <button className="btn btn-primary btn-cta-large" onClick={onFindContractor}>Find Contractor</button>
        </div>
      </div>
    </div>
  );
}
