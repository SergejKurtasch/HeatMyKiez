import { useState, useCallback, useEffect } from "react";
import { api, type BuildingSearchResult, type CalculatorMeasure } from "./lib/api";
import "./App.css";

/** Figma design: https://www.figma.com/design/z0Bncrc02De6zXiHGqfejP/Untitled--Copy-?node-id=0-1 */

function App() {
  const [step, setStep] = useState(1);
  const [postalCode, setPostalCode] = useState("");
  const [streets, setStreets] = useState<string[]>([]);
  const [street, setStreet] = useState("");
  const [buildings, setBuildings] = useState<BuildingSearchResult[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingSearchResult | null>(null);
  const [city, setCity] = useState("Berlin");
  const [buildingDetails, setBuildingDetails] = useState<Record<string, unknown> | null>(null);
  const [calculator, setCalculator] = useState<{ building: Record<string, unknown>; measures: CalculatorMeasure[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [buildingSqm, setBuildingSqm] = useState("");
  const [numUnits, setNumUnits] = useState("");
  const [avgRentPerUnit, setAvgRentPerUnit] = useState("");
  const [energyCostPerMonth, setEnergyCostPerMonth] = useState("");
  const [windowType, setWindowType] = useState("");
  const [windowToFloorRatio, setWindowToFloorRatio] = useState("");
  const [roofType, setRoofType] = useState("");
  const [roofInsulation, setRoofInsulation] = useState("");
  const [heatingType, setHeatingType] = useState("");
  const [heatingAge, setHeatingAge] = useState("");
  const [facadeType, setFacadeType] = useState("");
  const [facadeInsulation, setFacadeInsulation] = useState("");
  const [facadeSqm, setFacadeSqm] = useState("");

  const loadStreets = useCallback(async () => {
    if (!postalCode.trim()) return;
    setError("");
    setLoading(true);
    try {
      const list = await api.getStreets(postalCode.trim());
      setStreets(list);
      setStreet("");
      setBuildings([]);
      setSelectedBuilding(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load streets");
    } finally {
      setLoading(false);
    }
  }, [postalCode]);

  const loadBuildings = useCallback(async () => {
    if (!postalCode.trim() || !street.trim()) return;
    setError("");
    setLoading(true);
    try {
      const list = await api.getBuildings(postalCode.trim(), street.trim());
      setBuildings(list);
      if (list.length === 1) setSelectedBuilding(list[0]);
      else setSelectedBuilding(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load buildings");
    } finally {
      setLoading(false);
    }
  }, [postalCode, street]);

  useEffect(() => {
    if (postalCode.trim() && street.trim()) {
      loadBuildings();
    } else {
      setBuildings([]);
      setSelectedBuilding(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadBuildings stable for postalCode+street
  }, [street, postalCode]);

  useEffect(() => {
    if (!buildingDetails) return;
    if (buildingDetails.total_area_m2 != null) setBuildingSqm(String(buildingDetails.total_area_m2));
    if (buildingDetails.num_units != null) setNumUnits(String(buildingDetails.num_units));
    if (buildingDetails.window_type != null) setWindowType(String(buildingDetails.window_type));
    if (buildingDetails.roof_type != null) setRoofType(String(buildingDetails.roof_type));
    if (buildingDetails.heating_system != null) setHeatingType(String(buildingDetails.heating_system));
    if (buildingDetails.heating_age != null) setHeatingAge(String(buildingDetails.heating_age));
    if (buildingDetails.facade_material != null) setFacadeType(String(buildingDetails.facade_material));
    if (buildingDetails.insulation_walls != null) setFacadeInsulation(String(buildingDetails.insulation_walls));
    if (buildingDetails.insulation_roof != null) setRoofInsulation(String(buildingDetails.insulation_roof));
  }, [buildingDetails]);

  const onNextFromStep1 = () => {
    if (selectedBuilding) {
      setCity((selectedBuilding.display_address || "").split(" ").slice(0, -2).join(" ") || "");
      setStep(2);
      loadBuildingAndCalculator();
    } else setError("Please select a building (street and number).");
  };

  const loadBuildingAndCalculator = useCallback(async () => {
    if (!selectedBuilding?.address_slug) return;
    setError("");
    setLoading(true);
    try {
      const [b, c] = await Promise.all([
        api.getBuilding(selectedBuilding.address_slug),
        api.getCalculator(selectedBuilding.address_slug),
      ]);
      setBuildingDetails(b);
      setCalculator(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [selectedBuilding?.address_slug]);

  const goToStep = (s: number) => {
    setError("");
    if (s === 2 && selectedBuilding && !calculator) loadBuildingAndCalculator();
    setStep(s);
  };

  const handleRegister = async () => {
    if (!selectedBuilding || !userName.trim() || !userEmail.trim()) {
      setError("Name and email required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await api.createUser({
        name: userName.trim(),
        email: userEmail.trim(),
        building_id: selectedBuilding.building_id,
      });
      setUserId((user as { id?: string }).id || null);
      await api.createRequest({
        user_id: (user as { id?: string }).id!,
        building_id: selectedBuilding.building_id,
        status: "pending",
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const diyMeasures = calculator?.measures.filter((m) => !m.requires_whole_building_landlord) ?? [];

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">HeatMyKiez</div>
        <p className="app-tagline">
          Figure out how to finance insulating your building without losing money.
        </p>
        <button type="button" className="app-menu" aria-label="Menu">
          ☰
        </button>
      </header>

      <div className="stepper-row">
        <div className="stepper">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center" }}>
              <button
                type="button"
                className={`stepper-step ${step === s ? "active" : "inactive"}`}
                onClick={() => goToStep(s)}
                aria-current={step === s ? "step" : undefined}
              >
                {s}
              </button>
              {s < 4 && <span className="stepper-line" />}
            </div>
          ))}
        </div>
        {step === 1 && (
          <button
            type="button"
            className="btn btn-next"
            onClick={onNextFromStep1}
            disabled={!selectedBuilding || loading}
          >
            Next
          </button>
        )}
        {step === 2 && (
          <button type="button" className="btn btn-next" onClick={() => setStep(3)}>
            Next
          </button>
        )}
        {step === 3 && (
          <button type="button" className="btn btn-next" onClick={() => setStep(4)}>
            Next
          </button>
        )}
      </div>

      <main className={`step-content ${step >= 2 && step <= 4 ? "step-content-card" : ""}`}>
        {step === 1 && (
          <>
            <p>To understand your situation, we need some data from you.</p>
            <p>First, let us know where do you live</p>
            <div className="form-group">
              <label>Street</label>
              <select
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  setBuildings([]);
                  setSelectedBuilding(null);
                }}
                onFocus={postalCode ? loadStreets : undefined}
              >
                <option value="">Select street</option>
                {streets.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Postcode</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  onBlur={loadStreets}
                  placeholder="e.g. 10317"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Berlin"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Number</label>
              <select
                value={selectedBuilding?.building_id ?? ""}
                onChange={(e) => {
                  const b = buildings.find((x) => x.building_id === e.target.value);
                  setSelectedBuilding(b ?? null);
                }}
                onFocus={() => postalCode && street && loadBuildings()}
              >
                <option value="">Select number</option>
                {buildings.length === 0 && street && (
                  <option value="" disabled>Loading…</option>
                )}
                {buildings.map((b) => (
                  <option key={b.building_id} value={b.building_id}>
                    {b.display_address?.split(" ").pop() ?? b.building_id}
                  </option>
                ))}
              </select>
            </div>
            {buildings.length === 0 && street && !loading && (
              <button type="button" className="btn" onClick={loadBuildings}>
                Load addresses
              </button>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="step-intro-row">
              <div className="step-intro-text">
                <p>To understand your situation, we need some data from you.</p>
                <p>Now, give some basic details about the building and costs</p>
              </div>
              <div className="address-block">
                <strong>Address:</strong>
                <div className="address-lines">
                  <span>{(() => {
                    const addr = selectedBuilding?.display_address ?? "";
                    if (!addr) return street;
                    const parts = addr.trim().split(/\s+/);
                    parts.pop();
                    return parts.join(" ") || street;
                  })()}</span>
                  <span>{postalCode} {city || ""}</span>
                  <span>{selectedBuilding?.display_address?.trim().split(/\s+/).pop() ?? ""}</span>
                </div>
              </div>
            </div>

            <section className="form-section">
              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label>Building Square Meters (m2)</label>
                  <input
                    type="text"
                    value={buildingSqm}
                    onChange={(e) => setBuildingSqm(e.target.value)}
                    placeholder="e.g. 2523"
                  />
                </div>
                <div className="form-group">
                  <label>Number of residential units</label>
                  <input
                    type="text"
                    value={numUnits}
                    onChange={(e) => setNumUnits(e.target.value)}
                    placeholder="e.g. 31"
                  />
                </div>
                <div className="form-group">
                  <label>Average monthly rent/unit (Euros)</label>
                  <input
                    type="text"
                    value={avgRentPerUnit}
                    onChange={(e) => setAvgRentPerUnit(e.target.value)}
                    placeholder="e.g. 856.75"
                  />
                </div>
                <div className="form-group">
                  <label>Energy Cost per month (Euros)</label>
                  <input
                    type="text"
                    value={energyCostPerMonth}
                    onChange={(e) => setEnergyCostPerMonth(e.target.value)}
                    placeholder="e.g. 1650.73"
                  />
                </div>
              </div>
            </section>

            <p className="form-section-title">Then, let's get real and dive into heating related details</p>
            <section className="form-section">
              <div className="form-grid form-grid-3">
                <div className="form-group">
                  <label>Window Type</label>
                  <select value={windowType} onChange={(e) => setWindowType(e.target.value)}>
                    <option value="">select type</option>
                    <option value="Single Pane">Single Pane</option>
                    <option value="Double Pane">Double Pane</option>
                    <option value="Triple Pane">Triple Pane</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Window to Floor Square Meters Ratio</label>
                  <input
                    type="text"
                    value={windowToFloorRatio}
                    onChange={(e) => setWindowToFloorRatio(e.target.value)}
                    placeholder="e.g. 0.14"
                  />
                </div>
                <div className="form-group">
                  <label>Facade Square Meters (m2)</label>
                  <input
                    type="text"
                    value={facadeSqm}
                    onChange={(e) => setFacadeSqm(e.target.value)}
                    placeholder="e.g. 26554"
                  />
                </div>
                <div className="form-group">
                  <label>Facade Type</label>
                  <select value={facadeType} onChange={(e) => setFacadeType(e.target.value)}>
                    <option value="">select type</option>
                    <option value="Brick">Brick</option>
                    <option value="Concrete">Concrete</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Prefab Panel">Prefab Panel</option>
                    <option value="Render">Render</option>
                    <option value="Sandstone">Sandstone</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Facade Insulation</label>
                  <select value={facadeInsulation} onChange={(e) => setFacadeInsulation(e.target.value)}>
                    <option value="">select type</option>
                    <option value="Partial">Partial</option>
                    <option value="Full">Full</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Roof Type</label>
                  <select value={roofType} onChange={(e) => setRoofType(e.target.value)}>
                    <option value="">select type</option>
                    <option value="Flat">Flat</option>
                    <option value="Hip">Hip</option>
                    <option value="Mansard">Mansard</option>
                    <option value="Pitched">Pitched</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Roof Insulation</label>
                  <select value={roofInsulation} onChange={(e) => setRoofInsulation(e.target.value)}>
                    <option value="">select type</option>
                    <option value="None">None</option>
                    <option value="Full">Full</option>
                    <option value="Partial">Partial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Heating System Type</label>
                  <select value={heatingType} onChange={(e) => setHeatingType(e.target.value)}>
                    <option value="">select type</option>
                    <option value="District Heating">District Heating</option>
                    <option value="Electric">Electric</option>
                    <option value="Gas Boiler">Gas Boiler</option>
                    <option value="Oil Boiler">Oil Boiler</option>
                    <option value="Heat Pump">Heat Pump</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Heating Age</label>
                  <input
                    type="text"
                    value={heatingAge}
                    onChange={(e) => setHeatingAge(e.target.value)}
                    placeholder="e.g. 2007"
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {step === 3 && (
          <>
            <p className="step-intro">Now, let's summarize the data</p>
            <p className="step-intro">And pick the retrofits</p>
            <div className="address-block address-block-inline">
              <strong>Address:</strong>
              <div className="address-lines">
                <span>{(() => {
                  const addr = selectedBuilding?.display_address ?? "";
                  if (!addr) return street;
                  const parts = addr.trim().split(/\s+/);
                  parts.pop();
                  return parts.join(" ") || street;
                })()}</span>
                <span>{postalCode} {city || ""}</span>
                <span>{selectedBuilding?.display_address?.trim().split(/\s+/).pop() ?? ""}</span>
              </div>
            </div>
            <div className="summary-fields">
              <p><strong>Building Square Meters (m2):</strong> {buildingSqm || "-"}</p>
              <p><strong>Average monthly rent/unit (Euros)</strong> {avgRentPerUnit || "-"}</p>
              <p><strong>Window Type</strong> {windowType || "-"}</p>
            </div>
            {loading && <p>Loading…</p>}
            <table className="retrofit-table">
              <thead>
                <tr>
                  <th>Window Type</th>
                  <th>Energy Savings by</th>
                  <th>Baseline Cost (Euros)</th>
                  <th>Cost with applicable subsidies *</th>
                </tr>
              </thead>
              <tbody>
                {calculator && diyMeasures.filter((m) => (m.measure_name || "").toLowerCase().includes("window")).slice(0, 3).map((m) => (
                  <tr key={m.measure_id}>
                    <td>{m.measure_name}</td>
                    <td>{m.estimated_savings_pct}%</td>
                    <td>{m.estimated_cost}</td>
                    <td>{m.cost_after_subsidy_eur ?? (m.estimated_cost - (m.subsidy_eur ?? 0))}</td>
                  </tr>
                ))}
                {(!calculator || diyMeasures.filter((m) => (m.measure_name || "").toLowerCase().includes("window")).length === 0) && (
                  <>
                    <tr>
                      <td>Single Pane</td>
                      <td>12%</td>
                      <td>411780</td>
                      <td>267660</td>
                    </tr>
                    <tr>
                      <td>Double Pane</td>
                      <td>15%</td>
                      <td>503300</td>
                      <td>327150</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
            <div className="form-grid form-grid-4 summary-inputs">
              <div className="form-group">
                <label>Window Type</label>
                <input type="text" value={windowType} readOnly className="read-only" />
              </div>
              <div className="form-group">
                <label>Window to Floor Square Meters Ratio</label>
                <input type="text" value={windowToFloorRatio} readOnly className="read-only" />
              </div>
              <div className="form-group">
                <label>Energy cost per month (Euros)</label>
                <input type="text" value={energyCostPerMonth} readOnly className="read-only" />
              </div>
              <div className="form-group">
                <label>Number of residential units</label>
                <input type="text" value={numUnits} readOnly className="read-only" />
              </div>
            </div>
            <div className="action-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (selectedBuilding?.address_slug) {
                    setError("");
                    setLoading(true);
                    api
                      .getCalculator(selectedBuilding.address_slug)
                      .then((c) => {
                        setCalculator(c);
                      })
                      .catch((e) => setError(e instanceof Error ? e.message : "Calculation failed"))
                      .finally(() => setLoading(false));
                  } else {
                    setError("Please select a building first.");
                  }
                }}
                disabled={loading || !selectedBuilding?.address_slug}
              >
                {loading ? "Calculating…" : "Calculate"}
              </button>
              <button type="button" className="btn btn-secondary">Break Even</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="step-title">Your energy savings</h2>
            <p className="step-intro">We help you finance the retrofitting – so you are climate-safe for the future and your tenants stay warm.</p>
            <p className="step-intro">By slight rent increase, your investment has a return and the tenants pay less Warmmiete as they pay less energy costs.</p>
            <div className="address-block address-block-inline">
              <strong>Address:</strong>
              <div className="address-lines">
                <span>{(() => {
                  const addr = selectedBuilding?.display_address ?? "";
                  if (!addr) return street;
                  const parts = addr.trim().split(/\s+/);
                  return parts.length > 1 ? parts.slice(0, -1).join(" ") : street;
                })()}</span>
                <span>{postalCode} {city || ""}</span>
                <span>{selectedBuilding?.display_address?.trim().split(/\s+/).pop() ?? ""}</span>
              </div>
            </div>
            <table className="retrofit-table retrofit-summary-table">
              <thead>
                <tr>
                  <th>Type of Retrofit</th>
                  <th>Average monthly rent/unit (Euros)</th>
                  <th>Energy cost per month (Euros)</th>
                  <th>Number of residential units</th>
                </tr>
              </thead>
              <tbody>
                {calculator?.measures?.length
                  ? calculator.measures.slice(0, 1).map((m) => (
                    <tr key={m.measure_id}>
                      <td>{m.measure_name}</td>
                      <td>{avgRentPerUnit || "-"}</td>
                      <td>{energyCostPerMonth || "-"}</td>
                      <td>{numUnits || "-"}</td>
                    </tr>
                  ))
                  : (
                    <tr>
                      <td>Window Retrofit (Double Pane)</td>
                      <td>{avgRentPerUnit || "1124.26"}</td>
                      <td>{energyCostPerMonth || "20251.67"}</td>
                      <td>{numUnits || "60"}</td>
                    </tr>
                  )}
              </tbody>
            </table>
            {userId ? (
              <p className="success-msg">Thank you. Your request has been submitted.</p>
            ) : (
              <>
                <div className="form-row register-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={handleRegister}
                  disabled={loading || !userName.trim() || !userEmail.trim()}
                >
                  {loading ? "Submitting…" : "Submit request"}
                </button>
              </>
            )}
          </>
        )}

        {error && <p className="error-msg">{error}</p>}
      </main>
    </div>
  );
}

export default App;
