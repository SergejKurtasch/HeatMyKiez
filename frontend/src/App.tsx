import { useState, useEffect, useCallback } from "react";
import { api, type Building, type CalculatorResult, type Contractor } from "./api/client";
import { Step1Address } from "./components/Step1Address";
import { Step1Form } from "./components/Step1Form";
import { Step2Options } from "./components/Step2Options";
import { Step3Results } from "./components/Step3Results";
import { Step4Contractors } from "./components/Step4Contractors";
import "./App.css";

type Step = 1 | 2 | 3 | 4;

interface OptionCard {
  subType: string;
  label: string;
  savingsPct: number;
  RetrofitCostTotal: number;
  RetrofitCostTotalAfterSubsidy: number;
}

function App() {
  const [step, setStep] = useState<Step>(1);
  const [building, setBuilding] = useState<Building | null>(null);
  const [formOverrides, setFormOverrides] = useState<Record<string, unknown>>({});
  const [optionCards, setOptionCards] = useState<OptionCard[]>([]);
  const [selectedOption, setSelectedOption] = useState<OptionCard | null>(null);
  const [calculatorResult, setCalculatorResult] = useState<CalculatorResult | null>(null);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractorsLoading, setContractorsLoading] = useState(false);

  const buildOverridesForApi = useCallback(() => {
    const o: Record<string, unknown> = {};
    if (formOverrides.total_area_m2 != null) o.TotalSqm = formOverrides.total_area_m2;
    if (formOverrides.num_units != null) o.NrUnits = formOverrides.num_units;
    if (formOverrides.RentPerUnit != null) o.RentPerUnit = formOverrides.RentPerUnit;
    if (formOverrides.EnergyCostsPerMonth != null) o.EnergyCostsPerMonth = formOverrides.EnergyCostsPerMonth;
    if (formOverrides.window_type != null) o.WindowType = formOverrides.window_type;
    if (formOverrides.WindowToFloorRatio != null) o.WindowToFloorRatio = formOverrides.WindowToFloorRatio;
    if (formOverrides.facade_sqm != null) o.facade_sqm = formOverrides.facade_sqm;
    return o;
  }, [formOverrides]);

  const handleAddAddress = async (postcode: string, address: string) => {
    setError(null);
    setLoading(true);
    try {
      const b = await api.searchBuilding(postcode, address);
      setBuilding(b);
      setFormOverrides({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Building not found");
      return;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== 2 || !building?.building_id) return;
    const wt = (building.window_type || building.WindowType || "").toString().toLowerCase();
    const options: { subType: string; label: string }[] = [];
    if (wt.includes("single")) {
      options.push({ subType: "Window replacement - double glazing", label: "Double Pane" });
      options.push({ subType: "Window replacement - triple glazing", label: "Triple Pane" });
    } else if (wt.includes("double")) {
      options.push({ subType: "Window replacement - triple glazing", label: "Triple Pane" });
    }
    if (options.length === 0) {
      setOptionCards([]);
      setSelectedOption(null);
      return;
    }
    const overrides = buildOverridesForApi();
    Promise.all(
      options.map((opt) =>
        api.runCalculator({
          building_id: building.building_id!,
          sub_type_of_retrofit: opt.subType,
          overrides,
        })
      )
    )
      .then((results) => {
        setOptionCards(
          results.map((r, i) => ({
            subType: options[i].subType,
            label: options[i].label,
            savingsPct: r.EnergySavingsPct ?? 0,
            RetrofitCostTotal: r.RetrofitCostTotal,
            RetrofitCostTotalAfterSubsidy: r.RetrofitCostTotalAfterSubsidy,
          }))
        );
        setSelectedOption(null);
      })
      .catch(() => setOptionCards([]));
  }, [step, building?.building_id, building?.window_type, building?.WindowType, buildOverridesForApi]);

  const handleCalculateBreakEven = async () => {
    if (!building?.building_id || !selectedOption) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.runCalculator({
        building_id: building.building_id,
        sub_type_of_retrofit: selectedOption.subType,
        overrides: buildOverridesForApi(),
      });
      setCalculatorResult(result);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFindContractor = async () => {
    setContractorsLoading(true);
    try {
      const r = await api.getContractors("window");
      setContractors(r.contractors ?? []);
      setStep(4);
    } catch (e) {
      setContractors([]);
    } finally {
      setContractorsLoading(false);
    }
  };

  if (step === 1 && !building) {
    return (
      <Step1Address
        onAdd={handleAddAddress}
        loading={loading}
        error={error ?? undefined}
      />
    );
  }

  if (step === 1 && building) {
    return (
      <Step1Form
        building={building}
        overrides={formOverrides}
        onChange={setFormOverrides}
        onNext={() => setStep(2)}
      />
    );
  }

  if (step === 2 && building) {
    return (
      <Step2Options
        building={{ ...building, ...formOverrides } as Building}
        optionCards={optionCards}
        selectedOption={selectedOption}
        onSelect={setSelectedOption}
        onCalculateBreakEven={handleCalculateBreakEven}
        loading={loading}
      />
    );
  }

  if (step === 3 && calculatorResult) {
    return (
      <Step3Results
        result={calculatorResult}
        onFindContractor={handleFindContractor}
      />
    );
  }

  if (step === 4) {
    return (
      <Step4Contractors
        contractors={contractors}
        loading={contractorsLoading}
      />
    );
  }

  return (
    <div className="wizard-step">
      <p>Loading…</p>
    </div>
  );
}

export default App;
